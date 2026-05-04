const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true },
);

chatMessageSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
