/* FIRST IMPRESSIONS — BINGO — Premium UI */
const FirstImpressions = {
  gameData:null, ticked:new Set(), hasWon:false,

  init(gameData, player, socket) {
    this.gameData=gameData; this.player=player; this.socket=socket;
    this.ticked=new Set(); this.hasWon=false;
    this.ticked.add(12); // centre free space
    document.getElementById('gameNameText').textContent = '🧊 First Impressions';
    document.getElementById('progressFill').style.width = '0%';
    this.render();
  },

  render() {
    const game = this.gameData.game;
    const cells = game.clues || game.grid || [];
    document.getElementById('gameContent').innerHTML = `
      <div class="bingo-header fade-in">
        <h2 class="bingo-title">${K4App.escapeHtml(game.title)}</h2>
        <p class="bingo-sub">${K4App.escapeHtml(game.subtitle)}</p>
      </div>
      <div class="bingo-tip" style="width:100%">
        💡 Tap a cell when you find someone who matches. Get 5 in a row to win!
      </div>
      <div class="bingo-grid" id="bingoGrid">
        ${cells.map((cell,i) => {
          const isFree = cell.is_free_space || cell.free || false;
          const isTicked = this.ticked.has(i);
          const txt = isFree ? `⭐<br>FREE` : K4App.escapeHtml(cell.text);
          return `<div class="bingo-cell ${isFree?'free':''} ${(isTicked&&!isFree)?'ticked':''} ${isFree?'ticked':''}"
            id="cell-${i}" onclick="${isFree?'':`FirstImpressions.toggle(${i})`}"
          >${txt}</div>`;
        }).join('')}
      </div>
      <div class="bingo-tally">Ticked: <strong id="tickedCount">${this.ticked.size}</strong> / 25</div>
      <div id="bingoBanner" style="width:100%"></div>`;
  },

  toggle(idx) {
    if(this.hasWon) return;
    const cell = document.getElementById(`cell-${idx}`);
    if(!cell) return;
    if(this.ticked.has(idx)) {
      this.ticked.delete(idx);
      cell.classList.remove('ticked');
    } else {
      this.ticked.add(idx);
      cell.classList.add('ticked');
      cell.style.animation = 'none';
      setTimeout(() => cell.style.animation = 'cellPop 0.35s cubic-bezier(0.34,1.56,0.64,1)', 10);
    }
    document.getElementById('tickedCount').textContent = this.ticked.size;
    this.checkWin();
  },

  checkWin() {
    const S=5, win=[];
    // rows
    for(let r=0;r<S;r++){const row=[0,1,2,3,4].map(c=>r*S+c);if(row.every(i=>this.ticked.has(i))){win.push(...row);break;}}
    // cols
    if(!win.length)for(let c=0;c<S;c++){const col=[0,1,2,3,4].map(r=>r*S+c);if(col.every(i=>this.ticked.has(i))){win.push(...col);break;}}
    // diags
    if(!win.length){const d1=[0,6,12,18,24];if(d1.every(i=>this.ticked.has(i)))win.push(...d1);}
    if(!win.length){const d2=[4,8,12,16,20];if(d2.every(i=>this.ticked.has(i)))win.push(...d2);}
    if(win.length) this.triggerWin(win);
  },

  triggerWin(cells) {
    if(this.hasWon) return;
    this.hasWon = true;
    cells.forEach(i => {
      const c = document.getElementById(`cell-${i}`);
      if(c) c.classList.add('win');
    });
    document.getElementById('bingoBanner').innerHTML = `
      <div class="bingo-win-banner">
        <div style="font-size:3.5rem;margin-bottom:0.75rem">🎉</div>
        <h2 style="font-family:var(--font-display);font-size:2rem;font-weight:900;margin-bottom:0.5rem">BINGO!</h2>
        <p style="opacity:0.8">You got 5 in a row! Show the host your screen to claim your win! 🏆</p>
      </div>`;
    K4Anim.confetti(100);
  },

  destroy() {}
};
