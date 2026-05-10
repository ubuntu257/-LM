// ═══════════════════════════════════════════
// Inventory Page
// ═══════════════════════════════════════════
const Inventory = {
  products: [],
  companies: [],
  filterCompany: '',
  filterSearch: '',
  editingId: null,

  async render() {
    const el = document.getElementById('pg-inventory');
    UI.loading(el);

    try {
      const isAdmin = Auth.isAdmin();
      const isManager = Auth.isManager();
      const canViewAll = isAdmin || isManager;

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
            ${isAdmin ? `
            <button class="btn btn-secondary btn-sm" onclick="Inventory.downloadTemplate()">
              <i data-lucide="download"></i>양식 다운로드
            </button>
            <button class="btn btn-primary btn-sm" onclick="Inventory.openAddModal()">
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
                <th>상태</th>
                ${isAdmin ? '<th>관리</th>' : ''}
              </tr></thead>
              <tbody id="invBody"></tbody>
            </table>
          </div>
        </div>

        <!-- 제품 추가/수정 모달 -->
        <div class="modal-overlay" id="productModal">
          <div class="modal" style="max-width:520px">
            <div class="modal-header">
              <div class="modal-title" id="productModalTitle">제품 추가</div>
              <button class="btn-icon" onclick="UI.closeModal('productModal')">
                <i data-lucide="x"></i>
              </button>
            </div>
            <form id="productForm" onsubmit="Inventory.submitProduct(event)">
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label">업체 *</label>
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
                    <label class="form-label">초기 재고</label>
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
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px">
                  <div class="form-group" style="margin:0">
                    <label class="form-label">매입 단가 (원)</label>
                    <input class="form-input" id="pPrice" type="number" min="0" value="0">
                  </div>
                  <div class="form-group" style="margin:0">
                    <label class="form-label">보관 위치</label>
                    <input class="form-input" id="pLocation" placeholder="예: A구역 3번 선반">
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="UI.closeModal('productModal')">취소</button>
                <button type="submit" class="btn btn-primary" id="productSubmitBtn">추가</button>
              </div>
            </form>
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
    const canViewAll = Auth.isAdmin() || Auth.isManager();
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

  openAddModal() {
    this.editingId = null;
    document.getElementById('productModalTitle').textContent = '제품 추가';
    document.getElementById('productSubmitBtn').textContent = '추가';
    document.getElementById('productForm').reset();
    document.getElementById('pUnit').value = '개';
    if (this.filterCompany) document.getElementById('pCompany').value = this.filterCompany;
    UI.openModal('productModal');
    UI.icons();
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
      location: document.getElementById('pLocation').value.trim(),
    };

    try {
      if (this.editingId) {
        await DB.updateProduct(this.editingId, data);
        UI.toast('제품이 수정되었습니다');
      } else {
        await DB.createProduct(data);
        UI.toast('제품이 추가되었습니다');
      }
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
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '제품등록양식');
    XLSX.writeFile(wb, 'product_template.xlsx');
  },
};
