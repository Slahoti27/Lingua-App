import { useState, useEffect } from 'react';
import { lessonsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LessonsPage.css';

const TOPICS = ['Greetings & Introductions', 'Numbers & Time', 'Food & Restaurants', 'Travel & Transport', 'Shopping', 'Family & Relationships', 'Work & Business', 'Health & Body', 'Nature & Weather', 'Culture & Customs'];
const LEVELS = ['Beginner', 'Elementary', 'Intermediate', 'Advanced'];

export default function LessonsPage() {
  const { user, refreshUser } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [currentEx, setCurrentEx] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [results, setResults] = useState([]);
  const [lessonDone, setLessonDone] = useState(false);
  const [genForm, setGenForm] = useState({ topic: TOPICS[0], level: user?.level || 'Beginner' });
  const [showGen, setShowGen] = useState(false);

  const loadLessons = async () => {
    setLoading(true);
    try {
      const res = await lessonsApi.list({ language: user.currentLanguage });
      setLessons(res.data.lessons);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user?.currentLanguage) loadLessons(); }, [user?.currentLanguage]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await lessonsApi.generate({ language: user.currentLanguage, ...genForm });
      setLessons(prev => [...prev, res.data.lesson]);
      setShowGen(false);
    } catch (err) { alert(err.response?.data?.error || 'Failed to generate lesson'); }
    finally { setGenerating(false); }
  };

  const startLesson = async (lesson) => {
    const res = await lessonsApi.get(lesson._id);
    setActiveLesson(res.data.lesson);
    setCurrentEx(0); setResults([]); setFeedback(null);
    setUserAnswer(''); setLessonDone(false);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || evaluating) return;
    setEvaluating(true);
    try {
      const res = await lessonsApi.evaluate(activeLesson._id, { exerciseIndex: currentEx, userAnswer });
      setFeedback(res.data);
      setResults(r => [...r, { ...res.data, xp: activeLesson.exercises[currentEx].xpReward }]);
    } finally { setEvaluating(false); }
  };

  const nextExercise = async () => {
    if (currentEx + 1 >= activeLesson.exercises.length) {
      // Lesson done
      const correct = results.filter(r => r.correct).length;
      const score = Math.round((correct / activeLesson.exercises.length) * 100);
      const xpEarned = results.filter(r => r.correct).reduce((a, r) => a + r.xp, 0);
      await lessonsApi.complete(activeLesson._id, { score, xpEarned });
      await refreshUser();
      setLessonDone(true);
    } else {
      setCurrentEx(i => i + 1);
      setFeedback(null);
      setUserAnswer('');
    }
  };

  const exercise = activeLesson?.exercises[currentEx];

  if (activeLesson && !lessonDone) {
    return (
      <div className="lesson-page fade-up">
        <div className="lesson-header">
          <button className="btn btn-ghost" onClick={() => setActiveLesson(null)}>← Back</button>
          <div className="lesson-progress-bar">
            <div style={{ width: `${(currentEx / activeLesson.exercises.length) * 100}%` }} />
          </div>
          <span>{currentEx + 1}/{activeLesson.exercises.length}</span>
        </div>
        <div className="lesson-exercise card">
          <div className="ex-type-badge">{exercise?.type?.replace('-', ' ')}</div>
          <h2 className="ex-question">{exercise?.question}</h2>
          {exercise?.hint && <p className="ex-hint">💡 {exercise.hint}</p>}

          {exercise?.type === 'multiple-choice' ? (
            <div className="mc-options">
              {exercise.options?.map(opt => (
                <button
                  key={opt}
                  className={`mc-option ${userAnswer === opt ? 'mc-option--selected' : ''} ${feedback ? (opt === exercise.answer ? 'mc-option--correct' : userAnswer === opt ? 'mc-option--wrong' : '') : ''}`}
                  onClick={() => !feedback && setUserAnswer(opt)}
                  disabled={!!feedback}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea
              className="ex-input"
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), submitAnswer())}
              placeholder="Type your answer…"
              disabled={!!feedback}
              rows={2}
            />
          )}

          {feedback && (
            <div className={`ex-feedback ex-feedback--${feedback.correct ? 'correct' : 'wrong'} pop`}>
              <span className="ex-feedback-icon">{feedback.correct ? '🎉' : '💪'}</span>
              <div>
                <div className="ex-feedback-text">{feedback.feedback}</div>
                {!feedback.correct && feedback.correction && (
                  <div className="ex-feedback-correction">Correct: <strong>{feedback.correction}</strong></div>
                )}
              </div>
            </div>
          )}

          <div className="ex-actions">
            {!feedback ? (
              <button className="btn btn-primary" onClick={submitAnswer} disabled={!userAnswer.trim() || evaluating}>
                {evaluating ? <span className="spin">⟳</span> : 'Check Answer'}
              </button>
            ) : (
              <button className="btn btn-success" onClick={nextExercise}>
                {currentEx + 1 >= activeLesson.exercises.length ? 'Finish Lesson 🎉' : 'Next →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (lessonDone) {
    const correct = results.filter(r => r.correct).length;
    const score = Math.round((correct / results.length) * 100);
    return (
      <div className="lesson-page fade-up">
        <div className="card lesson-done pop">
          <div className="lesson-done-icon">🏆</div>
          <h2>Lesson Complete!</h2>
          <div className="lesson-done-score">{score}%</div>
          <p>{correct} of {results.length} correct</p>
          <div className="lesson-done-xp">+{results.filter(r => r.correct).reduce((a, r) => a + r.xp, 0)} XP earned</div>
          <button className="btn btn-primary" onClick={() => { setActiveLesson(null); loadLessons(); }}>Back to Lessons</button>
        </div>
      </div>
    );
  }

  return (
    <div className="lessons-page fade-up">
      <div className="lessons-header">
        <div>
          <h1>Lessons</h1>
          <p>{user?.currentLanguage} · {lessons.length} lessons available</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGen(!showGen)}>✦ Generate Lesson</button>
      </div>

      {showGen && (
        <div className="card lessons-gen fade-in">
          <h3>Generate AI Lesson</h3>
          <div className="gen-row">
            <div className="field">
              <label>Topic</label>
              <select value={genForm.topic} onChange={e => setGenForm(f => ({ ...f, topic: e.target.value }))}>
                {TOPICS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Level</label>
              <select value={genForm.level} onChange={e => setGenForm(f => ({ ...f, level: e.target.value }))}>
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn btn-ghost" onClick={() => setShowGen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              {generating ? <><span className="spin">⟳</span> Generating…</> : 'Generate Lesson'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="lessons-loading">Generating your lesson library…</div>
      ) : lessons.length === 0 ? (
        <div className="lessons-empty">
          <p>No lessons yet. Generate your first one!</p>
        </div>
      ) : (
        <div className="lessons-grid">
          {lessons.map(lesson => {
            const done = lesson.userProgress?.completed;
            return (
              <div key={lesson._id} className={`card lesson-card ${done ? 'lesson-card--done' : ''}`}>
                <div className="lesson-card-top">
                  <div>
                    <span className={`badge badge-${lesson.level === 'Beginner' ? 'forest' : lesson.level === 'Advanced' ? 'terracotta' : 'gold'}`}>{lesson.level}</span>
                    {done && <span className="badge badge-forest" style={{ marginLeft: 6 }}>✓ Done</span>}
                  </div>
                  <span className="lesson-xp">+{lesson.xpReward} XP</span>
                </div>
                <h3>{lesson.title}</h3>
                <p>{lesson.description}</p>
                <div className="lesson-card-footer">
                  <span className="lesson-topic">{lesson.topic}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => startLesson(lesson)}>
                    {done ? 'Redo' : 'Start'} →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
