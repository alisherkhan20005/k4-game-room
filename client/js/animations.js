/* ANIMATIONS — Premium */
const K4Anim = {
  confetti(count=80) {
    const colors=['#FF6B9D','#00C896','#FFD93D','#9B7FD4','#6B9EFF','#FF9B7B','#00BCD4'];
    const container = document.getElementById('confettiContainer') || document.body;
    for(let i=0;i<count;i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        const size = 6 + Math.random()*8;
        const isRound = Math.random()>0.5;
        p.style.cssText=`
          position:fixed;
          left:${Math.random()*100}vw;
          top:-20px;
          width:${size}px;height:${size}px;
          background:${colors[Math.floor(Math.random()*colors.length)]};
          border-radius:${isRound?'50%':'3px'};
          pointer-events:none;
          z-index:9998;
          animation:confettiFall ${2.5+Math.random()*2}s linear ${Math.random()*0.5}s forwards;
          transform:rotate(${Math.random()*360}deg);
        `;
        container.appendChild(p);
        setTimeout(()=>p.remove(), 5000);
      }, i*15);
    }
  },

  shake(el) {
    if(!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    el.addEventListener('animationend',()=>el.classList.remove('shake'),{once:true});
  }
};

// Add confetti keyframe dynamically
const style = document.createElement('style');
style.textContent=`
@keyframes confettiFall {
  0%   { opacity:1; transform:translateY(0) rotate(0deg); }
  100% { opacity:0; transform:translateY(110vh) rotate(720deg); }
}`;
document.head.appendChild(style);
