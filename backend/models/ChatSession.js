const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        text: String,
        sender: String, // "user" or "system"
        timestamp: { type: Date, default: Date.now },
      },
    ],
    diagnosisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Diagnosis",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatSession", chatSessionSchema);
