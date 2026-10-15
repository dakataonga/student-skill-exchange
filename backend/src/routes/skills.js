import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";
import { anthropic } from "../anthropicClient.js";
import { buildExchangeGraph, findCyclesForUser, rankCycles } from "../matching/cycleMatcher.js";

const router = Router();

// GET /api/skills?category=Programming&q=python&payment_type=paid
router.get("/", async (req, res) => {
  const { category, q, payment_type } = req.query;
  const clauses = ["skills_offered.active = TRUE"];
  const params = [];

  if (category) {
    params.push(category);
    clauses.push(`skill_categories.name = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    clauses.push(`(skills_offered.title ILIKE $${params.length} OR skills_offered.description ILIKE $${params.length})`);
  }
  if (payment_type) {
    params.push(payment_type);
    clauses.push(`skills_offered.payment_type = $${params.length}`);
  }

  const sql = `
    SELECT skills_offered.*, skill_categories.name AS category_name,
           users.name AS provider_name, users.verified AS provider_verified
    FROM skills_offered
    JOIN skill_categories ON skill_categories.id = skills_offered.category_id
    JOIN users ON users.id = skills_offered.user_id
    WHERE ${clauses.join(" AND ")}
    ORDER BY skills_offered.created_at DESC
  `;

  try {
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// POST /api/skills - create a listing (must be verified)
router.post("/", requireAuth, requireVerified, async (req, res) => {
  const { category_id, title, description, payment_type, price, availability } = req.body;
  if (!category_id || !title) {
    return res.status(400).json({ error: "category_id and title are required" });
  }
  try {
    const result = await query(
      `INSERT INTO skills_offered (user_id, category_id, title, description, payment_type, price, availability)
       VALUES ($1, $2, $3, $4, COALESCE($5::payment_type, 'barter'), $6, $7)
       RETURNING *`,
      [req.user.id, category_id, title, description, payment_type, price, availability]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

// POST /api/skills/wanted - add a skill the student is looking for
router.post("/wanted", requireAuth, requireVerified, async (req, res) => {
  const { category_id, notes } = req.body;
  if (!category_id) return res.status(400).json({ error: "category_id is required" });
  try {
    const result = await query(
      `INSERT INTO skills_wanted (user_id, category_id, notes) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, category_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add wanted skill" });
  }
});

// GET /api/skills/matches - mutual matches for the logged-in student.
router.get("/matches", requireAuth, async (req, res) => {
  const sql = `
    SELECT DISTINCT
      other_user.id AS user_id,
      other_user.name AS user_name,
      offer.title AS they_offer_title,
      offer_cat.name AS they_offer_category,
      want_cat.name AS you_offer_category
    FROM skills_wanted my_want
    JOIN skill_categories offer_cat ON offer_cat.id = my_want.category_id
    JOIN skills_offered offer ON offer.category_id = my_want.category_id AND offer.active = TRUE
    JOIN users other_user ON other_user.id = offer.user_id
    JOIN skills_offered their_want_match ON their_want_match.user_id = other_user.id
    JOIN skills_wanted their_want ON their_want.user_id = other_user.id
    JOIN skill_categories want_cat ON want_cat.id = their_want.category_id
    JOIN skills_offered my_offer ON my_offer.category_id = their_want.category_id AND my_offer.user_id = $1
    WHERE my_want.user_id = $1 AND other_user.id != $1
  `;
  try {
    const result = await query(sql, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute matches" });
  }
});

// GET /api/skills/ai-matches - semantic matching using Claude.
router.get("/ai-matches", requireAuth, async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: "AI matching is not configured. Set ANTHROPIC_API_KEY in backend/.env to enable it.",
    });
  }

  try {
    // 1. What the student is looking for
    const wantedResult = await query(
      `SELECT skills_wanted.notes, skill_categories.name AS category_name
       FROM skills_wanted
       JOIN skill_categories ON skill_categories.id = skills_wanted.category_id
       WHERE skills_wanted.user_id = $1`,
      [req.user.id]
    );

    if (wantedResult.rows.length === 0) {
      return res.json({
        matches: [],
        message: "Add a skill you're looking for on your profile first.",
      });
    }

    // 2. Candidate listings (capped for cost & prompt size)
    const listingsResult = await query(
      `SELECT skills_offered.id, skills_offered.title, skills_offered.description,
              skill_categories.name AS category_name,
              users.name AS provider_name, users.id AS provider_id
       FROM skills_offered
       JOIN skill_categories ON skill_categories.id = skills_offered.category_id
       JOIN users ON users.id = skills_offered.user_id
       WHERE skills_offered.active = TRUE AND skills_offered.user_id != $1
       LIMIT 25`,
      [req.user.id]
    );

    if (listingsResult.rows.length === 0) {
      return res.json({
        matches: [],
        message: "No listings from other students yet.",
      });
    }

    const wantedText = wantedResult.rows
      .map((w) => `- Category: ${w.category_name}. Notes: ${w.notes || "none"}`)
      .join("\n");

    const listingsText = listingsResult.rows
      .map(
        (l) =>
          `ID ${l.id} | ${l.category_name} | "${l.title}" by ${l.provider_name}: ${l.description || "no description"}`
      )
      .join("\n");

    const prompt = `A student is looking for help with these things:
${wantedText}

Here are skill listings posted by other students:
${listingsText}

Return ONLY a valid JSON array (no markdown fences, no explanation, no preamble). 
Each object must have exactly these keys:
- "listing_id": number
- "score": number between 0 and 100
- "reason": one short sentence explaining why it matches

Only include listings that are genuinely relevant (score 50 or higher).
If nothing is relevant, return an empty array: []`;

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text content safely
    const raw = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();

    // Robust JSON extraction (handles markdown fences or extra text)
    let ranked = [];
    try {
      ranked = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        ranked = JSON.parse(match[0]);
      } else {
        console.error("AI MATCH PARSE FAIL. Raw response:", raw);
        return res.status(500).json({
          error: "AI returned an unreadable response. Please try again.",
        });
      }
    }

    if (!Array.isArray(ranked)) {
      return res.status(500).json({
        error: "AI returned unexpected format. Please try again.",
      });
    }

    // Enrich with full listing data
    const byId = Object.fromEntries(listingsResult.rows.map((l) => [l.id, l]));
    const matches = ranked
      .filter((r) => r && byId[r.listing_id] && Number(r.score) >= 50)
      .map((r) => ({
        ...byId[r.listing_id],
        score: Math.round(Number(r.score)),
        reason: r.reason || "",
      }))
      .sort((a, b) => b.score - a.score);

    res.json({ matches });
  } catch (err) {
    console.error("AI MATCH ERROR:", err.message, err.error || "");

    if (err.status === 401 || err.message?.includes("authentication")) {
      return res.status(401).json({
        error: "Invalid Anthropic API key. Check ANTHROPIC_API_KEY in backend/.env",
      });
    }
    if (err.status === 429) {
      return res.status(429).json({
        error: "Anthropic rate limit hit. Wait a moment and try again.",
      });
    }

    res.status(500).json({
      error: "AI matching failed",
      detail: err.message,
    });
  }
});

