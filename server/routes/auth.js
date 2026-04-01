const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, targetLanguage } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    if (await User.findOne({ email })) return res.status(400).json({ error: 'Email already in use' });

    const user = await User.create({
      name, email, password,
      targetLanguages: targetLanguage ? [targetLanguage] : [],
      currentLanguage: targetLanguage || '',
    });

    res.status(201).json({ token: signToken(user._id), user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.json({ token: signToken(user._id), user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: sanitize(req.user) });
});

// PATCH /api/auth/profile
router.patch('/profile', requireAuth, async (req, res) => {
  const allowed = ['name', 'currentLanguage', 'targetLanguages', 'level', 'dailyGoal', 'nativeLanguage'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json({ user: sanitize(user) });
});

const sanitize = (u) => ({
  _id: u._id, name: u.name, email: u.email, avatar: u.avatar,
  nativeLanguage: u.nativeLanguage, targetLanguages: u.targetLanguages,
  currentLanguage: u.currentLanguage, level: u.level,
  xp: u.xp, streak: u.streak, longestStreak: u.longestStreak,
  lessonsCompleted: u.lessonsCompleted, flashcardsReviewed: u.flashcardsReviewed,
  aiCallMinutes: u.aiCallMinutes, dailyGoal: u.dailyGoal,
  todayXp: u.todayXp, todayDate: u.todayDate,
});

module.exports = router;
