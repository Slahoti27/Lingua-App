import AIChat from '../components/AIChat/AIChat';
import './PracticePage.css';

export default function PracticePage({ onNavigate }) {
  return (
    <div className="practice-page fade-up">
      <div className="practice-header">
        <h1>AI Practice Call</h1>
        <p>Speak and chat with your AI language tutor. Get real-time corrections and build fluency.</p>
      </div>
      <AIChat onEndCall={() => onNavigate('dashboard')} />
    </div>
  );
}
