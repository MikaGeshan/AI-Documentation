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

io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  socket.on('join', (roomId, cb) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
    if (cb) cb();
  });

  socket.on('signal', ({ roomId, data }) => {
    console.log(
      `Signal from ${socket.id} to room ${roomId}:`,
      data?.type || 'candidate',
    );
    socket.broadcast.to(roomId).emit('signal', { data });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Socket.IO server running on http://0.0.0.0:${PORT}`);
});
