const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },

  // Language learning profile
  nativeLanguage: { type: String, default: 'English' },
  targetLanguages: [{ type: String }],
  currentLanguage: { type: String, default: '' },
  level: { type: String, enum: ['Beginner', 'Elementary', 'Intermediate', 'Advanced'], default: 'Beginner' },

  // Progress & gamification
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: Date, default: null },
  lessonsCompleted: { type: Number, default: 0 },
  flashcardsReviewed: { type: Number, default: 0 },
  aiCallMinutes: { type: Number, default: 0 },

  // Daily goal (XP target)
  dailyGoal: { type: Number, default: 50 },
  todayXp: { type: Number, default: 0 },
  todayDate: { type: String, default: '' }, // 'YYYY-MM-DD'
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
