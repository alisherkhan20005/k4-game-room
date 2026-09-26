/* PRICE CHECK
   Server looks up PriceCheckItem by event_id + display_order
   display_order matches item index (0-based)
*/
const PriceCheck = {
  gameData: null, player: null, socket: null,
  currentIdx: 0, totalScore: 0,

  init(gameData, player, socket) {
    this.gameData   = gameData;
    this.player     = player;
    this.socket     = socket;
    this.currentIdx = 0;
    this.totalScore = parseInt(document.getElementById('currentScore')?.textContent || 0);
    document.getElementById('gameNameText').textContent = 'Price Check';
    this._render(0);
    socket.on('price_result', ({ score, difference, item_name }) => {
      this._showResult(score, difference, item_name);
    });
  },

  _render(idx) {
    const items = this.gameData.game.items;
    if (idx >= items.length) { this._renderDone(); return; }
    const item  = items[idx];
    const total = items.length;
    const pct   = Math.round((idx / total) * 100);
    const pb    = document.getElementById('progressFill');
    if (pb) pb.style.width = pct + '%';
    const qnum = document.getElementById('qNum');
    if (qnum) qnum.textContent = `${idx+1} / ${total}`;
    this.currentIdx = idx;

    const content = document.getElementById('gameContent');
    if (!content) return;
    content.innerHTML = `
      <div class="q-badge q-badge-yellow">Item ${idx+1} of ${total}</div>
      <div class="q-card q-enter" style="--card-accent:var(--yellow)">
        <div class="price-item-emoji">${item.emoji || '🛍️'}</div>
        <div class="price-item-name">${K4App.escapeHtml(item.name)}</div>
        <div class="price-item-hint">How much do you think this costs?</div>
        <div class="price-input-wrap">
          <span class="price-currency">£</span>
          <input class="price-input" id="priceInput" type="number"
            placeholder="0.00" min="0" step="0.01" max="99999">
        </div>
        <button class="q-submit-btn q-submit-yellow" id="priceBtn" onclick="PriceCheck.submit(${idx})">
          Lock In My Price
        </button>
      </div>
      <div id="priceResult"></div>`;

    const inp = document.getElementById('priceInput');
    inp?.addEventListener('keypress', e => { if (e.key === 'Enter') this.submit(idx); });
    setTimeout(() => inp?.focus(), 400);
  },

  submit(idx) {
    const inp = document.getElementById('priceInput');
    const btn = document.getElementById('priceBtn');
    const val = parseFloat(inp?.value);
    if (!inp?.value || isNaN(val) || val < 0) {
      K4App.toast('Enter a valid price!', 'warning'); return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Price Locked!'; }

    const item = this.gameData.game.items[idx];
    const result = document.getElementById('priceResult');
    if (result) result.innerHTML = `
      <div class="waiting-hint" style="margin-top:1rem">
        Your guess: £${val.toFixed(2)} — waiting for the reveal...
      </div>`;

    // CRITICAL: display_order is 0-based index matching item position
    this.socket.emit('submit_price', {
      player_id:    this.player.player_id,
      event_id:     this.player.event_id,
      item_index:   idx,          // maps to display_order in DB
      item_name:    item.name,
      guessed_price: val
    });
  },

  _showResult(score, difference, item_name) {
    const isExact = parseFloat(difference) === 0;
    const isClose = parseFloat(difference) < 5;
    this.totalScore += score;
    const sc = document.getElementById('currentScore');
    if (sc) sc.textContent = this.totalScore;
    if (isExact || isClose) K4Anim.confetti(20);

    const result = document.getElementById('priceResult');
    if (result) result.innerHTML = `
      <div class="result-card ${isExact||isClose?'result-correct':'result-wrong'}">
        <div class="result-score">+${score}</div>
        <div class="result-title">${isExact?'Perfect Match!':isClose?'So Close!':'Result'}</div>
        <div class="result-sub">${difference!=null&&!isExact?`You were £${parseFloat(difference).toFixed(2)} away`:'Good guess!'}</div>
      </div>`;

    setTimeout(() => {
      const next = this.currentIdx + 1;
      if (next < this.gameData.game.items.length) this._render(next);
      else this._renderDone();
    }, 3000);
  },

  _renderDone() {
    const content = document.getElementById('gameContent');
    if (content) content.innerHTML = `
      <div class="waiting-screen">
        <div class="waiting-title">All Done!</div>
        <div class="waiting-sub">Waiting for host to end this game...</div>
        <div class="waiting-dots"><span></span><span></span><span></span></div>
      </div>`;
  },

  destroy() { this.socket.off('price_result'); }
};
