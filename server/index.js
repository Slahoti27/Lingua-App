require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const flashcardRoutes = require('./routes/flashcards');
const lessonRoutes = require('./routes/lessons');
const conversationRoutes = require('./routes/conversation');
const progressRoutes = require('./routes/progress');
const socketHandler = require('./socket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

connectDB();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/progress', progressRoutes);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Socket.io
socketHandler(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server + WebSocket on port ${PORT}`));
