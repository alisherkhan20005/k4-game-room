const roomHandler = require('./roomHandler');
const gameHandler = require('./gameHandler');
const leaderboardHandler = require('./leaderboardHandler');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New connection: ${socket.id}`);

    // Register all handlers
    roomHandler(io, socket);
    gameHandler(io, socket);
    leaderboardHandler(io, socket);

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
};
