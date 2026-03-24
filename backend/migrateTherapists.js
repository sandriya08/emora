const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Therapist = require('./models/Therapist');

dotenv.config();

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration...");

        const therapists = await Therapist.find({});
        console.log(`Found ${therapists.length} therapists to migrate.`);

        const labelMap = {
            "Anxiety Disorders": "Anxiety & Worry",
            "Depression & Mood": "Depression & Low Mood",
            "Trauma & PTSD": "Stress & Pressure",
            "CBT": "CBT Specialist",
            "Mindfulness": "Mindfulness & Coping",
            "Relationship Issues": "Relationship & Marriage",
            "Grief & Loss": "Grief & Loss Support",
            "Self-Esteem": "Confidence & Self-Esteem",
            "Work-Life Balance": "Burnout & Fatigue"
        };

        for (const t of therapists) {
            let needsUpdate = false;

            if (!t.category) {
                t.category = "Individual";
                needsUpdate = true;
            }
            if (!t.gender) {
                t.gender = "Prefer not to say";
                needsUpdate = true;
            }
            if (!t.experienceYears) {
                t.experienceYears = "5";
                needsUpdate = true;
            }
            if (!t.bio || t.bio === "") {
                t.bio = `Hi, I'm ${t.name}. I specialize in helping individuals navigate their emotional journeys with care and professional clinical insight.`;
                needsUpdate = true;
            }

            // Map old specializations to new ones
            if (t.specialization && t.specialization.length > 0) {
                const newSpecs = t.specialization.map(s => labelMap[s] || s);
                // Remove LGBTQ+ or Addiction if they exist
                t.specialization = newSpecs.filter(s => !["LGBTQ+ Support", "Addiction Recovery"].includes(s));
                needsUpdate = true;
            }

            if (needsUpdate) {
                await t.save();
                console.log(`Updated therapist: ${t.name}`);
            }
        }

        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
