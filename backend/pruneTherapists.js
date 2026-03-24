const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Therapist = require('./models/Therapist');
const User = require('./models/User');

dotenv.config();

const prune = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for pruning...");

        const therapists = await Therapist.find({});
        const typesSeen = new Set();
        const toDeleteIds = [];
        const toKeepTherapists = [];

        for (const t of therapists) {
            if (typesSeen.has(t.type)) {
                toDeleteIds.push(t._id);
            } else {
                typesSeen.add(t.type);
                toKeepTherapists.push(t);
            }
        }

        console.log(`Pruning: Found ${toDeleteIds.length} redundant therapists to remove.`);
        
        for (const id of toDeleteIds) {
            // Find the associated user and delete it too
            const therapist = await Therapist.findById(id);
            if (therapist && therapist.user) {
                await User.findByIdAndDelete(therapist.user);
            }
            await Therapist.findByIdAndDelete(id);
        }

        console.log(`Cleanup complete! Kept ${toKeepTherapists.length} unique professional types.`);
        process.exit(0);
    } catch (err) {
        console.error("Pruning failed:", err);
        process.exit(1);
    }
};

prune();
