const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Therapist = require('../models/Therapist');
const Diagnosis = require('../models/Diagnosis');
const AssessmentQuestion = require('../models/AssessmentQuestion');
const bcrypt = require('bcryptjs');

// @route   POST /api/admin/login
// @desc    Hardcoded admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim()?.toLowerCase();
  
  console.log(`[AdminLogin] Received: ${normalizedEmail}`);

  if (!normalizedEmail || !password) {
    console.log('[AdminLogin] 400: Email and password required');
    return res.status(400).json({ message: 'Email and password required' });
  }

  const isAdminEmail = normalizedEmail === 'admin@emora.com' || normalizedEmail === 'admin123@emora.com';
  const isCorrectPassword = password === 'admin123';

  console.log(`[AdminLogin] Email match: ${isAdminEmail}, Pwd match: ${isCorrectPassword}`);

  if (isAdminEmail && isCorrectPassword) {
    console.log('[AdminLogin] 200: Success!');
    return res.json({
      message: 'Admin login successful',
      user: {
        id: 'admin_root',
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

// @route   DELETE /api/admin/users/:id
// @desc    Delete a patient user
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[AdminAPI] Request to DELETE patient with ID: ${id}`);
  
  try {
    const user = await User.findById(id);
    if (!user) {
      console.log(`[AdminAPI] User not found: ${id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Safety check: Don't allow deleting admins through this simple endpoint
    if (user.role === 'admin') {
      console.log(`[AdminAPI] Deletion blocked: target is an admin`);
      return res.status(403).json({ message: 'Administrative accounts cannot be deleted here' });
    }
    
    await User.findByIdAndDelete(id);
    console.log(`[AdminAPI] Successfully deleted user: ${user.email} (${id})`);
    res.json({ message: 'Patient deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get platform insights (diagnosis counts, wellbeing avg)
router.get('/analytics', async (req, res) => {
  try {
    const userCount = await User.countDocuments({ role: 'user' });
    const therapistCount = await User.countDocuments({ role: 'therapist' });
    
    // Aggregate diagnosis labels & average scores
    const diagnoses = await Diagnosis.find({});
    const labelCounts = {};
    let totalScore = 0;
    let diagnosisCount = 0;

    diagnoses.forEach(d => {
      d.labels.forEach(l => {
        labelCounts[l] = (labelCounts[l] || 0) + 1;
      });
      
      if (d.results) {
        const scores = Object.values(d.results).map(r => r.score || 0);
        if (scores.length > 0) {
          totalScore += scores.reduce((a, b) => a + b, 0) / (scores.length * 10);
          diagnosisCount++;
        }
      }
    });

    const avgWellbeing = diagnosisCount > 0 ? (totalScore / diagnosisCount) * 100 : 0;
    
    // Format label distribution for charts
    const labelDistribution = Object.entries(labelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get 5 most recent registrations
    const recentUsers = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');

    res.json({
      summary: {
        userCount,
        therapistCount,
        avgWellbeing: Math.round(avgWellbeing)
      },
      labelDistribution,
      recentEvents: recentUsers.map(u => ({
        id: u._id,
        type: 'REGISTRATION',
        title: 'New Patient Onboarded',
        message: `${u.name} registered as a patient.`,
        timestamp: u.createdAt
      }))
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all therapist bookings across the platform
router.get('/bookings', async (req, res) => {
  try {
    // Find all therapists and populate their booked slots' patient info
    const therapists = await Therapist.find().populate('bookedSlots.userId', 'name email');
    
    let allBookings = [];
    therapists.forEach(t => {
      if (t.bookedSlots && t.bookedSlots.length > 0) {
        t.bookedSlots.forEach(slot => {
          allBookings.push({
            id: slot._id,
            therapistName: t.name,
            patientName: slot.userId?.name || 'Unknown Patient',
            patientEmail: slot.userId?.email || 'N/A',
            date: slot.date,
            time: slot.time,
            therapistId: t._id,
          });
        });
      }
    });

    // Sort by date (newest first)
    allBookings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.json(allBookings);
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/questions
// @desc    Get all assessment questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await AssessmentQuestion.find().sort({ orderIndex: 1 });
    res.json(questions);
  } catch (err) {
    console.error('Get questions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/questions
// @desc    Add a new assessment question
router.post('/questions', async (req, res) => {
  try {
    const { text, category, weight, orderIndex } = req.body;
    if (!text || !category) return res.status(400).json({ message: 'Text and category required' });

    const newQuestion = new AssessmentQuestion({ text, category, weight, orderIndex });
    await newQuestion.save();
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error('Create question error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/questions/:id
// @desc    Update a question
router.put('/questions/:id', async (req, res) => {
  try {
    const { text, category, weight, orderIndex, isActive } = req.body;
    const updated = await AssessmentQuestion.findByIdAndUpdate(
      req.params.id,
      { text, category, weight, orderIndex, isActive },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('Update question error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/questions/:id
// @desc    Delete a question
router.delete('/questions/:id', async (req, res) => {
  try {
    await AssessmentQuestion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    console.error('Delete question error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
