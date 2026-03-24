const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixEmails = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Find Dr. Annie Flexy Dsilva
        const annie = await User.findOne({ name: /Annie/i, role: 'therapist' });
        
        if (annie) {
            console.log(`Found therapist: ${annie.name}, Current Email: ${annie.email}`);
            
            if (annie.email === 'Annie' || !annie.email.includes('@')) {
                annie.email = 'annie@emora.com';
                await annie.save();
                console.log(`Updated email to: ${annie.email}`);
            } else {
                console.log("Email already looks valid.");
            }
        } else {
            console.log("Dr. Annie not found.");
        }

        // Search for any other therapists with invalid emails
        const others = await User.find({ role: 'therapist', email: { $not: /@/ } });
        console.log(`Found ${others.length} other therapists with invalid emails.`);
        
        for (const user of others) {
            const newEmail = `${user.name.toLowerCase().replace(/[^a-z]/g, '')}@emora.com`;
            console.log(`Updating ${user.name}: ${user.email} -> ${newEmail}`);
            user.email = newEmail;
            await user.save();
        }

        console.log("Database repair complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

fixEmails();
