/* ============================================
   WHO KNOWS BEST - GAME LOGIC
   ============================================ */

const WhoKnowsBest = {
  gameData: null,
  currentQuestion: null,
  answered: new Set(),
  score: 0,

  init(gameData, player, socket) {
    this.gameData = gameData;
    this.player = player;
    this.socket = socket;
    this.answered = new Set();
    this.renderWaiting();
    this.bindSocketEvents();
  },

  renderWaiting() {
    const content = document.getElementById('gameContent');
    content.innerHTML = `
      <div class="quiz-waiting fade-in">
        <div class="quiz-waiting-icon">❓</div>
        <h2 style="font-family:var(--font-heading);margin-bottom:0.5rem">
          ${K4App.escapeHtml(this.gameData.game.title)}
        </h2>
        <p style="color:var(--gray)">${K4App.escapeHtml(this.gameData.game.subtitle)}</p>
        <div style="margin-top:2rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;color:var(--gray)">
          <div class="dot-bounce" style="width:8px;height:8px;border-radius:50%;background:var(--baby-pink);animation:dotBounce 1.2s ease infinite"></div>
          <div class="dot-bounce" style="width:8px;height:8px;border-radius:50%;background:var(--baby-pink);animation:dotBounce 1.2s ease infinite 0.2s"></div>
          <div class="dot-bounce" style="width:8px;height:8px;border-radius:50%;background:var(--baby-pink);animation:dotBounce 1.2s ease infinite 0.4s"></div>
          <span>Waiting for first question...</span>
        </div>
      </div>
    `;
  },

  renderQuestion(questionIndex, question) {
    this.currentQuestion = { index: questionIndex, text: question.text || question };
    const total = this.gameData.game.questions.length;
    const progress = ((questionIndex) / total) * 100;
    const alreadyAnswered = this.answered.has(questionIndex);

    const content = document.getElementById('gameContent');
    content.innerHTML = `
      <div class="game-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${questionIndex}/${total}</span>
      </div>
      <div class="quiz-question-card question-enter" id="questionCard">
        <div class="quiz-question-number">Question ${questionIndex}</div>
        <p class="quiz-question-text">${K4App.escapeHtml(this.currentQuestion.text)}</p>
      </div>
      <div class="quiz-answer-area">
        ${alreadyAnswered ? `
          <div style="text-align:center;padding:1.5rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md);color:var(--mint-green);font-weight:600">
            ✅ Answer submitted! Waiting for next question...
          </div>
        ` : `
          <input
            type="text"
            class="quiz-answer-input form-input"
            id="answerInput"
            placeholder="Type your answer..."
            autocomplete="off"
            maxlength="100"
          >
          <button class="btn btn-primary btn-full" id="submitAnswerBtn" onclick="WhoKnowsBest.submitAnswer()">
            Submit Answer ✓
          </button>
        `}
      </div>
    `;

    // Animate in
    K4Anim.questionEnter(document.getElementById('questionCard'));

    // Enter key support
    if (!alreadyAnswered) {
      const input = document.getElementById('answerInput');
      input?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.submitAnswer();
      });
      setTimeout(() => input?.focus(), 400);
    }
  },

  async submitAnswer() {
    const input = document.getElementById('answerInput');
    const btn = document.getElementById('submitAnswerBtn');
    if (!input || !btn) return;

    const answer = input.value.trim();
    if (!answer) {
      K4App.toast('Please type your answer first!', 'warning');
      K4Anim.shake(input);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    this.answered.add(this.currentQuestion.index);

    this.socket.emit('submit_answer', {
      player_id: this.player.player_id,
      event_id: this.player.event_id,
      game_name: 'who_knows_best',
      question_index: this.currentQuestion.index,
      answer
    });
  },

  onAnswerResult(correct, score) {
    const area = document.querySelector('.quiz-answer-area');
    if (!area) return;

    if (correct) {
      this.score += score;
      area.innerHTML = `
        <div style="text-align:center;padding:1.5rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md);color:var(--mint-green);font-weight:700;font-size:1.1rem">
          ✅ Correct! +${score} points
        </div>
      `;
      K4Anim.confetti(30);
    } else {
      area.innerHTML = `
        <div style="text-align:center;padding:1.5rem;background:rgba(255,107,107,0.1);border-radius:var(--radius-md);color:#FF6B6B;font-weight:600">
          ❌ Not quite! Waiting for next question...
        </div>
      `;
    }

    document.getElementById('currentScore').textContent = this.score;
  },

  bindSocketEvents() {
    this.socket.on('question_show', ({ question_index, question }) => {
      this.renderQuestion(question_index, question);
    });

    this.socket.on('answer_received', ({ correct, score }) => {
      this.onAnswerResult(correct, score);
    });
  },

  destroy() {
    this.socket.off('question_show');
    this.socket.off('answer_received');
  }
};
