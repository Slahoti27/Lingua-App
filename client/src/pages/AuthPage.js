import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

const LANGUAGES = ['French', 'Spanish', 'German', 'Italian', 'Japanese', 'Mandarin', 'Portuguese', 'Korean', 'Arabic', 'Hindi'];

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', targetLanguage: 'French' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter') submit(); };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-orb auth-orb1" />
        <div className="auth-orb auth-orb2" />
      </div>

      <div className="auth-card fade-up">
        <div className="auth-hero">
          <div className="auth-logo float">🌿</div>
          <h1>Lingua</h1>
          <p>Master any language with AI-powered practice and smart flashcards</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Get started</button>
        </div>

        <div className="auth-form">
          {mode === 'register' && (
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Maria García" onKeyDown={handleKey} />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" onKeyDown={handleKey} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" onKeyDown={handleKey} />
          </div>
          {mode === 'register' && (
            <div className="field">
              <label>I want to learn</label>
              <select value={form.targetLanguage} onChange={e => set('targetLanguage', e.target.value)}>
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="btn btn-primary auth-submit" onClick={submit} disabled={loading}>
            {loading ? <span className="spin">⟳</span> : mode === 'login' ? 'Sign in →' : 'Start learning →'}
          </button>
        </div>

        <div className="auth-features">
          {['🃏 Smart flashcards with spaced repetition', '🎙 AI video call practice', '📖 AI-generated lessons', '🔥 Daily streaks & XP'].map(f => (
            <div key={f} className="auth-feature">{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
