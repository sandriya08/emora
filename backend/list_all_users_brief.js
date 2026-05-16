const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const listAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}, { name: 1, email: 1, role: 1 });
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listAllUsers();
