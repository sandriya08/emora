const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Therapist = require('./backend/models/Therapist');
require('dotenv').config({ path: './backend/.env' });

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const userCount = await User.countDocuments();
        console.log(`Total users: ${userCount}`);

        const therapistUserCount = await User.countDocuments({ role: 'therapist' });
        console.log(`Therapist users: ${therapistUserCount}`);

        const specificUser = await User.findOne({ email: 'drmeera@emora.com' });
        if (specificUser) {
            console.log("Found drmeera@emora.com:");
            console.log(JSON.stringify(specificUser, null, 2));
        } else {
            console.log("drmeera@emora.com NOT found");
        }

        const therapistCount = await Therapist.countDocuments();
        console.log(`Total therapists in Therapist collection: ${therapistCount}`);

        process.exit(0);
    } catch (err) {
        console.error("Check failed:", err);
        process.exit(1);
    }
};

check();
