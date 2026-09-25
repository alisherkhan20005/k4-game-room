/* LEADERBOARD — Premium UI */
const K4Leaderboard = {

  renderList(players, containerId, currentPlayerId=null) {
    const el = document.getElementById(containerId);
    if(!el) return;
    if(!players || !players.length) {
      el.innerHTML = `<p style="text-align:center;color:rgba(255,255,255,0.25);padding:2rem;font-size:0.9rem">No scores yet</p>`;
      return;
    }
    el.innerHTML = players.map((p, i) => {
      const isMe = p.id === currentPlayerId;
      const rankClass = i===0?'lb-rank-1':i===1?'lb-rank-2':i===2?'lb-rank-3':'lb-rank-n';
      const rankIcon  = i===0?'👑':i===1?'🥈':i===2?'🥉':`${i+1}`;
      return `
        <div class="lb-item ${isMe?'me':''}" style="animation-delay:${i*60}ms">
          <div class="lb-rank ${rankClass}">${rankIcon}</div>
          <div class="avatar avatar-sm" style="background:${p.avatar_color||'var(--pink)'}">
            ${K4App.escapeHtml(p.name.charAt(0).toUpperCase())}
          </div>
          <div class="lb-name">
            ${K4App.escapeHtml(p.name)}
            ${isMe?'<span style="color:var(--pink);font-size:0.72rem;font-weight:700;margin-left:0.4rem">(you)</span>':''}
          </div>
          <div class="lb-pts">${p.total_score||0} <span style="font-size:0.75rem;opacity:0.5">pts</span></div>
        </div>`;
    }).join('');
  },

  renderPodium(players, containerId) {
    const el = document.getElementById(containerId);
    if(!el || !players.length) return;
    const top3 = players.slice(0,3);
    const order = [1,0,2]; // 2nd, 1st, 3rd
    const heights = {0:140, 1:105, 2:76};
    const classes = {0:'podium-1', 1:'podium-2', 2:'podium-3'};
    const labels  = {0:'👑', 1:'2', 2:'3'};
    const delays  = {0:'0.3s', 1:'0.5s', 2:'0.7s'};

    el.innerHTML = order.map(idx => {
      const p = top3[idx];
      if(!p) return '<div style="flex:1"></div>';
      return `
        <div class="podium-place" style="animation:podiumRise 0.7s ease ${delays[idx]} both">
          <div class="podium-avatar-wrap">
            ${idx===0?'<div class="podium-crown">👑</div>':''}
            <div class="avatar avatar-lg" style="background:${p.avatar_color||'var(--pink)'}">
              ${K4App.escapeHtml(p.name.charAt(0).toUpperCase())}
            </div>
          </div>
          <div class="podium-name">${K4App.escapeHtml(p.name)}</div>
          <div class="podium-pts">${p.total_score||0} pts</div>
          <div class="podium-block ${classes[idx]}">${labels[idx]}</div>
        </div>`;
    }).join('');
  },

  show(players, subtitle, currentPlayerId=null) {
    const ov = document.getElementById('leaderboardOverlay');
    if(!ov) return;
    if(subtitle) document.getElementById('lbSubtitle').textContent = subtitle;
    this.renderList(players, 'leaderboardList', currentPlayerId);
    ov.classList.add('active');
  },

  hide() {
    const ov = document.getElementById('leaderboardOverlay');
    if(ov) ov.classList.remove('active');
  },

  showFinal(players, currentPlayerId=null) {
    this.hide();
    const fin = document.getElementById('finalResults');
    if(!fin) return;
    this.renderPodium(players, 'podiumContainer');
    this.renderList(players, 'finalLeaderboard', currentPlayerId);
    fin.classList.add('active');
    setTimeout(() => K4Anim.confetti(120), 300);
    setTimeout(() => K4Anim.confetti(60), 1800);
  }
};
