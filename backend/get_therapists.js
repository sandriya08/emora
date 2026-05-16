const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const therapists = await User.find({ role: "therapist" }, { name: 1, email: 1 });
    console.log("THERAPISTS_START");
    console.log(JSON.stringify(therapists, null, 2));
    console.log("THERAPISTS_END");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
