/* FIRST IMPRESSIONS — BINGO
   Data uses 'clues' array with {text, is_free_space} objects
   Free space is at index 12 (centre of 5x5 grid)
*/
const FirstImpressions = {
  gameData: null, player: null, socket: null,
  ticked: new Set(), hasWon: false,

  init(gameData, player, socket) {
    this.gameData = gameData;
    this.player   = player;
    this.socket   = socket;
    this.ticked   = new Set();
    this.hasWon   = false;
    document.getElementById('gameNameText').textContent = 'First Impressions';
    const pb = document.getElementById('progressFill');
    if (pb) pb.style.width = '0%';
    this._render();
  },

  _render() {
    const game  = this.gameData.game;
    // API normalises to 'clues' always
    const cells = game.clues || game.grid || [];

    // Auto-tick free spaces
    cells.forEach((c, i) => { if (c.is_free_space) this.ticked.add(i); });

    const content = document.getElementById('gameContent');
    if (!content) return;
    content.innerHTML = `
      <div class="bingo-header">
        <div class="bingo-title">${K4App.escapeHtml(game.title)}</div>
        <div class="bingo-sub">${K4App.escapeHtml(game.subtitle)}</div>
      </div>
      <div class="bingo-tip">
        Tap a cell when you find someone who matches — get 5 in a row to win!
      </div>
      <div class="bingo-grid" id="bingoGrid"></div>
      <div class="bingo-tally">Ticked: <strong id="tickCount">${this.ticked.size}</strong> / 25</div>
      <div id="bingoBanner"></div>`;

    const grid = document.getElementById('bingoGrid');
    cells.forEach((cell, i) => {
      const isFree = !!cell.is_free_space;
      const isTicked = this.ticked.has(i);
      const div = document.createElement('div');
      div.className = `bingo-cell${isFree?' bingo-free':''}${isTicked?' bingo-ticked':''}`;
      div.id = `cell-${i}`;
      div.textContent = isFree ? 'FREE' : cell.text;
      if (!isFree) {
        div.addEventListener('click', () => this._toggle(i));
      }
      grid.appendChild(div);
    });
  },

  _toggle(idx) {
    if (this.hasWon) return;
    const cell = document.getElementById(`cell-${idx}`);
    if (!cell) return;
    if (this.ticked.has(idx)) {
      this.ticked.delete(idx);
      cell.classList.remove('bingo-ticked', 'bingo-win');
    } else {
      this.ticked.add(idx);
      cell.classList.add('bingo-ticked');
      // Pop animation
      cell.style.animation = 'none';
      void cell.offsetWidth;
      cell.style.animation = 'cellPop 0.35s cubic-bezier(0.34,1.56,0.64,1)';
    }
    const tc = document.getElementById('tickCount');
    if (tc) tc.textContent = this.ticked.size;
    this._checkWin();
  },

  _checkWin() {
    const S = 5;
    const lines = [
      // Rows
      [0,1,2,3,4],[5,6,7,8,9],[10,11,12,13,14],[15,16,17,18,19],[20,21,22,23,24],
      // Cols
      [0,5,10,15,20],[1,6,11,16,21],[2,7,12,17,22],[3,8,13,18,23],[4,9,14,19,24],
      // Diags
      [0,6,12,18,24],[4,8,12,16,20]
    ];
    for (const line of lines) {
      if (line.every(i => this.ticked.has(i))) {
        this._triggerWin(line);
        return;
      }
    }
  },

  _triggerWin(cells) {
    if (this.hasWon) return;
    this.hasWon = true;
    cells.forEach(i => {
      const c = document.getElementById(`cell-${i}`);
      if (c) { c.classList.add('bingo-win'); }
    });
    const banner = document.getElementById('bingoBanner');
    if (banner) banner.innerHTML = `
      <div class="bingo-win-banner">
        <div class="bingo-win-icon">🎉</div>
        <div class="bingo-win-title">BINGO!</div>
        <div class="bingo-win-sub">Show the host your screen to claim your win!</div>
      </div>`;
    K4Anim.confetti(80);
  },

  destroy() {}
};
