const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Activity = require("../models/Activity");
const staticActivities = require("../data/selfCareActivities");

dotenv.config();

const seedActivities = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing activities
        await Activity.deleteMany({});
        console.log("Cleared existing activities.");

        const flatActivities = [];
        
        for (const category in staticActivities) {
            staticActivities[category].forEach(activity => {
                flatActivities.push({
                    title: activity.title,
                    desc: activity.desc,
                    category: category,
                    duration: "5-10 minutes", // Default duration
                    difficulty: "Easy"
                });
            });
        }

        await Activity.insertMany(flatActivities);
        console.log(`Successfully seeded ${flatActivities.length} activities.`);

        process.exit();
    } catch (error) {
        console.error("Error seeding activities:", error);
        process.exit(1);
    }
};

seedActivities();
