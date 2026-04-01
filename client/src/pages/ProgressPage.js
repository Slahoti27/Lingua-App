import { useState, useEffect } from 'react';
import { progressApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './ProgressPage.css';

const ACHIEVEMENTS = [
  { id: 'first_lesson', icon: '📖', title: 'First Steps', desc: 'Complete your first lesson', check: s => s.lessonsCompleted >= 1 },
  { id: 'streak_3', icon: '🔥', title: 'On Fire', desc: '3-day streak', check: (s, u) => u?.streak >= 3 },
  { id: 'streak_7', icon: '⚡', title: 'Lightning Learner', desc: '7-day streak', check: (s, u) => u?.streak >= 7 },
  { id: 'cards_50', icon: '🃏', title: 'Card Shark', desc: 'Review 50 flashcards', check: s => s.flashcardsReviewed >= 50 },
  { id: 'xp_500', icon: '⭐', title: 'Rising Star', desc: 'Earn 500 XP', check: (s, u) => u?.xp >= 500 },
  { id: 'call_30', icon: '🎙', title: 'Chatterbox', desc: '30 minutes of AI calls', check: s => s.aiCallMinutes >= 30 },
  { id: 'lessons_10', icon: '🏅', title: 'Dedicated', desc: 'Complete 10 lessons', check: s => s.lessonsCompleted >= 10 },
  { id: 'xp_1000', icon: '🏆', title: 'Champion', desc: 'Earn 1000 XP', check: (s, u) => u?.xp >= 1000 },
];

export default function ProgressPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    progressApi.stats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="progress-page"><p style={{ color: 'var(--text3)', textAlign: 'center', padding: '60px' }}>Loading…</p></div>;

  const dailyPct = Math.min(100, Math.round((stats.todayXp / stats.dailyGoal) * 100));

  return (
    <div className="progress-page fade-up">
      <h1>Your Progress</h1>

      {/* Overview */}
      <div className="prog-overview">
        <div className="prog-hero card">
          <div className="prog-xp-num">{user?.xp}</div>
          <div className="prog-xp-label">Total XP</div>
          <div className="prog-lang">{user?.currentLanguage} · {user?.level}</div>
        </div>

        <div className="prog-metrics">
          {[
            { icon: '🔥', label: 'Current streak', value: `${user?.streak} days` },
            { icon: '🏅', label: 'Best streak', value: `${user?.longestStreak} days` },
            { icon: '📖', label: 'Lessons', value: stats.lessonsCompleted },
            { icon: '🃏', label: 'Cards reviewed', value: stats.flashcardsReviewed },
            { icon: '🎙', label: 'AI call minutes', value: stats.aiCallMinutes },
            { icon: '✅', label: 'Avg score', value: `${stats.avgScore}%` },
          ].map(m => (
            <div key={m.label} className="prog-metric card">
              <span className="prog-metric-icon">{m.icon}</span>
              <div className="prog-metric-value">{m.value}</div>
              <div className="prog-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily goal */}
      <div className="card prog-daily">
        <div className="prog-daily-header">
          <h3>Today's goal</h3>
          <span>{stats.todayXp} / {stats.dailyGoal} XP</span>
        </div>
        <div className="prog-bar-wrap">
          <div className="prog-bar">
            <div className="prog-bar-fill" style={{ width: `${dailyPct}%` }} />
          </div>
          <span className="prog-bar-pct">{dailyPct}%</span>
        </div>
      </div>

      {/* Flashcard health */}
      <div className="card prog-cards">
        <h3>Flashcard Library</h3>
        <div className="prog-cards-stats">
          <div>
            <span className="prog-cards-num">{stats.totalCards}</span>
            <span className="prog-cards-label">Total cards</span>
          </div>
          <div>
            <span className="prog-cards-num prog-cards-num--due">{stats.dueCards}</span>
            <span className="prog-cards-label">Due for review</span>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="prog-achievements">
        <h3>Achievements</h3>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map(a => {
            const unlocked = a.check(stats, user);
            return (
              <div key={a.id} className={`achievement-card card ${unlocked ? 'achievement-card--unlocked' : ''}`}>
                <div className="achievement-icon">{a.icon}</div>
                <div className="achievement-title">{a.title}</div>
                <div className="achievement-desc">{a.desc}</div>
                {unlocked && <div className="achievement-badge">✓ Unlocked</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
