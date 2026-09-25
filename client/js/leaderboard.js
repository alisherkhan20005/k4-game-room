/* ============================================
   K4 GAME ROOM - LEADERBOARD
   ============================================ */

const K4Leaderboard = {

  // Render leaderboard list
  render(players, containerId = 'leaderboardList', currentPlayerId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!players || players.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:2rem">No scores yet</p>';
      return;
    }

    container.innerHTML = players.map((p, i) => {
      const rankClass = i === 0 ? 'leaderboard-rank--1' : i === 1 ? 'leaderboard-rank--2' : i === 2 ? 'leaderboard-rank--3' : 'leaderboard-rank--other';
      const rankIcon = i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      const isMe = p.id === currentPlayerId;

      return `
        <div class="leaderboard-item ${isMe ? 'leaderboard-item--me' : ''}"
             style="${isMe ? 'border:2px solid var(--baby-pink);background:rgba(255,181,200,0.06)' : ''}">
          <div class="leaderboard-rank ${rankClass}">${rankIcon}</div>
          <div class="avatar" style="background:${p.avatar_color || '#FFB5C8'};width:38px;height:38px;font-size:0.9rem">
            ${K4App.escapeHtml(p.name.charAt(0).toUpperCase())}
          </div>
          <div class="leaderboard-name">
            ${K4App.escapeHtml(p.name)}
            ${isMe ? ' <span style="color:var(--baby-pink);font-size:0.75rem">(you)</span>' : ''}
          </div>
          <div class="leaderboard-score">${p.total_score || 0} pts</div>
        </div>
      `;
    }).join('');

    // Stagger animation
    const items = container.querySelectorAll('.leaderboard-item');
    K4Anim.staggerFadeIn(Array.from(items), 80);
  },

  // Render winner podium (top 3)
  renderPodium(players, containerId = 'podiumContainer') {
    const container = document.getElementById(containerId);
    if (!container || players.length === 0) return;

    const top3 = players.slice(0, 3);
    const order = [1, 0, 2]; // 2nd, 1st, 3rd position order

    container.innerHTML = order.map(idx => {
      const p = top3[idx];
      if (!p) return '<div class="podium-place"></div>';

      const place = idx + 1;
      const heights = { 1: 120, 2: 90, 3: 65 };
      const labels = { 1: '👑', 2: '2', 3: '3' };

      return `
        <div class="podium-place podium-rise" style="--delay:${0.3 + idx * 0.15}s">
          <div class="podium-avatar">
            <div class="avatar avatar-lg" style="background:${p.avatar_color || '#FFB5C8'}">
              ${K4App.escapeHtml(p.name.charAt(0).toUpperCase())}
            </div>
          </div>
          <div class="podium-name">${K4App.escapeHtml(p.name)}</div>
          <div class="podium-score">${p.total_score} pts</div>
          <div class="podium-block podium-block--${place}" style="height:${heights[place]}px">
            ${labels[place]}
          </div>
        </div>
      `;
    }).join('');
  },

  // Show leaderboard overlay
  show(players, subtitle = 'After this round', currentPlayerId = null) {
    const overlay = document.getElementById('leaderboardOverlay');
    if (!overlay) return;

    document.getElementById('lbSubtitle').textContent = subtitle;
    this.render(players, 'leaderboardList', currentPlayerId);

    overlay.classList.remove('hidden');
    overlay.style.display = 'flex';
  },

  // Hide leaderboard overlay
  hide() {
    const overlay = document.getElementById('leaderboardOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
  },

  // Show final results
  showFinal(players, currentPlayerId = null) {
    this.hide();
    const final = document.getElementById('finalResults');
    if (!final) return;

    this.renderPodium(players);
    this.render(players, 'finalLeaderboard', currentPlayerId);

    final.classList.remove('hidden');
    final.style.display = 'flex';

    // Confetti!
    setTimeout(() => K4Anim.confetti(100), 300);
    setTimeout(() => K4Anim.confetti(50), 1500);
  }
};
