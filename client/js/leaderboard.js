/* K4 LEADERBOARD */
const K4Leaderboard = {

  show(players, subtitle, currentPlayerId) {
    const ov = document.getElementById('leaderboardOverlay');
    if (!ov) return;
    const sub = document.getElementById('lbSubtitle');
    if (sub && subtitle) sub.textContent = subtitle;
    this._renderList(players, 'leaderboardList', currentPlayerId);
    ov.classList.add('active');
  },

  hide() {
    const ov = document.getElementById('leaderboardOverlay');
    if (ov) ov.classList.remove('active');
  },

  showFinal(players, currentPlayerId) {
    this.hide();
    const fin = document.getElementById('finalResults');
    if (!fin) return;
    this._renderPodium(players);
    this._renderList(players, 'finalLeaderboard', currentPlayerId);
    fin.classList.add('active');
    setTimeout(() => K4Anim.confetti(100), 400);
    setTimeout(() => K4Anim.confetti(50), 2000);
  },

  _renderList(players, containerId, currentPlayerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    if (!players || !players.length) {
      el.innerHTML = `<p style="text-align:center;color:rgba(255,255,255,0.25);padding:2rem;font-size:0.85rem">No scores yet</p>`;
      return;
    }
    const rankIcons = ['👑','🥈','🥉'];
    el.innerHTML = players.map((p, i) => {
      const isMe = String(p.id) === String(currentPlayerId);
      const rank = i < 3 ? rankIcons[i] : `${i+1}`;
      const rankBg = i===0?'linear-gradient(135deg,#FFD700,#FFA500)':i===1?'linear-gradient(135deg,#C0C0C0,#A0A0A0)':i===2?'linear-gradient(135deg,#CD7F32,#8B4513)':'rgba(255,255,255,0.08)';
      return `
        <div class="lb-item ${isMe?'lb-item-me':''}" style="animation-delay:${i*55}ms">
          <div class="lb-rank" style="background:${rankBg}">${rank}</div>
          <div class="lb-avatar" style="background:${p.avatar_color||'var(--pink)'}">
            ${K4App.escapeHtml((p.name||'?').charAt(0).toUpperCase())}
          </div>
          <div class="lb-name">
            ${K4App.escapeHtml(p.name||'Player')}
            ${isMe?'<span class="lb-you">(you)</span>':''}
          </div>
          <div class="lb-pts">${p.total_score||0}<span class="lb-pts-label">pts</span></div>
        </div>`;
    }).join('');
  },

  _renderPodium(players) {
    const el = document.getElementById('podiumContainer');
    if (!el || !players.length) return;
    // Order: 2nd, 1st, 3rd
    const order = [1, 0, 2];
    const heights = [105, 140, 72];
    const bgColors = [
      'linear-gradient(160deg,#C0C0C0,#909090)',
      'linear-gradient(160deg,#FFD700,#FFA500)',
      'linear-gradient(160deg,#CD7F32,#8B4513)'
    ];
    const delays = ['0.5s', '0.2s', '0.7s'];
    el.innerHTML = order.map((idx) => {
      const p = players[idx];
      if (!p) return '<div style="flex:1"></div>';
      return `
        <div class="podium-place" style="animation:podiumRise 0.7s ease ${delays[idx]} both">
          ${idx===0?'<div class="podium-crown">👑</div>':''}
          <div class="podium-avatar" style="background:${p.avatar_color||'#FF6B9D'}">
            ${K4App.escapeHtml((p.name||'?').charAt(0).toUpperCase())}
          </div>
          <div class="podium-name">${K4App.escapeHtml(p.name||'Player')}</div>
          <div class="podium-score">${p.total_score||0} pts</div>
          <div class="podium-block" style="height:${heights[idx]}px;background:${bgColors[idx]}">${idx+1}</div>
        </div>`;
    }).join('');
  }
};
