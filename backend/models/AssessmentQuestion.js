const mongoose = require('mongoose');

const AssessmentQuestionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Stress', 'Anxiety', 'Depression', 'Burnout', 'Sleep Disturbance', 'Low Self-Esteem', 'Emotional Exhaustion', 'Adjustment Issues'],
    default: 'Stress'
  },
  weight: {
    type: Number,
    default: 1
  },
  orderIndex: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentQuestion', AssessmentQuestionSchema);
