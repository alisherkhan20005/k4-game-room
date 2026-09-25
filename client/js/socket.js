/* K4 Game Room - Socket.io Client Setup */

function initSocket(room_code) {
  const socket = io({
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 10
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  socket.on('error', ({ message }) => {
    console.error('Socket error:', message);
  });

  return socket;
}
