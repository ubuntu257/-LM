// 3PL - Auth Module
const Auth = {
  init() {
    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.handleLogin(); });
  },

  handleLogin() {
    const code = document.getElementById('loginCode').value.trim();
    const pw = document.getElementById('loginPassword').value.trim();
    const errorEl = document.getElementById('loginError');
    if (!code || !pw) {
      errorEl.textContent = '업체 코드와 비밀번호를 입력해주세요.';
      errorEl.classList.add('show');
      return;
    }
    const user = DB.login(code, pw);
    if (user) {
      errorEl.classList.remove('show');
      this.showApp(user);
    } else {
      errorEl.textContent = '업체 코드 또는 비밀번호가 올바르지 않습니다.';
      errorEl.classList.add('show');
    }
  },

  showApp(user) {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('appLayout').classList.add('active');
    App.initApp(user);
  },

  logout() {
    DB.logout();
    document.getElementById('appLayout').classList.remove('active');
    document.getElementById('loginPage').style.display = '';
    document.getElementById('loginCode').value = '';
    document.getElementById('loginPassword').value = '';
  },

  checkSession() {
    const user = DB.getCurrentUser();
    if (user) { this.showApp(user); return true; }
    return false;
  }
};
