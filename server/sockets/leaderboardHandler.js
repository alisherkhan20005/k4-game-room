const Player = require('../models/Player');
const Event = require('../models/Event');
const Score = require('../models/Score');

module.exports = (io, socket) => {

  // Request live leaderboard
  socket.on('get_leaderboard', async ({ event_id }) => {
    try {
      const players = await Player.findAll({
        where: { event_id, is_active: true },
        order: [['total_score', 'DESC']],
        attributes: ['id', 'name', 'total_score', 'avatar_color']
      });

      socket.emit('leaderboard_data', { players });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Request game-specific scores
  socket.on('get_game_scores', async ({ event_id, game_name }) => {
    try {
      const scores = await Score.findAll({
        where: { event_id, game_name },
        include: [{ model: Player, attributes: ['name', 'avatar_color'] }],
        order: [['score', 'DESC']]
      });

      socket.emit('game_scores_data', { game_name, scores });
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
};
