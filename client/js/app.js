/* K4 Game Room — Shared utility functions */

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function spawnConfetti() {
  const colors = ['#FFB5C8','#C4A8D4','#A8CEDE','#5DC8A0','#F5D06E','#FFAD99','#6ECFCF'];
  for (let i = 0; i < 80; i++) {
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
        animation-delay: ${Math.random() * 0.6}s;
        z-index: 9998;
        position: fixed;
        pointer-events: none;
        animation-name: confettiFall;
        animation-timing-function: linear;
        animation-fill-mode: forwards;
      `;
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 5000);
    }, i * 20);
  }
}

function spawnScorePop(score, x, y) {
  const el = document.createElement('div');
  el.className = 'score-pop';
  el.textContent = `+${score}`;
  el.style.cssText = `left:${x || 45}%;top:${y || 50}%;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

// Admin auth helper
function getAdminToken() {
  return localStorage.getItem('k4_admin_token');
}

function logout() {
  localStorage.removeItem('k4_admin_token');
  window.location.href = '/admin/login.html';
}
