const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Serve static frontend files (like index.html) from the current folder
app.use(express.static(__dirname));

let players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Assign player role (Lamborghini or Bugatti) based on current connections
  if (Object.keys(players).length === 0) {
    players[socket.id] = { id: socket.id, role: 'Lamborghini', x: 100, y: 300 };
  } else if (Object.keys(players).length === 1) {
    players[socket.id] = { id: socket.id, role: 'Bugatti', x: 200, y: 300 };
  } else {
    players[socket.id] = { id: socket.id, role: 'Spectator', x: 0, y: 0 };
  }

  // Send current state to the newly connected player
  socket.emit('init', { id: socket.id, players });

  // Notify everyone else that a new player joined
  socket.broadcast.emit('playerJoined', players[socket.id]);

  // Listen for movement updates from client
  socket.on('playerMove', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      io.emit('stateUpdate', players);
    }
  });

  // Handle player disconnects
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
