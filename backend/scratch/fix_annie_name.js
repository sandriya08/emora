const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');
const Therapist = require('../models/Therapist');

async function fixName() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const oldName = 'Dr.Annie Flexy Dsilva';
    const newName = 'Dr. Annie Flexy Dsilva';

    const userRes = await User.updateOne({ name: oldName }, { $set: { name: newName } });
    const thRes = await Therapist.updateOne({ name: oldName }, { $set: { name: newName } });

    console.log('User update:', userRes);
    console.log('Therapist update:', thRes);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixName();
