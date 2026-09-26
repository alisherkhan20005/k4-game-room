/* K4 ANIMATIONS */
const K4Anim = {
  confetti(count = 60) {
    const wrap = document.getElementById('confettiContainer');
    if (!wrap) return;
    const colors = ['#FF6B9D','#00C896','#FFD93D','#9B7FD4','#6B9EFF','#FF9B7B','#00BCD4'];
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        const size = 5 + Math.random() * 9;
        const isRound = Math.random() > 0.5;
        p.style.cssText = `position:absolute;left:${Math.random()*100}%;top:-10px;
          width:${size}px;height:${size}px;
          background:${colors[Math.floor(Math.random()*colors.length)]};
          border-radius:${isRound?'50%':'3px'};pointer-events:none;
          animation:k4Confetti ${2+Math.random()*2}s ease ${Math.random()*0.5}s forwards`;
        wrap.appendChild(p);
        setTimeout(() => p.remove(), 5000);
      }, i * 18);
    }
  },

  scoreFloat(points, x, y) {
    const el = document.createElement('div');
    el.textContent = `+${points}`;
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;
      font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;
      color:#00C896;pointer-events:none;z-index:9999;
      text-shadow:0 2px 8px rgba(0,200,150,0.4);
      animation:k4ScoreFloat 1.5s ease forwards`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1600);
  }
};

// Confetti + score float keyframes
const _a = document.createElement('style');
_a.textContent = `
@keyframes k4Confetti{0%{opacity:1;transform:translateY(0) rotate(0deg)}100%{opacity:0;transform:translateY(120px) rotate(420deg)}}
@keyframes k4ScoreFloat{0%{opacity:0;transform:translateY(0) scale(0.5)}20%{opacity:1;transform:translateY(-20px) scale(1.3)}80%{opacity:1;transform:translateY(-65px) scale(1)}100%{opacity:0;transform:translateY(-90px) scale(0.8)}}
`;
document.head.appendChild(_a);
