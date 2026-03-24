const express = require('express');
const router = express.Router();
const Therapist = require('../models/Therapist');
const User = require('../models/User');

// Euclidean distance helper function for KNN
const calculateEuclideanDistance = (vec1, vec2) => {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 999;
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow((vec1[i] || 0) - (vec2[i] || 0), 2);
  }
  return Math.sqrt(sum);
};

// @route   POST /api/therapist/match
// @desc    Match user vector to top 3 therapists using algorithm
router.post('/match', async (req, res) => {
  try {
    const { features, language, style, labels, focus } = req.body; 
    console.log("Matching requested with focus:", focus, "features:", features);

    if (!features || features.length !== 8) {
      return res.status(400).json({ error: "Features must be an array of length 8" });
    }

    const filter = {};
    if (language) filter.language = language;
    if (style) filter.style = style; 
    if (focus) filter.category = focus;
    const therapists = await Therapist.find(filter);
    console.log(`Found ${therapists.length} therapists in DB matching filter`, filter);

    if (therapists.length === 0) {
      return res.status(404).json({ error: "No therapists found matching criteria." });
    }

    // 2. Compute Match Logic
    const matchedTherapists = therapists.map((therapist) => {
      const distance = calculateEuclideanDistance(features, therapist.features);
      
      // Professional label mapping
      const labelMap = {
        "Stress": "Stress & Pressure",
        "Anxiety": "Anxiety & Worry",
        "Depression": "Depression & Low Mood",
        "Burnout": "Burnout & Fatigue",
        "Sleep Disturbance": "Sleep & Rest Issues",
        "Low Self-Esteem": "Confidence & Self-Esteem",
        "Emotional Exhaustion": "Emotional Exhaustion",
        "Adjustment Issues": "Life Transitions"
      };

      // Specialist scoring
      let specialistScore = 0;
      if (labels && labels.length > 0) {
        // Expand labels to include professional terms
        const expandedLabels = labels.flatMap(label => [label, labelMap[label]].filter(Boolean));

        // Count matches in certificates
        const certificateMatches = expandedLabels.filter(label => 
          therapist.certificates && therapist.certificates.some(cert => cert.toLowerCase() === label.toLowerCase())
        ).length;
        
        // Count matches in specialization
        const specializationMatches = expandedLabels.filter(label => 
          therapist.specialization && therapist.specialization.some(spec => spec.toLowerCase() === label.toLowerCase())
        ).length;

        // Give high priority to certificate matches, especially in multi-diagnosis
        specialistScore = (certificateMatches * 10) + (specializationMatches * 2);

        // Professional Type Scoring (Intelligent Routing)
        if (focus === "Couple" && therapist.type === "Marriage & Family Therapist") {
          specialistScore += 15; // Strong boost for couple specialists
        }
        if (labels.includes("Anxiety") || labels.includes("Stress")) {
          if (therapist.type === "CBT Therapist" || therapist.type === "Clinical Psychologist") {
            specialistScore += 5;
          }
        }
        if (labels.includes("Depression") && therapist.type === "Psychiatrist") {
          specialistScore += 5; // psychiatrist for clinical depression (medical oversight)
        }
      }

      return {
        _id: therapist._id,
        name: therapist.name,
        type: therapist.type,
        specialization: therapist.specialization,
        certificates: therapist.certificates,
        language: therapist.language,
        style: therapist.style,
        features: therapist.features,
        distance: distance,
        specialistScore: specialistScore,
        isSpecialist: specialistScore >= 10 // Has at least one certificate match
      };
    });

    // 3. Sort logic: Specialist score first (desc), then distance (asc)
    matchedTherapists.sort((a, b) => {
      if (b.specialistScore !== a.specialistScore) {
        return b.specialistScore - a.specialistScore;
      }
      return a.distance - b.distance;
    });

    // 4. Send Top K Candidates (k=5 for better options)
    const top5 = matchedTherapists.slice(0, 5).map(t => {
      const { distance, specialistScore, ...rest } = t;
      return rest;
    });
    
    res.json(top5);

  } catch (err) {
    console.error("Match error:", err);
    res.status(500).json({ error: "Server error during therapist matching" });
  }
});

// @route   POST /api/therapist 
// @desc    Add a new therapist dynamically from admin module
router.post('/', async (req, res) => {
  try {
    const therapist = new Therapist(req.body);
    await therapist.save();
    res.status(201).json({ message: "Therapist added successfully", therapist });
  } catch (err) {
    console.error("Add error:", err);
    res.status(500).json({ error: "Failed to add therapist" });
  }
});

