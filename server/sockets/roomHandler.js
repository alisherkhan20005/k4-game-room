const Player = require('../models/Player');
const Event = require('../models/Event');

module.exports = (io, socket) => {

  // Player joins a room
  socket.on('join_room', async ({ room_code, player_id, player_name }) => {
    try {
      socket.join(room_code);

      // Update player socket ID
      if (player_id) {
        await Player.update(
          { socket_id: socket.id },
          { where: { id: player_id } }
        );
      }

      // Get all players in this room
      const event = await Event.findOne({ where: { room_code } });
      if (event) {
        const players = await Player.findAll({
          where: { event_id: event.id, is_active: true },
          order: [['total_score', 'DESC']],
          attributes: ['id', 'name', 'total_score', 'avatar_color']
        });

        // Notify all in room of updated player list
        io.to(room_code).emit('players_updated', { players });
        console.log(`👤 ${player_name} joined room ${room_code}`);
      }
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  // Admin joins host room
  socket.on('host_join', ({ room_code }) => {
    socket.join(`host_${room_code}`);
    console.log(`🎮 Host joined room ${room_code}`);
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      const player = await Player.findOne({ where: { socket_id: socket.id } });
      if (player) {
        await player.update({ is_active: false });
        const event = await Event.findByPk(player.event_id);
        if (event) {
          const players = await Player.findAll({
            where: { event_id: event.id, is_active: true },
            order: [['total_score', 'DESC']],
            attributes: ['id', 'name', 'total_score', 'avatar_color']
          });
          io.to(event.room_code).emit('players_updated', { players });
        }
        console.log(`👋 Player ${player.name} disconnected`);
      }
    } catch (error) {
      console.error('Disconnect error:', error.message);
    }
  });
};
