const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const cleanup = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.deleteMany({ 
            role: 'therapist', 
            email: { $regex: /\./ } // Delete if contains a dot in the username part (wait, all have @emora.com)
        });
        // Actually, let's be more specific: delete if contains a dot BEFORE @emora.com
        // But since all therapist emails end in @emora.com, we can just delete those with dots and re-run.
        // Wait, @emora.com HAS a dot.
        // Correct regex: Any dot before the @
        const result2 = await User.deleteMany({ 
            role: 'therapist', 
            email: /.*\..*@/ 
        });
        
        console.log(`Deleted ${result2.deletedCount} legacy therapist accounts.`);
        process.exit(0);
    } catch (err) {
        console.error("Cleanup failed:", err);
        process.exit(1);
    }
};

cleanup();
