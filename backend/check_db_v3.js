const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'therapist' }, 'email role');
        const meera = await User.findOne({ email: 'drmeera@emora.com' });
        
        let report = `Total therapist users found: ${users.length}\n`;
        if (meera) {
            report += `Found Meera: ${JSON.stringify(meera)}\n`;
        } else {
            report += `Meera NOT found\n`;
        }
        report += `All therapist emails: ${users.map(u => u.email).join(', ')}\n`;
        
        fs.writeFileSync('db_report.txt', report, 'utf8');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('db_report.txt', `Error: ${err.message}`, 'utf8');
        process.exit(1);
    }
};

check();
