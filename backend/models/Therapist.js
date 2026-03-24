const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true, // e.g., "CBT Therapist", "Clinical Psychologist"
  },
  category: {
    type: String,
    enum: ["Individual", "Couple"],
    default: "Individual"
  },
  gender: {
    type: String, // e.g., "Male", "Female", "Non-binary"
  },
  experienceYears: {
    type: Number,
  },
  bio: {
    type: String,
  },
  phone: {
    type: String,
  },
  location: {
    type: String, // e.g., Hospital name or City area
  },
  specialization: {
    type: [String],
    default: [],
  },
  features: {
    type: [Number], // [anxiety, depression, sleep, self_esteem, burnout, stress, emotional_exhaustion, adjustment_issues]
    required: true,
    validate: [v => v.length === 8, 'Features vector must have exactly 8 elements']
  },
  style: {
    type: String, // e.g., "structured", "supportive"
  },
  language: {
    type: String, // e.g., "English", "Hindi"
  },
  certificates: {
    type: [String], // Certified specializations
    default: [],
  },
  availability: {
    type: [String], // Array of available dates/slots
    default: [],
  },
  bookedSlots: [
    {
      date: String,
      time: String,
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Therapist', therapistSchema);
