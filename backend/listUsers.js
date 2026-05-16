const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        const users = await User.find({}, { password: 0 }); // Don't show passwords
        console.log("All users:");
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection error:", err);
        process.exit(1);
    });
