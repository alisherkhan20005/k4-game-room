/* ============================================
   K4 GAME ROOM - ANIMATIONS
   ============================================ */

const K4Anim = {

  // Score pop effect
  scorePop(score, x, y) {
    const el = document.createElement('div');
    el.className = 'score-pop';
    el.textContent = `+${score}`;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  // Confetti celebration
  confetti(count = 80) {
    const colors = ['#FFB5C8','#B5EAD7','#FFDAC1','#C7CEEA','#FFF1BA','#B5D5E8','#E2BED6','#ACDED8'];
    const container = document.getElementById('confettiContainer') || document.body;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.cssText = `
          left: ${Math.random() * 100}vw;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          width: ${6 + Math.random() * 8}px;
          height: ${6 + Math.random() * 8}px;
          border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
          animation-duration: ${2 + Math.random() * 2}s;
          animation-delay: ${Math.random() * 0.5}s;
        `;
        container.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
      }, i * 20);
    }
  },

  // Shake element (wrong answer)
  shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
  },

  // Bounce element
  bounce(el) {
    el.classList.remove('bounce');
    void el.offsetWidth;
    el.classList.add('bounce');
    el.addEventListener('animationend', () => el.classList.remove('bounce'), { once: true });
  },

  // Correct answer glow
  correctGlow(el) {
    el.classList.add('correct-glow');
    el.addEventListener('animationend', () => el.classList.remove('correct-glow'), { once: true });
  },

  // Wrong answer flash
  wrongFlash(el) {
    el.classList.add('wrong-flash');
    el.addEventListener('animationend', () => el.classList.remove('wrong-flash'), { once: true });
  },

  // Staggered fade-in for list items
  staggerFadeIn(els, delay = 80) {
    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      setTimeout(() => {
        el.style.transition = 'all 0.4s cubic-bezier(0.4,0,0.2,1)';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, i * delay);
    });
  },

  // Question enter animation
  questionEnter(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateX(60px)';
    requestAnimationFrame(() => {
      el.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });
  },

  // Letter drop for word scramble
  animateLetters(container) {
    const letters = container.querySelectorAll('.scramble-letter');
    letters.forEach((l, i) => {
      l.style.opacity = '0';
      l.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        l.style.transition = 'all 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)';
        l.style.opacity = '1';
        l.style.transform = 'translateY(0)';
      }, i * 60);
    });
  },

  // Price reveal
  priceReveal(el) {
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'priceReveal 0.6s cubic-bezier(0.4,0,0.2,1) forwards';
  },

  // Crown winner
  crownWinner(el) {
    el.style.animation = 'crownSpin 1s cubic-bezier(0.68,-0.55,0.265,1.55) forwards';
  }
};
