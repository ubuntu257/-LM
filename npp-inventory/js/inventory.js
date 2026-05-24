// ═══════════════════════════════════════════
// Inventory Page
// ═══════════════════════════════════════════
const Inventory = {
  products: [],
  companies: [],
  filterCompany: '',
  filterSearch: '',
  editingId: null,
  productRowCount: 0,

  async render() {
    const el = document.getElementById('pg-inventory');
    UI.loading(el);

    try {
      const isAdmin = Auth.isAdmin();
      const isManager = Auth.isManager();
      const isObserver = Auth.isObserver();
      const canViewAll = isAdmin || isManager || isObserver;

      this.companies = canViewAll ? await DB.getPermittedCompanies() : [Auth.profile];
      if (!this.filterCompany && this.companies.length === 1) {
        this.filterCompany = this.companies[0].id;
      }

      this.products = await DB.getProducts(Auth.isClient() ? Auth.profile.id : (this.filterCompany || undefined));

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-filters">
            ${canViewAll && this.companies.length > 1 ? `
            <select class="filter-select" id="invCompanyFilter">
              <option value="">전체 업체</option>
              ${this.companies.map(c => `<option value="${c.id}" ${this.filterCompany === c.id ? 'selected' : ''}>${c.company_name}</option>`).join('')}
            </select>
            ` : ''}
            <input type="text" class="filter-select" id="invSearch" placeholder="제품명/SKU 검색..."
              value="${this.filterSearch}" style="width:200px">
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-secondary btn-sm" onclick="Inventory.downloadExcel()">
              <i data-lucide="file-down"></i>엑셀 다운로드
            </button>
            ${isAdmin ? `
            <button class="btn btn-secondary btn-sm" onclick="Inventory.downloadTemplate()">
              <i data-lucide="download"></i>업로드 양식
            </button>
            <label class="btn btn-secondary btn-sm" style="cursor:pointer">
              <i data-lucide="upload"></i>엑셀 업로드
              <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Inventory.handleUpload(event)">
            </label>
            <button class="btn btn-primary btn-sm" onclick="Inventory.openBatchAddModal()">
              <i data-lucide="plus"></i>제품 추가
            </button>
            ` : ''}
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-overflow">
            <table class="data-table">
              <thead><tr>
                ${canViewAll ? '<th>업체</th>' : ''}
                <th>제품명</th>
                <th>SKU</th>
                <th>현재 재고</th>
                <th>최소 재고</th>
                <th>보관 위치</th>
                ${isAdmin ? '<th>매입 단가</th>' : ''}
                <th>소비자가격</th>
                <th>상태</th>
                ${isAdmin ? '<th>관리</th>' : ''}
              </tr></thead>
              <tbody id="invBody"></tbody>
            </table>
          </div>
        </div>

        <!-- 제품 수정 모달 (편집 전용) -->
        <div class="modal-overlay" id="productModal">
          <div class="modal" style="max-width:520px">
            <div class="modal-header">
              <div class="modal-title">제품 수정</div>
              <button class="btn-icon" onclick="UI.closeModal('productModal')">
                <i data-lucide="x"></i>
              </button>
            </div>
            <form id="productForm" onsubmit="Inventory.submitProduct(event)">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">업체</label>
                  <select class="form-input" id="pCompany" required>
                    <option value="">선택하세요</option>
                    ${this.companies.map(c => `<option value="${c.id}">${c.company_name}</option>`).join('')}
                  </select>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="form-group" style="margin:0">
                    <label class="form-label">제품명 *</label>
                    <input class="form-input" id="pName" required placeholder="예: 국립공원 텀블러">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">SKU</label>
                    <input class="form-input" id="pSku" placeholder="예: NPP-TBL-001">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px">
                  <div class="form-group" style="margin:0">
                    <label class="form-label">현재 재고</label>
                    <input class="form-input" id="pStock" type="number" min="0" value="0">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">최소 재고</label>
                    <input class="form-input" id="pMinStock" type="number" min="0" value="0">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">단위</label>
                    <input class="form-input" id="pUnit" value="개" placeholder="개/박스/kg">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:12px">
                  <div class="form-group" style="margin:0">
                    <label class="form-label">매입 단가 (원)</label>
                    <input class="form-input" id="pPrice" type="number" min="0" value="0">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">소비자가격 (원)</label>
                    <input class="form-input" id="pConsumerPrice" type="number" min="0" value="0">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">보관 위치</label>
                    <input class="form-input" id="pLocation" placeholder="예: A구역 3번 선반">
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('productModal')">취소</button>
                <button type="submit" class="btn btn-primary" id="productSubmitBtn">저장</button>
              </div>
            </form>
          </div>
        </div>

        <!-- 제품 일괄 추가 모달 -->
        <div class="modal-overlay" id="batchAddModal">
          <div class="modal" style="max-width:1080px;width:97vw">
            <div class="modal-header">
              <div class="modal-title">제품 일괄 추가</div>
              <button class="btn-icon" onclick="UI.closeModal('batchAddModal')"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body" style="padding-bottom:8px">
              <p style="font-size:0.82rem;color:var(--text-3);margin-bottom:12px">
                제품명은 필수입니다. 빈 행은 자동으로 건너뜁니다. 저장 후 입출고 등록으로 재고를 추가하세요.
              </p>
              <div class="table-overflow">
                <table class="data-table" style="min-width:860px">
                  <thead><tr>
                    <th style="width:36px"></th>
                    <th style="min-width:140px">업체 *</th>
                    <th style="min-width:170px">제품명 *</th>
                    <th style="width:110px">SKU</th>
                    <th style="width:75px">초기재고</th>
                    <th style="width:75px">최소재고</th>
                    <th style="width:55px">단위</th>
                    <th style="width:90px">매입단가</th>
                    <th style="width:90px">소비자가격</th>
                    <th style="min-width:110px">보관위치</th>
                  </tr></thead>
                  <tbody id="productRowsBody"></tbody>
                </table>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" style="margin-top:10px"
                onclick="Inventory.addProductRow()">
                <i data-lucide="plus"></i>행 추가
              </button>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="UI.closeModal('batchAddModal')">취소</button>
              <button type="button" class="btn btn-primary" id="productBatchSubmitBtn" onclick="Inventory.submitProductRows()">
                <i data-lucide="check"></i>전체 저장
              </button>
            </div>
          </div>
        </div>
      `;

      // 이벤트
      document.getElementById('invSearch')?.addEventListener('input', e => {
        this.filterSearch = e.target.value;
        this._renderTable();
      });
      document.getElementById('invCompanyFilter')?.addEventListener('change', async e => {
        this.filterCompany = e.target.value;
        this.products = await DB.getProducts(this.filterCompany || undefined);
        this._renderTable();
      });

      this._renderTable();
      UI.icons();
    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">오류: ${err.message}</div>`;
    }
  },

  _renderTable() {
    const isAdmin = Auth.isAdmin();
    const canViewAll = Auth.isAdmin() || Auth.isManager() || Auth.isObserver();
    const search = this.filterSearch.toLowerCase();

    let filtered = this.products.filter(p =>
      !search || p.name.toLowerCase().includes(search) || (p.sku || '').toLowerCase().includes(search)
    );

    const tbody = document.getElementById('invBody');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="10">제품이 없습니다</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const isLow = p.current_stock <= p.min_stock;
      const stockPct = p.min_stock > 0 ? Math.min(100, Math.round((p.current_stock / (p.min_stock * 3)) * 100)) : 100;
      const barColor = isLow ? 'var(--red)' : p.current_stock < p.min_stock * 2 ? 'var(--amber)' : 'var(--green)';

      return `<tr>
        ${canViewAll ? `<td>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:8px;height:8px;border-radius:50%;background:${p.company?.logo_color || '#6366f1'};flex-shrink:0"></div>
            <span style="font-size:0.8rem;color:var(--text-2)">${p.company?.company_name || '-'}</span>
          </div>
        </td>` : ''}
        <td class="td-main">${p.name}</td>
        <td style="color:var(--text-3);font-family:monospace;font-size:0.82rem">${p.sku || '-'}</td>
        <td>
          <div class="stock-bar-wrap">
            <strong style="color:${isLow ? 'var(--red)' : 'var(--text-1)'}">
              ${UI.fmtNum(p.current_stock)}${p.unit}
            </strong>
          </div>
          <div class="stock-bar-bg" style="margin-top:4px">
            <div class="stock-bar-fill" style="width:${stockPct}%;background:${barColor}"></div>
          </div>
        </td>
        <td style="color:var(--text-3)">${UI.fmtNum(p.min_stock)}${p.unit}</td>
        <td style="color:var(--text-2);font-size:0.82rem">${p.location || '-'}</td>
        ${isAdmin ? `<td style="color:var(--text-2)">${UI.fmtMoney(p.purchase_price)}</td>` : ''}
        <td style="color:var(--text-2)">${p.consumer_price ? UI.fmtMoney(p.consumer_price) : '-'}</td>
        <td>
          ${isLow
            ? '<span class="badge badge-red">재고 부족</span>'
            : '<span class="badge badge-green">정상</span>'
          }
        </td>
        ${isAdmin ? `<td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-secondary" onclick="Inventory.openEditModal('${p.id}')">
              <i data-lucide="pencil"></i>수정
            </button>
            <button class="btn btn-sm btn-danger" onclick="Inventory.deleteProduct('${p.id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>` : ''}
      </tr>`;
    }).join('');

    UI.icons();
  },

  openBatchAddModal() {
    this.productRowCount = 0;
    const tbody = document.getElementById('productRowsBody');
    if (tbody) tbody.innerHTML = '';
    for (let i = 0; i < 5; i++) this.addProductRow();
    UI.openModal('batchAddModal');
    UI.icons();
  },

  _productRowHtml(n) {
    const s = 'font-size:0.82rem;padding:5px 7px;height:34px';
    const preCompany = this.filterCompany || '';
    const companyOptions = this.companies
      .map(c => `<option value="${c.id}" ${preCompany === c.id ? 'selected' : ''}>${c.company_name}</option>`)
      .join('');
    return `<tr id="productRow-${n}" style="vertical-align:middle">
      <td style="text-align:center">
        <button type="button" onclick="Inventory.removeProductRow(${n})"
          style="background:transparent;border:1px solid var(--border);border-radius:4px;
                 color:var(--text-3);cursor:pointer;width:24px;height:24px;font-size:0.8rem;line-height:1">✕</button>
      </td>
      <td>
        <select class="form-input" id="prCompany-${n}" style="${s}">
          <option value="">선택</option>${companyOptions}
        </select>
      </td>
      <td><input class="form-input" id="prName-${n}" style="${s}" placeholder="제품명 *"></td>
      <td><input class="form-input" id="prSku-${n}" style="${s}" placeholder="NPP-001"></td>
      <td><input class="form-input" id="prStock-${n}" type="number" min="0" value="0" style="${s};width:68px"></td>
      <td><input class="form-input" id="prMinStock-${n}" type="number" min="0" value="0" style="${s};width:68px"></td>
      <td><input class="form-input" id="prUnit-${n}" value="개" style="${s};width:50px"></td>
      <td><input class="form-input" id="prPrice-${n}" type="number" min="0" value="0" style="${s};width:84px"></td>
      <td><input class="form-input" id="prCPrice-${n}" type="number" min="0" value="0" style="${s};width:84px"></td>
      <td><input class="form-input" id="prLocation-${n}" style="${s}" placeholder="A구역 1번"></td>
    </tr>`;
  },

  addProductRow() {
    const n = ++this.productRowCount;
    const tbody = document.getElementById('productRowsBody');
    if (!tbody) return;
    tbody.insertAdjacentHTML('beforeend', this._productRowHtml(n));
    UI.icons();
  },

  removeProductRow(n) {
    document.getElementById(`productRow-${n}`)?.remove();
  },

  async submitProductRows() {
    const toSave = [];
    const errors = [];

    for (let n = 1; n <= this.productRowCount; n++) {
      if (!document.getElementById(`productRow-${n}`)) continue;
      const companyId = document.getElementById(`prCompany-${n}`)?.value?.trim();
      const name      = document.getElementById(`prName-${n}`)?.value?.trim();
      const sku       = document.getElementById(`prSku-${n}`)?.value?.trim();
      const stock     = parseInt(document.getElementById(`prStock-${n}`)?.value || '0');
      const minStock  = parseInt(document.getElementById(`prMinStock-${n}`)?.value || '0');
      const unit      = document.getElementById(`prUnit-${n}`)?.value?.trim() || '개';
      const price     = parseFloat(document.getElementById(`prPrice-${n}`)?.value || '0');
      const cPrice    = parseFloat(document.getElementById(`prCPrice-${n}`)?.value || '0');
      const location  = document.getElementById(`prLocation-${n}`)?.value?.trim();

      if (!companyId && !name) continue; // 빈 행
      if (!companyId) { errors.push(`${n}행: 업체 선택 필요`); continue; }
      if (!name)      { errors.push(`${n}행: 제품명 입력 필요`); continue; }

      toSave.push({ company_id: companyId, name, sku, current_stock: stock,
        min_stock: minStock, unit, purchase_price: price, consumer_price: cPrice, location });
    }

    if (toSave.length === 0) {
      UI.toast(errors.length > 0 ? errors[0] : '입력된 데이터가 없습니다', 'danger');
      return;
    }

    const btn = document.getElementById('productBatchSubmitBtn');
    btn.disabled = true; btn.textContent = '저장 중...';

    let saved = 0; const saveErrors = [];
    for (const row of toSave) {
      try { await DB.createProduct(row); saved++; }
      catch (err) { saveErrors.push(`"${row.name}": ${err.message}`); }
    }

    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="check"></i>전체 저장';
    UI.icons();

    if (saved > 0) {
      const warn = (errors.length + saveErrors.length) > 0 ? ' (일부 실패)' : '';
      UI.toast(`${saved}개 제품 추가 완료${warn} ✓`, 'success');
      if (saveErrors.length === 0) UI.closeModal('batchAddModal');
      await this.render();
    } else {
      UI.toast('저장 실패: ' + (saveErrors[0] || errors[0] || '알 수 없는 오류'), 'danger');
    }
  },

  openEditModal(id) {
    const p = this.products.find(x => x.id === id);
    if (!p) return;
    this.editingId = id;
    document.getElementById('productModalTitle').textContent = '제품 수정';
    document.getElementById('productSubmitBtn').textContent = '저장';
    document.getElementById('pCompany').value = p.company_id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pSku').value = p.sku || '';
    document.getElementById('pStock').value = p.current_stock;
    document.getElementById('pMinStock').value = p.min_stock;
    document.getElementById('pUnit').value = p.unit;
    document.getElementById('pPrice').value = p.purchase_price;
    document.getElementById('pConsumerPrice').value = p.consumer_price || 0;
    document.getElementById('pLocation').value = p.location || '';
    UI.openModal('productModal');
    UI.icons();
  },

  async submitProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('productSubmitBtn');
    btn.disabled = true;

    const data = {
      company_id: document.getElementById('pCompany').value,
      name: document.getElementById('pName').value.trim(),
      sku: document.getElementById('pSku').value.trim(),
      current_stock: parseInt(document.getElementById('pStock').value) || 0,
      min_stock: parseInt(document.getElementById('pMinStock').value) || 0,
      unit: document.getElementById('pUnit').value.trim() || '개',
      purchase_price: parseFloat(document.getElementById('pPrice').value) || 0,
      consumer_price: parseFloat(document.getElementById('pConsumerPrice').value) || 0,
      location: document.getElementById('pLocation').value.trim(),
    };

    try {
      await DB.updateProduct(this.editingId, data);
      UI.toast('제품이 수정되었습니다');
      UI.closeModal('productModal');
      await this.render();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  },

  async deleteProduct(id) {
    if (!await UI.confirm('이 제품을 삭제하시겠습니까?')) return;
    try {
      await DB.deleteProduct(id);
      UI.toast('삭제되었습니다');
      await this.render();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    }
  },

  downloadTemplate() {
    const sample = [
      { '업체코드(필수)': 'KE2024', '제품명(필수)': '예시 제품', 'SKU': 'NPP-001', '매입단가': 15000, '현재재고': 100, '최소재고': 20, '단위': '개', '보관위치': 'A구역 1번' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws['!cols'] = [{wch:14},{wch:24},{wch:14},{wch:12},{wch:12},{wch:12},{wch:8},{wch:16}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '제품등록양식');
    XLSX.writeFile(wb, 'product_upload_template.xlsx');
  },

  async downloadExcel() {
    const companyId = Auth.isClient() ? Auth.profile.id : (this.filterCompany || undefined);
    const products = await DB.getProducts(companyId);

    const rows = products.map(p => ({
      '업체코드': p.company?.company_name ? '' : '',  // filled below
      '업체명': p.company?.company_name || '',
      '제품명': p.name,
      'SKU': p.sku || '',
      '현재재고': p.current_stock,
      '최소재고': p.min_stock,
      '단위': p.unit,
      '매입단가(원)': p.purchase_price,
      '보관위치': p.location || '',
      '상태': p.current_stock <= p.min_stock ? '재고부족' : '정상',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:12},{wch:18},{wch:24},{wch:14},{wch:10},{wch:10},{wch:8},{wch:14},{wch:16},{wch:8}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '재고현황');
    const today = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `재고현황_${today}.xlsx`);
  },

  async handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    const companies = await DB.getClients();
    const companyMap = {};
    companies.forEach(c => { companyMap[c.company_code.toUpperCase()] = c.id; });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        let created = 0, updated = 0;
        const errors = [];

        for (const [i, row] of rows.entries()) {
          const lineNum = i + 2;
          const code = String(row['업체코드(필수)'] || row['업체코드'] || '').toUpperCase().trim();
          const name = String(row['제품명(필수)'] || row['제품명'] || '').trim();
          const sku  = String(row['SKU'] || '').trim();

          if (!code) { errors.push(`${lineNum}행: 업체코드 누락`); continue; }
          if (!companyMap[code]) { errors.push(`${lineNum}행: 업체코드 "${code}" 없음`); continue; }
          if (!name) { errors.push(`${lineNum}행: 제품명 누락`); continue; }

          const companyId = companyMap[code];
          const productData = {
            company_id: companyId,
            name,
            sku,
            purchase_price: parseFloat(row['매입단가'] || 0),
            current_stock: parseInt(row['현재재고'] || 0),
            min_stock: parseInt(row['최소재고'] || 0),
            unit: String(row['단위'] || '개').trim(),
            location: String(row['보관위치'] || '').trim(),
          };

          try {
            // SKU 있으면 중복 확인 후 업데이트
            if (sku) {
              const existing = this.products.find(p => p.sku?.toUpperCase() === sku.toUpperCase() && p.company_id === companyId);
              if (existing) {
                await DB.updateProduct(existing.id, productData);
                updated++;
                continue;
              }
            }
            await DB.createProduct(productData);
            created++;
          } catch(err) {
            errors.push(`${lineNum}행 오류: ${err.message}`);
          }
        }

        const msg = `✅ 신규 ${created}건 등록, 수정 ${updated}건${errors.length > 0 ? `\n\n⚠️ 오류 ${errors.length}건:\n` + errors.slice(0,10).join('\n') : ''}`;
        alert(msg);
        await this.render();
      } catch(err) {
        alert('업로드 오류: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  },
};
