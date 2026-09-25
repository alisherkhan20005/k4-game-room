/* EMOJI-NARY — Premium UI */
const Emojinary = {
  gameData:null, player:null, socket:null,
  score:0, answered:new Set(),

  init(gameData, player, socket) {
    this.gameData=gameData; this.player=player; this.socket=socket;
    this.score=0; this.answered=new Set();
    document.getElementById('gameNameText').textContent = '😂 Emoji-nary';
    this.render(0);
    socket.on('next_question', ({question_index}) => this.render(question_index));
  },

  render(idx) {
    const items = this.gameData.game.items;
    const item = items[idx]; if(!item) return;
    const total = items.length;
    const pct = Math.round((idx/total)*100);
    document.getElementById('progressFill').style.width = pct+'%';
    const already = this.answered.has(idx);

    document.getElementById('gameContent').innerHTML = `
      <div class="q-counter" style="background:rgba(155,127,212,0.12);border-color:rgba(155,127,212,0.2);color:rgba(196,168,212,0.9)">
        Emoji ${idx+1} of ${total}
      </div>
      <div class="emoji-card q-enter" id="emojiCard">
        <p style="font-size:0.72rem;text-transform:uppercase;letter-spacing:0.12em;color:rgba(155,127,212,0.7);font-weight:700;margin-bottom:0.5rem">Decode the emojis! 🔍</p>
        <div class="emoji-display" id="emojiDisplay">${item.emojis}</div>
        <p class="emoji-hint">What phrase or word do these emojis represent?</p>
      </div>
      <div id="emojiAnswerWrap">
        ${already ? `
          <div class="result-correct" style="width:100%">
            <div style="font-size:1.8rem;margin-bottom:0.4rem">✅</div>
            <div style="font-weight:700">Submitted! Moving on...</div>
          </div>` : `
          <div class="wkb-answer-wrap">
            <input class="wkb-input" id="emojiInput" type="text"
              placeholder="Type the phrase or word..." maxlength="100" autocomplete="off">
            <button class="btn btn-purple btn-full btn-lg" id="emojiBtn" onclick="Emojinary.submit(${idx})">
              Submit Answer 🎯
            </button>
          </div>`}
      </div>`;

    const inp = document.getElementById('emojiInput');
    inp?.addEventListener('keypress', e => { if(e.key==='Enter') this.submit(idx); });
    setTimeout(() => inp?.focus(), 500);
  },

  submit(idx) {
    const inp = document.getElementById('emojiInput');
    const btn = document.getElementById('emojiBtn');
    const answer = inp?.value.trim();
    if(!answer) { K4App.toast('Type your answer!','warning'); return; }
    if(btn) btn.disabled = true;

    const item = this.gameData.game.items[idx];
    const correct = K4App.answersMatch(answer, item.answer);
    const score = correct ? 150 : 0;
    this.answered.add(idx);
    if(correct) { this.score += score; document.getElementById('currentScore').textContent = this.score; }

    const wrap = document.getElementById('emojiAnswerWrap');
    if(correct) {
      wrap.innerHTML = `
        <div class="result-correct" style="width:100%">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">🎉</div>
          <div class="result-score" style="color:var(--mint)">+${score}</div>
          <div style="font-size:0.9rem;opacity:0.7;margin-top:0.4rem">Answer: <strong>${K4App.escapeHtml(item.answer)}</strong></div>
        </div>`;
      K4Anim.confetti(25);
    } else {
      wrap.innerHTML = `
        <div class="result-wrong" style="width:100%">
          <div style="font-size:2rem;margin-bottom:0.4rem">😅</div>
          <div style="font-weight:700">Not quite!</div>
          <div style="font-size:0.85rem;opacity:0.6;margin-top:0.25rem">Answer: <strong>${K4App.escapeHtml(item.answer)}</strong></div>
        </div>`;
    }

    this.socket.emit('submit_answer', {
      player_id:this.player.player_id, event_id:this.player.event_id,
      game_name:'emojinary', question_index:idx, answer, is_correct:correct
    });

    const next = idx + 1;
    setTimeout(() => {
      if(next < this.gameData.game.items.length) this.render(next);
      else wrap.innerHTML += `<div style="text-align:center;color:rgba(255,255,255,0.3);font-size:0.85rem;margin-top:1rem">🌸 All done! Waiting for host...</div>`;
    }, 2500);
  },

  destroy() { this.socket.off('next_question'); }
};
