/* WHO KNOWS BEST — Premium UI */
const WhoKnowsBest = {
  gameData: null, player: null, socket: null,
  answered: new Set(), score: 0, currentQ: null,

  init(gameData, player, socket) {
    this.gameData = gameData; this.player = player; this.socket = socket;
    this.answered = new Set(); this.score = 0;
    this.renderWaiting();
    socket.on('question_show', ({ question_index, question }) => this.renderQuestion(question_index, question));
    socket.on('answer_received', ({ correct, score, question_index }) => this.onResult(correct, score, question_index));
  },

  renderWaiting() {
    document.getElementById('gameNameText').textContent = '❓ Who Knows Best';
    document.getElementById('gameContent').innerHTML = `
      <div class="waiting-screen fade-in">
        <div class="waiting-icon">🤔</div>
        <h2 class="waiting-title">${K4App.escapeHtml(this.gameData.game.title)}</h2>
        <p class="waiting-sub" style="max-width:340px;margin:0 auto">${K4App.escapeHtml(this.gameData.game.subtitle)}</p>
        <div class="waiting-dots" style="margin-top:2rem">
          <div class="waiting-dot"></div><div class="waiting-dot"></div><div class="waiting-dot"></div>
        </div>
        <p style="color:rgba(255,255,255,0.3);font-size:0.82rem;margin-top:1rem">Host will send questions one at a time</p>
      </div>`;
  },

  renderQuestion(idx, question) {
    this.currentQ = { idx, text: question.text || question };
    const total = this.gameData.game.questions.length;
    const pct = Math.round((idx / total) * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    const already = this.answered.has(idx);

    document.getElementById('gameContent').innerHTML = `
      <div class="q-counter">Question ${idx} of ${total}</div>
      <div class="wkb-card q-enter" id="wkbCard">
        <p style="font-size:0.78rem;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:1.25rem">Who knows the celebrant best? 🌸</p>
        <p class="wkb-question">${K4App.escapeHtml(this.currentQ.text)}</p>
      </div>
      <div class="wkb-answer-wrap" id="answerWrap">
        ${already ? `
          <div class="result-correct">
            <div style="font-size:1.8rem;margin-bottom:0.5rem">✅</div>
            <div style="font-weight:700;font-size:1rem">Answer submitted!</div>
            <div style="font-size:0.82rem;opacity:0.6;margin-top:0.25rem">Waiting for next question...</div>
          </div>` : `
          <input class="wkb-input" id="wkbInput" type="text"
            placeholder="Type your answer here..." maxlength="100" autocomplete="off">
          <button class="btn btn-primary btn-full btn-lg" id="wkbBtn" onclick="WhoKnowsBest.submit()">
            Submit Answer ✓
          </button>`}
      </div>`;

    if (!already) {
      const inp = document.getElementById('wkbInput');
      inp?.addEventListener('keypress', e => { if(e.key==='Enter') this.submit(); });
      setTimeout(() => inp?.focus(), 500);
    }
  },

  submit() {
    const inp = document.getElementById('wkbInput');
    const btn = document.getElementById('wkbBtn');
    const answer = inp?.value.trim();
    if (!answer) { K4App.toast('Type your answer first!', 'warning'); inp?.classList.add('shake'); return; }
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }
    this.answered.add(this.currentQ.idx);
    this.socket.emit('submit_answer', {
      player_id: this.player.player_id, event_id: this.player.event_id,
      game_name: 'who_knows_best', question_index: this.currentQ.idx, answer, is_correct: false
    });
  },

  onResult(correct, score) {
    const wrap = document.getElementById('answerWrap');
    if (!wrap) return;
    if (correct) {
      this.score += score;
      document.getElementById('currentScore').textContent = this.score;
      wrap.innerHTML = `
        <div class="result-correct">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">🎉</div>
          <div class="result-score">+${score}</div>
          <div style="font-size:0.9rem;opacity:0.7;margin-top:0.4rem">Correct answer!</div>
        </div>`;
      K4Anim.confetti(30);
    } else {
      wrap.innerHTML = `
        <div class="result-wrong">
          <div style="font-size:2rem;margin-bottom:0.5rem">😅</div>
          <div style="font-weight:700">Not this time!</div>
          <div style="font-size:0.82rem;opacity:0.5;margin-top:0.25rem">Waiting for next question...</div>
        </div>`;
    }
  },

  destroy() { this.socket.off('question_show'); this.socket.off('answer_received'); }
};