// @route   POST /api/therapist/save
// @desc    Toggle saving a therapist
router.post('/save', async (req, res) => {
  try {
    const { userId, therapistId } = req.body;
    if (!userId || !therapistId) {
      return res.status(400).json({ error: "userId and therapistId are required" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const index = user.savedTherapists.findIndex(id => id.toString() === therapistId.toString());
    if (index > -1) {
      user.savedTherapists.splice(index, 1);
      await user.save();
      return res.json({ message: "Therapist removed from favorites", saved: false });
    } else {
      user.savedTherapists.push(therapistId);
      await user.save();
      return res.json({ message: "Therapist saved to favorites", saved: true });
    }
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/therapist/saved
// @desc    Get all saved therapists for a user
router.get('/saved', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    console.log(`User ${userId} has ${user.savedTherapists.length} raw saved IDs:`, user.savedTherapists);

    await user.populate('savedTherapists');
    console.log(`Populated ${user.savedTherapists.length} therapists for match check`);
    res.json(user.savedTherapists);
  } catch (err) {
    console.error("Get saved error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/therapist/book
// @desc    Book a therapist with date/time validation
router.post('/book', async (req, res) => {
  console.log("[therapistRoutes.js] POST /book received:", req.body);
  try {
    const { userId, therapistId, date, time } = req.body;
    if (!userId || !therapistId || !date || !time) {
      return res.status(400).json({ error: "userId, therapistId, date, and time are required" });
    }

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) return res.status(404).json({ error: "Therapist not found" });

    // 1. Check if slot is already taken by ANYONE (Prevent Double Booking)
    const isSlotTaken = therapist.bookedSlots?.some(slot => 
      slot.date === date && slot.time === time
    );
    if (isSlotTaken) {
      return res.status(400).json({ message: "This slot is already booked by another user." });
    }

    // 2. Future-Proof: Verify against Therapist-defined availability
    if (therapist.availability && therapist.availability.length > 0) {
      const isAvailable = therapist.availability.some(slotStr => 
        slotStr.includes(date) && slotStr.includes(time)
      );
      if (!isAvailable) {
        return res.status(400).json({ message: "The therapist is not available at this time." });
      }
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 2. Add to Therapist's booked slots
    therapist.bookedSlots.push({ date, time, userId });
    await therapist.save();

    // 3. Add to User's list if not already there (for the general 'booked' list)
    if (!user.bookedTherapists.some(id => id.toString() === therapistId)) {
      user.bookedTherapists.push(therapistId);
      await user.save();
    }

    res.json({ message: "Session booked successfully!", booked: true });
  } catch (err) {
    console.error("Book error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/therapist/booked
// @desc    Get all booked therapists with their slots for a specific user
router.get('/booked', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    // We fetch therapists who have booked slots for this user
    const therapists = await Therapist.find({ "bookedSlots.userId": userId });
    
    // Transform to include the user's specific appointment data
    const appointments = therapists.map(t => {
      const userSlot = t.bookedSlots.find(slot => slot.userId.toString() === userId.toString());
      return {
        _id: t._id,
        name: t.name,
        type: t.type,
        specialization: t.specialization,
        date: userSlot?.date,
        time: userSlot?.time
      };
    });

    res.json(appointments);
  } catch (err) {
    console.error("Get booked error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/therapist/patients
// @desc    Get all users who have booked this therapist
router.get('/patients', async (req, res) => {
  try {
    const { therapistId } = req.query;
    if (!therapistId) return res.status(400).json({ error: "therapistId is required" });

    const therapist = await Therapist.findById(therapistId).populate('bookedSlots.userId', 'name email');
    if (!therapist) return res.status(404).json({ error: "Therapist not found" });

    // Extract unique patients from booked slots
    const patientsMap = new Map();
    therapist.bookedSlots.forEach(slot => {
      if (slot.userId && !patientsMap.has(slot.userId._id.toString())) {
        patientsMap.set(slot.userId._id.toString(), {
          _id: slot.userId._id,
          name: slot.userId.name,
          email: slot.userId.email,
          lastBooking: slot.date + ' ' + slot.time
        });
      }
    });

    res.json(Array.from(patientsMap.values()));
  } catch (err) {
    console.error("Get patients error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/therapist/patient/:userId/progress
// @desc    Get a specific patient's results and activity progress
router.get('/patient/:userId/progress', async (req, res) => {
  try {
    const { userId } = req.params;
    const { therapistId } = req.query;

    // Optional: Verify if this therapist has a booking with this user
    const therapist = await Therapist.findOne({ _id: therapistId, "bookedSlots.userId": userId });
    if (!therapist) {
      return res.status(403).json({ error: "Access denied. You can only view progress for your booked patients." });
    }

    const Diagnosis = require('../models/Diagnosis');
    const SelfCareSession = require('../models/SelfCareSession');

    const diagnoses = await Diagnosis.find({ userId }).populate('userId', 'name email').sort({ timestamp: -1 });
    const activities = await SelfCareSession.find({ userId }).sort({ createdAt: -1 });

    res.json({
      diagnoses,
      activities
    });
  } catch (err) {
    console.error("Get progress error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
