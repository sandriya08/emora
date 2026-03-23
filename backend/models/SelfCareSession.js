const mongoose = require("mongoose");

const selfCareSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for anonymous sessions
    },
    diagnoses: {
      type: [String],
      required: true,
    },
    moodBefore: {
      type: String, // Initial mood of the session
    },
    completedActivities: {
        type: [String], // Array of activity titles or IDs
        default: []
    },
    moodAfter: {
      type: String, // e.g., "better", "little", "struggling"
    },
    week: {
      type: String, // e.g., "Week 1", "Week 2"
    },
    totalActivities: {
        type: Number, // Total number of activities suggested for the week
        default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SelfCareSession", selfCareSessionSchema);
