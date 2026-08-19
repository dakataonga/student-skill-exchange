import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireVerified } from "../middleware/auth.js";

const router = Router();

// POST /api/requests - seeker requests a session for a skill
router.post("/", requireAuth, requireVerified, async (req, res) => {
  const { skill_id, agreed_payment, agreed_price, scheduled_at } = req.body;
  if (!skill_id) return res.status(400).json({ error: "skill_id is required" });

  try {
    const skillResult = await query("SELECT * FROM skills_offered WHERE id = $1", [skill_id]);
    const skill = skillResult.rows[0];
    if (!skill) return res.status(404).json({ error: "Skill listing not found" });
    if (skill.user_id === req.user.id) {
      return res.status(400).json({ error: "You cannot request your own listing" });
    }

    const result = await query(
      `INSERT INTO requests (seeker_id, provider_id, skill_id, agreed_payment, agreed_price, scheduled_at)
       VALUES ($1, $2, $3, $4::payment_type, $5, $6) RETURNING *`,
      [req.user.id, skill.user_id, skill_id, agreed_payment || skill.payment_type, agreed_price || skill.price, scheduled_at]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

// GET /api/requests/mine - both sent and received requests for logged-in user
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT requests.*, skills_offered.title AS skill_title,
              seeker.name AS seeker_name, provider.name AS provider_name
       FROM requests
       JOIN skills_offered ON skills_offered.id = requests.skill_id
       JOIN users seeker ON seeker.id = requests.seeker_id
       JOIN users provider ON provider.id = requests.provider_id
       WHERE requests.seeker_id = $1 OR requests.provider_id = $1
       ORDER BY requests.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

// PATCH /api/requests/:id/status - provider accepts/rejects, either side completes/cancels
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body;
  const allowed = ["accepted", "rejected", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${allowed.join(", ")}` });
  }

  try {
    const existing = await query("SELECT * FROM requests WHERE id = $1", [req.params.id]);
    const request = existing.rows[0];
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (![request.seeker_id, request.provider_id].includes(req.user.id)) {
      return res.status(403).json({ error: "Not part of this request" });
    }
    if (["accepted", "rejected"].includes(status) && req.user.id !== request.provider_id) {
      return res.status(403).json({ error: "Only the provider can accept or reject" });
    }

    const result = await query(
      "UPDATE requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// PATCH /api/requests/:id/pay - mock payment toggle (stub for real gateway later)
router.patch("/:id/pay", requireAuth, async (req, res) => {
  try {
    const result = await query(
      "UPDATE requests SET paid = TRUE WHERE id = $1 AND seeker_id = $2 RETURNING *",
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Request not found or not yours to pay for" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as paid" });
  }
});

// GET /api/requests/:id/messages - message thread for a request
router.get("/:id/messages", requireAuth, async (req, res) => {
  try {
    const existing = await query("SELECT * FROM requests WHERE id = $1", [req.params.id]);
    const request = existing.rows[0];
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (![request.seeker_id, request.provider_id].includes(req.user.id)) {
      return res.status(403).json({ error: "Not part of this request" });
    }

    const result = await query(
      `SELECT messages.*, users.name AS sender_name
       FROM messages
       JOIN users ON users.id = messages.sender_id
       WHERE messages.request_id = $1
       ORDER BY messages.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/requests/:id/messages - send a message on a request
router.post("/:id/messages", requireAuth, async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ error: "Message body is required" });

  try {
    const existing = await query("SELECT * FROM requests WHERE id = $1", [req.params.id]);
    const request = existing.rows[0];
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (![request.seeker_id, request.provider_id].includes(req.user.id)) {
      return res.status(403).json({ error: "Not part of this request" });
    }

    const result = await query(
      `INSERT INTO messages (request_id, sender_id, body) VALUES ($1, $2, $3)
       RETURNING *`,
      [req.params.id, req.user.id, body.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;