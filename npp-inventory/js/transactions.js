// ═══════════════════════════════════════════
// Transactions Page (입출고 이력 + 엑셀 업로드)
// ═══════════════════════════════════════════
const Transactions = {
  companies: [],
  filterCompany: '',
  filterType: '',
  filterStart: '',
  filterEnd: '',

  async render() {
    const el = document.getElementById('pg-transactions');
    UI.loading(el);

    const isAdmin = Auth.isAdmin();
    const canViewAll = Auth.isAdmin() || Auth.isManager();

    try {
      this.companies = canViewAll ? await DB.getPermittedCompanies() : [Auth.profile];

      const now = new Date();
      if (!this.filterStart) {
        const d = new Date(now.getFullYear(), now.getMonth(), 1);
        this.filterStart = UI.fmtDate(d.toISOString());
      }
      if (!this.filterEnd) {
        this.filterEnd = UI.fmtDate(now.toISOString());
      }

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-filters">
            ${canViewAll && this.companies.length > 1 ? `
            <select class="filter-select" id="txnCompany">
              <option value="">전체 업체</option>
              ${this.companies.map(c => `<option value="${c.id}" ${this.filterCompany === c.id ? 'selected' : ''}>${c.company_name}</option>`).join('')}
            </select>
            ` : ''}
            <select class="filter-select" id="txnType">
              <option value="">전체</option>
              <option value="inbound" ${this.filterType === 'inbound' ? 'selected' : ''}>입고</option>
              <option value="outbound" ${this.filterType === 'outbound' ? 'selected' : ''}>출고</option>
            </select>
            <input type="date" class="filter-select" id="txnStart" value="${this.filterStart}" style="width:140px">
            <span style="color:var(--text-3)">~</span>
            <input type="date" class="filter-select" id="txnEnd" value="${this.filterEnd}" style="width:140px">
          </div>
          <div class="toolbar-actions">
            ${isAdmin ? `
            <button class="btn btn-secondary btn-sm" onclick="Transactions.downloadTemplate()">
              <i data-lucide="download"></i>업로드 양식
            </button>
            <label class="btn btn-primary btn-sm" style="cursor:pointer">
              <i data-lucide="upload"></i>엑셀 업로드
              <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Transactions.handleUpload(event)">
            </label>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="Transactions.downloadExcel()">
              <i data-lucide="file-down"></i>엑셀 다운로드
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-overflow">
            <table class="data-table">
              <thead><tr>
                <th>날짜</th>
                ${canViewAll ? '<th>업체</th>' : ''}
                <th>유형</th>
                <th>제품명</th>
                <th>SKU</th>
                <th>수량</th>
                <th>참조번호</th>
                <th>비고</th>
              </tr></thead>
              <tbody id="txnBody">
                <tr><td colspan="9"><div class="loading"><div class="spinner"></div>조회 중...</div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 업로드 결과 모달 -->
        <div class="modal-overlay" id="uploadResultModal">
          <div class="modal" style="max-width:480px">
            <div class="modal-header">
              <div class="modal-title">업로드 결과</div>
              <button class="btn-icon" onclick="UI.closeModal('uploadResultModal')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body" id="uploadResultBody"></div>
            <div class="modal-footer">
              <button class="btn btn-primary" onclick="UI.closeModal('uploadResultModal');Transactions.render()">확인</button>
            </div>
          </div>
        </div>
      `;

      // 이벤트
      document.getElementById('txnCompany')?.addEventListener('change', e => { this.filterCompany = e.target.value; this._load(); });
      document.getElementById('txnType')?.addEventListener('change', e => { this.filterType = e.target.value; this._load(); });
      document.getElementById('txnStart')?.addEventListener('change', e => { this.filterStart = e.target.value; this._load(); });
      document.getElementById('txnEnd')?.addEventListener('change', e => { this.filterEnd = e.target.value; this._load(); });

      UI.icons();
      await this._load();
    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">오류: ${err.message}</div>`;
    }
  },

  async _load() {
    const canViewAll = Auth.isAdmin() || Auth.isManager();
    const companyId = Auth.isClient()
      ? Auth.profile.id
      : (this.filterCompany || undefined);

    try {
      const txns = await DB.getTransactions({
        companyId,
        type: this.filterType || undefined,
        startDate: this.filterStart || undefined,
        endDate: this.filterEnd || undefined,
      });
      this._renderTable(txns);
    } catch (err) {
      document.getElementById('txnBody').innerHTML =
        `<tr><td colspan="9" style="color:var(--red);text-align:center;padding:24px">오류: ${err.message}</td></tr>`;
    }
  },

  _renderTable(txns) {
    const canViewAll = Auth.isAdmin() || Auth.isManager();
    const tbody = document.getElementById('txnBody');
    if (!tbody) return;

    if (!txns || txns.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="9">해당 기간의 이력이 없습니다</td></tr>`;
      return;
    }

    tbody.innerHTML = txns.map(t => {
      const isIn = t.type === 'inbound';
      return `<tr>
        <td style="white-space:nowrap;color:var(--text-3);font-size:0.82rem">${t.transaction_date}</td>
        ${canViewAll ? `<td>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:7px;height:7px;border-radius:50%;background:${t.company?.logo_color || '#6366f1'};flex-shrink:0"></div>
            <span style="font-size:0.8rem;color:var(--text-2)">${t.company?.company_name || '-'}</span>
          </div>
        </td>` : ''}
        <td>
          <span class="badge ${isIn ? 'badge-green' : 'badge-amber'}">
            ${isIn ? '입고' : '출고'}
          </span>
        </td>
        <td class="td-main">${t.product?.name || '-'}</td>
        <td style="color:var(--text-3);font-size:0.8rem;font-family:monospace">${t.product?.sku || '-'}</td>
        <td style="font-weight:700;color:${isIn ? 'var(--green)' : 'var(--amber)'}">
          ${isIn ? '+' : '-'}${UI.fmtNum(t.quantity)}${t.product?.unit || ''}
        </td>
        <td style="color:var(--text-3);font-size:0.8rem;font-family:monospace">${t.reference || '-'}</td>
        <td style="color:var(--text-3);font-size:0.82rem">${t.note || '-'}</td>
      </tr>`;
    }).join('');
  },

  async handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const companies = await DB.getClients();
    const companyMap = {};
    companies.forEach(c => { companyMap[c.company_code.toUpperCase()] = c.id; });

    const products = await DB.getProducts();
    const productMap = {};
    products.forEach(p => { productMap[p.sku?.toUpperCase()] = p; productMap[p.name] = p; });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        const batch = [];
        const errors = [];

        rows.forEach((row, i) => {
          const lineNum = i + 2;
          const code = String(row['업체코드'] || row['company_code'] || '').toUpperCase().trim();
          const skuOrName = String(row['SKU'] || row['제품명'] || row['product'] || '').trim();
          const type = String(row['유형'] || row['type'] || '').trim();
          const qty = parseInt(row['수량'] || row['quantity'] || 0);
          const ref = String(row['참조번호'] || row['reference'] || '');
          const note = String(row['비고'] || row['note'] || '');
          const dateRaw = row['날짜'] || row['date'];
          let dateStr = '';
          if (dateRaw) {
            if (typeof dateRaw === 'number') {
              // Excel serial date
              const d = new Date((dateRaw - 25569) * 86400000);
              dateStr = UI.fmtDate(d.toISOString());
            } else {
              dateStr = String(dateRaw).trim().replace(/\./g, '-').replace(/[^0-9-]/g, '');
            }
          }

          if (!code) { errors.push(`${lineNum}행: 업체코드 누락`); return; }
          if (!companyMap[code]) { errors.push(`${lineNum}행: 업체코드 "${code}" 없음`); return; }
          if (!skuOrName) { errors.push(`${lineNum}행: SKU/제품명 누락`); return; }
          const product = productMap[skuOrName.toUpperCase()] || productMap[skuOrName];
          if (!product) { errors.push(`${lineNum}행: 제품 "${skuOrName}" 없음`); return; }
          if (product.company_id !== companyMap[code]) { errors.push(`${lineNum}행: 제품이 해당 업체 소속이 아님`); return; }
          const txnType = (type === '입고' || type === 'inbound') ? 'inbound' : (type === '출고' || type === 'outbound') ? 'outbound' : '';
          if (!txnType) { errors.push(`${lineNum}행: 유형은 "입고" 또는 "출고"만 가능`); return; }
          if (!qty || qty <= 0) { errors.push(`${lineNum}행: 수량은 1 이상`); return; }

          batch.push({
            company_id: companyMap[code],
            product_id: product.id,
            type: txnType,
            quantity: qty,
            reference: ref,
            note,
            transaction_date: dateStr || null,
          });
        });

        if (batch.length === 0 && errors.length > 0) {
          const body = document.getElementById('uploadResultBody');
          body.innerHTML = `<div class="alert alert-danger">처리할 데이터가 없습니다.<br>${errors.slice(0,10).map(e => `• ${e}`).join('<br>')}</div>`;
          UI.openModal('uploadResultModal');
          return;
        }

        if (batch.length > 0) {
          const count = await DB.processTransactionBatch(batch);
          const body = document.getElementById('uploadResultBody');
          body.innerHTML = `
            <div class="alert alert-success">✅ ${count}건 처리 완료</div>
            ${errors.length > 0 ? `<div class="alert alert-warning">${errors.length}건 오류:<br>${errors.slice(0,10).map(e => `• ${e}`).join('<br>')}</div>` : ''}
          `;
          UI.openModal('uploadResultModal');
          UI.icons();
        }
      } catch (err) {
        alert('업로드 오류: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },

  downloadTemplate() {
    const sample = [
      { '업체코드': 'KE2024', 'SKU': 'NPP-001', '유형': '입고', '수량': 50, '날짜': '2025-05-01', '참조번호': 'PO-001', '비고': '1차 입고' },
      { '업체코드': 'KE2024', 'SKU': 'NPP-001', '유형': '출고', '수량': 10, '날짜': '2025-05-05', '참조번호': 'SO-001', '비고': '일반 출고' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '입출고양식');
    XLSX.writeFile(wb, 'transaction_upload_template.xlsx');
  },

  async downloadExcel() {
    const companyId = Auth.isClient() ? Auth.profile.id : (this.filterCompany || undefined);
    const txns = await DB.getTransactions({
      companyId,
      type: this.filterType || undefined,
      startDate: this.filterStart || undefined,
      endDate: this.filterEnd || undefined,
      limit: 10000,
    });

    const rows = txns.map(t => ({
      '날짜': t.transaction_date,
      '업체': t.company?.company_name || '',
      '유형': t.type === 'inbound' ? '입고' : '출고',
      '제품명': t.product?.name || '',
      'SKU': t.product?.sku || '',
      '수량': t.quantity,
      '단위': t.product?.unit || '',
      '참조번호': t.reference || '',
      '비고': t.note || '',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '입출고이력');
    XLSX.writeFile(wb, `transactions_${this.filterStart}_${this.filterEnd}.xlsx`);
  },
};
