const express = require('express');
const router = express.Router();
const Therapist = require('../models/Therapist');

// Euclidean distance helper function for KNN
const calculateEuclideanDistance = (vec1, vec2) => {
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  return Math.sqrt(sum);
};

// @route   POST /api/therapist/match
// @desc    Match user vector to top 3 therapists using algorithm
router.post('/match', async (req, res) => {
  try {
    const { features, language, style } = req.body; 
    // user features format: [anxiety, depression, sleep, self_esteem, burnout]

    if (!features || features.length !== 5) {
      return res.status(400).json({ error: "Features must be an array of length 5" });
    }

    // 1. Pre-filter by language or style if requested (Diversity logic capability)
    const filter = {};
    if (language) filter.language = language;
    if (style) filter.style = style; // e.g. 'structured', 'supportive'

    const therapists = await Therapist.find(filter);

    if (therapists.length === 0) {
      return res.status(404).json({ error: "No therapists found matching criteria." });
    }

    // 2. Compute Euclidean distance mapping (KNN Implementation)
    const matchedTherapists = therapists.map((therapist) => {
      const distance = calculateEuclideanDistance(features, therapist.features);
      // Formula: match_score = 1 / (1 + distance) 
      const score = Math.round((1 / (1 + distance)) * 100);
      
      return {
        _id: therapist._id,
        name: therapist.name,
        type: therapist.type,
        specialization: therapist.specialization,
        language: therapist.language,
        style: therapist.style,
        features: therapist.features,
        matchPercentage: score, // Returns matching exactly as '91%' later in app
        matchScoreString: `${score}%`
      };
    });

    // 3. Sort descendingly by match percentage
    matchedTherapists.sort((a, b) => b.matchPercentage - a.matchPercentage);

    // 4. Send Top K Candidates (k=3)
    const top3 = matchedTherapists.slice(0, 3);
    
    // Example: Optional Diversity check to prevent duplicates
    // We already sorted by match_percentage. If we wanted 3 diverse types,
    // we would filter them here! For now, returning top 3 directly.
    
    res.json(top3);

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

module.exports = router;
