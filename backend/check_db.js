const mongoose = require('mongoose');
const User = require('./models/User');
const Therapist = require('./models/Therapist');
require('dotenv').config();

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
            console.log("ID:", specificUser._id);
            console.log("Role:", specificUser.role);
            console.log("Password hash exists:", !!specificUser.password);
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
