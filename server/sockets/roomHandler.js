const Player = require('../models/Player');
const Event  = require('../models/Event');

module.exports = (io, socket) => {

  // Player joins room
  socket.on('join_room', async ({ room_code, player_id, player_name }) => {
    try {
      socket.join(room_code);
      if (player_id) {
        // Always mark as active when they join/rejoin
        await Player.update(
          { socket_id: socket.id, is_active: true },
          { where: { id: player_id } }
        );
      }
      await broadcastPlayers(io, room_code);
      console.log(`👤 ${player_name} joined ${room_code}`);
    } catch (e) { socket.emit('error', { message: e.message }); }
  });

  // Host joins
  socket.on('host_join', ({ room_code }) => {
    socket.join(room_code);
    socket.join(`host_${room_code}`);
    broadcastPlayers(io, room_code);
    console.log(`🎛️ Host joined ${room_code}`);
  });

  // Disconnect — only mark inactive if event is finished
  socket.on('disconnect', async () => {
    try {
      const player = await Player.findOne({ where: { socket_id: socket.id } });
      if (player) {
        const event = await Event.findByPk(player.event_id);
        // Only mark inactive if event is fully finished
        // During active/waiting events keep them active so scores persist
        if (event && event.status === 'finished') {
          await player.update({ is_active: false, socket_id: null });
        } else {
          // Just clear socket_id, keep is_active:true so they stay on leaderboard
          await player.update({ socket_id: null });
        }
        if (event && event.status !== 'finished') {
          await broadcastPlayers(io, event.room_code);
        }
        console.log(`👋 ${player.name} disconnected`);
      }
    } catch (e) { console.error('Disconnect error:', e.message); }
  });
};

async function broadcastPlayers(io, room_code) {
  const event = await Event.findOne({ where: { room_code } });
  if (!event) return;
  // Show ALL players who joined — regardless of current connection
  const players = await Player.findAll({
    where: { event_id: event.id, is_active: true },
    order: [['total_score', 'DESC']],
    attributes: ['id', 'name', 'total_score', 'avatar_color']
  });
  io.to(room_code).emit('players_updated', { players });
}
