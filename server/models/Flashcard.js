const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  language: { type: String, required: true },
  front: { type: String, required: true },       // Word / phrase
  back: { type: String, required: true },         // Translation
  phonetic: { type: String, default: '' },        // Pronunciation
  example: { type: String, default: '' },         // Example sentence
  category: { type: String, default: 'General' }, // Food, Travel, etc.
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },

  // Spaced repetition
  nextReview: { type: Date, default: Date.now },
  interval: { type: Number, default: 1 },         // Days until next review
  easeFactor: { type: Number, default: 2.5 },     // SM-2 ease factor
  repetitions: { type: Number, default: 0 },
  lastResult: { type: String, enum: ['correct', 'incorrect', null], default: null },
}, { timestamps: true });

flashcardSchema.index({ userId: 1, language: 1 });
flashcardSchema.index({ userId: 1, nextReview: 1 });

module.exports = mongoose.model('Flashcard', flashcardSchema);
