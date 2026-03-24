const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Therapist = require('./models/Therapist');

dotenv.config();

const types = [
    "Clinical Psychologist",
    "CBT Therapist",
    "Counseling Psychologist",
    "Psychiatrist",
    "Psychiatric Nurse",
    "Marriage & Family Therapist",
    "Mental Health Counselor",
    "Social Worker"
];

const reMigrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Type migration...");

        const therapists = await Therapist.find({});
        console.log(`Updating types and flow for ${therapists.length} therapists.`);

        for (let i = 0; i < therapists.length; i++) {
            const t = therapists[i];
            
            // Assign Marriage & Family to Couple specialists intelligently
            if (t.category === "Couple") {
                t.type = "Marriage & Family Therapist";
            } else {
                // Distribute others across the other 7 types
                const nonCoupleTypes = types.filter(type => type !== "Marriage & Family Therapist");
                t.type = nonCoupleTypes[i % nonCoupleTypes.length];
            }

            // Also clean up specializations for these types
            if (t.type === "CBT Therapist") {
                t.specialization = ["CBT Specialist", "Anxiety & Worry", "Stress & Pressure"];
            } else if (t.type === "Psychiatrist") {
                t.specialization = ["Medical Oversight", "Depression & Low Mood"];
            } else if (t.type === "Marriage & Family Therapist") {
                t.specialization = ["Relationship & Marriage", "Communication & Trust"];
            }

            await t.save();
            console.log(`Synchronized profile for: ${t.name} (Type: ${t.type})`);
        }

        console.log("Database profiles synchronized and flow-aligned!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

reMigrate();
