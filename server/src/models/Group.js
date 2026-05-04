const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "admin", "member"], default: "member" },
    incomeSnapshot: { type: Number, default: 0, min: 0 },
    participationScore: { type: Number, default: 1, min: 0, max: 2 },
    paymentConsistency: { type: Number, default: 1, min: 0, max: 1 },
    totalPaid: { type: Number, default: 0 },
    totalShare: { type: Number, default: 0 },
    netBalance: { type: Number, default: 0 },
    underpaymentStreak: { type: Number, default: 0, min: 0 },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const fairnessSnapshotSchema = new mongoose.Schema(
  {
    score: { type: Number, default: 100, min: 0, max: 100 },
    imbalance: { type: Number, default: 0, min: 0 },
    calculatedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: ["trip", "rent", "event", "dining", "general"], default: "general" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] },
    fairnessScore: { type: Number, default: 100, min: 0, max: 100 },
    fairnessHistory: { type: [fairnessSnapshotSchema], default: [] },
  },
  { timestamps: true },
);

groupSchema.index({ "members.user": 1 });

module.exports = mongoose.model("Group", groupSchema);
