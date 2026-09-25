/* ============================================
   K4 GAME ROOM - GAME ROUTER
   ============================================ */

(async () => {
  const player = K4App.requirePlayer();
  if (!player) return;

  const gameName = K4App.getParam('game');
  const roomCode = K4App.getParam('room') || player.room_code;

  // Set player avatar
  const avatarEl = document.getElementById('playerAvatar');
  if (avatarEl) {
    avatarEl.textContent = player.player_name?.charAt(0).toUpperCase() || 'P';
    avatarEl.style.background = player.avatar_color || 'var(--baby-pink)';
  }

  // Connect socket
  const socket = io();
  let currentGame = null;

  socket.on('connect', () => {
    socket.emit('join_room', {
      room_code: roomCode,
      player_id: player.player_id,
      player_name: player.player_name
    });
  });

  // Load game data
  try {
    const data = await K4App.api(`/games/${roomCode}/${gameName}`);
    const gameData = data.data;

    // Set game name in header
    const nameMap = {
      who_knows_best: 'Who Knows Best ❓',
      emojinary: 'Emoji-nary 😂',
      price_check: 'Price Check 💰',
      first_impressions: 'First Impressions 🧊',
      word_scramble: 'Word Scramble 🔤'
    };
    document.getElementById('gameName').textContent = nameMap[gameName] || gameName;
    document.title = `${nameMap[gameName] || 'Game'} — K4 Game Room`;

    // Init correct game module
    switch (gameName) {
      case 'who_knows_best':
        currentGame = WhoKnowsBest;
        break;
      case 'emojinary':
        currentGame = Emojinary;
        break;
      case 'price_check':
        currentGame = PriceCheck;
        break;
      case 'first_impressions':
        currentGame = FirstImpressions;
        break;
      case 'word_scramble':
        currentGame = WordScramble;
        break;
      default:
        document.getElementById('gameContent').innerHTML = `
          <div style="text-align:center;padding:3rem">
            <div style="font-size:3rem">🎮</div>
            <h2 style="font-family:var(--font-heading)">Game not found</h2>
            <p style="color:var(--gray)">Please wait for the host to start a game</p>
          </div>
        `;
        return;
    }

    currentGame.init(gameData, player, socket);

  } catch (err) {
    console.error('Game load error:', err);
    document.getElementById('gameContent').innerHTML = `
      <div style="text-align:center;padding:3rem">
        <div style="font-size:3rem">⚠️</div>
        <h2 style="font-family:var(--font-heading)">Connection Error</h2>
        <p style="color:var(--gray)">${K4App.escapeHtml(err.message)}</p>
        <button class="btn btn-primary" style="margin-top:1.5rem" onclick="location.reload()">Try Again</button>
      </div>
    `;
  }

  // Socket global events
  socket.on('game_started', ({ game_name }) => {
    if (currentGame?.destroy) currentGame.destroy();
    window.location.href = `/game.html?game=${game_name}&room=${roomCode}`;
  });

  socket.on('leaderboard_update', ({ players }) => {
    document.getElementById('currentScore').textContent =
      players.find(p => p.id === player.player_id)?.total_score || 0;
  });

  socket.on('game_ended', ({ game_name, players }) => {
    if (currentGame?.destroy) currentGame.destroy();
    K4Leaderboard.show(players, `After ${game_name.replace(/_/g, ' ')}`, player.player_id);
  });

  socket.on('event_finished', ({ players }) => {
    K4Leaderboard.showFinal(players, player.player_id);
  });
})();
