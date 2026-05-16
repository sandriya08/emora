const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const getCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find all therapists and admins
    const users = await User.find({ role: { $in: ["therapist", "admin"] } });
    
    console.log("\n--- DR & ADMIN CREDENTIALS ---");
    console.log("Name | Email | Role | Password Status");
    console.log("-----|-------|------|----------------");
    
    for (const u of users) {
      const isDefault = await bcrypt.compare("emora123", u.password);
      const passwordDisplay = isDefault ? "emora123" : "Unknown (Custom)";
      console.log(`${u.name} | ${u.email} | ${u.role} | ${passwordDisplay}`);
    }
    
    console.log("-------------------------------\n");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

getCredentials();
