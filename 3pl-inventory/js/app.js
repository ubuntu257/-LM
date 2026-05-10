// 3PL - App Controller
const App = {
  currentPage: 'dashboard',
  currentUser: null,

  init() {
    DB.init();
    Auth.init();
    if (!Auth.checkSession()) {
      document.getElementById('loginPage').style.display = '';
    }
    
    // Theme init
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
      document.getElementById('themeIcon').setAttribute('data-lucide', 'sun');
      document.getElementById('themeText').textContent = '라이트 모드';
    }
  },

  toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    
    document.getElementById('themeIcon').setAttribute('data-lucide', isLight ? 'sun' : 'moon');
    document.getElementById('themeText').textContent = isLight ? '라이트 모드' : '다크 모드';
    if (window.lucide) lucide.createIcons();
    
    // Refresh charts if they exist
    if (this.currentPage === 'dashboard' && Dashboard.renderCharts) {
      Dashboard.renderCharts(this.currentUser.id, this.currentUser.role === 'admin');
    }
  },

  initApp(user) {
    this.currentUser = user;
    this.renderSidebar(user);
    this.navigate('dashboard');
  },

  renderSidebar(user) {
    const isAdmin = user.role === 'admin';
    const initial = user.name.charAt(0);

    document.getElementById('sidebarUser').innerHTML = `
      <div class="avatar" style="background:${user.logoColor}">${initial}</div>
      <div class="user-info">
        <div class="name">${user.name}</div>
        <div class="role">${isAdmin ? '관리자' : '화주'}</div>
      </div>`;

    // Update alert badge
    const stats = DB.getStats(user.id);
    const alertBadge = document.getElementById('alertBadge');
    if (alertBadge) {
      if (stats.lowStockProducts.length > 0) {
        alertBadge.textContent = stats.lowStockProducts.length;
        alertBadge.style.display = '';
      } else {
        alertBadge.style.display = 'none';
      }
    }

    // 관리자/화주 메뉴 분기
    document.querySelectorAll('.admin-menu').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
    document.querySelectorAll('.client-menu').forEach(el => {
      el.style.display = isAdmin ? 'none' : '';
    });

    // Show/hide legacy admin-only nav items
    document.querySelectorAll('.admin-only').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
  },

  navigate(page) {
    this.currentPage = page;
    // Update nav
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.style.display = 'none');
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.style.display = '';

    // Update header
    const titles = {
      dashboard: { title:'대시보드', desc:'재고 현황을 한눈에 확인하세요' },
      inventory: { title:'재고 관리', desc:'제품별 현재 재고를 확인합니다' },
      history: { title:'입출고 이력', desc:'입고 및 출고 내역을 조회합니다' },
      requests: { title:'출고 요청 관리', desc:'화주의 출고 요청을 확인하고 처리합니다' },
      'outbound-new': { title:'출고요청 등록', desc:'새로운 출고 요청서를 작성합니다' },
      'my-requests': { title:'나의 출고요청', desc:'내가 접수한 출고 요청 내역을 확인합니다' },
      settlements: { title:'정산 관리', desc:'기간별 판매(출고) 내역에 따른 정산 금액을 확인합니다' },
      settings: { title:'설정', desc:'시스템 설정을 관리합니다' }
    };
    const t = titles[page] || titles.dashboard;
    document.getElementById('pageTitle').textContent = t.title;
    document.getElementById('pageDesc').textContent = t.desc;

    // Render page
    const uid = this.currentUser.id;
    if (page === 'dashboard') Dashboard.render(uid);
    else if (page === 'inventory') Inventory.render(uid);
    else if (page === 'history') History.render(uid);
    else if (page === 'requests') Requests.render(uid);
    else if (page === 'outbound-new') Outbound.renderNewForm();
    else if (page === 'my-requests') Outbound.renderMyRequests();
    else if (page === 'settlements') Settlement.render(uid);
    else if (page === 'settings') this.renderSettings();
  },

  renderSettings() {
    const user = this.currentUser;
    const isAdmin = user.role === 'admin';
    const companies = DB.getCompanies().filter(c => c.role === 'client');
    const page = document.getElementById('page-settings');
    page.innerHTML = `
      <div class="settings-section animate-fade-in">
        <h3>📋 업체 정보</h3>
        <div class="settings-grid">
          <div class="detail-field"><div class="label">업체명</div><div class="value">${user.name}</div></div>
          <div class="detail-field"><div class="label">업체 코드</div><div class="value">${user.code}</div></div>
          <div class="detail-field"><div class="label">사업자번호</div><div class="value">${user.businessNumber||'-'}</div></div>
          <div class="detail-field"><div class="label">담당자</div><div class="value">${user.contactName}</div></div>
          <div class="detail-field"><div class="label">연락처</div><div class="value">${user.contactPhone}</div></div>
          <div class="detail-field"><div class="label">이메일</div><div class="value">${user.email||'-'}</div></div>
          <div class="detail-field"><div class="label" style="grid-column:1/-1">주소</div><div class="value" style="grid-column:1/-1">${user.address||'-'}</div></div>
          <div class="detail-field"><div class="label">계좌번호</div><div class="value">${user.accountNumber||'-'}</div></div>
          <div class="detail-field"><div class="label">계약일</div><div class="value">${user.contractDate}</div></div>
          <div class="detail-field"><div class="label">권한</div><div class="value">${user.role==='admin'?'관리자':'화주(클라이언트)'}</div></div>
        </div>
      </div>

      ${isAdmin ? `
      <div class="settings-section animate-fade-in stagger-2">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--border-color)">
          <h3 style="margin:0;padding:0;border:none">🏢 등록 업체 관리</h3>
          <div style="display:flex;gap:10px">
            <button class="btn btn-sm btn-secondary" onclick="App.downloadCompanyTemplate()">
              <i data-lucide="download" style="width:14px;height:14px"></i>양식 다운로드
            </button>
            <label class="btn btn-sm btn-secondary" style="cursor:pointer">
              <i data-lucide="upload" style="width:14px;height:14px"></i>엑셀 업로드
              <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="App.handleCompanyUpload(event)">
            </label>
          </div>
        </div>
        <div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr>
              <th>업체명</th><th>코드/사업자번호</th><th>담당자/연락처/이메일</th><th>주소/계좌</th><th>제품수</th>
            </tr></thead>
            <tbody>
              ${companies.map(c => {
                const prodCount = DB.getProducts(c.id).length;
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:10px">
                    <div style="width:10px;height:10px;border-radius:50%;background:${c.logoColor};flex-shrink:0"></div>
                    <span style="font-weight:600;color:var(--text-primary)">${c.name}</span>
                  </div></td>
                  <td>
                    <div style="margin-bottom:4px"><span class="badge badge-info">${c.code}</span></div>
                    <div style="font-size:0.8rem;color:var(--text-tertiary)">${c.businessNumber||'-'}</div>
                  </td>
                  <td>
                    <div style="font-weight:500;color:var(--text-secondary)">${c.contactName}</div>
                    <div style="font-size:0.8rem;color:var(--text-tertiary)">${c.contactPhone}</div>
                    <div style="font-size:0.8rem;color:var(--text-tertiary)">${c.email||'-'}</div>
                  </td>
                  <td>
                    <div style="font-size:0.85rem;color:var(--text-secondary);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.address||'-'}">${c.address||'-'}</div>
                    <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:4px">${c.accountNumber||'-'}</div>
                  </td>
                  <td style="font-weight:600">${prodCount}종</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        <p style="color:var(--text-tertiary);font-size:0.78rem;margin-top:12px">
          엑셀 컬럼: 업체명*, 업체코드*, 비밀번호*, 사업자번호, 이메일, 주소, 계좌번호, 담당자, 연락처, 계약일, 식별색상(HEX)
        </p>
      </div>` : ''}

      <div class="settings-section animate-fade-in ${isAdmin ? 'stagger-3' : 'stagger-2'}">
        <h3>⚙️ 데이터 관리</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.9rem">
          샘플 데이터를 초기화하거나 전체 데이터를 리셋할 수 있습니다.
        </p>
        <div class="settings-actions">
          <button class="btn btn-danger" onclick="App.resetData()">
            <i data-lucide="refresh-cw" style="width:16px;height:16px"></i>데이터 초기화
          </button>
        </div>
      </div>`;
    if (window.lucide) lucide.createIcons();
  },

  // ── Company Excel Upload ──
  handleCompanyUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        if (rows.length === 0) { alert('엑셀 파일에 데이터가 없습니다.'); return; }

        const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#14b8a6','#f97316'];
        const existingCodes = DB.getCompanies().map(c => c.code);
        let added = 0;
        const errors = [];

        rows.forEach((row, i) => {
          const name = row['업체명'] || row['name'] || '';
          const code = row['업체코드'] || row['code'] || '';
          const password = row['비밀번호'] || row['password'] || '1234';
          const businessNumber = row['사업자번호'] || row['businessNumber'] || '';
          const email = row['업체이메일'] || row['이메일'] || row['email'] || '';
          const address = row['주소'] || row['address'] || '';
          const accountNumber = row['계좌번호'] || row['account'] || '';
          const contactName = row['담당자'] || row['contact'] || '';
          const contactPhone = row['연락처'] || row['phone'] || '';
          const contractDate = row['계약일'] || row['contractDate'] || new Date().toISOString().slice(0,10);
          const logoColor = row['식별색상'] || row['color'] || colors[i % colors.length];

          if (!name) { errors.push(`행 ${i+2}: 업체명이 없습니다`); return; }
          if (!code) { errors.push(`행 ${i+2}: 업체코드가 없습니다`); return; }
          if (existingCodes.includes(code)) { errors.push(`행 ${i+2}: 업체코드 "${code}"가 이미 존재합니다`); return; }

          DB.addCompany({ name, code, password, role: 'client', businessNumber, email, address, accountNumber, contactName, contactPhone, contractDate, logoColor });
          existingCodes.push(code);
          added++;
        });

        let msg = `✅ ${added}개 업체가 등록되었습니다!`;
        if (errors.length) msg += `\n\n⚠️ ${errors.length}건 오류:\n` + errors.slice(0,5).join('\n');
        alert(msg);
        this.renderSettings();
      } catch (err) {
        alert('엑셀 파일 처리 중 오류가 발생했습니다.\n' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  },

  downloadCompanyTemplate() {
    const sample = [
      { '업체명': '새업체 주식회사', '업체코드': 'NEW001', '비밀번호': '1234', '사업자번호': '123-45-67890', '업체이메일': 'contact@newcompany.com', '주소': '서울특별시 강남구 테헤란로 123', '계좌번호': '국민은행 123456-01-7890', '담당자': '홍길동', '연락처': '010-0000-0000', '계약일': '2024-06-01', '식별색상': '#06b6d4' },
      { '업체명': '테스트 상사', '업체코드': 'TEST01', '비밀번호': '1234', '사업자번호': '987-65-43210', '업체이메일': 'info@testcorp.co.kr', '주소': '부산광역시 해운대구 센텀중앙로 45', '계좌번호': '신한은행 110-222-3333', '담당자': '김영희', '연락처': '010-1111-1111', '계약일': '2024-07-01', '식별색상': '#ec4899' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws['!cols'] = [{wch:18},{wch:10},{wch:10},{wch:16},{wch:25},{wch:35},{wch:25},{wch:10},{wch:16},{wch:12},{wch:10}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'template');
    XLSX.writeFile(wb, 'company_upload_template.xlsx');
  },

  resetData() {
    if (!confirm('모든 데이터를 초기 상태로 되돌리시겠습니까?')) return;
    DB.resetData();
    this.navigate(this.currentPage);
  },

  toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('open');
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
