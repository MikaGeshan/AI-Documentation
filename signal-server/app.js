const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const userToSocket = {};
const socketToUser = {};
const pendingSignals = {};

io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('register', userId => {
    userToSocket[userId] = socket.id;
    socketToUser[socket.id] = userId;
    console.log(`Registered user ${userId} with socket ${socket.id}`);

    if (pendingSignals[userId]) {
      pendingSignals[userId].forEach(data => {
        socket.emit('signal', { data });
      });
      delete pendingSignals[userId];
    }
  });

  socket.on('signal', ({ targetUserId, data }) => {
    const targetSocketId = userToSocket[targetUserId];
    if (targetSocketId && io.sockets.sockets.get(targetSocketId)) {
      io.to(targetSocketId).emit('signal', { data });
    } else {
      if (!pendingSignals[targetUserId]) {
        pendingSignals[targetUserId] = [];
      }
      pendingSignals[targetUserId].push(data);
      console.log(`Stored signal for ${targetUserId}`);
    }
  });

  socket.on('disconnect', () => {
    const userId = socketToUser[socket.id];
    delete userToSocket[userId];
    delete socketToUser[socket.id];
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🔌 Socket.IO server running on http://0.0.0.0:${PORT}`);
});
