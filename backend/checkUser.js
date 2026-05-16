const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        const user = await User.findOne({ email: "anna@gmail.com" });
        if (user) {
            console.log("User found:");
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log("User not found: anna@gmail.com");
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection error:", err);
        process.exit(1);
    });
