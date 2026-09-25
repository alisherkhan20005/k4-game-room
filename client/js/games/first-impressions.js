/* ============================================
   FIRST IMPRESSIONS - BINGO GAME
   ============================================ */

const FirstImpressions = {
  gameData: null,
  ticked: new Set(),
  hasWon: false,

  init(gameData, player, socket) {
    this.gameData = gameData;
    this.player = player;
    this.socket = socket;
    this.ticked = new Set();
    this.hasWon = false;
    // Auto-tick the free space (index 12, centre)
    this.ticked.add(12);
    this.renderGrid();
  },

  renderGrid() {
    const game = this.gameData.game;
    // Support both 'clues' and 'grid' key names
    const cells = game.clues || game.grid || [];
    const content = document.getElementById('gameContent');

    content.innerHTML = `
      <div class="fade-in">
        <div style="text-align:center;margin-bottom:1rem">
          <h2 style="font-family:var(--font-heading);font-size:1.4rem;color:var(--dark)">${K4App.escapeHtml(game.title)}</h2>
          <p style="color:var(--gray);font-size:0.85rem;margin-top:0.25rem">${K4App.escapeHtml(game.subtitle)}</p>
        </div>
        <div style="background:rgba(255,181,200,0.1);border-radius:var(--radius-md);padding:0.625rem 1rem;margin-bottom:1rem;font-size:0.82rem;color:var(--gray);text-align:center">
          💡 Tap a square when you find someone who matches. Get 5 in a row and show the host!
        </div>
        <div class="bingo-grid" id="bingoGrid">
          ${cells.map((cell, i) => {
            const isFree = cell.is_free_space || cell.free || false;
            const isTicked = this.ticked.has(i);
            const displayText = isFree ? (cell.content || '⭐') + ' FREE' : K4App.escapeHtml(cell.text);
            return `
              <div
                class="bingo-cell ${isFree ? 'bingo-cell--free' : ''} ${(isTicked && !isFree) ? 'bingo-cell--ticked' : ''} ${isFree && isTicked ? 'bingo-cell--free' : ''}"
                id="cell-${i}"
                data-index="${i}"
                onclick="${isFree ? '' : `FirstImpressions.toggleCell(${i})`}"
              >${displayText}</div>
            `;
          }).join('')}
        </div>
        <div id="winBanner"></div>
        <div style="margin-top:0.75rem;text-align:center">
          <span style="font-size:0.8rem;color:var(--gray)">
            Ticked: <strong id="tickedCount">${this.ticked.size}</strong>/25
          </span>
        </div>
      </div>
    `;
  },

  toggleCell(index) {
    if (this.hasWon) return;
    const cell = document.getElementById(`cell-${index}`);
    if (!cell) return;

    if (this.ticked.has(index)) {
      this.ticked.delete(index);
      cell.classList.remove('bingo-cell--ticked');
    } else {
      this.ticked.add(index);
      cell.classList.add('bingo-cell--ticked');
      K4Anim.bounce(cell);
    }

    document.getElementById('tickedCount').textContent = this.ticked.size;
    this.checkWin();
  },

  // Check all rows, cols, diagonals in a flat 25-cell 5×5 grid
  checkWin() {
    const SIZE = 5;
    const winning = [];

    // Rows
    for (let r = 0; r < SIZE; r++) {
      const row = [0,1,2,3,4].map(c => r * SIZE + c);
      if (row.every(i => this.ticked.has(i))) { winning.push(...row); break; }
    }
    if (!winning.length) {
      // Columns
      for (let c = 0; c < SIZE; c++) {
        const col = [0,1,2,3,4].map(r => r * SIZE + c);
        if (col.every(i => this.ticked.has(i))) { winning.push(...col); break; }
      }
    }
    if (!winning.length) {
      // Diagonal TL→BR
      const diag1 = [0,6,12,18,24];
      if (diag1.every(i => this.ticked.has(i))) winning.push(...diag1);
    }
    if (!winning.length) {
      // Diagonal TR→BL
      const diag2 = [4,8,12,16,20];
      if (diag2.every(i => this.ticked.has(i))) winning.push(...diag2);
    }

    if (winning.length) this.triggerWin(winning);
  },

  triggerWin(winningCells) {
    if (this.hasWon) return;
    this.hasWon = true;

    winningCells.forEach(i => {
      const cell = document.getElementById(`cell-${i}`);
      if (cell) cell.classList.add('bingo-cell--win');
    });

    const banner = document.getElementById('winBanner');
    banner.innerHTML = `
      <div class="bingo-win-banner" style="margin-top:1rem">
        <div style="font-size:3rem;margin-bottom:0.5rem">🎉</div>
        <h2>BINGO! You got 5 in a row!</h2>
        <p style="margin-top:0.5rem;opacity:0.9;font-size:0.95rem">Show the host your screen to claim your win! 🏆</p>
      </div>
    `;
    K4Anim.confetti(80);
  },

  destroy() {}
};
