# 🌿 Lingua — AI Language Learning App

A full-stack MERN application for language learning with **AI-powered lessons, flashcards, and live video practice calls** with a Claude AI tutor.

---

## 🏗 Architecture

```
lingua-app/
├── server/                          # Node.js + Express backend
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── models/
│   │   ├── User.js                  # User + XP + streak
│   │   ├── Flashcard.js             # Vocabulary cards (SM-2)
│   │   ├── Lesson.js                # Lessons + exercises
│   │   └── UserProgress.js          # Per-lesson completion
│   ├── routes/
│   │   ├── auth.js                  # Register, login, profile
│   │   ├── flashcards.js            # CRUD + AI generate + review
│   │   ├── lessons.js               # List, AI generate, complete
│   │   ├── conversation.js          # AI tutor chat endpoint
│   │   └── progress.js              # Stats & achievements
│   ├── services/
│   │   ├── aiService.js             # Claude AI: tutor, flashcards, lessons
│   │   └── progressService.js       # XP + streak logic
│   ├── socket/
│   │   └── index.js                 # Socket.io WebRTC signaling
│   └── index.js                     # Express + HTTP + Socket.io server
│
└── client/                          # React frontend
    └── src/
        ├── components/
        │   ├── Navbar/              # Nav with XP bar + streak
        │   ├── FlashCard/           # 3D flip card component
        │   └── AIChat/              # Video call + AI chat panel
        ├── pages/
        │   ├── AuthPage             # Login + register
        │   ├── DashboardPage        # Home with stats & quick actions
        │   ├── LessonsPage          # Lesson list + AI generation + exercises
        │   ├── FlashcardsPage       # Review queue + card library
        │   ├── PracticePage         # AI video practice call
        │   └── ProgressPage         # Full stats + achievements
        ├── context/
        │   └── AuthContext.js       # JWT auth state
        └── services/
            └── api.js               # Axios API wrapper
```

---

## 🚀 Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or [Atlas](https://mongodb.com/atlas))
- Anthropic API key

### 1 — Install
```bash
git clone <your-repo>
cd lingua-app
npm run install:all
```

### 2 — Configure
```bash
cd server
cp .env.example .env
```

Fill in `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/lingua-app
PORT=5000
JWT_SECRET=some-long-random-string-here
ANTHROPIC_API_KEY=your-key-from-console.anthropic.com
CLIENT_URL=http://localhost:3000
```

### 3 — Run
```bash
# From root
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## ✨ Features

### 📖 AI-Generated Lessons
- Pick any topic & level
- Claude generates 5–8 exercises: translate, multiple-choice, fill-in-the-blank
- Answers evaluated by Claude AI (accepts paraphrases and minor variations)
- XP awarded on completion

### 🃏 Smart Flashcards (Spaced Repetition)
- Claude generates vocabulary cards with phonetics + examples
- **SM-2 algorithm** schedules reviews optimally
- 3D flip animation with correct/incorrect feedback
- Daily review queue ("due cards")

### 🎙 AI Practice Call
- **WebRTC** accesses your real camera & microphone
- **Socket.io** server handles signaling
- Claude AI tutor responds in the target language
- Inline grammar corrections, translations for new words
- Session timer, mute/camera toggle, XP for time spent

### 📈 Progress & Gamification
- **XP system** — earn points for every activity
- **Daily streak** — maintains and breaks automatically
- **Level progression** — Beginner → Elementary → Intermediate → Advanced
- **8 achievements** to unlock
- Daily goal tracking

---

## 🔌 Key API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/flashcards` | List cards (filter by language/due) |
| POST | `/api/flashcards/generate` | AI-generate vocabulary cards |
| POST | `/api/flashcards/:id/review` | Submit SM-2 review result |
| GET | `/api/lessons` | List lessons |
| POST | `/api/lessons/generate` | AI-generate a lesson |
| POST | `/api/lessons/:id/evaluate` | AI-evaluate an answer |
| POST | `/api/lessons/:id/complete` | Mark lesson done + award XP |
| POST | `/api/conversation/chat` | AI tutor chat message |
| POST | `/api/conversation/end-call` | Log call minutes + award XP |
| GET | `/api/progress/stats` | Full stats for progress page |

---

## 🛠 Extending

**Add real-time speech-to-text:**
- Use Web Speech API (`window.SpeechRecognition`) in `AIChat.js`
- Feed transcribed text to the chat endpoint automatically

**Add more languages:**
- The app is language-agnostic — Claude handles all languages
- Add more options to the `LANGUAGES` array in `AuthPage.js`

**Deploy:**
- Backend: Railway or Render
- Frontend: Vercel or Netlify (`npm run build` in `/client`)
- DB: MongoDB Atlas (free tier)
