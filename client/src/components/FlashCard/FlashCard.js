import { useState } from 'react';
import './FlashCard.css';

export default function FlashCard({ card, onResult, showControls = true }) {
  const [flipped, setFlipped] = useState(false);
  const [answered, setAnswered] = useState(false);

  const handleResult = (result) => {
    if (answered) return;
    setAnswered(true);
    setTimeout(() => {
      setFlipped(false);
      setAnswered(false);
      onResult && onResult(result);
    }, 600);
  };

  return (
    <div className="flashcard-wrapper">
      <div className={`flashcard ${flipped ? 'flashcard--flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
        <div className="flashcard-face flashcard-front">
          <div className="flashcard-lang">{card.language}</div>
          <div className="flashcard-word">{card.front}</div>
          {card.phonetic && <div className="flashcard-phonetic">{card.phonetic}</div>}
          <div className="flashcard-hint">Tap to reveal</div>
          <div className={`flashcard-difficulty diff-${card.difficulty?.toLowerCase()}`}>{card.difficulty}</div>
        </div>
        <div className="flashcard-face flashcard-back">
          <div className="flashcard-translation">{card.back}</div>
          {card.example && <div className="flashcard-example">"{card.example}"</div>}
          <div className="flashcard-category">{card.category}</div>
        </div>
      </div>

      {showControls && flipped && !answered && (
        <div className="flashcard-controls pop">
          <button className="fc-btn fc-btn-wrong" onClick={() => handleResult('incorrect')}>
            ✕ Again
          </button>
          <button className="fc-btn fc-btn-correct" onClick={() => handleResult('correct')}>
            ✓ Got it!
          </button>
        </div>
      )}
    </div>
  );
}
