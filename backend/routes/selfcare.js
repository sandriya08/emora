const express = require("express");
const router = express.Router();
const { getSelfCareSuggestions } = require("../services/selfCareService");
const SelfCareSession = require("../models/SelfCareSession");
const Diagnosis = require("../models/Diagnosis");

// GET diagnosis history
router.get("/diagnosis", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const history = await Diagnosis.find({ userId }).sort({ timestamp: 1 }); // Sort oldest to newest for "Day 1, Day 2" labeling
    res.json(history);
  } catch (error) {
    console.error("Error fetching diagnosis history:", error);
    res.status(500).json({ message: "Error fetching history" });
  }
});

// POST save diagnosis
router.post("/diagnosis", async (req, res) => {
  try {
    const { userId, results, labels } = req.body;
    if (!userId || !results || !labels) return res.status(400).json({ message: "Missing required fields" });
    
    const newDiagnosis = new Diagnosis({ userId, results, labels });
    await newDiagnosis.save();
    res.status(201).json({ message: "Diagnosis saved successfully", diagnosis: newDiagnosis });
  } catch (error) {
    console.error("Error saving diagnosis:", error);
    res.status(500).json({ message: "Error saving diagnosis" });
  }
});

router.get("/history", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    const sessions = await SelfCareSession.find({ userId }).sort({ timestamp: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Error fetching session history:", error);
    res.status(500).json({ message: "Error fetching history" });
  }
});

router.post("/", async (req, res) => {
  const { diagnoses } = req.body;
  const suggestions = await getSelfCareSuggestions(diagnoses);

  res.json({
    diagnoses,
    suggestions
  });
});

router.post("/session", async (req, res) => {
  try {
    const { userId, diagnoses, completedActivities, moodBefore, moodAfter, week, totalActivities } = req.body;
    
    const newSession = new SelfCareSession({
      userId,
      diagnoses,
      completedActivities,
      moodBefore,
      moodAfter,
      week,
      totalActivities: totalActivities || 0,
    });

    await newSession.save();
    res.status(201).json({ message: "Session saved successfully", session: newSession });
  } catch (error) {
    console.error("Error saving self-care session:", error);
    res.status(500).json({ message: "Error saving session" });
  }
});

module.exports = router;
