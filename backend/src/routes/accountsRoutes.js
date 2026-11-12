const express = require("express");
const DeletionRequest = require("../models/DeletionRequest");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
const express = require("express");
const router = express.Router();

// CHANGE these two lines to match your existing files:
const pool = require("../db");                      // your existing Postgres connection
const { protect } = require("../middleware/auth");  // your existing login-check middleware

router.post("/delete-request", protect, async (req, res) => {
  try {
    const userId = req.user.id; // change if your middleware stores it differently (e.g. req.userId)

    const existing = await pool.query(
      "SELECT 1 FROM deletion_requests WHERE user_id = $1 AND status = 'pending'",
      [userId]
    );
    if (existing.rows.length) {
      return res.status(409).json({ message: "You already have a pending deletion request" });
    }

    await pool.query(
      "INSERT INTO deletion_requests (user_id, reason) VALUES ($1, $2)",
      [userId, req.body.reason || ""]
    );

    res.status(201).json({ message: "Deletion request submitted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// User submits a deletion request
router.post("/delete-request", protect, async (req, res) => {
  try {
    const existing = await DeletionRequest.findOne({ user: req.user._id, status: "pending" });
    if (existing) {
      return res.status(409).json({ message: "You already have a pending deletion request" });
    }
    const request = await DeletionRequest.create({
      user: req.user._id,
      reason: req.body.reason || "",
    });
    res.status(201).json({ message: "Deletion request submitted", request });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Admin lists all requests
router.get("/delete-requests", protect, adminOnly, async (req, res) => {
  const requests = await DeletionRequest.find().populate("user", "name email").sort("-createdAt");
  res.json(requests);
});

// Admin approves or rejects
router.patch("/delete-requests/:id", protect, adminOnly, async (req, res) => {
  try {
    const { action } = req.body; // "approve" or "reject"
    const request = await DeletionRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (action === "approve") {
      await User.findByIdAndDelete(request.user);
      request.status = "approved";
    } else if (action === "reject") {
      request.status = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }
    await request.save();
    res.json({ message: `Request ${request.status}`, request });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;