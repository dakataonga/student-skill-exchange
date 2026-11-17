
import { Router } from "express";
import { query, pool } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Protect all admin routes
router.use(requireAuth, requireAdmin);

// ─────────────────────────────────────────
// GET /api/admin/users?verified=false
// List users, optionally filter by verification status
// ─────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { verified } = req.query;

    const sql =
      verified === undefined
        ? "SELECT id, name, email, student_id, verified, role, created_at FROM users ORDER BY created_at DESC"
        : "SELECT id, name, email, student_id, verified, role, created_at FROM users WHERE verified = $1 ORDER BY created_at DESC";

    const params = verified === undefined ? [] : [verified === "true"];

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/users/:id/verify
// Approve a student's ID
// ─────────────────────────────────────────
router.patch("/users/:id/verify", async (req, res) => {
  try {
    const result = await query(
      "UPDATE users SET verified = TRUE WHERE id = $1 RETURNING id, name, email, verified",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to verify user:", err);
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// ─────────────────────────────────────────
// DELETE /api/admin/listings/:id
// Deactivate a skill listing
// ─────────────────────────────────────────
router.delete("/listings/:id", async (req, res) => {
  try {
    await query(
      "UPDATE skills_offered SET active = FALSE WHERE id = $1",
      [req.params.id]
    );

    res.json({ message: "Listing deactivated" });
  } catch (err) {
    console.error("Failed to deactivate listing:", err);
    res.status(500).json({ error: "Failed to deactivate listing" });
  }
});

// ─────────────────────────────────────────
// GET /api/admin/reports
// Get all reports
// ─────────────────────────────────────────
router.get("/reports", async (_req, res) => {
  try {
    const result = await query(
      `SELECT reports.*,
              reporter.name AS reporter_name,
              reported.name AS reported_name
       FROM reports
       JOIN users reporter ON reporter.id = reports.reported_by
       JOIN users reported ON reported.id = reports.reported_user
       ORDER BY reports.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch reports:", err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/reports/:id/resolve
// Resolve a report
// ─────────────────────────────────────────
router.patch("/reports/:id/resolve", async (req, res) => {
  try {
    const result = await query(
      "UPDATE reports SET resolved = TRUE WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to resolve report:", err);
    res.status(500).json({ error: "Failed to resolve report" });
  }
});

// ─────────────────────────────────────────
// GET /api/admin/deletion-requests
// Get all account deletion requests
// ─────────────────────────────────────────
router.get("/deletion-requests", async (req, res) => {
  try {
    const result = await query(
      `SELECT
         dr.id,
         dr.user_id,
         dr.reason,
         dr.status,
         dr.created_at,
         dr.resolved_at,
         u.name AS user_name,
         u.email AS user_email
       FROM deletion_requests dr
       JOIN users u ON u.id = dr.user_id
       ORDER BY dr.created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch deletion requests:", err);
    res.status(500).json({
      error: "Failed to fetch deletion requests"
    });
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/deletion-requests/:id/reject
// Reject an account deletion request
// ─────────────────────────────────────────
router.patch("/deletion-requests/:id/reject", async (req, res) => {
  try {
    const result = await query(
      `UPDATE deletion_requests
       SET status = 'rejected',
           resolved_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Pending deletion request not found"
      });
    }

    res.json({
      message: "Deletion request rejected successfully",
      request: result.rows[0]
    });
  } catch (err) {
    console.error("Failed to reject deletion request:", err);
    res.status(500).json({
      error: "Failed to reject deletion request"
    });
  }
});

// ─────────────────────────────────────────
// PATCH /api/admin/deletion-requests/:id/approve
// Approve request and delete user account
// ─────────────────────────────────────────
router.patch("/deletion-requests/:id/approve", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const requestResult = await client.query(
      `SELECT id, user_id, status
       FROM deletion_requests
       WHERE id = $1
       FOR UPDATE`,
      [req.params.id]
    );

    const deletionRequest = requestResult.rows[0];

    if (!deletionRequest) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        error: "Deletion request not found"
      });
    }

    if (deletionRequest.status !== "pending") {
      await client.query("ROLLBACK");

      return res.status(409).json({
        error: "This request has already been processed"
      });
    }

    await client.query(
      `UPDATE deletion_requests
       SET status = 'approved',
           resolved_at = NOW()
       WHERE id = $1`,
      [req.params.id]
    );

    await client.query(
      "DELETE FROM users WHERE id = $1",
      [deletionRequest.user_id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Request approved and user account deleted successfully"
    });

  } catch (err) {
    await client.query("ROLLBACK");

    console.error("Failed to approve deletion request:", err);

    res.status(500).json({
      error: "Failed to approve deletion request"
    });
  } finally {
    client.release();
  }
});

export default router;
