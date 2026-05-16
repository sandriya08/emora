const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        const result = await User.updateOne(
            { email: "anna@gmail,com" },
            { $set: { email: "anna@gmail.com" } }
        );
        
        if (result.matchedCount > 0) {
            console.log("Successfully updated email from anna@gmail,com to anna@gmail.com");
        } else {
            console.log("User anna@gmail,com not found. Maybe it was already fixed?");
        }
        process.exit(0);
    })
    .catch(err => {
        console.error("Connection error:", err);
        process.exit(1);
    });
