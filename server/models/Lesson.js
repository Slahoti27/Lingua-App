const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  type: { type: String, enum: ['translate', 'multiple-choice', 'fill-blank', 'match'], required: true },
  question: { type: String, required: true },
  options: [String],           // For multiple-choice
  answer: { type: String, required: true },
  hint: { type: String, default: '' },
  xpReward: { type: Number, default: 10 },
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  language: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Elementary', 'Intermediate', 'Advanced'], required: true },
  title: { type: String, required: true },
  description: { type: String },
  topic: { type: String },        // e.g. "Greetings", "Numbers", "Food"
  order: { type: Number, default: 0 },
  xpReward: { type: Number, default: 50 },
  exercises: [exerciseSchema],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Lesson', lessonSchema);
