const mongoose = require('mongoose');
require('dotenv').config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const collections = ['selfcaresessions', 'diagnoses', 'chatsessions'];
    
    for (const col of collections) {
      const docs = await mongoose.connection.db.collection(col).find({ 
        $or: [
          { userId: "test" },
          { userId: { $exists: false } },
          { userId: null }
        ]
      }).toArray();
      console.log(`Collection ${col}: Found ${docs.length} unusual documents`);
      if (docs.length > 0) {
        console.log(`Sample from ${col}:`, JSON.stringify(docs[0], null, 2));
      }
    }

    // Also check for the user "test"
    const user = await mongoose.connection.db.collection('users').findOne({ name: "test" });
    if (user) {
      console.log("Found user 'test':", user._id);
      const userDocs = await mongoose.connection.db.collection('selfcaresessions').find({ userId: user._id }).toArray();
      console.log(`User 'test' has ${userDocs.length} self-care sessions`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

checkData();