// GET /api/skills/cycles - multi-party (circular) exchange matching.
router.get("/cycles", requireAuth, async (req, res) => {
  const maxLength = Math.min(Number(req.query.maxLength) || 4, 5);

  try {
    const offersResult = await query(
      `SELECT skills_offered.id, skills_offered.user_id, skills_offered.category_id,
              skills_offered.title, skill_categories.name AS category_name
       FROM skills_offered
       JOIN skill_categories ON skill_categories.id = skills_offered.category_id
       WHERE skills_offered.active = TRUE`
    );
    const wantsResult = await query(`SELECT user_id, category_id FROM skills_wanted`);
    const usersResult = await query(`SELECT id, name FROM users`);

    const nameById = Object.fromEntries(usersResult.rows.map((u) => [u.id, u.name]));

    const edges = buildExchangeGraph(offersResult.rows, wantsResult.rows);
    const cycles = rankCycles(findCyclesForUser(edges, req.user.id, maxLength));

    const readable = cycles.map((cycle) => ({
      participants: cycle.length,
      steps: cycle.map((step) => ({
        ...step,
        fromName: nameById[step.from] || `User ${step.from}`,
        toName: nameById[step.to] || `User ${step.to}`,
      })),
    }));

    const pairwiseCount = readable.filter((c) => c.participants === 2).length;
    const multiPartyCount = readable.filter((c) => c.participants >= 3).length;

    res.json({
      cycles: readable,
      stats: {
        total: readable.length,
        pairwise: pairwiseCount,
        multiParty: multiPartyCount,
        unlockedByCycleDetection: multiPartyCount,
        maxLengthSearched: maxLength,
      },
    });
  } catch (err) {
    console.error("CYCLE MATCH ERROR:", err.message);
    res.status(500).json({ error: "Failed to compute exchange cycles" });
  }
});

// GET /api/skills/categories
router.get("/categories", async (_req, res) => {
  const result = await query("SELECT * FROM skill_categories ORDER BY name");
  res.json(result.rows);
});

export default router;