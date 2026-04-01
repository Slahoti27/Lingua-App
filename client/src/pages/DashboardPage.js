import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressApi, flashcardsApi } from '../services/api';
import './DashboardPage.css';

const LEVEL_XP = { Beginner: 0, Elementary: 500, Intermediate: 1500, Advanced: 3500 };
const NEXT_LEVEL = { Beginner: 'Elementary', Elementary: 'Intermediate', Intermediate: 'Advanced' };

export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    progressApi.stats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  const levelXp = LEVEL_XP[user?.level] || 0;
  const nextLevelXp = LEVEL_XP[NEXT_LEVEL[user?.level]] || levelXp + 1000;
  const levelProgress = Math.min(100, Math.round(((user?.xp - levelXp) / (nextLevelXp - levelXp)) * 100));
  const dailyPct = user ? Math.min(100, Math.round((user.todayXp / user.dailyGoal) * 100)) : 0;

  return (
    <div className="dashboard fade-up">
      <div className="dash-greeting">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p>You're learning <strong>{user?.currentLanguage || 'a language'}</strong> · {user?.level} level</p>
        </div>
        <div className="dash-streak-card">
          <span className="dash-streak-fire">🔥</span>
          <div>
            <div className="dash-streak-num">{user?.streak}</div>
            <div className="dash-streak-label">day streak</div>
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="card dash-daily">
        <div className="dash-daily-top">
          <div>
            <h3>Today's goal</h3>
            <p>{user?.todayXp || 0} / {user?.dailyGoal} XP earned</p>
          </div>
          <span className="dash-daily-pct">{dailyPct}%</span>
        </div>
        <div className="dash-progress-bar">
          <div className="dash-progress-fill" style={{ width: `${dailyPct}%` }} />
        </div>
        {dailyPct >= 100 && <div className="dash-goal-achieved">🎉 Daily goal achieved!</div>}
      </div>

      {/* Stats Grid */}
      <div className="dash-stats-grid">
        {[
          { icon: '📖', label: 'Lessons done', value: stats?.lessonsCompleted ?? '–' },
          { icon: '🃏', label: 'Cards reviewed', value: stats?.flashcardsReviewed ?? '–' },
          { icon: '🎙', label: 'AI call minutes', value: stats?.aiCallMinutes ?? '–' },
          { icon: '⭐', label: 'Total XP', value: user?.xp ?? '–' },
        ].map(s => (
          <div key={s.label} className="card dash-stat">
            <div className="dash-stat-icon">{s.icon}</div>
            <div className="dash-stat-value">{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Level Progress */}
      <div className="card dash-level">
        <div className="dash-level-row">
          <h3>{user?.level}</h3>
          {NEXT_LEVEL[user?.level] && <span className="dash-next-level">→ {NEXT_LEVEL[user?.level]}</span>}
        </div>
        <div className="dash-progress-bar">
          <div className="dash-progress-fill dash-progress-fill--gold" style={{ width: `${levelProgress}%` }} />
        </div>
        <p>{user?.xp - levelXp} / {nextLevelXp - levelXp} XP to next level</p>
      </div>

      {/* Quick Actions */}
      <div className="dash-actions">
        <h3>Jump back in</h3>
        <div className="dash-action-grid">
          {[
            { icon: '📖', title: 'Continue Lesson', sub: 'Pick up where you left off', page: 'lessons', color: 'terracotta' },
            { icon: '🃏', title: `Review Cards`, sub: `${stats?.dueCards ?? 0} cards due today`, page: 'flashcards', color: 'forest' },
            { icon: '🎙', title: 'AI Practice Call', sub: 'Speak with your AI tutor', page: 'practice', color: 'gold' },
          ].map(a => (
            <button key={a.page} className={`dash-action-card dash-action-card--${a.color}`} onClick={() => onNavigate(a.page)}>
              <span className="dash-action-icon">{a.icon}</span>
              <div>
                <div className="dash-action-title">{a.title}</div>
                <div className="dash-action-sub">{a.sub}</div>
              </div>
              <span className="dash-action-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
