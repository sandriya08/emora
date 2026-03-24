const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Therapist = require('../models/Therapist');
const bcrypt = require('bcryptjs');

// @route   POST /api/admin/login
// @desc    Hardcoded admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`[AdminLogin] Attempt for: ${email}`);

  if (!email || !password) {
    console.log('[AdminLogin] Missing email or password');
    return res.status(400).json({ message: 'Email and password required' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const isAdminEmail = normalizedEmail === 'admin@emora.com' || normalizedEmail === 'admin123@emora.com';

  console.log(`[AdminLogin] Email match: ${isAdminEmail}, Password check: ${password === 'admin123'}`);

  if (isAdminEmail && password === 'admin123') {
    console.log('[AdminLogin] Success!');
    return res.json({
      message: 'Admin login successful',
      user: {
        email: 'admin@emora.com',
        role: 'admin',
        name: 'Admin'
      }
    });
  }

  console.log('[AdminLogin] 401: Invalid credentials');
  return res.status(401).json({ message: 'Invalid admin credentials' });
});

// @route   POST /api/admin/register-therapist
// @desc    Register a new therapist (User + Therapist profile)
router.post('/register-therapist', async (req, res) => {
  try {
    const {
      name, email, password, type, specialization, features,
      style, language, certificates, phone, location,
      gender, experienceYears, bio, category
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Therapist Profile first
    const newTherapist = new Therapist({
      name,
      type,
      specialization,
      features,
      style,
      language,
      certificates,
      phone,
      location,
      gender,
      experienceYears,
      bio,
      category
    });
    await newTherapist.save();

    // 2. Create User account
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: 'therapist',
      therapistProfile: newTherapist._id
    });
    await newUser.save();

    // 3. Link back
    newTherapist.user = newUser._id;
    await newTherapist.save();

    res.status(201).json({
      message: 'Therapist registered successfully',
      therapist: newTherapist,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Register therapist error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all registered users (patients)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password');
    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/therapists
// @desc    Get all therapists with their accounts
router.get('/therapists', async (req, res) => {
  try {
    const therapists = await User.find({ role: 'therapist' })
      .select('-password')
      .populate('therapistProfile');
    res.json(therapists);
  } catch (err) {
    console.error('Get therapists error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/reset-password
// @desc    Reset a user's password from admin
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) return res.status(400).json({ message: 'userId and newPassword required' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
