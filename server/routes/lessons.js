const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const { generateLesson, evaluateAnswer } = require('../services/aiService');
const { awardXP } = require('../services/progressService');
const User = require('../models/User');

const router = express.Router();

// GET /api/lessons?language=French&level=Beginner
router.get('/', requireAuth, async (req, res) => {
  const { language, level } = req.query;
  const query = { isActive: true };
  if (language) query.language = language;
  if (level) query.level = level;

  const lessons = await Lesson.find(query).sort({ order: 1 }).select('-exercises');

  // Attach user progress
  const progress = await UserProgress.find({
    userId: req.user._id,
    lessonId: { $in: lessons.map(l => l._id) },
  });
  const progressMap = {};
  progress.forEach(p => { progressMap[p.lessonId.toString()] = p; });

  const lessonsWithProgress = lessons.map(l => ({
    ...l.toObject(),
    userProgress: progressMap[l._id.toString()] || null,
  }));

  res.json({ lessons: lessonsWithProgress });
});

// GET /api/lessons/:id — full lesson with exercises
router.get('/:id', requireAuth, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

  const progress = await UserProgress.findOne({ userId: req.user._id, lessonId: lesson._id });
  res.json({ lesson, userProgress: progress });
});

// POST /api/lessons/generate — AI-generate a new lesson
router.post('/generate', requireAuth, async (req, res) => {
  const { language, level, topic } = req.body;

  if (!language || !topic) {
    return res.status(400).json({ error: 'language and topic required' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const finalLevel = level || req.user.level;

    const generated = await generateLesson({
      language,
      level: finalLevel,
      topic,
    });

    const count = await Lesson.countDocuments({
      language,
      level: finalLevel,
    });

    const lesson = await Lesson.create({
      ...generated,
      language,
      level: finalLevel,
      topic,
      order: count + 1,
    });

    res.status(201).json({ lesson });

  } catch (err) {
    console.error("🔥 Generate error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:id/evaluate — evaluate a user's answer
router.post('/:id/evaluate', requireAuth, async (req, res) => {
  const { exerciseIndex, userAnswer } = req.body;
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

  const exercise = lesson.exercises[exerciseIndex];
  if (!exercise) return res.status(400).json({ error: 'Exercise not found' });

  // For multiple-choice, check directly
  if (exercise.type === 'multiple-choice') {
    const correct = userAnswer.trim().toLowerCase() === exercise.answer.trim().toLowerCase();
    return res.json({ correct, feedback: correct ? 'Correct! 🎉' : `The answer was: ${exercise.answer}`, correction: exercise.answer });
  }

  // For translate / fill-blank — use AI evaluation
  const result = await evaluateAnswer({
    question: exercise.question,
    userAnswer,
    correctAnswer: exercise.answer,
    language: lesson.language,
  });

  res.json(result);
});

// POST /api/lessons/:id/complete — mark lesson done, award XP
router.post('/:id/complete', requireAuth, async (req, res) => {
  const { score, xpEarned } = req.body;
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

  const progress = await UserProgress.findOneAndUpdate(
    { userId: req.user._id, lessonId: lesson._id },
    {
      userId: req.user._id, lessonId: lesson._id, language: lesson.language,
      completed: true, score, xpEarned, attempts: 1, completedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  const xpStats = await awardXP(req.user._id, xpEarned || lesson.xpReward);
  await User.findByIdAndUpdate(req.user._id, { $inc: { lessonsCompleted: 1 } });

  res.json({ progress, ...xpStats });
});

module.exports = router;
