import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/reports - any logged-in user can report another user
router.post("/", requireAuth, async (req, res) => {
  const { reported_user, reason } = req.body;
  if (!reported_user || !reason) {
    return res.status(400).json({ error: "reported_user and reason are required" });
  }
  try {
    const result = await query(
      `INSERT INTO reports (reported_by, reported_user, reason) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, reported_user, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

export default router;
