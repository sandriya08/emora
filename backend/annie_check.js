const mongoose = require('mongoose');
const Therapist = require('./models/Therapist');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const therapists = await Therapist.find({}, 'name');
        const users = await User.find({ role: 'therapist' }, 'email role');
        
        let report = `Therapists in collection: ${therapists.map(t => t.name).join(', ')}\n\n`;
        report += `Therapist Users in collection: ${users.map(u => u.email).join(', ')}\n`;
        
        fs.writeFileSync('annie_check.txt', report, 'utf8');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('annie_check.txt', `Error: ${err.message}`, 'utf8');
        process.exit(1);
    }
};

check();
