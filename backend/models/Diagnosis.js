const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    results: {
      type: mongoose.Schema.Types.Mixed, // Stores the diagnosisResult object
      required: true,
    },
    labels: {
      type: [String], // Array of keys like ["Stress", "Anxiety"]
      required: true,
    },
    focus: {
      type: String,
      enum: ["Individual", "Couple"],
      default: "Individual"
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Diagnosis", diagnosisSchema);
