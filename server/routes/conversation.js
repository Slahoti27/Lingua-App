const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { tutorChat } = require('../services/aiService');
const { awardXP } = require('../services/progressService');
const User = require('../models/User');

const router = express.Router();

// POST /api/conversation/chat
router.post('/chat', requireAuth, async (req, res) => {
  const { messages, topic } = req.body;
  if (!messages || !messages.length) return res.status(400).json({ error: 'messages required' });

  try {
    const reply = await tutorChat({
      messages,
      targetLanguage: req.user.currentLanguage || 'French',
      nativeLanguage: req.user.nativeLanguage || 'English',
      level: req.user.level,
      topic,
    });

    // Award small XP for each message exchanged
    await awardXP(req.user._id, 3);

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/conversation/end-call — log AI call minutes
router.post('/end-call', requireAuth, async (req, res) => {
  const { minutes } = req.body;
  if (minutes > 0) {
    const xp = Math.round(minutes * 10);
    await awardXP(req.user._id, xp);
    await User.findByIdAndUpdate(req.user._id, { $inc: { aiCallMinutes: minutes } });
  }
  res.json({ success: true });
});

module.exports = router;
