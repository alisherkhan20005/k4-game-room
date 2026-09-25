/* WORD SCRAMBLE — Premium UI */
const WordScramble = {
  gameData:null, player:null, socket:null,
  score:0, answered:new Set(),

  init(gameData, player, socket) {
    this.gameData=gameData; this.player=player; this.socket=socket;
    this.score=0; this.answered=new Set();
    document.getElementById('gameNameText').textContent = '🔤 Word Scramble';
    this.render(0);
    socket.on('next_question', ({question_index}) => this.render(question_index));
  },

  render(idx) {
    const words = this.gameData.game.words;
    const word = words[idx]; if(!word) return;
    const total = words.length;
    const pct = Math.round((idx/total)*100);
    document.getElementById('progressFill').style.width = pct+'%';
    const already = this.answered.has(idx);

    const tiles = word.scrambled.split('').map((l,i) => {
      if(l===' ') return `<div style="width:10px"></div>`;
      return `<div class="scramble-tile" style="opacity:0;transform:translateY(-25px);transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);transition-delay:${i*55}ms">${l}</div>`;
    }).join('');

    document.getElementById('gameContent').innerHTML = `
      <div class="q-counter" style="background:rgba(0,200,150,0.1);border-color:rgba(0,200,150,0.2);color:rgba(0,200,150,0.8)">
        Word ${idx+1} of ${total}
      </div>
      <div class="scramble-card q-enter" id="scrambleCard">
        <div class="scramble-label">🔀 Unscramble this word!</div>
        <div class="scramble-tiles" id="scrambleTiles">${tiles}</div>
        <div class="scramble-raw">${word.scrambled}</div>
      </div>
      <div class="scramble-input-wrap" id="scrambleWrap">
        ${already ? `
          <div class="result-correct">
            <div style="font-size:1.8rem;margin-bottom:0.4rem">✅</div>
            <div style="font-weight:700">Submitted!</div>
          </div>` : `
          <input class="scramble-input" id="scrambleInput"
            type="text" placeholder="TYPE YOUR ANSWER..."
            maxlength="50" autocomplete="off" autocorrect="off">
          <div style="display:flex;gap:0.75rem;width:100%">
            <button class="btn btn-outline btn-ghost" style="flex:1;color:rgba(255,255,255,0.5)" onclick="WordScramble.skip(${idx})">
              Skip →
            </button>
            <button class="btn btn-success" style="flex:2" id="scrambleBtn" onclick="WordScramble.submit(${idx})">
              Submit ✓
            </button>
          </div>`}
      </div>`;

    // Animate tiles in
    setTimeout(() => {
      document.querySelectorAll('.scramble-tile').forEach(t => {
        t.style.opacity='1'; t.style.transform='translateY(0)';
      });
    }, 100);

    const inp = document.getElementById('scrambleInput');
    if(inp) {
      inp.addEventListener('input', e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g,''); });
      inp.addEventListener('keypress', e => { if(e.key==='Enter') this.submit(idx); });
      setTimeout(() => inp.focus(), 500);
    }
  },

  submit(idx) {
    const inp = document.getElementById('scrambleInput');
    const btn = document.getElementById('scrambleBtn');
    const answer = inp?.value.trim().toUpperCase();
    if(!answer) { K4App.toast('Type your answer!','warning'); return; }
    if(btn) btn.disabled = true;

    const word = this.gameData.game.words[idx];
    const correct = answer === word.answer.toUpperCase() || K4App.answersMatch(answer, word.answer);
    const score = correct ? 100 : 0;
    this.answered.add(idx);
    if(correct) { this.score+=score; document.getElementById('currentScore').textContent=this.score; }

    const wrap = document.getElementById('scrambleWrap');
    if(correct) {
      wrap.innerHTML = `
        <div class="result-correct" style="width:100%">
          <div style="font-size:2.5rem;margin-bottom:0.5rem">🎉</div>
          <div class="result-score" style="color:var(--mint)">+${score}</div>
          <div style="font-size:1.1rem;font-weight:700;margin-top:0.4rem">${K4App.escapeHtml(word.answer)}</div>
        </div>`;
      K4Anim.confetti(20);
    } else {
      wrap.innerHTML = `
        <div class="result-wrong" style="width:100%">
          <div style="font-size:2rem;margin-bottom:0.4rem">😅</div>
          <div style="font-weight:700">Not quite!</div>
          <div style="font-size:0.9rem;opacity:0.6;margin-top:0.25rem">Answer: <strong>${K4App.escapeHtml(word.answer)}</strong></div>
        </div>`;
    }

    this.socket.emit('submit_answer', {
      player_id:this.player.player_id, event_id:this.player.event_id,
      game_name:'word_scramble', question_index:idx, answer, is_correct:correct
    });

    setTimeout(() => {
      const next = idx+1;
      if(next < this.gameData.game.words.length) this.render(next);
      else wrap.innerHTML += `<div style="text-align:center;color:rgba(255,255,255,0.3);font-size:0.85rem;margin-top:1rem">🌸 All done! Waiting for host...</div>`;
    }, 2500);
  },

  skip(idx) {
    this.answered.add(idx);
    const next = idx+1;
    if(next < this.gameData.game.words.length) this.render(next);
  },

  destroy() { this.socket.off('next_question'); }
};
