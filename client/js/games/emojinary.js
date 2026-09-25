/* ============================================
   EMOJI-NARY - GAME LOGIC
   ============================================ */

const Emojinary = {
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
    const progress = Math.round((index / total) * 100);
    const alreadyAnswered = this.answered.has(index);

    const content = document.getElementById('gameContent');
    content.innerHTML = `
      <div class="game-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${index + 1}/${total}</span>
      </div>
      <div class="emojinary-card question-enter" id="emojiCard">
        <div class="emojinary-label">Emoji ${index + 1} of ${total}</div>
        <div class="emojinary-emojis" id="emojiDisplay">${item.emojis}</div>
        <p style="color:var(--gray);font-size:0.85rem;margin-top:0.5rem">What phrase or word do these emojis represent?</p>
      </div>
      <div id="answerArea">
        ${alreadyAnswered ? `
          <div style="text-align:center;padding:1.5rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md);color:var(--mint-green);font-weight:600">
            ✅ Answer submitted — moving on shortly!
          </div>
        ` : `
          <div class="quiz-answer-area">
            <input type="text" class="form-input" id="emojiAnswer"
              placeholder="Type the phrase..."
              autocomplete="off" maxlength="100"
              style="text-align:center;font-size:1.05rem"
            >
            <button class="btn btn-primary btn-full" id="emojiSubmitBtn" onclick="Emojinary.submitAnswer(${index})">
              Submit 🎯
            </button>
          </div>
        `}
      </div>
    `;

    K4Anim.questionEnter(document.getElementById('emojiCard'));
    const input = document.getElementById('emojiAnswer');
    input?.addEventListener('keypress', e => { if (e.key === 'Enter') this.submitAnswer(index); });
    setTimeout(() => input?.focus(), 400);
  },

  submitAnswer(index) {
    const input = document.getElementById('emojiAnswer');
    const btn = document.getElementById('emojiSubmitBtn');
    const answer = input?.value.trim();

    if (!answer) { K4App.toast('Please type your answer!', 'warning'); K4Anim.shake(input); return; }
    if (btn) btn.disabled = true;

    const item = this.gameData.game.items[index];
    const correct = K4App.answersMatch(answer, item.answer);
    const score = correct ? 150 : 0;

    this.answered.add(index);
    if (correct) { this.score += score; document.getElementById('currentScore').textContent = this.score; }

    const area = document.getElementById('answerArea');
    if (correct) {
      area.innerHTML = `
        <div style="text-align:center;padding:1.5rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md)">
          <div style="font-size:2rem;margin-bottom:0.5rem">🎉</div>
          <div style="color:var(--mint-green);font-weight:700;font-size:1.1rem">Correct! +${score} points</div>
          <div style="color:var(--gray);font-size:0.9rem;margin-top:0.25rem">${K4App.escapeHtml(item.answer)}</div>
        </div>`;
      K4Anim.confetti(25);
    } else {
      area.innerHTML = `
        <div style="text-align:center;padding:1.5rem;background:rgba(255,107,107,0.08);border-radius:var(--radius-md)">
          <div style="font-size:1.5rem;margin-bottom:0.25rem">❌</div>
          <div style="color:#FF6B6B;font-weight:600">Not quite!</div>
          <div style="color:var(--gray);font-size:0.9rem;margin-top:0.25rem">Answer: <strong>${K4App.escapeHtml(item.answer)}</strong></div>
        </div>`;
    }

    // Tell server (with correct flag so server scores accurately)
    this.socket.emit('submit_answer', {
      player_id: this.player.player_id,
      event_id: this.player.event_id,
      game_name: 'emojinary',
      question_index: index,
      answer,
      is_correct: correct
    });

    // Auto-advance
    const nextIndex = index + 1;
    setTimeout(() => {
      if (nextIndex < this.gameData.game.items.length) {
        this.renderItem(nextIndex);
      } else {
        area.innerHTML += `
          <div style="text-align:center;margin-top:1rem;padding:1rem;background:rgba(196,168,212,0.1);border-radius:var(--radius-md)">
            <div style="font-size:1.5rem">🌸</div>
            <p style="color:var(--gray);font-size:0.9rem">All done! Waiting for host...</p>
          </div>`;
      }
    }, 2500);
  },

  bindSocketEvents() {
    this.socket.on('next_question', ({ question_index }) => this.renderItem(question_index));
  },

  destroy() { this.socket.off('next_question'); }
};
