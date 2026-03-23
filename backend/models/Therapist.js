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
  specialization: {
    type: [String],
    default: [],
  },
  features: {
    type: [Number], // [anxiety, depression, sleep, self_esteem, burnout]
    required: true,
    validate: [v => v.length === 5, 'Features vector must have exactly 5 elements']
  },
  style: {
    type: String, // e.g., "structured", "supportive"
  },
  language: {
    type: String, // e.g., "English", "Hindi"
  },
  availability: {
    type: [String], // Array of available dates/slots
    default: [],
  }
}, { timestamps: true });

module.exports = mongoose.model('Therapist', therapistSchema);
