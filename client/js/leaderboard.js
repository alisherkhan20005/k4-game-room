/* K4 LEADERBOARD — Fixed: all players shown, points always visible */
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
    setTimeout(() => K4Anim.confetti(50), 2200);
  },

  _renderList(players, containerId, currentPlayerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    // Always show all players, even with 0 points
    if (!players || !players.length) {
      el.innerHTML = `<p style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem;font-size:0.85rem">No players yet</p>`;
      return;
    }

    // Sort by score descending (server already sorts, but ensure it client-side too)
    const sorted = [...players].sort((a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0));

    const rankIcons = ['👑', '🥈', '🥉'];
    el.innerHTML = sorted.map((p, i) => {
      const isMe   = String(p.id) === String(currentPlayerId);
      const rank   = i < 3 ? rankIcons[i] : `${i + 1}`;
      const pts    = Number(p.total_score) || 0; // handle null/undefined
      const rankBg = i === 0 ? 'linear-gradient(135deg,#FFD700,#FFA500)'
                   : i === 1 ? 'linear-gradient(135deg,#C0C0C0,#A0A0A0)'
                   : i === 2 ? 'linear-gradient(135deg,#CD7F32,#8B4513)'
                   : 'rgba(255,255,255,0.08)';
      return `
        <div class="lb-item ${isMe ? 'lb-item-me' : ''}" style="animation-delay:${i * 55}ms">
          <div class="lb-rank" style="background:${rankBg}">${rank}</div>
          <div class="lb-avatar" style="background:${p.avatar_color || 'var(--pink)'}">
            ${K4App.escapeHtml((p.name || '?').charAt(0).toUpperCase())}
          </div>
          <div class="lb-name">
            ${K4App.escapeHtml(p.name || 'Player')}
            ${isMe ? '<span class="lb-you">(you)</span>' : ''}
          </div>
          <div class="lb-pts">
            <span style="color:#fff;font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:900">${pts}</span>
            <span style="color:rgba(255,255,255,0.4);font-size:0.65rem;margin-left:2px">pts</span>
          </div>
        </div>`;
    }).join('');
  },

  _renderPodium(players) {
    const el = document.getElementById('podiumContainer');
    if (!el) return;

    const sorted = [...players].sort((a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0));

    if (!sorted.length) {
      el.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center">No players</p>';
      return;
    }

    // Podium display order: 2nd place | 1st place | 3rd place
    const podiumSlots = [
      { dataIdx: 1, height: 105, bg: 'linear-gradient(160deg,#C0C0C0,#909090)', label: '2nd', delay: '0.4s' },
      { dataIdx: 0, height: 140, bg: 'linear-gradient(160deg,#FFD700,#FFA500)', label: '1st', delay: '0.1s' },
      { dataIdx: 2, height: 72,  bg: 'linear-gradient(160deg,#CD7F32,#8B4513)', label: '3rd', delay: '0.6s' },
    ];

    el.innerHTML = podiumSlots.map(slot => {
      const p = sorted[slot.dataIdx];
      if (!p) return `<div style="flex:1"></div>`;
      const pts = Number(p.total_score) || 0;
      return `
        <div class="podium-place" style="animation:podiumRise 0.7s ease ${slot.delay} both">
          ${slot.dataIdx === 0 ? '<div class="podium-crown">👑</div>' : ''}
          <div class="podium-avatar" style="background:${p.avatar_color || '#FF6B9D'}">
            ${K4App.escapeHtml((p.name || '?').charAt(0).toUpperCase())}
          </div>
          <div class="podium-name">${K4App.escapeHtml(p.name || 'Player')}</div>
          <div class="podium-score" style="color:#fff;font-weight:700;font-size:0.78rem">${pts} pts</div>
          <div class="podium-block" style="height:${slot.height}px;background:${slot.bg}">${slot.label}</div>
        </div>`;
    }).join('');
  }
};
