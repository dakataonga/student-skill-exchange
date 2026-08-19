import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/reviews - leave a review after a completed request
router.post("/", requireAuth, async (req, res) => {
  const { request_id, rating, comment } = req.body;
  if (!request_id || !rating) {
    return res.status(400).json({ error: "request_id and rating are required" });
  }

  try {
    const reqResult = await query("SELECT * FROM requests WHERE id = $1", [request_id]);
    const request = reqResult.rows[0];
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "completed") {
      return res.status(400).json({ error: "Can only review completed sessions" });
    }
    if (![request.seeker_id, request.provider_id].includes(req.user.id)) {
      return res.status(403).json({ error: "Not part of this request" });
    }

    const reviewee_id = req.user.id === request.seeker_id ? request.provider_id : request.seeker_id;

    const result = await query(
      `INSERT INTO reviews (request_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [request_id, req.user.id, reviewee_id, rating, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// GET /api/reviews/user/:id - all reviews received by a user
router.get("/user/:id", async (req, res) => {
  const result = await query(
    `SELECT reviews.*, reviewer.name AS reviewer_name
     FROM reviews JOIN users reviewer ON reviewer.id = reviews.reviewer_id
     WHERE reviewee_id = $1 ORDER BY created_at DESC`,
    [req.params.id]
  );
  res.json(result.rows);
});

export default router;
