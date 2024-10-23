const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000', // React frontend URL
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const players = {};
const readyPlayers = {};
const playersProps = {};
let GlobalSpawns = []; // Initialize as an empty array
let firstPlayerId = null; // Track the first player

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  io.emit('updatePlayers', players);
  io.emit('updatePlayerCount', Object.keys(players).length);
  // Initialize player objects
  players[socket.id] = [];
  playersProps[socket.id] = []


  socket.on('lockInMoves', (moves) => {
    players[socket.id] = moves; // Update moves for the player
 
    io.emit('updatePlayers', players);

    readyPlayers[socket.id] = 'Ready';
    //console.log(`Moves for ${socket.id}:`, players[socket.id]);
    console.log(readyPlayers);
    console.log(Object.keys(readyPlayers).length, ' out of ', Object.keys(players).length, ' are ready!');
    // Check if all players are ready
    if (Object.keys(readyPlayers).length === Object.keys(players).length) {
        console.log('All players are ready!');
        io.emit('StartRound', players)
    }
  });




  socket.on('startGame', (spawnedPlayers) => {
    console.log('Received player spawns:', spawnedPlayers);
    // Assign the value received from the client
    GlobalSpawns = spawnedPlayers;
  // Emit to all clients
    console.log('Global Spawns:', GlobalSpawns);
    const keys = Object.keys(playersProps);
    const Spawnkeys = Object.keys(GlobalSpawns);
    for (let i = 0; i < keys.length; i++) {
      const j = GlobalSpawns[Spawnkeys[i+1]]
      if (i < Math.floor(keys.length / 2)) {
        playersProps[keys[i]] = [j, 'R', 'B', 'A'].flat();
      } else {   
        playersProps[keys[i]] = [j, 'L', 'B', 'A'].flat();
      }
    }
    io.emit('setSpawns', GlobalSpawns); 
    io.emit('setPlayerDirections', playersProps)
    console.log(playersProps);
  });


  
  /*socket.on('startRound', (players) => {
    console.log('Sent player moves:', players);
    // Assign the value received from the client
    GlobalSpawns = spawnedPlayers;
    io.emit('setSpawns', GlobalSpawns); // Emit to all clients
    console.log('Global Spawns:', GlobalSpawns);
  });*/

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete players[socket.id];
    delete readyPlayers[socket.id];
    delete playersProps[socket.id];
    io.emit('updatePlayerCount', Object.keys(players).length);
    if (firstPlayerId === socket.id) {
      firstPlayerId = null; // Clear first player
    }
    console.log('Current players after disconnect:', players);
  });

  socket.on('joinRoom', ({ roomId, nickname }) => {
    socket.join(roomId);
    console.log(`${nickname} joined room ${roomId}`);
    io.emit('updatePlayerCount', Object.keys(players).length);

    if (!firstPlayerId) {
      firstPlayerId = socket.id; // Set the first player
    }

    io.to(roomId).emit('message', `${nickname} joined the room`);
    socket.emit('message', `Welcome ${nickname}! You joined room ${roomId}`);
    socket.emit('firstPlayer', firstPlayerId === socket.id);
  });

    
});

server.listen(4000, () => {
  console.log('Server is running on port 4000');
});
