// ═══════════════════════════════════════════
// Settings Page (관리자 전용)
// ═══════════════════════════════════════════
const Settings = {
  profiles: [],
  activeTab: 'companies',

  async render() {
    const el = document.getElementById('pg-settings');
    UI.loading(el);

    try {
      this.profiles = await DB.getAllProfiles();
      const clients = this.profiles.filter(p => p.role === 'client');
      const managers = this.profiles.filter(p => p.role === 'manager');
      const observers = this.profiles.filter(p => p.role === 'observer');

      el.innerHTML = `
        <div class="tabs">
          <button class="tab ${this.activeTab === 'companies' ? 'active' : ''}" onclick="Settings.switchTab('companies')">화주 업체 관리</button>
          <button class="tab ${this.activeTab === 'managers' ? 'active' : ''}" onclick="Settings.switchTab('managers')">매니저·열람자 관리</button>
          <button class="tab ${this.activeTab === 'newaccount' ? 'active' : ''}" onclick="Settings.switchTab('newaccount')">계정 추가</button>
        </div>

        <!-- 화주 업체 탭 -->
        <div id="tab-companies" class="tab-content" style="${this.activeTab !== 'companies' ? 'display:none' : ''}">
          <div class="toolbar" style="margin-bottom:12px">
            <div class="toolbar-filters"></div>
            <div class="toolbar-actions">
              <button class="btn btn-secondary btn-sm" onclick="Settings.downloadCompanies()">
                <i data-lucide="file-down"></i>업체목록 다운로드
              </button>
              <button class="btn btn-secondary btn-sm" onclick="Settings.downloadCompanyTemplate()">
                <i data-lucide="download"></i>업로드 양식
              </button>
              <label class="btn btn-secondary btn-sm" style="cursor:pointer">
                <i data-lucide="upload"></i>업체정보 업로드
                <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Settings.handleCompanyUpload(event)">
              </label>
            </div>
          </div>
          <div class="table-wrap">
            <div class="table-overflow">
              <table class="data-table">
                <thead><tr>
                  <th>업체명</th><th>업체코드</th><th>담당자</th><th>연락처</th>
                  <th>사업자번호</th><th>계약일</th><th>제품수</th><th>관리</th>
                </tr></thead>
                <tbody>
                  ${clients.map(c => this._clientRow(c)).join('')}
                  ${clients.length === 0 ? '<tr class="empty-row"><td colspan="8">등록된 화주가 없습니다</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 매니저·열람자 탭 -->
        <div id="tab-managers" class="tab-content" style="${this.activeTab !== 'managers' ? 'display:none' : ''}">
          <div class="table-wrap">
            <div class="table-overflow">
              <table class="data-table">
                <thead><tr>
                  <th>이름</th><th>코드</th><th>역할</th><th>연락처</th><th>접근 가능 업체</th><th>관리</th>
                </tr></thead>
                <tbody id="managerList">
                  ${(managers.length + observers.length) === 0 ? '<tr class="empty-row"><td colspan="6">등록된 매니저/열람자가 없습니다</td></tr>' : ''}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- 계정 추가 탭 -->
        <div id="tab-newaccount" class="tab-content card" style="${this.activeTab !== 'newaccount' ? 'display:none' : ''}">
          <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:20px;color:var(--text-1)">새 계정 추가</h3>
          <div class="alert alert-info" style="margin-bottom:20px">
            계정 생성 후 해당 업체코드와 설정한 비밀번호로 로그인할 수 있습니다.
          </div>
          <form id="newAccountForm" onsubmit="Settings.createAccount(event)">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
              <div class="form-group">
                <label class="form-label">역할 *</label>
                <select class="form-input" id="naRole" required onchange="Settings.toggleRoleFields()">
                  <option value="client">화주 (매입처)</option>
                  <option value="manager">매니저 (내부 담당자)</option>
                  <option value="observer">열람자 (국립공원공단 담당자)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">업체코드 (로그인 ID) *</label>
                <input class="form-input" id="naCode" required placeholder="예: KE2024" style="text-transform:uppercase">
              </div>
              <div class="form-group">
                <label class="form-label">업체명 / 담당자명 *</label>
                <input class="form-input" id="naName" required placeholder="예: 한국전자 또는 홍길동">
              </div>
              <div class="form-group">
                <label class="form-label">초기 비밀번호 *</label>
                <input class="form-input" id="naPassword" type="password" required minlength="6" placeholder="6자 이상">
              </div>
              <div class="form-group">
                <label class="form-label">담당자 이름</label>
                <input class="form-input" id="naContact" placeholder="예: 김영희">
              </div>
              <div class="form-group">
                <label class="form-label">연락처</label>
                <input class="form-input" id="naPhone" placeholder="010-0000-0000">
              </div>
              <div class="form-group client-only">
                <label class="form-label">사업자번호</label>
                <input class="form-input" id="naBiz" placeholder="000-00-00000">
              </div>
              <div class="form-group client-only">
                <label class="form-label">계약일</label>
                <input class="form-input" id="naContract" type="date">
              </div>
              <div class="form-group client-only" style="grid-column:1/-1">
                <label class="form-label">주소</label>
                <input class="form-input" id="naAddress" placeholder="업체 주소">
              </div>
              <div class="form-group client-only" style="grid-column:1/-1">
                <label class="form-label">계좌번호</label>
                <input class="form-input" id="naAccount" placeholder="예: 국민은행 123456-01-123456">
              </div>
              <div class="form-group">
                <label class="form-label">식별 색상</label>
                <input class="form-input" id="naColor" type="color" value="#6366f1" style="height:42px;padding:4px">
              </div>
            </div>
            <div style="margin-top:8px">
              <button type="submit" class="btn btn-primary" id="naSubmitBtn">
                <i data-lucide="user-plus"></i>계정 생성
              </button>
            </div>
          </form>
        </div>

        <!-- 업체 수정 모달 -->
        <div class="modal-overlay" id="editCompanyModal">
          <div class="modal" style="max-width:560px">
            <div class="modal-header">
              <div class="modal-title">업체 정보 수정</div>
              <button class="btn-icon" onclick="UI.closeModal('editCompanyModal')"><i data-lucide="x"></i></button>
            </div>
            <form id="editCompanyForm" onsubmit="Settings.saveCompany(event)">
              <input type="hidden" id="ecId">
              <div class="modal-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group" style="margin:0">
                    <label class="form-label">업체명</label>
                    <input class="form-input" id="ecName" required>
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">담당자</label>
                    <input class="form-input" id="ecContact">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">연락처</label>
                    <input class="form-input" id="ecPhone">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">사업자번호</label>
                    <input class="form-input" id="ecBiz">
                  </div>
                  <div class="form-group" style="grid-column:1/-1;margin:0">
                    <label class="form-label">주소</label>
                    <input class="form-input" id="ecAddress">
                  </div>
                  <div class="form-group" style="grid-column:1/-1;margin:0">
                    <label class="form-label">계좌번호</label>
                    <input class="form-input" id="ecAccount">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">계약일</label>
                    <input class="form-input" id="ecContract" type="date">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">식별 색상</label>
                    <input class="form-input" id="ecColor" type="color" style="height:42px;padding:4px">
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('editCompanyModal')">취소</button>
                <button type="submit" class="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>

        <!-- 매니저 권한 모달 -->
        <div class="modal-overlay" id="managerPermModal">
          <div class="modal" style="max-width:480px">
            <div class="modal-header">
              <div class="modal-title">매니저 접근 권한 설정</div>
              <button class="btn-icon" onclick="UI.closeModal('managerPermModal')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
              <p style="color:var(--text-2);font-size:0.85rem;margin-bottom:16px">
                이 매니저가 조회할 수 있는 화주 업체를 선택하세요
              </p>
              <div id="permCheckboxes"></div>
            </div>
            <div class="modal-footer">
              <input type="hidden" id="permManagerId">
              <button class="btn btn-secondary" onclick="UI.closeModal('managerPermModal')">취소</button>
              <button class="btn btn-primary" onclick="Settings.savePermissions()">저장</button>
            </div>
          </div>
        </div>
      `;

      UI.icons();
      if (this.activeTab === 'managers') await this._renderManagerList(managers);

    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">오류: ${err.message}</div>`;
    }
  },

  _clientRow(c) {
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:9px">
          <div style="width:10px;height:10px;border-radius:50%;background:${c.logo_color};flex-shrink:0"></div>
          <span class="td-main">${c.company_name}</span>
        </div>
      </td>
      <td><span class="badge badge-blue">${c.company_code}</span></td>
      <td style="color:var(--text-2)">${c.contact_name || '-'}</td>
      <td style="color:var(--text-2)">${c.contact_phone || '-'}</td>
      <td style="color:var(--text-3);font-size:0.8rem">${c.business_number || '-'}</td>
      <td style="color:var(--text-3);font-size:0.8rem">${c.contract_date || '-'}</td>
      <td style="font-weight:600" id="prodCount-${c.id}">-</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm btn-secondary" onclick="Settings.openEditModal('${c.id}')">
            <i data-lucide="pencil"></i>수정
          </button>
        </div>
      </td>
    </tr>`;
  },

  async _renderManagerList(managers) {
    const clients = this.profiles.filter(p => p.role === 'client');
    const observers = this.profiles.filter(p => p.role === 'observer');
    const listEl = document.getElementById('managerList');
    if (!listEl) return;

    if (managers.length === 0 && observers.length === 0) return;

    // 매니저 행
    const managerRows = await Promise.all(managers.map(async m => {
      const permIds = await DB.getManagerPermissions(m.id);
      const permLabels = clients.filter(c => permIds.includes(c.id)).map(c => c.company_name);
      return `<tr>
        <td class="td-main">${m.company_name}</td>
        <td><span class="badge badge-purple">${m.company_code}</span></td>
        <td><span class="badge badge-blue">매니저</span></td>
        <td style="color:var(--text-2)">${m.contact_phone || '-'}</td>
        <td>
          ${permLabels.length > 0
            ? permLabels.map(n => `<span class="badge badge-blue" style="margin:2px">${n}</span>`).join('')
            : '<span style="color:var(--text-3);font-size:0.8rem">권한 없음</span>'
          }
        </td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="Settings.openPermModal('${m.id}')">
            <i data-lucide="shield"></i>권한 설정
          </button>
        </td>
      </tr>`;
    }));

    // 열람자(observer) 행
    const observerRows = observers.map(o => `<tr>
      <td class="td-main">${o.company_name}</td>
      <td><span class="badge badge-purple">${o.company_code}</span></td>
      <td><span class="badge badge-gray">열람자</span></td>
      <td style="color:var(--text-2)">${o.contact_phone || '-'}</td>
      <td><span style="color:var(--text-3);font-size:0.8rem">전체 열람 가능</span></td>
      <td><span style="font-size:0.78rem;color:var(--text-3)">읽기 전용</span></td>
    </tr>`);

    listEl.innerHTML = [...managerRows, ...observerRows].join('');
    UI.icons();
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${tab}`).style.display = '';
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => {
      if (t.textContent.includes(tab === 'companies' ? '화주' : tab === 'managers' ? '매니저' : '계정')) {
        t.classList.add('active');
      }
    });

    if (tab === 'managers') {
      const managers = this.profiles.filter(p => p.role === 'manager');
      this._renderManagerList(managers);
    }
  },

  toggleRoleFields() {
    const role = document.getElementById('naRole')?.value;
    document.querySelectorAll('.client-only').forEach(el => {
      el.style.display = role === 'client' ? '' : 'none';
    });
    // observer는 업체코드 자동 제안
    const codeInput = document.getElementById('naCode');
    if (codeInput && role === 'observer') {
      codeInput.placeholder = '예: KNPS2024 (열람자 ID)';
    } else if (codeInput) {
      codeInput.placeholder = '예: KE2024';
    }
  },

  async createAccount(e) {
    e.preventDefault();
    const btn = document.getElementById('naSubmitBtn');
    btn.disabled = true;
    btn.textContent = '생성 중...';

    const role = document.getElementById('naRole').value;
    const code = document.getElementById('naCode').value.trim().toUpperCase();
    const name = document.getElementById('naName').value.trim();
    const password = document.getElementById('naPassword').value;

    const profileData = {
      role,
      company_name: name,
      contact_name: document.getElementById('naContact').value.trim(),
      contact_phone: document.getElementById('naPhone').value.trim(),
      email: '',
      logo_color: document.getElementById('naColor').value,
    };

    if (role === 'client') {
      profileData.business_number = document.getElementById('naBiz').value.trim();
      profileData.contract_date = document.getElementById('naContract').value || null;
      profileData.address = document.getElementById('naAddress').value.trim();
      profileData.account_number = document.getElementById('naAccount').value.trim();
    }

    try {
      await Auth.createUser(code, password, profileData);
      UI.toast(`"${name}" 계정이 생성되었습니다`);
      document.getElementById('newAccountForm').reset();
      document.getElementById('naColor').value = '#6366f1';
      this.profiles = await DB.getAllProfiles();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="user-plus"></i>계정 생성';
      UI.icons();
    }
  },

  openEditModal(id) {
    const c = this.profiles.find(p => p.id === id);
    if (!c) return;
    document.getElementById('ecId').value = id;
    document.getElementById('ecName').value = c.company_name;
    document.getElementById('ecContact').value = c.contact_name || '';
    document.getElementById('ecPhone').value = c.contact_phone || '';
    document.getElementById('ecBiz').value = c.business_number || '';
    document.getElementById('ecAddress').value = c.address || '';
    document.getElementById('ecAccount').value = c.account_number || '';
    document.getElementById('ecContract').value = c.contract_date || '';
    document.getElementById('ecColor').value = c.logo_color || '#6366f1';
    UI.openModal('editCompanyModal');
  },

  async saveCompany(e) {
    e.preventDefault();
    const id = document.getElementById('ecId').value;
    try {
      await DB.updateProfile(id, {
        company_name: document.getElementById('ecName').value.trim(),
        contact_name: document.getElementById('ecContact').value.trim(),
        contact_phone: document.getElementById('ecPhone').value.trim(),
        business_number: document.getElementById('ecBiz').value.trim(),
        address: document.getElementById('ecAddress').value.trim(),
        account_number: document.getElementById('ecAccount').value.trim(),
        contract_date: document.getElementById('ecContract').value || null,
        logo_color: document.getElementById('ecColor').value,
      });
      UI.toast('저장되었습니다');
      UI.closeModal('editCompanyModal');
      await this.render();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    }
  },

  async openPermModal(managerId) {
    document.getElementById('permManagerId').value = managerId;
    const clients = this.profiles.filter(p => p.role === 'client');
    const currentPerms = await DB.getManagerPermissions(managerId);

    document.getElementById('permCheckboxes').innerHTML = clients.map(c => `
      <label style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:6px;cursor:pointer;border:1px solid var(--border);margin-bottom:8px;background:var(--bg-3)">
        <input type="checkbox" value="${c.id}" ${currentPerms.includes(c.id) ? 'checked' : ''}
               style="width:16px;height:16px;accent-color:var(--accent)">
        <div>
          <div style="font-weight:600;color:var(--text-1)">${c.company_name}</div>
          <div style="font-size:0.75rem;color:var(--text-3)">${c.company_code}</div>
        </div>
      </label>
    `).join('');

    UI.openModal('managerPermModal');
  },

  downloadCompanyTemplate() {
    const sample = [
      { '업체코드(수정금지)': 'KE2024', '업체명': '예시업체', '담당자': '홍길동', '연락처': '010-1234-5678', '사업자번호': '123-45-67890', '주소': '서울시 강남구', '계좌번호': '국민은행 123-456-789', '계약일': '2025-01-01' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws['!cols'] = [{wch:16},{wch:20},{wch:12},{wch:16},{wch:16},{wch:28},{wch:28},{wch:12}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '업체정보양식');
    XLSX.writeFile(wb, 'company_upload_template.xlsx');
  },

  downloadCompanies() {
    const clients = this.profiles.filter(p => p.role === 'client');
    const rows = clients.map(c => ({
      '업체코드(수정금지)': c.company_code,
      '업체명': c.company_name,
      '담당자': c.contact_name || '',
      '연락처': c.contact_phone || '',
      '이메일': c.email || '',
      '사업자번호': c.business_number || '',
      '주소': c.address || '',
      '계좌번호': c.account_number || '',
      '계약일': c.contract_date || '',
      '활성여부': c.is_active ? '활성' : '비활성',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:16},{wch:20},{wch:12},{wch:16},{wch:22},{wch:16},{wch:28},{wch:28},{wch:12},{wch:8}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '화주목록');
    const today = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `화주목록_${today}.xlsx`);
  },

  async handleCompanyUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        const codeMap = {};
        this.profiles.forEach(p => { codeMap[p.company_code.toUpperCase()] = p.id; });

        let updated = 0;
        const errors = [];

        for (const [i, row] of rows.entries()) {
          const lineNum = i + 2;
          const code = String(row['업체코드(수정금지)'] || row['업체코드'] || '').toUpperCase().trim();
          if (!code) { errors.push(`${lineNum}행: 업체코드 없음`); continue; }
          const id = codeMap[code];
          if (!id) { errors.push(`${lineNum}행: "${code}" 존재하지 않음 (신규 등록은 계정추가 탭 사용)`); continue; }

          const updates = {};
          if (row['업체명']) updates.company_name = String(row['업체명']).trim();
          if (row['담당자'] !== undefined) updates.contact_name = String(row['담당자']).trim();
          if (row['연락처'] !== undefined) updates.contact_phone = String(row['연락처']).trim();
          if (row['사업자번호'] !== undefined) updates.business_number = String(row['사업자번호']).trim();
          if (row['주소'] !== undefined) updates.address = String(row['주소']).trim();
          if (row['계좌번호'] !== undefined) updates.account_number = String(row['계좌번호']).trim();
          if (row['계약일']) updates.contract_date = String(row['계약일']).trim();

          try {
            await DB.updateProfile(id, updates);
            updated++;
          } catch(err) {
            errors.push(`${lineNum}행 오류: ${err.message}`);
          }
        }

        const msg = `✅ ${updated}개 업체 정보 업데이트${errors.length > 0 ? `\n\n⚠️ 오류:\n` + errors.slice(0,10).join('\n') : ''}`;
        alert(msg);
        await this.render();
      } catch(err) {
        alert('업로드 오류: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  async savePermissions() {
    const managerId = document.getElementById('permManagerId').value;
    const checked = Array.from(document.querySelectorAll('#permCheckboxes input:checked')).map(cb => cb.value);
    try {
      await DB.setManagerPermissions(managerId, checked);
      UI.toast('권한이 저장되었습니다');
      UI.closeModal('managerPermModal');
      const managers = this.profiles.filter(p => p.role === 'manager');
      await this._renderManagerList(managers);
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    }
  },
};
