/* ============================================
   K4 GAME ROOM - APP UTILITIES
   ============================================ */

const K4App = {
  toast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  },

  escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  },

  getPlayer() {
    try {
      return JSON.parse(sessionStorage.getItem('k4_player') || '{}');
    } catch { return {}; }
  },

  getAdminToken() {
    return localStorage.getItem('k4_admin_token');
  },

  setAdminToken(token) {
    localStorage.setItem('k4_admin_token', token);
  },

  clearAdmin() {
    localStorage.removeItem('k4_admin_token');
  },

  async api(endpoint, options = {}) {
    const token = this.getAdminToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  },

  requirePlayer() {
    const player = this.getPlayer();
    if (!player.player_id) {
      window.location.href = '/';
      return null;
    }
    return player;
  },

  async requireAdmin() {
    const token = this.getAdminToken();
    if (!token) {
      window.location.href = '/admin/login.html';
      return false;
    }
    try {
      await this.api('/admin/verify');
      return true;
    } catch {
      this.clearAdmin();
      window.location.href = '/admin/login.html';
      return false;
    }
  },

  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  normalizeAnswer(str) {
    return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  },

  answersMatch(a, b) {
    const na = this.normalizeAnswer(a);
    const nb = this.normalizeAnswer(b);
    return na === nb || na.includes(nb) || nb.includes(na);
  },

  formatScore(score) {
    return score > 0 ? `+${score}` : `${score}`;
  }
};

// Global helpers
window.showToast = (msg, type) => K4App.toast(msg, type);
window.K4App = K4App;

function logout() {
  K4App.clearAdmin();
  window.location.href = '/admin/login.html';
}
