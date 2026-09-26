/* K4 GAME ROOM — GAME SHELL CONTROLLER
   Manages socket connection, game loading, leaderboard display
*/
(function () {
  // Guard — must be logged in as player
  const playerData = JSON.parse(sessionStorage.getItem('k4_player') || 'null');
  if (!playerData || !playerData.player_id) {
    window.location.href = '/';
    return;
  }

  // Set topbar avatar
  const avatarEl = document.getElementById('playerAvatar');
  if (avatarEl) {
    avatarEl.textContent  = (playerData.player_name || 'P').charAt(0).toUpperCase();
    avatarEl.style.background = playerData.avatar_color || 'var(--pink)';
  }
  const scoreEl = document.getElementById('currentScore');
  if (scoreEl) scoreEl.textContent = playerData.total_score || 0;

  // Socket connection
  const socket = io({ transports: ['websocket', 'polling'] });
  let activeGame = null;

  socket.on('connect', () => {
    socket.emit('join_room', {
      room_code:   playerData.room_code,
      player_id:   playerData.player_id,
      player_name: playerData.player_name
    });
  });

  socket.on('connect_error', () => {
    K4App.toast('Connection error — reconnecting...', 'error');
  });

  // Host launched a game
  socket.on('game_started', async ({ game_name }) => {
    // Close leaderboard if open
    K4Leaderboard.hide();
    await _loadAndStartGame(game_name);
  });

  // Host ended a game — show interim leaderboard
  socket.on('game_ended', ({ scores }) => {
    if (activeGame?.destroy) activeGame.destroy();
    _updateMyScore(scores);
    K4Leaderboard.show(scores, 'After this game', playerData.player_id);
  });

  // Host ended entire event — show final results
  socket.on('final_results', ({ scores }) => {
    if (activeGame?.destroy) activeGame.destroy();
    _updateMyScore(scores);
    K4Leaderboard.showFinal(scores, playerData.player_id);
  });

  // Real-time score update from server
  socket.on('score_update', ({ player_id, total_score }) => {
    if (String(player_id) === String(playerData.player_id)) {
      if (scoreEl) scoreEl.textContent = total_score;
    }
  });

  // Load game data from API then init game module
  async function _loadAndStartGame(game_name) {
    const content = document.getElementById('gameContent');
    if (content) content.innerHTML = `
      <div class="waiting-screen">
        <div class="waiting-title">Loading game...</div>
        <div class="waiting-dots"><span></span><span></span><span></span></div>
      </div>`;

    try {
      const res  = await fetch(`/api/games/${playerData.room_code}/${game_name}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      _initGame(game_name, data.data);
    } catch (err) {
      K4App.toast('Error loading game: ' + err.message, 'error');
    }
  }

  function _initGame(name, data) {
    if (activeGame?.destroy) activeGame.destroy();

    // Update topbar
    const labels = {
      who_knows_best:    'Who Knows Best',
      emojinary:         'Emoji-nary',
      price_check:       'Price Check',
      first_impressions: 'First Impressions',
      word_scramble:     'Word Scramble'
    };
    const nameEl = document.getElementById('gameNameText');
    if (nameEl) nameEl.textContent = labels[name] || name;

    // Reset progress
    const pb = document.getElementById('progressFill');
    if (pb) pb.style.width = '0%';

    const modules = {
      who_knows_best:    WhoKnowsBest,
      emojinary:         Emojinary,
      price_check:       PriceCheck,
      first_impressions: FirstImpressions,
      word_scramble:     WordScramble
    };

    activeGame = modules[name];
    if (!activeGame) { K4App.toast('Unknown game: ' + name, 'error'); return; }
    activeGame.init(data, playerData, socket);
  }

  function _updateMyScore(scores) {
    const me = scores.find(p => String(p.id) === String(playerData.player_id));
    if (me && scoreEl) scoreEl.textContent = me.total_score || 0;
  }

  // Support direct URL load for testing: /game.html?game=emojinary&room=ABC123
  const urlGame = K4App.getParam('game');
  const urlRoom = K4App.getParam('room');
  if (urlGame && urlRoom && urlRoom === playerData.room_code) {
    _loadAndStartGame(urlGame);
  }

})();
