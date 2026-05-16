const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const checkAllCredentials = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    
    console.log("\n--- ALL USER CREDENTIALS ---");
    console.log("Role | Name | Email | Password Status");
    console.log("-----|------|-------|----------------");
    
    for (const u of users) {
      const isDefault = await bcrypt.compare("emora123", u.password);
      const isTest123 = await bcrypt.compare("test1234", u.password); // Common test pwd
      const passwordDisplay = isDefault ? "emora123" : (isTest123 ? "test1234" : "Custom/Unknown");
      console.log(`${u.role} | ${u.name} | ${u.email} | ${passwordDisplay}`);
    }
    
    console.log("----------------------------\n");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAllCredentials();
