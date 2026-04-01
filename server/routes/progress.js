const express = require('express');
const { requireAuth } = require('../middleware/auth');
const UserProgress = require('../models/UserProgress');
const Flashcard = require('../models/Flashcard');
const User = require('../models/User');

const router = express.Router();

// GET /api/progress/stats
router.get('/stats', requireAuth, async (req, res) => {
  const user = req.user;
  const lang = user.currentLanguage;

  const [lessonStats, dueCards, totalCards] = await Promise.all([
    UserProgress.find({ userId: user._id, language: lang }),
    Flashcard.countDocuments({ userId: user._id, language: lang, nextReview: { $lte: new Date() } }),
    Flashcard.countDocuments({ userId: user._id, language: lang }),
  ]);

  const completed = lessonStats.filter(p => p.completed).length;
  const avgScore = completed > 0
    ? Math.round(lessonStats.filter(p => p.completed).reduce((a, p) => a + p.score, 0) / completed)
    : 0;

  res.json({
    xp: user.xp,
    streak: user.streak,
    longestStreak: user.longestStreak,
    lessonsCompleted: user.lessonsCompleted,
    flashcardsReviewed: user.flashcardsReviewed,
    aiCallMinutes: user.aiCallMinutes,
    todayXp: user.todayXp,
    dailyGoal: user.dailyGoal,
    dueCards,
    totalCards,
    avgScore,
    level: user.level,
  });
});

module.exports = router;
