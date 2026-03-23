const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    duration: {
      type: String, // e.g., "5 minutes"
    },
    difficulty: {
      type: String, // e.g., "Easy"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
