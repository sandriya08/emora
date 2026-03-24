const mongoose = require('mongoose');
const Therapist = require('../models/Therapist');
require('dotenv').config();

// Features Array Index: [anxiety, depression, sleep, self_esteem, burnout, stress, emotional_exhaustion, adjustment_issues]
const therapists = [
  // CBT Therapists (Focus: Anxiety, Overthinking)
  { name: "Dr. Meera", type: "CBT Therapist", specialization: ["Anxiety", "Sleep"], features: [1, 0, 1, 0, 1, 0.8, 0.5, 0.4], style: "structured", language: "English" },
  { name: "Mr. Rajeev", type: "CBT Therapist", specialization: ["Anxiety", "Burnout"], features: [0.9, 0, 0, 0, 1, 0.9, 0.7, 0.3], style: "structured", language: "Hindi" },
  { name: "Dr. Ananya", type: "CBT Therapist", specialization: ["Depression", "Anxiety"], features: [0.8, 0.5, 0, 0, 0.5, 0.6, 0.4, 0.5], style: "direct", language: "Malayalam" },

  // Counselors / Talk Therapists (Focus: Stress, Adjustment)
  { name: "Mr. Arun", type: "Counselor", specialization: ["Depression", "Self-Esteem"], features: [0, 1, 0, 1, 0, 0.3, 0.6, 0.8], style: "supportive", language: "Malayalam" },
  { name: "Ms. Priya", type: "Counselor", specialization: ["Burnout", "Stress"], features: [0.5, 0, 0, 0, 0.9, 1, 0.8, 0.6], style: "friendly", language: "English" },
  { name: "Ms. Sunita", type: "Counselor", specialization: ["Self-Esteem"], features: [0.2, 0.5, 0, 0.9, 0, 0.4, 0.3, 0.7], style: "empathetic", language: "Hindi" },

  // Clinical Psychologists (Focus: Severe Anxiety, Depression, Burnout)
  { name: "Dr. Nisha", type: "Clinical Psychologist", specialization: ["Anxiety", "Depression", "Burnout"], features: [1, 1, 0, 0, 1, 0.9, 0.9, 0.7], style: "structured", language: "English", certificates: ["Anxiety", "Burnout", "Depression"] },
  { name: "Dr. Karthik", type: "Clinical Psychologist", specialization: ["Depression", "Sleep Issues"], features: [0.5, 1, 0.8, 0, 0.5, 0.6, 0.7, 0.5], style: "analytical", language: "English", certificates: ["Depression"] },
  { name: "Dr. Samuel", type: "Clinical Psychologist", specialization: ["Severe Anxiety"], features: [1, 0.2, 0.5, 0.2, 0.5, 0.8, 0.6, 0.9], style: "supportive", language: "Malayalam", certificates: ["Anxiety"] },
 
  // Mindfulness / Wellness Therapists (Focus: Sleep, Stress, Emotional Overwhelm)
  { name: "Ms. Kavya", type: "Mindfulness Therapist", specialization: ["Sleep", "Burnout"], features: [0, 0, 1, 0, 1, 0.8, 0.9, 0.4], style: "gentle", language: "Hindi", certificates: ["Sleep"] },
  { name: "Mr. Deepak", type: "Mindfulness Therapist", specialization: ["Anxiety", "Sleep"], features: [0.8, 0, 0.9, 0, 0, 0.7, 0.5, 0.4], style: "calm", language: "English", certificates: ["Anxiety", "Sleep"] },
  { name: "Ms. Lakshmi", type: "Mindfulness Therapist", specialization: ["Burnout", "Self-Esteem"], features: [0, 0, 0.4, 0.8, 0.7, 0.6, 0.5, 0.4], style: "holistic", language: "Malayalam", certificates: ["Burnout"] },

  // Life Coaches / Motivation Coaches (Focus: Self-esteem, Motivation, Career)
  { name: "Mr. Rohan", type: "Life Coach", specialization: ["Self-Esteem", "Burnout"], features: [0, 0, 0, 1, 1, 0.8, 0.7, 0.9], style: "motivational", language: "English" },
  { name: "Ms. Simran", type: "Life Coach", specialization: ["Motivation", "Confidence"], features: [0.2, 0, 0, 1, 0, 0.4, 0.3, 0.6], style: "energetic", language: "Hindi" },
  { name: "Mr. Vishal", type: "Motivation Coach", specialization: ["Burnout", "Career Stress"], features: [0.5, 0, 0, 0.5, 1, 0.9, 0.8, 0.7], style: "practical", language: "English" },

  // Trauma Therapists (Focus: Emotional distress, Past experiences)
  { name: "Dr. Sara", type: "Trauma Therapist", specialization: ["Anxiety", "Burnout"], features: [1, 0, 0, 0, 1, 0.9, 0.9, 0.8], style: "supportive", language: "English" },
  { name: "Dr. Farhan", type: "Trauma Therapist", specialization: ["Depression", "PTSD"], features: [0.8, 0.9, 0.5, 0, 0.5, 0.7, 0.6, 0.9], style: "gentle", language: "Hindi" },

  // Psychiatrists (Focus: Severe clinical conditions requiring medication potential)
  { name: "Dr. Joseph", type: "Psychiatrist", specialization: ["Anxiety", "Depression", "Sleep", "Burnout"], features: [1, 1, 1, 0, 1, 0.9, 0.9, 0.8], style: "clinical", language: "English", certificates: ["Anxiety", "Burnout"] },
  { name: "Dr. Anita", type: "Psychiatrist", specialization: ["Major Depression", "Insomnia"], features: [0.4, 1, 1, 0, 0.2, 0.6, 0.7, 0.4], style: "medical", language: "Malayalam", certificates: ["Depression"] },
  { name: "Dr. Vikram", type: "Psychiatrist", specialization: ["Panic Disorders", "Anxiety"], features: [1, 0, 0.8, 0, 0.5, 0.9, 0.7, 0.6], style: "clinical", language: "English", certificates: ["Anxiety"] }
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/emora')
  .then(async () => {
    console.log("Connected to MongoDB");
    await Therapist.deleteMany({});
    console.log("Cleared existing therapists");
    await Therapist.insertMany(therapists);
    console.log("Successfully seeded", therapists.length, "therapists!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error seeding therapists:", err);
    process.exit(1);
  });
