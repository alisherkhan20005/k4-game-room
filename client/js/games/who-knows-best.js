/* WHO KNOWS BEST
   Server handles answer checking via QuizAnswer table.
   We send the raw answer — server returns correct:bool, score:int
*/
const WhoKnowsBest = {
  gameData: null, player: null, socket: null,
  answered: new Set(), currentQ: null, totalScore: 0,
  timerInterval: null,

  init(gameData, player, socket) {
    this.gameData = gameData;
    this.player   = player;
    this.socket   = socket;
    this.answered = new Set();
    this.totalScore = parseInt(document.getElementById('currentScore')?.textContent || 0);

    document.getElementById('gameNameText').textContent = 'Who Knows Best';
    this._renderWaiting();

    // Server pushes question to all players
    socket.on('question_show', ({ question_index, question }) => {
      this._renderQuestion(question_index, question);
    });

    // Server sends back result after submit_answer
    socket.on('answer_received', ({ correct, score, question_index }) => {
      this._showResult(correct, score);
    });
  },

  _renderWaiting() {
    const content = document.getElementById('gameContent');
    if (!content) return;
    content.innerHTML = `
      <div class="waiting-screen">
        <div class="waiting-title">${K4App.escapeHtml(this.gameData.game.title)}</div>
        <div class="waiting-sub">${K4App.escapeHtml(this.gameData.game.subtitle)}</div>
        <div class="waiting-dots"><span></span><span></span><span></span></div>
        <div class="waiting-hint">Host will send questions one at a time</div>
      </div>`;
  },

  _renderQuestion(idx, question) {
    this.currentQ = { idx, text: question.text || question };
    this.answered.has(idx) ? this._renderAnswered() : this._renderActive(idx);
    // Progress
    const total = this.gameData.game.questions.length;
    const pct = Math.round((idx / total) * 100);
    const pb = document.getElementById('progressFill');
    if (pb) pb.style.width = pct + '%';
    const qnum = document.getElementById('qNum');
    if (qnum) qnum.textContent = `${idx} / ${total}`;
  },

  _renderActive(idx) {
    const content = document.getElementById('gameContent');
    if (!content) return;
    const total = this.gameData.game.questions.length;
    content.innerHTML = `
      <div class="q-badge">Question ${idx} of ${total}</div>
      <div class="q-card q-enter">
        <div class="q-card-label">Who knows the celebrant best?</div>
        <div class="q-text">${K4App.escapeHtml(this.currentQ.text)}</div>
      </div>
      <div class="q-timer-wrap">
        <div class="q-timer-bar"><div class="q-timer-fill" id="timerFill"></div></div>
        <div class="q-timer-num" id="timerNum">30</div>
      </div>
      <div class="q-answer-wrap">
        <input class="q-input" id="wkbInput" type="text"
          placeholder="Type your answer here..." maxlength="100" autocomplete="off">
        <button class="q-submit-btn" id="wkbBtn" onclick="WhoKnowsBest.submit()">
          Submit Answer
        </button>
      </div>`;
    const inp = document.getElementById('wkbInput');
    inp?.addEventListener('keypress', e => { if (e.key === 'Enter') this.submit(); });
    setTimeout(() => inp?.focus(), 400);
    this._startTimer(30);
  },

  _renderAnswered() {
    const content = document.getElementById('gameContent');
    if (!content) return;
    content.innerHTML = `
      <div class="result-card result-pending">
        <div class="result-icon">✓</div>
        <div class="result-title">Answer Submitted!</div>
        <div class="result-sub">Waiting for next question...</div>
      </div>`;
  },

  _startTimer(seconds) {
    clearInterval(this.timerInterval);
    let t = seconds;
    const fill = document.getElementById('timerFill');
    const num  = document.getElementById('timerNum');
    const tick = () => {
      if (fill) fill.style.width = (t / seconds * 100) + '%';
      if (num)  num.textContent = t;
      if (t <= 5) {
        if (num)  num.classList.add('timer-urgent');
        if (fill) fill.style.background = '#FF4757';
      }
      if (t <= 0) {
        clearInterval(this.timerInterval);
        this._autoTimeout();
      }
      t--;
    };
    tick();
    this.timerInterval = setInterval(tick, 1000);
  },

  _autoTimeout() {
    const btn = document.getElementById('wkbBtn');
    if (btn && !btn.disabled) {
      // Submit empty — server gives 0 score
      this.submit('');
    }
  },

  submit(forceAnswer) {
    clearInterval(this.timerInterval);
    const inp = document.getElementById('wkbInput');
    const btn = document.getElementById('wkbBtn');
    const answer = forceAnswer !== undefined ? forceAnswer : (inp?.value.trim() || '');

    if (!answer && forceAnswer === undefined) {
      K4App.toast('Type your answer first!', 'warning');
      inp?.focus();
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = 'Submitted...'; }
    this.answered.add(this.currentQ.idx);

    this.socket.emit('submit_answer', {
      player_id:      this.player.player_id,
      event_id:       this.player.event_id,
      game_name:      'who_knows_best',
      question_index: this.currentQ.idx,
      answer,
      is_correct:     false  // server decides via QuizAnswer table
    });
  },

  _showResult(correct, score) {
    clearInterval(this.timerInterval);
    const content = document.getElementById('gameContent');
    if (!content) return;
    if (correct) {
      this.totalScore += score;
      const sc = document.getElementById('currentScore');
      if (sc) sc.textContent = this.totalScore;
      K4Anim.confetti(30);
      content.innerHTML = `
        <div class="result-card result-correct">
          <div class="result-icon">🎉</div>
          <div class="result-score">+${score}</div>
          <div class="result-title">Correct!</div>
          <div class="result-sub">Next question coming...</div>
        </div>`;
    } else {
      content.innerHTML = `
        <div class="result-card result-wrong">
          <div class="result-icon">😅</div>
          <div class="result-title">Not This Time!</div>
          <div class="result-sub">Waiting for next question...</div>
        </div>`;
    }
  },

  destroy() {
    clearInterval(this.timerInterval);
    this.socket.off('question_show');
    this.socket.off('answer_received');
  }
};
