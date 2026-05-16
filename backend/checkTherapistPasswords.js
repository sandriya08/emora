const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const checkPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const therapists = await User.find({ role: "therapist" });
    
    console.log("\n--- THERAPIST PASSWORDS ---");
    console.log("Name | Email | Password");
    console.log("-----|-------|---------");
    
    for (const t of therapists) {
      const isDefault = await bcrypt.compare("emora123", t.password);
      const passwordDisplay = isDefault ? "emora123" : "Unknown (Custom)";
      console.log(`${t.name} | ${t.email} | ${passwordDisplay}`);
    }
    
    console.log("---------------------------\n");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkPasswords();
