const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }

        // Check user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user", // IMPORTANT
        });

        res.status(201).json({
            message: "User registered successfully",
            userId: user._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                therapistProfile: user.therapistProfile,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

/* ================= UPDATE PROFILE ================= */
router.put("/profile", async (req, res) => {
    try {
        const { userId, name, email } = req.body;
        if (!userId) return res.status(400).json({ message: "userId is required" });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (name) user.name = name;
        if (email) {
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: "Please enter a valid email address" });
            }
            user.email = email;
        }

        await user.save();
        res.json({ message: "Profile updated successfully", name: user.name, email: user.email });
    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
});

/* ================= CHANGE PASSWORD ================= */
router.put("/password", async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;
        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({ message: "userId, currentPassword, and newPassword are required" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Password change error:", error);
        res.status(500).json({ message: "Error changing password" });
    }
});

module.exports = router;
