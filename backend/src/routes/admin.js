import { Router } from "express";
import { query } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireAdmin);

// GET /api/admin/users?verified=false - list users, optionally filter by verification status
router.get("/users", async (req, res) => {
  const { verified } = req.query;
  const sql =
    verified === undefined
      ? "SELECT id, name, email, student_id, verified, role, created_at FROM users ORDER BY created_at DESC"
      : "SELECT id, name, email, student_id, verified, role, created_at FROM users WHERE verified = $1 ORDER BY created_at DESC";
  const params = verified === undefined ? [] : [verified === "true"];
  const result = await query(sql, params);
  res.json(result.rows);
});

// PATCH /api/admin/users/:id/verify - approve a student's ID
router.patch("/users/:id/verify", async (req, res) => {
  const result = await query(
    "UPDATE users SET verified = TRUE WHERE id = $1 RETURNING id, name, email, verified",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
  res.json(result.rows[0]);
});

// DELETE /api/admin/listings/:id - remove a skill listing
router.delete("/listings/:id", async (req, res) => {
  await query("UPDATE skills_offered SET active = FALSE WHERE id = $1", [req.params.id]);
  res.json({ message: "Listing deactivated" });
});

// GET /api/admin/reports
router.get("/reports", async (_req, res) => {
  const result = await query(
    `SELECT reports.*, reporter.name AS reporter_name, reported.name AS reported_name
     FROM reports
     JOIN users reporter ON reporter.id = reports.reported_by
     JOIN users reported ON reported.id = reports.reported_user
     ORDER BY reports.created_at DESC`
  );
  res.json(result.rows);
});

// PATCH /api/admin/reports/:id/resolve
router.patch("/reports/:id/resolve", async (req, res) => {
  const result = await query(
    "UPDATE reports SET resolved = TRUE WHERE id = $1 RETURNING *",
    [req.params.id]
  );
  res.json(result.rows[0]);
});

export default router;
