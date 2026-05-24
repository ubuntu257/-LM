// ═══════════════════════════════════════════
// App Controller — Router & Init
// ═══════════════════════════════════════════
const App = {
  currentPage: 'dashboard',

  async init() {
    await Auth.init();

    if (!Auth.profile) {
      document.getElementById('loginPage').style.display = '';
      document.getElementById('appWrap').style.display = 'none';
      App._bindLogin();
      if (window.lucide) lucide.createIcons();
      return;
    }

    App._bootApp();
  },

  _bindLogin() {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = document.getElementById('loginCode').value;
      const pw = document.getElementById('loginPassword').value;
      const errEl = document.getElementById('loginError');
      const btn = document.getElementById('loginBtn');

      errEl.style.display = 'none';
      btn.disabled = true;
      btn.textContent = '로그인 중...';

      try {
        await Auth.login(code, pw);
        App._bootApp();
      } catch (err) {
        errEl.textContent = '업체 코드 또는 비밀번호가 올바르지 않습니다.';
        errEl.style.display = '';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="log-in" style="width:18px;height:18px"></i> 로그인';
        if (window.lucide) lucide.createIcons();
      }
    });
  },

  _bootApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appWrap').style.display = 'flex';

    const profile = Auth.profile;
    const isAdmin = Auth.isAdmin();

    // 역할 배지
    document.getElementById('roleBadge').textContent = Auth.getRoleLabel();

    // 관리자 전용 메뉴 표시
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });

    // 설정 메뉴 — 관리자만 표시 (observer 포함 나머지 숨김)
    const settingsNav = document.querySelector('.nav-item[data-page="settings"]');
    if (settingsNav) settingsNav.style.display = isAdmin ? '' : 'none';

    // 사이드바 유저 정보
    const initial = profile.company_name.charAt(0);
    document.getElementById('sidebarUser').innerHTML = `
      <div class="user-avatar" style="background:${profile.logo_color}">${initial}</div>
      <div>
        <div class="user-name">${profile.company_name}</div>
        <div class="user-role">${Auth.getRoleLabel()}</div>
      </div>`;

    if (window.lucide) lucide.createIcons();
    App.go('dashboard');
    App._updateBadges();
  },

  async _updateBadges() {
    if (!Auth.isAdmin()) return;
    try {
      const { data } = await _sb
        .from('outbound_requests')
        .select('id')
        .eq('status', 'pending');
      const badge = document.getElementById('navBadgePending');
      if (badge) {
        badge.textContent = data?.length || 0;
        badge.style.display = data?.length > 0 ? '' : 'none';
      }
    } catch (_) {}
  },

  go(page) {
    App.currentPage = page;

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(`pg-${page}`);
    if (el) el.classList.add('active');

    const meta = {
      dashboard:    { title: '대시보드',       desc: '재고 현황을 한눈에 확인하세요' },
      inventory:    { title: '재고 현황',       desc: '제품별 현재 재고를 확인합니다' },
      transactions: { title: '입출고 이력',     desc: '입고 및 출고 내역을 조회합니다' },
      requests:     { title: '출고 요청서',     desc: '출고 요청을 작성하고 처리합니다' },
      settlement:   { title: '정산 관리',       desc: '품목별 매입금액 기준 정산 내역을 확인합니다' },
      settings:     { title: '설정 / 업체관리', desc: '업체·제품·계정을 관리합니다' },
    };
    const m = meta[page] || meta.dashboard;
    document.getElementById('pageTitle').textContent = m.title;
    document.getElementById('pageDesc').textContent = m.desc;

    App._renderPage(page);
    App.closeSidebar();
  },

  _renderPage(page) {
    const uid = Auth.profile?.id;
    const role = Auth.getRole();
    switch (page) {
      case 'dashboard':    Dashboard.render(); break;
      case 'inventory':    Inventory.render(); break;
      case 'transactions': Transactions.render(); break;
      case 'requests':     Requests.render(); break;
      case 'settlement':   Settlement.render(); break;
      case 'settings':     if (Auth.isAdmin()) Settings.render(); break;
    }
  },

  openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('sidebarOverlay').classList.add('open');
  },

  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  },
};

// ── Utility helpers ──────────────────────
const UI = {
  loading(el, msg = '불러오는 중...') {
    el.innerHTML = `<div class="loading"><div class="spinner"></div>${msg}</div>`;
  },

  fmtDate(str) {
    if (!str) return '-';
    const d = new Date(str);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  fmtDatetime(str) {
    if (!str) return '-';
    const d = new Date(str);
    return `${UI.fmtDate(str)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  fmtNum(n) {
    return Number(n || 0).toLocaleString('ko-KR');
  },

  fmtMoney(n) {
    return Number(n || 0).toLocaleString('ko-KR') + '원';
  },

  openModal(id) {
    document.getElementById(id)?.classList.add('open');
  },

  closeModal(id) {
    document.getElementById(id)?.classList.remove('open');
  },

  async confirm(msg) {
    return window.confirm(msg);
  },

  toast(msg, type = 'success') {
    const t = document.createElement('div');
    const colors = { success: '#22c55e', danger: '#ef4444', warning: '#f59e0b', info: '#4f7ef8' };
    t.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      background:${colors[type] || colors.success};color:#fff;
      padding:10px 18px;border-radius:8px;font-size:0.875rem;font-weight:600;
      box-shadow:0 4px 16px rgba(0,0,0,0.3);
      animation:slideUp 0.25s ease;
    `;
    t.textContent = msg;
    if (!document.getElementById('toastStyle')) {
      const s = document.createElement('style');
      s.id = 'toastStyle';
      s.textContent = '@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}';
      document.head.appendChild(s);
    }
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },

  icons() {
    if (window.lucide) lucide.createIcons();
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
