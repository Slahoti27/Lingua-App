import { useState, useEffect, useRef, useCallback } from 'react';
import { conversationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './AIChat.css';

const TOPICS = ['Free Conversation', 'Greetings & Introductions', 'Food & Restaurant', 'Travel & Directions', 'Work & Daily Life', 'Shopping', 'Family & Friends'];

const AI_AVATAR = '🤖';
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function AIChat({ onEndCall }) {
  const { user, refreshUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('Free Conversation');
  const [callActive, setCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const chatEndRef = useRef(null);
  const startTimeRef = useRef(null);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Call timer
  useEffect(() => {
    if (callActive) {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [callActive]);

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCallActive(true);
      // Greet the user
      sendMessage('Hello! I am ready to practice. Let\'s start!', true);
    } catch (err) {
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const endCall = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCallActive(false);
    const minutes = Math.round(callDuration / 60);
    if (minutes > 0) {
      await conversationApi.endCall(minutes);
      await refreshUser();
    }
    setCallDuration(0);
    onEndCall && onEndCall();
  }, [callDuration, onEndCall, refreshUser]);

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setCamEnabled(p => !p);
    }
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setMicEnabled(p => !p);
    }
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  const sendMessage = async (text, isSystemInit = false) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', content: text };
    const updatedMsgs = isSystemInit ? [] : [...messages, userMsg];

    if (!isSystemInit) {
      setMessages(prev => [...prev, { role: 'user', content: text, id: Date.now() }]);
      setInput('');
    }
    setLoading(true);

    try {
      const apiMsgs = isSystemInit
        ? [{ role: 'user', content: `Let's start a ${topic} conversation in ${user?.currentLanguage || 'French'}. Please greet me and ask an opening question.` }]
        : updatedMsgs.filter(m => m.role).map(m => ({ role: m.role, content: m.content }));

      const res = await conversationApi.chat({ messages: apiMsgs, topic });
      const aiMsg = { role: 'assistant', content: res.data.reply, id: Date.now() + 1 };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.', id: Date.now() + 1, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="aichat">
      {/* Video Panel */}
      <div className="aichat-video-panel">
        <div className="aichat-video-header">
          <h2 className="aichat-title">AI Practice Call</h2>
          <div className="topic-selector">
            <select value={topic} onChange={e => setTopic(e.target.value)} disabled={callActive}>
              {TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* AI Avatar (remote) */}
        <div className="aichat-remote">
          <div className={`ai-avatar-ring ${callActive ? 'ai-avatar-ring--active' : ''}`}>
            <div className="ai-avatar-inner float">
              <span className="ai-avatar-emoji">{AI_AVATAR}</span>
            </div>
          </div>
          {callActive && (
            <div className="ai-status">
              {loading
                ? <><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></>
                : <span>Listening…</span>
              }
            </div>
          )}
          <div className="ai-name">
            AI Tutor · {user?.currentLanguage || 'French'}
          </div>
        </div>

        {/* User's video (local) */}
        <div className="aichat-local">
          <video ref={videoRef} autoPlay muted playsInline className={!camEnabled ? 'hidden' : ''} />
          {!camEnabled && <div className="cam-off-placeholder">📷 Camera off</div>}
          {callActive && <div className="call-timer">{fmtTime(callDuration)}</div>}
        </div>

        {/* Call Controls */}
        <div className="call-controls">
          {!callActive ? (
            <button className="btn btn-primary call-start-btn" onClick={startCall}>
              📹 Start Practice Call
            </button>
          ) : (
            <>
              <button className={`ctrl-btn ${!micEnabled ? 'ctrl-btn--off' : ''}`} onClick={toggleMic} title="Toggle mic">
                {micEnabled ? '🎙' : '🔇'}
              </button>
              <button className="ctrl-btn ctrl-btn--end" onClick={endCall} title="End call">
                📵
              </button>
              <button className={`ctrl-btn ${!camEnabled ? 'ctrl-btn--off' : ''}`} onClick={toggleCam} title="Toggle camera">
                {camEnabled ? '📹' : '🚫'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="aichat-chat-panel">
        <div className="chat-header">
          <span>💬 Conversation</span>
          <span className="chat-language">{user?.currentLanguage || 'French'} · {user?.level}</span>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="chat-empty-icon">🌍</div>
              <p>Start a call to begin your AI conversation practice!</p>
              <p className="chat-empty-sub">Your tutor will respond in {user?.currentLanguage || 'French'} and help you improve naturally.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.role} fade-up`}>
              {msg.role === 'assistant' && <div className="msg-avatar">{AI_AVATAR}</div>}
              <div className={`msg-bubble ${msg.error ? 'msg-bubble--error' : ''}`}>{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg chat-msg--assistant">
              <div className="msg-avatar">{AI_AVATAR}</div>
              <div className="msg-bubble msg-bubble--typing">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={callActive ? `Type in ${user?.currentLanguage || 'French'} or English…` : 'Start a call first…'}
            rows={2}
            disabled={!callActive || loading}
          />
          <button
            className="btn btn-primary chat-send-btn"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading || !callActive}
          >
            {loading ? <span className="spin">⟳</span> : '↑'}
          </button>
        </div>
      </div>
    </div>
  );
}
