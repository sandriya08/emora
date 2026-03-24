const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Therapist = require('./models/Therapist');
const User = require('./models/User');

dotenv.config();

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for account healing...");

        const therapists = await Therapist.find({});
        console.log(`Checking ${therapists.length} therapists for user accounts.`);

        for (const t of therapists) {
            // Generate a fake but consistent email if none exists (though therapists usually have phones/names)
            // Most therapists in the current DB don't have an 'email' field in Therapist model, 
            // but we need one for User.
            const safeEmail = t.name.toLowerCase().replace(/[^a-z0-9]/g, '') + "@emora.com";
            
            let user = await User.findOne({ email: safeEmail });
            
            if (!user) {
                console.log(`Creating user account for ${t.name} (${safeEmail})`);
                const hashedPassword = await bcrypt.hash("emora123", 10);
                user = new User({
                    name: t.name,
                    email: safeEmail,
                    password: hashedPassword,
                    role: 'therapist',
                    therapistProfile: t._id
                });
                await user.save();
            } else {
                // Ensure it's linked
                user.therapistProfile = t._id;
                user.role = 'therapist';
                await user.save();
            }

            // Sync back to Therapist
            t.user = user._id;
            await t.save();
        }

        console.log("Healing complete! All therapists now have User accounts.");
        process.exit(0);
    } catch (err) {
        console.error("Healing failed:", err);
        process.exit(1);
    }
};

fix();
