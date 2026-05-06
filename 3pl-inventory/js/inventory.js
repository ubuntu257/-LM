// 3PL - Inventory Module
const Inventory = {
  searchTerm: '',
  categoryFilter: 'all',
  statusFilter: 'all',
  companyFilter: 'all',

  render(companyId) {
    const page = document.getElementById('page-inventory');
    const isAdmin = DB.getCurrentUser()?.role === 'admin';
    page.innerHTML = `
      <div class="inventory-toolbar">
        <div class="toolbar-left">
          <div class="search-bar">
            <span class="search-icon"><i data-lucide="search" style="width:18px;height:18px"></i></span>
            <input type="text" id="inventorySearch" placeholder="제품명 또는 SKU 검색..." value="${this.searchTerm}">
          </div>
          ${isAdmin ? `<select class="filter-select" id="filterCompany">
            <option value="all">전체 업체</option>
          </select>` : ''}
          <select class="filter-select" id="filterCategory">
            <option value="all">전체 카테고리</option>
          </select>
          <select class="filter-select" id="filterStatus">
            <option value="all">전체 상태</option>
            <option value="safe">정상</option>
            <option value="warning">주의</option>
            <option value="danger">부족</option>
          </select>
        </div>
        <div class="toolbar-right">
          <button class="btn btn-secondary" onclick="Inventory.downloadExcel()">
            <i data-lucide="download" style="width:16px;height:16px"></i>엑셀 다운로드
          </button>
          ${isAdmin ? `<button class="btn btn-secondary" onclick="Inventory.downloadTemplate()">
            <i data-lucide="download" style="width:16px;height:16px"></i>양식 다운로드
          </button>
          <label class="btn btn-secondary" style="cursor:pointer">
            <i data-lucide="upload" style="width:16px;height:16px"></i>엑셀 업로드
            <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="Inventory.handleExcelUpload(event)">
          </label>
          <button class="btn btn-primary" onclick="Inventory.showAddModal()">
            <i data-lucide="plus" style="width:16px;height:16px"></i>제품 추가
          </button>` : ''}
        </div>
      </div>
      <div class="inventory-table-wrap animate-fade-in">
        <table class="data-table">
          <thead><tr>
            <th>제품정보</th><th>카테고리</th><th>재고현황</th><th>위치</th><th>입고단가</th><th>판매가격</th>
            ${isAdmin ? '<th>관리</th>' : ''}
          </tr></thead>
          <tbody id="inventoryBody"></tbody>
        </table>
        <div class="table-footer"><span class="showing" id="inventoryCount"></span></div>
      </div>
      ${isAdmin ? this.getModalHTML() : ''}
    `;
    if (isAdmin) this.populateCompanies();
    this.populateCategories(companyId);
    this.bindEvents(companyId);
    this.refreshTable(companyId);
    if (window.lucide) lucide.createIcons();
  },

  populateCompanies() {
    const sel = document.getElementById('filterCompany');
    if (!sel) return;
    const companies = DB.getCompanies().filter(c => c.role === 'client');
    companies.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      sel.appendChild(o);
    });
    sel.value = this.companyFilter;
  },

  populateCategories(companyId) {
    const filterCid = this.companyFilter !== 'all' ? this.companyFilter : companyId;
    const products = DB.getProducts(filterCid);
    const cats = [...new Set(products.map(p => p.category))];
    const sel = document.getElementById('filterCategory');
    if (!sel) return;
    cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
    sel.value = this.categoryFilter;
    document.getElementById('filterStatus').value = this.statusFilter;
  },

  bindEvents(companyId) {
    document.getElementById('inventorySearch')?.addEventListener('input', (e) => {
      this.searchTerm = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
    document.getElementById('filterCompany')?.addEventListener('change', (e) => {
      this.companyFilter = e.target.value;
      // Re-populate categories when company changes
      const catSel = document.getElementById('filterCategory');
      if (catSel) {
        catSel.innerHTML = '<option value="all">전체 카테고리</option>';
        this.categoryFilter = 'all';
        const cid = this.companyFilter !== 'all' ? this.companyFilter : DB.getCurrentUser()?.id;
        const prods = DB.getProducts(cid);
        [...new Set(prods.map(p => p.category))].forEach(c => {
          const o = document.createElement('option'); o.value = c; o.textContent = c; catSel.appendChild(o);
        });
      }
      this.refreshTable(DB.getCurrentUser()?.id);
    });
    document.getElementById('filterCategory')?.addEventListener('change', (e) => {
      this.categoryFilter = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
    document.getElementById('filterStatus')?.addEventListener('change', (e) => {
      this.statusFilter = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
  },

  refreshTable(companyId) {
    // If admin selected a specific company, use that
    const effectiveId = (this.companyFilter !== 'all') ? this.companyFilter : companyId;
    let products = DB.getProducts(effectiveId);

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (this.categoryFilter !== 'all') products = products.filter(p => p.category === this.categoryFilter);
    if (this.statusFilter !== 'all') {
      products = products.filter(p => {
        const ratio = p.safetyStock > 0 ? p.currentStock / p.safetyStock : 999;
        if (this.statusFilter === 'danger') return ratio <= 0.5;
        if (this.statusFilter === 'warning') return ratio > 0.5 && ratio <= 1;
        return ratio > 1;
      });
    }
    const isAdmin = DB.getCurrentUser()?.role === 'admin';
    const body = document.getElementById('inventoryBody');
    if (!body) return;

    body.innerHTML = products.length === 0
      ? `<tr><td colspan="${isAdmin?7:6}" style="text-align:center;padding:40px;color:var(--text-tertiary)">제품이 없습니다</td></tr>`
      : products.map(p => {
        const ratio = p.safetyStock > 0 ? p.currentStock / p.safetyStock : 999;
        const level = ratio <= 0.5 ? 'danger' : ratio <= 1 ? 'warning' : 'safe';
        const pct = Math.min(p.safetyStock > 0 ? ratio * 50 : 100, 100);
        const comp = DB.getCompany(p.companyId);
        const color = comp ? comp.logoColor : '#6366f1';
        return `<tr>
          <td><div class="product-cell">
            <div class="product-color" style="background:${color}"></div>
            <div class="product-info">
              <div class="product-name">${p.name}</div>
              <div class="product-sku">${p.sku}${isAdmin && comp ? ' · '+comp.name : ''}</div>
            </div>
          </div></td>
          <td><span class="badge badge-info">${p.category}</span></td>
          <td><div class="stock-bar">
            <div class="bar-track"><div class="bar-fill ${level}" style="width:${pct}%"></div></div>
            <span class="stock-num" style="color:var(--color-${level})">${p.currentStock.toLocaleString()} ${p.unit}</span>
          </div></td>
          <td><span class="location-tag"><i data-lucide="map-pin" style="width:12px;height:12px"></i>${p.location}</span></td>
          <td style="color:var(--text-secondary)">₩${(p.incomingPrice||0).toLocaleString()}</td>
          <td style="color:var(--text-secondary)">₩${p.price.toLocaleString()}</td>
          ${isAdmin ? `<td><div class="table-actions">
            <button onclick="Inventory.showEditModal('${p.id}')" title="수정"><i data-lucide="edit-2" style="width:15px;height:15px"></i></button>
            <button class="delete" onclick="Inventory.deleteProduct('${p.id}')" title="삭제"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>
          </div></td>` : ''}
        </tr>`;
      }).join('');

    document.getElementById('inventoryCount').textContent = `총 ${products.length}개 제품`;
    if (window.lucide) lucide.createIcons();
  },

  // ── Excel Upload (관리자 전용) ──
  handleExcelUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);
        if (rows.length === 0) { alert('엑셀 파일에 데이터가 없습니다.'); return; }

        const companies = DB.getCompanies().filter(c => c.role === 'client');
        const compMap = {};
        companies.forEach(c => { compMap[c.name] = c.id; compMap[c.code] = c.id; });

        const products = [];
        const errors = [];
        rows.forEach((row, i) => {
          const name = row['제품명'] || row['name'] || '';
          const sku = row['SKU'] || row['sku'] || '';
          const category = row['카테고리'] || row['category'] || '기타';
          const stock = parseInt(row['재고수량'] || row['currentStock'] || row['stock'] || 0);
          const safety = parseInt(row['안전재고'] || row['safetyStock'] || 0);
          const unit = row['단위'] || row['unit'] || '개';
          const location = row['위치'] || row['location'] || '-';
          const incomingPrice = parseInt(row['입고단가'] || row['incomingPrice'] || 0);
          const price = parseInt(row['판매가격'] || row['단가'] || row['price'] || 0);
          const compName = row['업체명'] || row['업체'] || row['company'] || '';
          const companyId = compMap[compName] || companies[0]?.id;

          if (!name) { errors.push(`행 ${i+2}: 제품명이 없습니다`); return; }

          products.push({
            companyId, name, sku, category,
            currentStock: stock, safetyStock: safety,
            unit, location, incomingPrice, price, weight: 0.1
          });
        });

        if (products.length === 0) {
          alert('등록할 수 있는 제품이 없습니다.\n' + errors.join('\n'));
          return;
        }
        const count = DB.addBulkProducts(products);
        let msg = `✅ ${count}개 제품이 등록되었습니다!`;
        if (errors.length) msg += `\n\n⚠️ ${errors.length}건 오류:\n` + errors.slice(0,5).join('\n');
        alert(msg);
        this.render(DB.getCurrentUser()?.id);
      } catch (err) {
        alert('엑셀 파일 처리 중 오류가 발생했습니다.\n' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  },

  // ── Excel Download (모든 사용자) ──
  downloadExcel() {
    const user = DB.getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const effectiveId = (isAdmin && this.companyFilter !== 'all') ? this.companyFilter : user.id;
    const products = DB.getProducts(effectiveId);
    if (products.length === 0) { alert('다운로드할 재고 데이터가 없습니다.'); return; }

    const data = products.map(p => {
      const comp = DB.getCompany(p.companyId);
      const ratio = p.safetyStock > 0 ? p.currentStock / p.safetyStock : 999;
      const status = ratio <= 0.5 ? '부족' : ratio <= 1 ? '주의' : '정상';
      return {
        '업체명': comp ? comp.name : '-',
        '제품명': p.name,
        'SKU': p.sku,
        '카테고리': p.category,
        '현재재고': p.currentStock,
        '안전재고': p.safetyStock,
        '단위': p.unit,
        '상태': status,
        '창고위치': p.location,
        '입고단가(원)': p.incomingPrice || 0,
        '판매가격(원)': p.price
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      {wch:18},{wch:25},{wch:16},{wch:12},{wch:10},{wch:10},{wch:6},{wch:6},{wch:10},{wch:12},{wch:12}
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'inventory');
    const today = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, 'inventory_' + today + '.xlsx');
  },

  downloadTemplate() {
    const sample = [
      { '제품명': '무선 이어폰', 'SKU': 'WE-001', '카테고리': '전자제품', '재고수량': 100, '안전재고': 20, '단위': '개', '위치': 'A-01-01', '판매가격': 50000, '업체명': 'KE2024' },
      { '제품명': '유기농 주스', 'SKU': 'OJ-001', '카테고리': '음료', '재고수량': 500, '안전재고': 100, '단위': '병', '위치': 'B-02-01', '판매가격': 3000, '업체명': 'FF2024' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws['!cols'] = [{wch:15},{wch:12},{wch:10},{wch:10},{wch:10},{wch:6},{wch:10},{wch:10},{wch:10}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'template');
    XLSX.writeFile(wb, 'product_upload_template.xlsx');
  },

  getModalHTML() {
    const companies = DB.getCompanies().filter(c => c.role === 'client');
    return `<div class="modal-overlay" id="productModal">
      <div class="modal">
        <div class="modal-header">
          <h3 id="productModalTitle">제품 추가</h3>
          <button class="modal-close" onclick="Inventory.closeModal()"><i data-lucide="x" style="width:20px;height:20px"></i></button>
        </div>
        <form id="productForm" onsubmit="Inventory.saveProduct(event)">
          <input type="hidden" id="editProductId">
          <div class="form-group"><label class="form-label">업체</label>
            <select class="form-select" id="prodCompany" required>
              ${companies.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}
            </select></div>
          <div class="form-group"><label class="form-label">제품명</label>
            <input class="form-input" id="prodName" required placeholder="제품명을 입력하세요"></div>
          <div class="form-group"><label class="form-label">SKU</label>
            <input class="form-input" id="prodSku" required placeholder="SKU 코드"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">카테고리</label>
              <input class="form-input" id="prodCategory" required placeholder="예: 전자제품"></div>
            <div class="form-group"><label class="form-label">단위</label>
              <input class="form-input" id="prodUnit" required placeholder="예: 개, 박스"></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">현재 재고</label>
              <input class="form-input" id="prodStock" type="number" min="0" required></div>
            <div class="form-group"><label class="form-label">안전 재고</label>
              <input class="form-input" id="prodSafety" type="number" min="0" required></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">입고단가 (₩)</label>
              <input class="form-input" id="prodIncomingPrice" type="number" min="0" required></div>
            <div class="form-group"><label class="form-label">판매가격 (₩)</label>
              <input class="form-input" id="prodPrice" type="number" min="0" required></div>
            <div class="form-group"><label class="form-label">창고 위치</label>
              <input class="form-input" id="prodLocation" required placeholder="예: A-01-01"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="Inventory.closeModal()">취소</button>
            <button type="submit" class="btn btn-primary">저장</button>
          </div>
        </form>
      </div>
    </div>`;
  },

  showAddModal() {
    document.getElementById('productModalTitle').textContent = '제품 추가';
    document.getElementById('editProductId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.add('active');
  },

  showEditModal(id) {
    const p = DB.getProduct(id);
    if (!p) return;
    document.getElementById('productModalTitle').textContent = '제품 수정';
    document.getElementById('editProductId').value = id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodSku').value = p.sku;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodUnit').value = p.unit;
    document.getElementById('prodStock').value = p.currentStock;
    document.getElementById('prodSafety').value = p.safetyStock;
    document.getElementById('prodIncomingPrice').value = p.incomingPrice || 0;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodLocation').value = p.location;
    const compSel = document.getElementById('prodCompany');
    if (compSel) compSel.value = p.companyId;
    document.getElementById('productModal').classList.add('active');
  },

  closeModal() { document.getElementById('productModal')?.classList.remove('active'); },

  saveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    const user = DB.getCurrentUser();
    const data = {
      companyId: document.getElementById('prodCompany')?.value || user.id,
      name: document.getElementById('prodName').value,
      sku: document.getElementById('prodSku').value,
      category: document.getElementById('prodCategory').value,
      unit: document.getElementById('prodUnit').value,
      currentStock: parseInt(document.getElementById('prodStock').value),
      safetyStock: parseInt(document.getElementById('prodSafety').value),
      incomingPrice: parseInt(document.getElementById('prodIncomingPrice').value),
      price: parseInt(document.getElementById('prodPrice').value),
      location: document.getElementById('prodLocation').value,
      weight: 0.1
    };
    if (id) DB.updateProduct(id, data);
    else DB.addProduct(data);
    this.closeModal();
    this.refreshTable(user.id);
  },

  deleteProduct(id) {
    if (!confirm('이 제품을 삭제하시겠습니까?')) return;
    DB.deleteProduct(id);
    this.refreshTable(DB.getCurrentUser()?.id);
  }
};
