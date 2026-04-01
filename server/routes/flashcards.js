const express = require('express');
const { requireAuth } = require('../middleware/auth');
const Flashcard = require('../models/Flashcard');
const { generateFlashcards } = require('../services/aiService');
const { awardXP } = require('../services/progressService');
const User = require('../models/User');

const router = express.Router();

// GET /api/flashcards?language=French&due=true
router.get('/', requireAuth, async (req, res) => {
  const { language, due, category } = req.query;
  const query = { userId: req.user._id };
  if (language) query.language = language;
  if (category) query.category = category;
  if (due === 'true') query.nextReview = { $lte: new Date() };

  const cards = await Flashcard.find(query).sort({ nextReview: 1 });
  res.json({ cards });
});

// POST /api/flashcards — create single card
router.post('/', requireAuth, async (req, res) => {
  try {
    const card = await Flashcard.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ card });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/flashcards/generate — AI generate cards
router.post('/generate', requireAuth, async (req, res) => {
  const { language, topic, level, count = 8 } = req.body;
  if (!language || !topic) return res.status(400).json({ error: 'language and topic required' });

  try {
    const generated = await generateFlashcards({ language, topic, level: level || req.user.level, count });
    const cards = await Flashcard.insertMany(
      generated.map(c => ({ ...c, userId: req.user._id, language, category: topic }))
    );
    res.json({ cards, count: cards.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/flashcards/:id/review — submit review result
router.post('/:id/review', requireAuth, async (req, res) => {
  const { result } = req.body; // 'correct' | 'incorrect'
  const card = await Flashcard.findOne({ _id: req.params.id, userId: req.user._id });
  if (!card) return res.status(404).json({ error: 'Card not found' });

  // SM-2 spaced repetition algorithm
  if (result === 'correct') {
    card.repetitions += 1;
    card.easeFactor = Math.max(1.3, card.easeFactor + 0.1);
    card.interval = card.repetitions === 1 ? 1 : Math.round(card.interval * card.easeFactor);
  } else {
    card.repetitions = 0;
    card.interval = 1;
    card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
  }

  card.nextReview = new Date(Date.now() + card.interval * 24 * 60 * 60 * 1000);
  card.lastResult = result;
  await card.save();

  // Award XP for reviews
  if (result === 'correct') {
    await awardXP(req.user._id, 5);
    await User.findByIdAndUpdate(req.user._id, { $inc: { flashcardsReviewed: 1 } });
  }

  res.json({ card });
});

// DELETE /api/flashcards/:id
router.delete('/:id', requireAuth, async (req, res) => {
  await Flashcard.deleteOne({ _id: req.params.id, userId: req.user._id });
  res.json({ success: true });
});

module.exports = router;
