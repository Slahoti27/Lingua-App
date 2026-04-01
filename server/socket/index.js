const { v4: uuidv4 } = require('uuid');

const rooms = new Map(); // roomId -> { users: [] }

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── Room Management ─────────────────────────────────────
    socket.on('create-room', ({ userId }) => {
      const roomId = uuidv4();
      rooms.set(roomId, { users: [{ socketId: socket.id, userId }] });
      socket.join(roomId);
      socket.emit('room-created', { roomId });
      console.log(`Room created: ${roomId}`);
    });

    socket.on('join-room', ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.users.length >= 2) return socket.emit('error', { message: 'Room is full' });

      room.users.push({ socketId: socket.id, userId });
      socket.join(roomId);

      // Notify the other peer to initiate offer
      const otherPeer = room.users.find(u => u.socketId !== socket.id);
      if (otherPeer) {
        io.to(otherPeer.socketId).emit('peer-joined', { peerId: socket.id });
      }
      socket.emit('room-joined', { roomId, peers: room.users.filter(u => u.socketId !== socket.id) });
    });

    // ── WebRTC Signaling ─────────────────────────────────────
    socket.on('offer', ({ to, offer }) => {
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    // ── Disconnect ───────────────────────────────────────────
    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        const idx = room.users.findIndex(u => u.socketId === socket.id);
        if (idx !== -1) {
          room.users.splice(idx, 1);
          // Notify remaining peer
          room.users.forEach(u => io.to(u.socketId).emit('peer-left', { peerId: socket.id }));
          if (room.users.length === 0) rooms.delete(roomId);
        }
      });
      console.log(`🔌 Disconnected: ${socket.id}`);
    });
  });
};
