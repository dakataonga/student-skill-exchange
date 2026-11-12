import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// POST /api/account/delete-request
router.post("/delete-request", requireAuth, async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id = $1", [req.user.id]);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

export default router;