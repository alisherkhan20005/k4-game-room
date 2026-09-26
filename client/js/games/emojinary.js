/* EMOJI-NARY — Client-side answer checking, sends is_correct to server */
const Emojinary = {
  gameData: null, player: null, socket: null,
  currentIdx: 0, totalScore: 0, timerInterval: null,

  init(gameData, player, socket) {
    this.gameData   = gameData;
    this.player     = player;
    this.socket     = socket;
    this.currentIdx = 0;
    this.totalScore = parseInt(document.getElementById('currentScore')?.textContent || 0);
    document.getElementById('gameNameText').textContent = 'Emoji-nary';
    this._render(0);
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

    const content = document.getElementById('gameContent');
    if (!content) return;
    content.innerHTML = `
      <div class="q-badge q-badge-purple">Emoji ${idx+1} of ${total}</div>
      <div class="q-card q-enter" style="--card-accent:var(--lavender)">
        <div class="q-card-label">What phrase do these emojis represent?</div>
        <div class="emoji-display">${item.emojis}</div>
        <div class="emoji-hint">Decode the emojis above</div>
      </div>
      <div class="q-timer-wrap">
        <div class="q-timer-bar"><div class="q-timer-fill q-timer-purple" id="timerFill"></div></div>
        <div class="q-timer-num" id="timerNum">30</div>
      </div>
      <div class="q-answer-wrap">
        <input class="q-input" id="emojiInput" type="text"
          placeholder="Type your answer here..." maxlength="100" autocomplete="off">
        <button class="q-submit-btn q-submit-purple" id="emojiBtn" onclick="Emojinary.submit(${idx})">
          Submit Answer
        </button>
      </div>`;

    const inp = document.getElementById('emojiInput');
    inp?.addEventListener('keypress', e => { if (e.key === 'Enter') this.submit(idx); });
    setTimeout(() => inp?.focus(), 400);
    this._startTimer(30, idx);
  },

  _startTimer(seconds, idx) {
    clearInterval(this.timerInterval);
    let t = seconds;
    const tick = () => {
      const fill = document.getElementById('timerFill');
      const num  = document.getElementById('timerNum');
      if (fill) fill.style.width = (t / seconds * 100) + '%';
      if (num)  num.textContent = t;
      if (t <= 5 && num) { num.classList.add('timer-urgent'); if(fill) fill.style.background='#FF4757'; }
      if (t <= 0) { clearInterval(this.timerInterval); this.submit(idx, ''); }
      t--;
    };
    tick();
    this.timerInterval = setInterval(tick, 1000);
  },

  submit(idx, forceAnswer) {
    clearInterval(this.timerInterval);
    const inp    = document.getElementById('emojiInput');
    const btn    = document.getElementById('emojiBtn');
    const answer = forceAnswer !== undefined ? forceAnswer : (inp?.value.trim() || '');
    if (!answer && forceAnswer === undefined) { K4App.toast('Type your answer!','warning'); inp?.focus(); return; }
    if (btn) btn.disabled = true;

    const item    = this.gameData.game.items[idx];
    const correct = answer ? K4App.answersMatch(answer, item.answer) : false;
    const score   = correct ? 150 : 0;

    if (correct) {
      this.totalScore += score;
      const sc = document.getElementById('currentScore');
      if (sc) sc.textContent = this.totalScore;
    }

    // Show result
    const content = document.getElementById('gameContent');
    if (content) {
      content.innerHTML = correct ? `
        <div class="result-card result-correct">
          <div class="result-score">+${score}</div>
          <div class="result-title">Correct!</div>
          <div class="result-answer">Answer: <strong>${K4App.escapeHtml(item.answer)}</strong></div>
        </div>` : `
        <div class="result-card result-wrong">
          <div class="result-title">Not Quite!</div>
          <div class="result-answer">Answer: <strong>${K4App.escapeHtml(item.answer)}</strong></div>
        </div>`;
    }
    if (correct) K4Anim.confetti(25);

    // Send to server
    this.socket.emit('submit_answer', {
      player_id: this.player.player_id, event_id: this.player.event_id,
      game_name: 'emojinary', question_index: idx, answer, is_correct: correct
    });

    // Next question
    setTimeout(() => {
      const next = idx + 1;
      if (next < this.gameData.game.items.length) this._render(next);
      else this._renderDone();
    }, 2500);
  },

  _renderDone() {
    const content = document.getElementById('gameContent');
    if (content) content.innerHTML = `
      <div class="waiting-screen">
        <div class="waiting-title">All Done!</div>
        <div class="waiting-sub">Waiting for the host to end this game...</div>
        <div class="waiting-dots"><span></span><span></span><span></span></div>
      </div>`;
  },

  destroy() { clearInterval(this.timerInterval); }
};
