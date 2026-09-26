/* WORD SCRAMBLE — Client-side answer checking, sends is_correct to server */
const WordScramble = {
  gameData: null, player: null, socket: null,
  currentIdx: 0, totalScore: 0, timerInterval: null,

  init(gameData, player, socket) {
    this.gameData   = gameData;
    this.player     = player;
    this.socket     = socket;
    this.currentIdx = 0;
    this.totalScore = parseInt(document.getElementById('currentScore')?.textContent || 0);
    document.getElementById('gameNameText').textContent = 'Word Scramble';
    this._render(0);
  },

  _render(idx) {
    const words = this.gameData.game.words;
    if (idx >= words.length) { this._renderDone(); return; }
    const word  = words[idx];
    const total = words.length;
    const pct   = Math.round((idx / total) * 100);
    const pb    = document.getElementById('progressFill');
    if (pb) pb.style.width = pct + '%';
    const qnum = document.getElementById('qNum');
    if (qnum) qnum.textContent = `${idx+1} / ${total}`;
    this.currentIdx = idx;

    const content = document.getElementById('gameContent');
    if (!content) return;

    // Build tile HTML
    const tiles = word.scrambled.split('').map((l, i) => {
      if (l === ' ') return `<div style="width:10px"></div>`;
      return `<div class="scramble-tile" style="opacity:0;transform:translateY(-20px);transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);transition-delay:${i*55}ms">${l}</div>`;
    }).join('');

    content.innerHTML = `
      <div class="q-badge q-badge-mint">Word ${idx+1} of ${total}</div>
      <div class="q-card q-enter" style="--card-accent:var(--mint)">
        <div class="q-card-label">Unscramble this word!</div>
        <div class="scramble-tiles" id="scrambleTiles">${tiles}</div>
        <div class="scramble-raw">${K4App.escapeHtml(word.scrambled)}</div>
      </div>
      <div class="q-timer-wrap">
        <div class="q-timer-bar"><div class="q-timer-fill q-timer-mint" id="timerFill"></div></div>
        <div class="q-timer-num" id="timerNum">30</div>
      </div>
      <div class="q-answer-wrap">
        <input class="q-input scramble-input" id="scrambleInput"
          type="text" placeholder="TYPE YOUR ANSWER..."
          maxlength="50" autocomplete="off" autocorrect="off">
        <div style="display:flex;gap:0.75rem;width:100%">
          <button class="q-skip-btn" onclick="WordScramble.skip(${idx})">Skip</button>
          <button class="q-submit-btn q-submit-mint" id="scrambleBtn" onclick="WordScramble.submit(${idx})">
            Submit
          </button>
        </div>
      </div>`;

    // Animate tiles in
    setTimeout(() => {
      document.querySelectorAll('.scramble-tile').forEach(t => {
        t.style.opacity = '1';
        t.style.transform = 'translateY(0)';
      });
    }, 100);

    const inp = document.getElementById('scrambleInput');
    if (inp) {
      inp.addEventListener('input', e => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g,'');
      });
      inp.addEventListener('keypress', e => { if (e.key === 'Enter') this.submit(idx); });
      setTimeout(() => inp.focus(), 400);
    }
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
    const inp    = document.getElementById('scrambleInput');
    const btn    = document.getElementById('scrambleBtn');
    const raw    = forceAnswer !== undefined ? forceAnswer : (inp?.value.trim() || '');
    const answer = raw.toUpperCase();

    if (!raw && forceAnswer === undefined) { K4App.toast('Type your answer!','warning'); inp?.focus(); return; }
    if (btn) btn.disabled = true;

    const word    = this.gameData.game.words[idx];
    const correct = answer === word.answer.toUpperCase();
    const score   = correct ? 100 : 0;

    if (correct) {
      this.totalScore += score;
      const sc = document.getElementById('currentScore');
      if (sc) sc.textContent = this.totalScore;
      K4Anim.confetti(20);
    }

    const content = document.getElementById('gameContent');
    if (content) {
      content.innerHTML = correct ? `
        <div class="result-card result-correct">
          <div class="result-score">+${score}</div>
          <div class="result-title">Correct!</div>
          <div class="result-answer">${K4App.escapeHtml(word.answer)}</div>
        </div>` : `
        <div class="result-card result-wrong">
          <div class="result-title">Not Quite!</div>
          <div class="result-answer">Answer: <strong>${K4App.escapeHtml(word.answer)}</strong></div>
        </div>`;
    }

    this.socket.emit('submit_answer', {
      player_id: this.player.player_id, event_id: this.player.event_id,
      game_name: 'word_scramble', question_index: idx, answer, is_correct: correct
    });

    setTimeout(() => {
      const next = idx + 1;
      if (next < this.gameData.game.words.length) this._render(next);
      else this._renderDone();
    }, 2500);
  },

  skip(idx) {
    clearInterval(this.timerInterval);
    this.socket.emit('submit_answer', {
      player_id: this.player.player_id, event_id: this.player.event_id,
      game_name: 'word_scramble', question_index: idx, answer: '', is_correct: false
    });
    const next = idx + 1;
    if (next < this.gameData.game.words.length) this._render(next);
    else this._renderDone();
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

  destroy() { clearInterval(this.timerInterval); }
};
