import { useState, useEffect } from 'react';
import { flashcardsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FlashCard from '../components/FlashCard/FlashCard';
import './FlashcardsPage.css';

const TOPICS = ['Greetings', 'Numbers', 'Food & Drink', 'Travel', 'Colors', 'Family', 'Body Parts', 'Emotions', 'Work', 'Shopping'];

export default function FlashcardsPage() {
  const { user, refreshUser } = useAuth();
  const [cards, setCards] = useState([]);
  const [dueCards, setDueCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mode, setMode] = useState('browse'); // browse | review | generate
  const [genTopic, setGenTopic] = useState('Greetings');
  const [reviewed, setReviewed] = useState({ correct: 0, incorrect: 0 });
  const [sessionDone, setSessionDone] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [allRes, dueRes] = await Promise.all([
        flashcardsApi.list({ language: user.currentLanguage }),
        flashcardsApi.list({ language: user.currentLanguage, due: true }),
      ]);
      setCards(allRes.data.cards);
      setDueCards(dueRes.data.cards);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.currentLanguage) load(); }, [user?.currentLanguage]);

  const handleReview = async (cardId, result) => {
    await flashcardsApi.review(cardId, result);
    setReviewed(r => ({ ...r, [result]: r[result] + 1 }));
    if (currentIdx + 1 >= dueCards.length) {
      setSessionDone(true);
      refreshUser();
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await flashcardsApi.generate({ language: user.currentLanguage, topic: genTopic, level: user.level, count: 8 });
      await load();
      setMode('browse');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate');
    } finally { setGenerating(false); }
  };

  const startReview = () => {
    setCurrentIdx(0); setReviewed({ correct: 0, incorrect: 0 });
    setSessionDone(false); setMode('review');
  };

  if (loading) return <div className="fc-page"><div className="fc-loading">Loading flashcards…</div></div>;

  return (
    <div className="fc-page fade-up">
      <div className="fc-header">
        <div>
          <h1>Flashcards</h1>
          <p>{user?.currentLanguage} · {cards.length} cards total · <span className="due-highlight">{dueCards.length} due today</span></p>
        </div>
        <div className="fc-header-btns">
          <button className="btn btn-ghost" onClick={() => setMode('generate')}>✦ AI Generate</button>
          {dueCards.length > 0 && <button className="btn btn-primary" onClick={startReview}>Review {dueCards.length} Cards →</button>}
        </div>
      </div>

      {/* Generate panel */}
      {mode === 'generate' && (
        <div className="card fc-generate fade-in">
          <h3>Generate AI Flashcards</h3>
          <p>Claude will create 8 vocabulary cards for you on any topic.</p>
          <div className="gen-topics">
            {TOPICS.map(t => (
              <button key={t} className={`topic-chip ${genTopic === t ? 'topic-chip--active' : ''}`} onClick={() => setGenTopic(t)}>{t}</button>
            ))}
          </div>
          <div className="gen-actions">
            <button className="btn btn-ghost" onClick={() => setMode('browse')}>Cancel</button>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? <><span className="spin">⟳</span> Generating…</> : `Generate ${genTopic} Cards`}
            </button>
          </div>
        </div>
      )}

      {/* Review mode */}
      {mode === 'review' && !sessionDone && dueCards[currentIdx] && (
        <div className="fc-review fade-in">
          <div className="fc-review-progress">
            <span>{currentIdx + 1} / {dueCards.length}</span>
            <div className="fc-review-bar">
              <div style={{ width: `${((currentIdx) / dueCards.length) * 100}%` }} />
            </div>
            <span className="fc-score">✓ {reviewed.correct} · ✕ {reviewed.incorrect}</span>
          </div>
          <FlashCard
            card={dueCards[currentIdx]}
            onResult={(result) => handleReview(dueCards[currentIdx]._id, result)}
          />
        </div>
      )}

      {/* Session complete */}
      {mode === 'review' && sessionDone && (
        <div className="card fc-done pop">
          <div className="fc-done-icon">🎉</div>
          <h2>Session complete!</h2>
          <p>You reviewed {reviewed.correct + reviewed.incorrect} cards</p>
          <div className="fc-done-stats">
            <div className="fc-done-stat"><span>{reviewed.correct}</span> Correct</div>
            <div className="fc-done-stat fc-done-stat--wrong"><span>{reviewed.incorrect}</span> To retry</div>
          </div>
          <button className="btn btn-primary" onClick={() => { setMode('browse'); load(); }}>Back to library</button>
        </div>
      )}

      {/* Browse all cards */}
      {mode === 'browse' && (
        <div className="fc-grid">
          {cards.length === 0 ? (
            <div className="fc-empty">
              <p>No flashcards yet.</p>
              <button className="btn btn-primary" onClick={() => setMode('generate')}>✦ Generate your first cards</button>
            </div>
          ) : cards.map(card => (
            <div key={card._id} className="fc-card-mini card">
              <div className="fc-card-mini-front">{card.front}</div>
              <div className="fc-card-mini-back">{card.back}</div>
              {card.phonetic && <div className="fc-card-mini-phonetic">{card.phonetic}</div>}
              <div className="fc-card-mini-footer">
                <span className={`badge badge-${card.difficulty === 'Easy' ? 'forest' : card.difficulty === 'Hard' ? 'terracotta' : 'gold'}`}>{card.difficulty}</span>
                <span className="fc-card-mini-cat">{card.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
