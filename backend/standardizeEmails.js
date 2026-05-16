const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const User = require("./models/User");

dotenv.config({ path: path.join(__dirname, ".env") });

const fixEmails = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for email standardization...");

    const therapists = await User.find({ role: "therapist" });
    console.log(`Checking ${therapists.length} therapists.`);

    for (const t of therapists) {
      const oldEmail = t.email;
      
      // Clean name: remove "Dr.", "Dr ", "dr.", "dr " from the start
      let cleanedName = t.name.replace(/^(dr\.?\s*)/i, "").trim();
      
      // Keep only letters for the email part
      const emailBase = cleanedName.toLowerCase().replace(/[^a-z]/g, "");
      const newEmail = `${emailBase}@emora.com`;

      if (oldEmail !== newEmail) {
        console.log(`Updating ${t.name}: ${oldEmail} -> ${newEmail}`);
        t.email = newEmail;
        await t.save();
      } else {
        console.log(`Email for ${t.name} is already correct: ${oldEmail}`);
      }
    }

    console.log("Email standardization complete.");
    process.exit(0);
  } catch (err) {
    console.error("Standardization failed:", err);
    process.exit(1);
  }
};

fixEmails();
