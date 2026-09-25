/* K4 GAME ROOM — GAME SHELL CONTROLLER */
(function() {
  const playerData = JSON.parse(sessionStorage.getItem('k4_player') || '{}');
  if(!playerData.player_id) { window.location.href='/'; return; }

  // Set avatar
  const avatar = document.getElementById('playerAvatar');
  if(avatar) {
    avatar.textContent = (playerData.player_name||'P').charAt(0).toUpperCase();
    avatar.style.background = playerData.avatar_color || 'var(--pink)';
  }
  document.getElementById('currentScore').textContent = playerData.total_score || 0;

  // Socket
  const socket = io();
  let gameModule = null;
  let localScore  = 0;

  socket.on('connect', () => {
    socket.emit('join_room', {
      room_code:   playerData.room_code,
      player_id:   playerData.player_id,
      player_name: playerData.player_name
    });
  });

  socket.on('game_started', async ({ game_name }) => {
    try {
      const res = await fetch(`/api/games/${playerData.room_code}/${game_name}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if(!data.success) throw new Error(data.message);
      initGame(game_name, data.data);
    } catch(e) {
      K4App.toast('Error loading game: '+e.message,'error');
    }
  });

  // Close leaderboard when next game starts
  socket.on('game_ended', ({ scores }) => {
    updateScoreFromServer(scores);
    K4Leaderboard.show(scores, 'Scores after this game', playerData.player_id);
  });

  socket.on('final_results', ({ scores }) => {
    K4Leaderboard.showFinal(scores, playerData.player_id);
  });

  socket.on('score_update', ({ player_id, total_score }) => {
    if(player_id === playerData.player_id) {
      localScore = total_score;
      document.getElementById('currentScore').textContent = total_score;
    }
  });

  function updateScoreFromServer(scores) {
    const me = scores.find(p => p.id === playerData.player_id);
    if(me) document.getElementById('currentScore').textContent = me.total_score;
  }

  function initGame(name, data) {
    // Destroy old module
    if(gameModule?.destroy) gameModule.destroy();
    K4Leaderboard.hide();

    // Update topbar
    const titles = {
      who_knows_best:   '❓ Who Knows Best',
      emojinary:        '😂 Emoji-nary',
      price_check:      '💰 Price Check',
      first_impressions:'🧊 First Impressions',
      word_scramble:    '🔤 Word Scramble'
    };
    document.getElementById('gameNameText').textContent = titles[name] || name;
    document.getElementById('progressFill').style.width = '0%';

    // Init game module
    const modules = {
      who_knows_best:    WhoKnowsBest,
      emojinary:         Emojinary,
      price_check:       PriceCheck,
      first_impressions: FirstImpressions,
      word_scramble:     WordScramble
    };
    gameModule = modules[name];
    if(gameModule) gameModule.init(data, playerData, socket);
    else K4App.toast('Unknown game: '+name,'error');
  }

  // Check URL params for direct load (testing)
  const urlGame = K4App.getParam('game');
  const urlRoom = K4App.getParam('room');
  if(urlGame && urlRoom) {
    (async()=>{
      try {
        const res = await fetch(`/api/games/${urlRoom}/${urlGame}`);
        const data = await res.json();
        if(data.success) initGame(urlGame, data.data);
      } catch(e) { console.log('Waiting for host to start game...'); }
    })();
  }

})();
