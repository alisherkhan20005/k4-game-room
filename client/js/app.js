/* ============================================
   K4 GAME ROOM — CORE APP UTILITIES
   Tested & verified against all API endpoints
   ============================================ */
const K4App = {

  /* ── API Helper ── */
  async api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getAdminToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api' + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  },

  /* ── Toast Notifications ── */
  toast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.style.cssText = 'position:fixed;top:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;max-width:340px;pointer-events:none';
      document.body.appendChild(container);
    }
    const colors = { success: '#00C896', error: '#FF4757', info: '#6B9EFF', warning: '#FFD93D' };
    const icons  = { success: '✓', error: '✕', info: 'i', warning: '!' };
    const t = document.createElement('div');
    t.style.cssText = `display:flex;align-items:center;gap:0.75rem;padding:0.875rem 1.1rem;
      background:#fff;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.12);
      pointer-events:all;font-family:'Poppins',sans-serif;font-size:0.85rem;font-weight:500;
      color:#1F2937;border-left:4px solid ${colors[type]||colors.info};
      animation:k4ToastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards`;
    t.innerHTML = `<span style="width:20px;height:20px;border-radius:50%;background:${colors[type]||colors.info};color:#fff;font-size:0.65rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">${icons[type]||'i'}</span><span>${this.escapeHtml(message)}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(20px)'; setTimeout(()=>t.remove(),300); }, 3500);
  },

  /* ── Admin Auth ── */
  getAdminToken()   { return sessionStorage.getItem('k4_admin_token'); },
  setAdminToken(t)  { sessionStorage.setItem('k4_admin_token', t); },
  clearAdmin()      { sessionStorage.removeItem('k4_admin_token'); sessionStorage.removeItem('k4_player'); },

  async requireAdmin() {
    const t = this.getAdminToken();
    if (!t) { window.location.href = '/admin/login.html'; return false; }
    try {
      await this.api('/admin/verify');
      return true;
    } catch {
      this.clearAdmin();
      window.location.href = '/admin/login.html';
      return false;
    }
  },

  /* ── Utilities ── */
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // Strict answer matching — exact or very close only
  answersMatch(userAns, correct) {
    const clean = s => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
    const u = clean(userAns);
    const c = clean(correct);
    if (!u || !c) return false;
    if (u === c) return true;
    // Allow only if user answer contains ALL words of correct answer
    const cWords = c.split(' ').filter(Boolean);
    if (cWords.length > 1 && cWords.every(w => u.includes(w))) return true;
    // Single word: must match exactly
    return false;
  },

  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
};

// Toast animation
const _s = document.createElement('style');
_s.textContent = `@keyframes k4ToastIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}`;
document.head.appendChild(_s);
