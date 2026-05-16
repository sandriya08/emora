const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AssessmentQuestion = require('./models/AssessmentQuestion');

dotenv.config();

const initialQuestions = [
  { text: "To start, could you describe the general emotional atmosphere of your life lately?", category: "Adjustment Issues", weight: 1, orderIndex: 0 },
  { text: "How often have you felt overwhelmed by the demands or pressures of your daily routine?", category: "Stress", weight: 1, orderIndex: 1 },
  { text: "Lately, have you been troubled by persistent worry, nervousness, or a sense of unease?", category: "Anxiety", weight: 1, orderIndex: 2 },
  { text: "Have you noticed a significant decline in your mood, or a loss of interest in things you usually enjoy?", category: "Depression", weight: 1, orderIndex: 3 },
  { text: "Describe your recent energy levels; do you feel a sense of chronic mental or physical depletion?", category: "Emotional Exhaustion", weight: 2, orderIndex: 4 },
  { text: "How has your quality of rest been? Are you finding it difficult to fall asleep or wake up feeling restored?", category: "Sleep Disturbance", weight: 2, orderIndex: 5 },
  { text: "Lately, how would you describe your internal dialogue or your sense of self-worth?", category: "Low Self-Esteem", weight: 2, orderIndex: 6 },
  { text: "Have recent life events or shifts made it particularly challenging for you to maintain your balance?", category: "Adjustment Issues", weight: 1, orderIndex: 7 },
  { text: "Do you sometimes feel emotionally detached, as if you're running on 'auto-pilot' and finding it hard to connect?", category: "Burnout", weight: 2, orderIndex: 8 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Clear existing questions
    await AssessmentQuestion.deleteMany({});
    console.log("Cleared existing assessment questions.");

    // Insert new questions
    await AssessmentQuestion.insertMany(initialQuestions);
    console.log("Successfully seeded initial assessment questions!");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();
