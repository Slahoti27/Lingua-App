const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  language: { type: String, required: true },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },        // % correct
  xpEarned: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  completedAt: { type: Date },
}, { timestamps: true });

progressSchema.index({ userId: 1, language: 1 });
progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', progressSchema);
