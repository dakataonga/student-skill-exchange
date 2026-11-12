const mongoose = require("mongoose");

const deletionRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeletionRequest", deletionRequestSchema);