import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const NAV_LINKS = [
  { id: 'dashboard', label: 'Home', icon: '⌂' },
  { id: 'lessons', label: 'Lessons', icon: '📖' },
  { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
  { id: 'practice', label: 'AI Practice', icon: '🎙' },
  { id: 'progress', label: 'Progress', icon: '📈' },
];

export default function Navbar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const xpPct = user ? Math.min(100, Math.round((user.todayXp / user.dailyGoal) * 100)) : 0;

  return (
    <nav className="navbar">
      <div className="navbar-brand" onClick={() => onNavigate('dashboard')}>
        <span className="navbar-logo">🌿</span>
        <span className="navbar-title">Lingua</span>
      </div>

      <div className="navbar-links">
        {NAV_LINKS.map(link => (
          <button
            key={link.id}
            className={`nav-link ${activePage === link.id ? 'nav-link--active' : ''}`}
            onClick={() => onNavigate(link.id)}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </button>
        ))}
      </div>

      <div className="navbar-right">
        {user && (
          <div className="navbar-xp" title={`${user.todayXp}/${user.dailyGoal} XP today`}>
            <span className="xp-label">{user.todayXp} XP</span>
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        )}

        {user && (
          <div className="navbar-streak" title={`${user.streak} day streak`}>
            <span>🔥</span>
            <span className="streak-num">{user.streak}</span>
          </div>
        )}

        {user && (
          <div className="navbar-user" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="user-avatar">{user.name[0].toUpperCase()}</div>
            {menuOpen && (
              <div className="user-menu fade-in">
                <div className="user-menu-name">{user.name}</div>
                <div className="user-menu-email">{user.email}</div>
                <hr />
                <button onClick={logout}>Sign out</button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
