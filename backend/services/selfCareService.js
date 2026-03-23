const Activity = require("../models/Activity");

async function getSelfCareSuggestions(diagnoses) {
  if (!Array.isArray(diagnoses)) {
    diagnoses = [diagnoses];
  }

  try {
    const allActivities = await Activity.find({});
    if (allActivities.length === 0) return [];

    const matches = allActivities.filter(a => diagnoses.includes(a.category));
    const nonMatches = allActivities.filter(a => !diagnoses.includes(a.category));

    const shuffledMatches = matches.sort(() => 0.5 - Math.random());
    const shuffledNonMatches = nonMatches.sort(() => 0.5 - Math.random());

    const combined = [...shuffledMatches, ...shuffledNonMatches];
    
    // Return 24 items (6 unique items per week for 4 weeks)
    return combined.slice(0, 24);
  } catch (error) {
    console.error("Error fetching activities from MongoDB:", error);
    return [];
  }
}

module.exports = { getSelfCareSuggestions };
