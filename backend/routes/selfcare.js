const express = require("express");
const router = express.Router();
const { getSelfCareSuggestions } = require("../services/selfCareService");
const SelfCareSession = require("../models/SelfCareSession");
const Diagnosis = require("../models/Diagnosis");
const ChatSession = require("../models/ChatSession");

// GET diagnosis history
router.get("/diagnosis", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const history = await Diagnosis.find({ userId }).sort({ timestamp: -1 }); // Newest first
    res.json(history);
  } catch (error) {
    console.error("Error fetching diagnosis history:", error);
    res.status(500).json({ message: "Error fetching history" });
  }
});

// GET specific diagnosis by ID
router.get("/diagnosis/:id", async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) return res.status(404).json({ message: "Diagnosis not found" });
    res.json(diagnosis);
  } catch (error) {
    console.error("Error fetching diagnosis by ID:", error);
    res.status(500).json({ message: "Error fetching diagnosis" });
  }
});

// POST save chat session
router.post("/chat", async (req, res) => {
  try {
    const { userId, messages, diagnosisId } = req.body;
    if (!userId || !messages) return res.status(400).json({ message: "userId and messages are required" });
    
    const newChatSession = new ChatSession({ userId, messages, diagnosisId });
    await newChatSession.save();
    res.status(201).json({ message: "Chat session saved successfully", session: newChatSession });
  } catch (error) {
    console.error("Error saving chat session:", error);
    res.status(500).json({ message: "Error saving chat session" });
  }
});

// POST save diagnosis
router.post("/diagnosis", async (req, res) => {
  try {
    const { userId, results, labels, focus } = req.body;
    if (!userId || !results || !labels) return res.status(400).json({ message: "Missing required fields" });
    
    const newDiagnosis = new Diagnosis({ userId, results, labels, focus: focus || "Individual" });
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

// GET chat history
router.get("/chat-history", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const chatSessions = await ChatSession.find({ userId })
      .sort({ createdAt: -1 })
      .populate('diagnosisId');
    
    res.json(chatSessions);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
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
