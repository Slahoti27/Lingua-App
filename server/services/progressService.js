const User = require('../models/User');

const today = () => new Date().toISOString().split('T')[0];

/**
 * Award XP and update streak for a user
 */
const awardXP = async (userId, xpAmount) => {
  const user = await User.findById(userId);
  if (!user) return;

  const todayStr = today();

  // Reset today's XP if it's a new day
  if (user.todayDate !== todayStr) {
    user.todayXp = 0;
    user.todayDate = todayStr;
  }

  user.xp += xpAmount;
  user.todayXp += xpAmount;

  // Update streak
  const last = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;
  if (last === todayStr) {
    // Already active today — no streak change
  } else if (last === getPreviousDay(todayStr)) {
    // Consecutive day
    user.streak += 1;
    if (user.streak > user.longestStreak) user.longestStreak = user.streak;
  } else {
    // Streak broken
    user.streak = 1;
  }

  user.lastActiveDate = new Date();
  await user.save();

  return { xp: user.xp, streak: user.streak, todayXp: user.todayXp };
};

const getPreviousDay = (dateStr) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

module.exports = { awardXP, today };
