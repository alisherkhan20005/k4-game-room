/* PRICE CHECK — Premium UI */
const PriceCheck = {
  gameData:null, player:null, socket:null,
  score:0, answered:new Set(),

  init(gameData, player, socket) {
    this.gameData=gameData; this.player=player; this.socket=socket;
    this.score=0; this.answered=new Set();
    document.getElementById('gameNameText').textContent = '💰 Price Check';
    this.render(0);
    socket.on('price_result', data => this.onResult(data));
    socket.on('next_question', ({question_index}) => this.render(question_index));
  },

  render(idx) {
    const items = this.gameData.game.items;
    const item = items[idx]; if(!item) return;
    const total = items.length;
    const pct = Math.round((idx/total)*100);
    document.getElementById('progressFill').style.width = pct+'%';
    const already = this.answered.has(idx);
    this._currentIdx = idx;

    document.getElementById('gameContent').innerHTML = `
      <div class="q-counter" style="background:rgba(255,217,61,0.1);border-color:rgba(255,217,61,0.2);color:rgba(255,217,61,0.8)">
        Item ${idx+1} of ${total}
      </div>
      <div class="price-card q-enter" id="priceCard">
        <span class="price-item-emoji">${item.emoji || '🛍️'}</span>
        <h2 class="price-item-name">${K4App.escapeHtml(item.name)}</h2>
        <p class="price-item-hint">How much do you think this costs? 🤔</p>
        ${already ? `
          <div style="padding:1rem;background:rgba(0,200,150,0.1);border-radius:var(--r-md);color:var(--mint);font-weight:700">
            ✅ Your guess is locked in!
          </div>` : `
          <div class="price-input-wrap">
            <span class="price-currency">£</span>
            <input class="price-input" id="priceInput" type="number" placeholder="0.00" min="0" step="0.01" max="99999">
          </div>
          <button class="btn btn-full btn-lg" id="priceBtn"
            style="background:linear-gradient(135deg,#FFD93D,#FF9B7B);color:#1A0A00;font-weight:800;margin-top:0.25rem"
            onclick="PriceCheck.submit(${idx})">
            🔒 Lock In My Price
          </button>`}
      </div>
      <div id="priceResultWrap"></div>`;

    const inp = document.getElementById('priceInput');
    inp?.addEventListener('keypress', e => { if(e.key==='Enter') this.submit(idx); });
    setTimeout(() => inp?.focus(), 500);
  },

  submit(idx) {
    const inp = document.getElementById('priceInput');
    const btn = document.getElementById('priceBtn');
    const val = parseFloat(inp?.value);
    if(!inp?.value || isNaN(val) || val < 0) { K4App.toast('Enter a valid price!','warning'); return; }
    if(btn) { btn.disabled=true; btn.textContent='Locked In! 🔒'; }
    this.answered.add(idx);
    const item = this.gameData.game.items[idx];

    document.getElementById('priceResultWrap').innerHTML = `
      <div style="text-align:center;color:rgba(255,255,255,0.3);font-size:0.85rem;padding:1rem">
        <div class="spinner spinner-sm" style="margin:0 auto 0.5rem"></div>
        Submitted £${val.toFixed(2)} — waiting for the reveal...
      </div>`;

    this.socket.emit('submit_price', {
      player_id:this.player.player_id, event_id:this.player.event_id,
      item_index:idx, item_name:item.name, guessed_price:val
    });
  },

  onResult({ score, difference, item_name }) {
    this.score += score;
    document.getElementById('currentScore').textContent = this.score;
    const isExact = difference === 0;
    const isClose = difference < 5;

    document.getElementById('priceResultWrap').innerHTML = `
      <div class="price-result-card">
        <div style="font-size:2rem;margin-bottom:0.5rem">${isExact?'🎯':isClose?'🔥':'📊'}</div>
        <div style="font-size:0.9rem;font-weight:600;opacity:0.8;margin-bottom:0.25rem">
          ${isExact?'Perfect match!':isClose?'So close!':'Result'}
        </div>
        <div class="price-result-score">+${score}</div>
        <div class="price-result-diff">
          ${isExact?'Exact price! Amazing!': difference != null?`You were £${parseFloat(difference).toFixed(2)} away`:'Good guess!'}
        </div>
      </div>`;

    if(isExact || isClose) K4Anim.confetti(20);

    const idx = this._currentIdx;
    setTimeout(() => {
      const next = idx + 1;
      if(next < this.gameData.game.items.length) this.render(next);
      else document.getElementById('priceResultWrap').innerHTML += `<div style="text-align:center;color:rgba(255,255,255,0.3);font-size:0.85rem;margin-top:1rem">🌸 All done! Waiting for host...</div>`;
    }, 3000);
  },

  destroy() { this.socket.off('price_result'); this.socket.off('next_question'); }
};
