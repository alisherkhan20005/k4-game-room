/* K4 GAME ROOM — CORE APP */
const K4App = {

  // ── API ──
  async api(path, opts={}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getAdminToken();
    if(token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api'+path, {
      method: opts.method||'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json();
    if(!data.success) throw new Error(data.message || 'Request failed');
    return data;
  },

  // ── Toast ──
  toast(message, type='info') {
    let container = document.getElementById('toastContainer');
    if(!container) {
      container = document.createElement('div');
      container.id='toastContainer';
      container.className='toast-container';
      document.body.appendChild(container);
    }
    const icons = { success:'✅', error:'❌', info:'ℹ️', warning:'⚠️' };
    const colors = { success:'var(--success)', error:'var(--error)', info:'var(--blue)', warning:'var(--warning)' };
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.style.cssText = `display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1.25rem;
      border-radius:var(--r-md);background:var(--white);box-shadow:var(--shadow-lg);
      pointer-events:all;animation:toastSlide 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
      border-left:4px solid ${colors[type]||colors.info};font-size:0.9rem;font-weight:500;
      color:var(--gray-700);max-width:360px;`;
    t.innerHTML=`<span style="font-size:1.1rem">${icons[type]||'ℹ️'}</span><span>${K4App.escapeHtml(message)}</span>`;
    container.appendChild(t);
    setTimeout(()=>{ t.style.animation='toastFade 0.3s ease forwards'; setTimeout(()=>t.remove(),350); }, 3500);
  },

  // ── Auth ──
  getAdminToken() { return sessionStorage.getItem('k4_admin_token'); },
  setAdminToken(t){ sessionStorage.setItem('k4_admin_token', t); },
  clearAdmin()    { sessionStorage.removeItem('k4_admin_token'); sessionStorage.removeItem('k4_player'); },

  async requireAdmin() {
    const t = this.getAdminToken();
    if(!t) { window.location.href='/admin/login.html'; return false; }
    try {
      await this.api('/admin/verify');
      return true;
    } catch {
      this.clearAdmin();
      window.location.href='/admin/login.html';
      return false;
    }
  },

  // ── Utils ──
  escapeHtml(str) {
    if(!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },

  answersMatch(userAns, correct) {
    const clean = s => s.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim();
    const u = clean(userAns);
    const c = clean(correct);
    if(u===c) return true;
    // Allow partial match for long answers
    if(c.split(' ').length > 1 && (u.includes(c)||c.includes(u))) return true;
    return false;
  },

  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
};

// CSS for toast fade
const s=document.createElement('style');
s.textContent=`@keyframes toastFade{to{opacity:0;transform:translateX(20px) scale(0.95)}}`;
document.head.appendChild(s);

// Avatar colour generator (deterministic)
function playerColor(name) {
  const colors=['#FF6B9D','#9B7FD4','#00C896','#6B9EFF','#FFD93D','#FF9B7B','#00BCD4','#FF4757'];
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%colors.length;
  return colors[Math.abs(h)%colors.length];
}
