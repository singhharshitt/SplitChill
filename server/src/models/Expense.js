const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    usage: { type: Number, default: 1, min: 0 },
    share: { type: Number, default: 0, min: 0 },
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false },
);

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    amount: { type: Number, required: true, min: 0.01 },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: { type: [participantSchema], required: true },
    splitType: {
      type: String,
      enum: ["equal", "income-based", "usage-based", "ai-recommended", "custom"],
      default: "equal",
    },
    fairnessScoreAfter: { type: Number, min: 0, max: 100 },
    insights: { type: [String], default: [] },
  },
  { timestamps: true },
);

expenseSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
