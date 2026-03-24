const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "therapist", "admin"],
      default: "user",
    },
    savedTherapists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Therapist",
      },
    ],
    bookedTherapists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Therapist",
      },
    ],
    therapistProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Therapist",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
