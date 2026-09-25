/* ============================================
   PRICE CHECK - GAME LOGIC
   ============================================ */

const PriceCheck = {
  gameData: null,
  currentIndex: 0,
  score: 0,
  answered: new Set(),

  init(gameData, player, socket) {
    this.gameData = gameData;
    this.player = player;
    this.socket = socket;
    this.currentIndex = 0;
    this.score = 0;
    this.answered = new Set();
    this.renderItem(0);
    this.bindSocketEvents();
  },

  renderItem(index) {
    const items = this.gameData.game.items;
    const item = items[index];
    if (!item) return;

    const total = items.length;
    const progress = (index / total) * 100;
    const alreadyAnswered = this.answered.has(index);

    const content = document.getElementById('gameContent');
    content.innerHTML = `
      <div class="game-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${index + 1}/${total}</span>
      </div>

      <div class="price-item-card question-enter" id="priceCard">
        <span class="price-item-emoji">${item.emoji || '🛍️'}</span>
        <h2 class="price-item-name">${K4App.escapeHtml(item.name)}</h2>
        <p style="color:var(--gray);font-size:0.9rem;margin-bottom:1.5rem">
          How much do you think this costs?
        </p>

        ${alreadyAnswered ? `
          <div style="padding:1rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md);color:var(--mint-green);font-weight:600">
            ✅ Answer submitted!
          </div>
        ` : `
          <div class="price-input-wrapper">
            <span class="price-currency">£</span>
            <input
              type="number"
              class="price-input"
              id="priceInput"
              placeholder="0.00"
              min="0"
              step="0.01"
              max="99999"
            >
          </div>
          <button class="btn btn-primary" style="margin-top:1rem;width:100%" onclick="PriceCheck.submitPrice(${index})">
            Lock In My Price 🔒
          </button>
        `}
      </div>

      <div id="priceResult"></div>
    `;

    K4Anim.questionEnter(document.getElementById('priceCard'));

    const input = document.getElementById('priceInput');
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.submitPrice(index);
    });
    setTimeout(() => input?.focus(), 400);
  },

  submitPrice(index) {
    const input = document.getElementById('priceInput');
    const value = parseFloat(input?.value);

    if (!input?.value || isNaN(value) || value < 0) {
      K4App.toast('Please enter a valid price!', 'warning');
      K4Anim.shake(input);
      return;
    }

    this.answered.add(index);
    const item = this.gameData.game.items[index];

    // Disable input
    input.disabled = true;
    document.querySelector(`[onclick="PriceCheck.submitPrice(${index})"]`).disabled = true;

    // Send to server
    this.socket.emit('submit_price', {
      player_id: this.player.player_id,
      event_id: this.player.event_id,
      item_index: index,
      item_name: item.name,
      guessed_price: value
    });

    // Show pending
    document.getElementById('priceResult').innerHTML = `
      <div style="text-align:center;padding:1rem;color:var(--gray);font-size:0.9rem">
        <div class="spinner" style="margin:0 auto 0.5rem;width:24px;height:24px;border-width:2px"></div>
        Submitted £${value.toFixed(2)} — waiting for reveal...
      </div>
    `;
  },

  onPriceResult({ score, difference, item_name }) {
    this.score += score;
    document.getElementById('currentScore').textContent = this.score;

    const resultEl = document.getElementById('priceResult');
    const isClose = difference < 5;
    const isExact = difference === 0;

    resultEl.innerHTML = `
      <div class="price-reveal-card price-reveal" style="margin-top:1rem">
        <div style="font-size:1rem;font-weight:600;margin-bottom:0.5rem">
          ${isExact ? '🎯 Exact match!' : isClose ? '🔥 So close!' : '📊 Result'}
        </div>
        <div class="price-reveal-amount">+${score} pts</div>
        <div style="font-size:0.9rem;opacity:0.8">
          ${isExact ? 'Perfect price!' : `You were £${difference.toFixed(2)} away`}
        </div>
      </div>
    `;

    if (isExact || isClose) K4Anim.confetti(20);

    // Auto advance
    const nextIndex = index + 1;
    setTimeout(() => {
      if (nextIndex < this.gameData.game.items.length) {
        this.renderItem(nextIndex);
      }
    }, 3000);
  },

  bindSocketEvents() {
    this.socket.on('price_result', (data) => this.onPriceResult(data));
  },

  destroy() {
    this.socket.off('price_result');
  }
};
