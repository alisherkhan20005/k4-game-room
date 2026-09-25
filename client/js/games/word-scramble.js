/* ============================================
   WORD SCRAMBLE - GAME LOGIC
   ============================================ */

const WordScramble = {
  gameData: null,
  score: 0,
  answered: new Set(),

  init(gameData, player, socket) {
    this.gameData = gameData;
    this.player = player;
    this.socket = socket;
    this.score = 0;
    this.answered = new Set();
    this.renderWord(0);
    this.bindSocketEvents();
  },

  renderWord(index) {
    const words = this.gameData.game.words;
    const word = words[index];
    if (!word) return;

    const total = words.length;
    const progress = Math.round((index / total) * 100);
    const alreadyAnswered = this.answered.has(index);

    const letters = word.scrambled.split('').map((l, i) => {
      if (l === ' ') return `<div style="width:8px"></div>`;
      return `<div class="scramble-letter" style="opacity:0;transform:translateY(-20px);transition:all 0.35s cubic-bezier(0.68,-0.55,0.265,1.55);transition-delay:${i*60}ms">${l}</div>`;
    }).join('');

    const content = document.getElementById('gameContent');
    content.innerHTML = `
      <div class="game-progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <span class="progress-text">${index + 1}/${total}</span>
      </div>
      <div class="scramble-card question-enter" id="scrambleCard">
        <div class="scramble-label">Unscramble this word!</div>
        <div class="scramble-word" id="scrambleLetters">${letters}</div>
        <p style="color:var(--gray);font-size:0.8rem;letter-spacing:0.1em">${word.scrambled}</p>
      </div>
      <div id="scrambleAnswerArea">
        ${alreadyAnswered ? `
          <div style="text-align:center;padding:1.5rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md);color:var(--mint-green);font-weight:600">
            ✅ Answer submitted!
          </div>
        ` : `
          <div class="quiz-answer-area">
            <input type="text" class="form-input" id="scrambleInput"
              placeholder="Type the unscrambled word..."
              autocomplete="off" maxlength="50"
              style="text-align:center;letter-spacing:0.1em;font-size:1.1rem;font-weight:600;text-transform:uppercase"
            >
            <div style="display:flex;gap:0.75rem">
              <button class="btn btn-outline" style="flex:1" onclick="WordScramble.skipWord(${index})">Skip</button>
              <button class="btn btn-primary" style="flex:2" id="scrambleSubmitBtn" onclick="WordScramble.submitWord(${index})">Submit ✓</button>
            </div>
          </div>
        `}
      </div>
    `;

    K4Anim.questionEnter(document.getElementById('scrambleCard'));

    // Animate letters in
    requestAnimationFrame(() => {
      document.querySelectorAll('.scramble-letter').forEach(l => {
        l.style.opacity = '1';
        l.style.transform = 'translateY(0)';
      });
    });

    const input = document.getElementById('scrambleInput');
    if (input) {
      input.addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, ''); });
      input.addEventListener('keypress', e => { if (e.key === 'Enter') this.submitWord(index); });
      setTimeout(() => input.focus(), 400);
    }
  },

  submitWord(index) {
    const input = document.getElementById('scrambleInput');
    const btn = document.getElementById('scrambleSubmitBtn');
    const answer = input?.value.trim().toUpperCase();

    if (!answer) { K4App.toast('Please type an answer!', 'warning'); K4Anim.shake(input); return; }
    if (btn) btn.disabled = true;

    const word = this.gameData.game.words[index];
    const correct = answer === word.answer.toUpperCase() || K4App.answersMatch(answer, word.answer);
    const score = correct ? 100 : 0;

    this.answered.add(index);
    if (correct) { this.score += score; document.getElementById('currentScore').textContent = this.score; }

    const area = document.getElementById('scrambleAnswerArea');
    if (correct) {
      area.innerHTML = `
        <div style="text-align:center;padding:1.5rem;background:rgba(93,200,160,0.1);border-radius:var(--radius-md)">
          <div style="font-size:2rem;margin-bottom:0.25rem">✅</div>
          <div style="color:var(--mint-green);font-weight:700;font-size:1.1rem">${K4App.escapeHtml(word.answer)}! +${score} points</div>
        </div>`;
      K4Anim.confetti(20);
    } else {
      area.innerHTML = `
        <div style="text-align:center;padding:1.5rem;background:rgba(255,107,107,0.08);border-radius:var(--radius-md)">
          <div style="font-size:1.5rem;margin-bottom:0.25rem">❌</div>
          <div style="color:#FF6B6B;font-weight:600">Not quite!</div>
          <div style="color:var(--gray);font-size:0.9rem;margin-top:0.25rem">Answer: <strong>${K4App.escapeHtml(word.answer)}</strong></div>
        </div>`;
    }

    this.socket.emit('submit_answer', {
      player_id: this.player.player_id,
      event_id: this.player.event_id,
      game_name: 'word_scramble',
      question_index: index,
      answer,
      is_correct: correct
    });

    setTimeout(() => {
      const next = index + 1;
      if (next < this.gameData.game.words.length) {
        this.renderWord(next);
      } else {
        area.innerHTML += `
          <div style="text-align:center;margin-top:1rem;padding:1rem;background:rgba(196,168,212,0.1);border-radius:var(--radius-md)">
            <div style="font-size:1.5rem">🌸</div>
            <p style="color:var(--gray);font-size:0.9rem">All done! Waiting for host...</p>
          </div>`;
      }
    }, 2500);
  },

  skipWord(index) {
    this.answered.add(index);
    const next = index + 1;
    if (next < this.gameData.game.words.length) this.renderWord(next);
  },

  bindSocketEvents() {
    this.socket.on('next_question', ({ question_index }) => this.renderWord(question_index));
  },

  destroy() { this.socket.off('next_question'); }
};
