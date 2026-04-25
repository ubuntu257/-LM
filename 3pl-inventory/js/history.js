// 3PL - History Module
const History = {
  typeFilter: 'all',
  companyFilter: 'all',
  viewMode: 'list',
  dateFrom: '',
  dateTo: '',

  render(companyId) {
    const page = document.getElementById('page-history');
    const isAdmin = DB.getCurrentUser()?.role === 'admin';
    page.innerHTML = `
      <div class="history-toolbar">
        <div class="history-filters">
          <select class="filter-select" id="historyType">
            <option value="all">전체 내역</option>
            <option value="inbound">입고</option>
            <option value="outbound">출고</option>
          </select>
          ${isAdmin ? `<select class="filter-select" id="historyCompany">
            <option value="all">전체 업체</option>
            ${DB.getCompanies().filter(c=>c.role==='client').map(c=>`<option value="${c.id}" ${this.companyFilter===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>` : ''}
          <input type="date" class="date-input" id="historyFrom" value="${this.dateFrom}">
          <span style="color:var(--text-tertiary)">~</span>
          <input type="date" class="date-input" id="historyTo" value="${this.dateTo}">
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <div class="txn-type-toggle" style="margin-right:10px;">
            <button type="button" class="txn-type-btn ${this.viewMode==='list'?'active-inbound':''}" onclick="History.setViewMode('list')">내역 보기</button>
            <button type="button" class="txn-type-btn ${this.viewMode==='stats'?'active-outbound':''}" onclick="History.setViewMode('stats')">통계 보기</button>
          </div>
          <button class="btn btn-secondary" onclick="History.downloadExcel()">
            <i data-lucide="download" style="width:16px;height:16px"></i>엑셀 다운로드
          </button>
          ${isAdmin ? `<label class="btn btn-secondary" style="cursor:pointer">
            <i data-lucide="upload" style="width:16px;height:16px"></i>엑셀 업로드
            <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="History.handleExcelUpload(event)">
          </label>
          <button class="btn btn-primary" onclick="History.showTxnModal()">
            <i data-lucide="plus" style="width:16px;height:16px"></i>입출고 등록
          </button>` : ''}
        </div>
      </div>
      <div class="history-table-wrap animate-fade-in">
        <table class="data-table">
          <thead id="historyHead"></thead>
          <tbody id="historyBody"></tbody>
        </table>
        <div class="table-footer"><span class="showing" id="historyCount"></span></div>
      </div>
      ${this.getTxnModalHTML(companyId)}
    `;
    this.bindEvents();
    this.refreshTable(companyId);
    if (window.lucide) lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('historyType')?.addEventListener('change', e => {
      this.typeFilter = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
    document.getElementById('historyCompany')?.addEventListener('change', e => {
      this.companyFilter = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
    document.getElementById('historyFrom')?.addEventListener('change', e => {
      this.dateFrom = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
    document.getElementById('historyTo')?.addEventListener('change', e => {
      this.dateTo = e.target.value;
      this.refreshTable(DB.getCurrentUser()?.id);
    });
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.render(DB.getCurrentUser()?.id);
  },

  refreshTable(companyId) {
    const user = DB.getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const effectiveId = (isAdmin && this.companyFilter !== 'all') ? this.companyFilter : user.id;
    let txns = DB.getTransactions(effectiveId);

    if (this.typeFilter !== 'all') txns = txns.filter(t => t.type === this.typeFilter);
    if (this.dateFrom) txns = txns.filter(t => new Date(t.date) >= new Date(this.dateFrom));
    if (this.dateTo) {
      const to = new Date(this.dateTo); to.setHours(23,59,59);
      txns = txns.filter(t => new Date(t.date) <= to);
    }
    
    const head = document.getElementById('historyHead');
    const body = document.getElementById('historyBody');
    if (!body || !head) return;

    if (this.viewMode === 'list') {
      head.innerHTML = `<tr><th>일시</th><th>유형</th><th>제품</th>${isAdmin?'<th>업체</th>':''}<th>수량</th><th>참조번호</th><th>비고</th></tr>`;
      body.innerHTML = txns.length === 0
        ? `<tr><td colspan="${isAdmin?7:6}" style="text-align:center;padding:40px;color:var(--text-tertiary)">입출고 내역이 없습니다</td></tr>`
        : txns.slice(0, 100).map(t => {
          const product = DB.getProduct(t.productId);
          const company = DB.getCompany(t.companyId);
          const d = new Date(t.date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          return `<tr>
            <td style="color:var(--text-secondary);font-size:0.85rem">${dateStr}</td>
            <td><span class="type-badge ${t.type}"><i data-lucide="${t.type==='inbound'?'arrow-down':'arrow-up'}" style="width:13px;height:13px"></i>${t.type==='inbound'?'입고':'출고'}</span></td>
            <td style="font-weight:500">${product?product.name:'삭제됨'}</td>
            ${isAdmin ? `<td style="color:var(--text-tertiary)">${company?company.name:'-'}</td>` : ''}
            <td style="font-weight:700;color:${t.type==='inbound'?'var(--color-inbound)':'var(--color-outbound)'}">
              ${t.type==='inbound'?'+':'-'}${t.quantity.toLocaleString()}
            </td>
            <td><span class="ref-tag">${t.reference}</span></td>
            <td style="color:var(--text-tertiary)">${t.note||'-'}</td>
          </tr>`;
        }).join('');
      document.getElementById('historyCount').textContent = `총 ${txns.length}건`;
    } else {
      // 통계 뷰 모드
      head.innerHTML = `<tr>${isAdmin?'<th>업체</th>':''}<th>제품</th><th style="text-align:right">총 입고량</th><th style="text-align:right">총 출고량</th><th style="text-align:right">월평균 입고</th><th style="text-align:right">월평균 출고</th><th style="text-align:right">누적 일출고량</th></tr>`;
      
      const stats = {};
      txns.forEach(t => {
        if (!stats[t.productId]) {
          stats[t.productId] = { in: 0, out: 0, firstDate: new Date(t.date), companyId: t.companyId };
        }
        if (new Date(t.date) < stats[t.productId].firstDate) stats[t.productId].firstDate = new Date(t.date);
        if (t.type === 'inbound') stats[t.productId].in += t.quantity;
        else stats[t.productId].out += t.quantity;
      });

      const now = new Date();
      const statRows = Object.keys(stats).map(pid => {
        const product = DB.getProduct(pid);
        const company = DB.getCompany(stats[pid].companyId);
        const s = stats[pid];
        
        let daysDiff = (now - s.firstDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 1) daysDiff = 1;
        let monthsDiff = daysDiff / 30;
        if (monthsDiff < 1) monthsDiff = 1;

        const avgInM = Math.round(s.in / monthsDiff);
        const avgOutM = Math.round(s.out / monthsDiff);
        const avgOutD = (s.out / daysDiff).toFixed(1);

        return `<tr>
          ${isAdmin ? `<td style="color:var(--text-tertiary)">${company?company.name:'-'}</td>` : ''}
          <td style="font-weight:500">${product?product.name:'삭제됨'}</td>
          <td style="text-align:right;color:var(--color-inbound);font-weight:600">${s.in.toLocaleString()}</td>
          <td style="text-align:right;color:var(--color-outbound);font-weight:600">${s.out.toLocaleString()}</td>
          <td style="text-align:right">${avgInM.toLocaleString()}</td>
          <td style="text-align:right">${avgOutM.toLocaleString()}</td>
          <td style="text-align:right;font-weight:600;color:var(--accent-color)">${avgOutD}</td>
        </tr>`;
      });

      body.innerHTML = statRows.length === 0
        ? `<tr><td colspan="${isAdmin?7:6}" style="text-align:center;padding:40px;color:var(--text-tertiary)">통계 데이터가 없습니다</td></tr>`
        : statRows.join('');
      document.getElementById('historyCount').textContent = `총 ${statRows.length}개 제품 통계`;
    }

    if (window.lucide) lucide.createIcons();
  },

  // ── Excel Upload for Transactions ──
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

        const allProducts = DB.getProducts();
        const skuMap = {};
        allProducts.forEach(p => { skuMap[p.sku] = p; if (p.name) skuMap[p.name] = p; });

        const txns = [];
        const errors = [];
        const user = DB.getCurrentUser();
        rows.forEach((row, i) => {
          const typeRaw = (row['유형'] || row['type'] || '').toString().toLowerCase();
          const type = (typeRaw === '입고' || typeRaw === 'inbound' || typeRaw === 'in') ? 'inbound' : 'outbound';
          const productKey = row['제품SKU'] || row['SKU'] || row['sku'] || row['제품명'] || row['product'] || '';
          const product = skuMap[productKey];
          const quantity = parseInt(row['수량'] || row['quantity'] || row['qty'] || 0);
          const reference = row['참조번호'] || row['reference'] || row['ref'] || 'EXCEL-IMPORT';
          const note = row['비고'] || row['note'] || '엑셀 일괄 등록';

          if (!product) { errors.push(`행 ${i+2}: 제품 "${productKey}"을 찾을 수 없습니다`); return; }
          if (!quantity || quantity <= 0) { errors.push(`행 ${i+2}: 수량이 유효하지 않습니다`); return; }

          txns.push({
            companyId: product.companyId,
            productId: product.id,
            type, quantity, reference, note,
            processedBy: user.contactName
          });
        });

        if (txns.length === 0) {
          alert('등록할 수 있는 입출고 건이 없습니다.\n' + errors.join('\n'));
          return;
        }
        const count = DB.addBulkTransactions(txns);
        let msg = `✅ ${count}건의 입출고가 등록되었습니다!`;
        if (errors.length) msg += `\n\n⚠️ ${errors.length}건 오류:\n` + errors.slice(0,5).join('\n');
        alert(msg);
        this.render(user.id);
      } catch (err) {
        alert('엑셀 파일 처리 중 오류가 발생했습니다.\n' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  },

  downloadExcel() {
    const user = DB.getCurrentUser();
    const isAdmin = user?.role === 'admin';
    const effectiveId = (isAdmin && this.companyFilter !== 'all') ? this.companyFilter : user.id;
    let txns = DB.getTransactions(effectiveId);

    if (this.typeFilter !== 'all') txns = txns.filter(t => t.type === this.typeFilter);
    if (this.dateFrom) txns = txns.filter(t => new Date(t.date) >= new Date(this.dateFrom));
    if (this.dateTo) {
      const to = new Date(this.dateTo); to.setHours(23,59,59);
      txns = txns.filter(t => new Date(t.date) <= to);
    }

    if (txns.length === 0) { alert('다운로드할 데이터가 없습니다.'); return; }
    
    let ws;
    if (this.viewMode === 'list') {
      const data = txns.map(t => {
        const product = DB.getProduct(t.productId);
        const company = DB.getCompany(t.companyId);
        const d = new Date(t.date);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        return {
          '업체명': company ? company.name : '-',
          '일시': dateStr,
          '유형': t.type === 'inbound' ? '입고' : '출고',
          '제품명': product ? product.name : '삭제됨',
          '수량': t.quantity,
          '참조번호': t.reference,
          '비고': t.note || ''
        };
      });
      ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:15},{wch:18},{wch:6},{wch:25},{wch:8},{wch:16},{wch:20}];
    } else {
      const stats = {};
      txns.forEach(t => {
        if (!stats[t.productId]) {
          stats[t.productId] = { in: 0, out: 0, firstDate: new Date(t.date), companyId: t.companyId };
        }
        if (new Date(t.date) < stats[t.productId].firstDate) stats[t.productId].firstDate = new Date(t.date);
        if (t.type === 'inbound') stats[t.productId].in += t.quantity;
        else stats[t.productId].out += t.quantity;
      });

      const now = new Date();
      const data = Object.keys(stats).map(pid => {
        const product = DB.getProduct(pid);
        const company = DB.getCompany(stats[pid].companyId);
        const s = stats[pid];
        let daysDiff = (now - s.firstDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 1) daysDiff = 1;
        let monthsDiff = daysDiff / 30;
        if (monthsDiff < 1) monthsDiff = 1;

        return {
          '업체명': company ? company.name : '-',
          '제품명': product ? product.name : '삭제됨',
          '총 입고량': s.in,
          '총 출고량': s.out,
          '월평균 입고량': Math.round(s.in / monthsDiff),
          '월평균 출고량': Math.round(s.out / monthsDiff),
          '누적 일평균 출고량': Number((s.out / daysDiff).toFixed(1))
        };
      });
      ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:15},{wch:25},{wch:12},{wch:12},{wch:15},{wch:15},{wch:18}];
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, this.viewMode === 'list' ? 'History' : 'Statistics');
    const today = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `history_${this.viewMode}_${today}.xlsx`);
  },

  downloadTxnTemplate() {
    const products = DB.getProducts();
    const sample = [
      { '유형': '입고', '제품SKU': products[0]?.sku || 'WBE-PRO-001', '수량': 100, '참조번호': 'PO-2024-0001', '비고': '정기 입고' },
      { '유형': '출고', '제품SKU': products[1]?.sku || 'CHG-65W-002', '수량': 50, '참조번호': 'SO-2024-0001', '비고': '주문 출고' },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    ws['!cols'] = [{wch:8},{wch:16},{wch:8},{wch:16},{wch:14}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'template');
    XLSX.writeFile(wb, 'transaction_upload_template.xlsx');
  },

  getTxnModalHTML(companyId) {
    const products = DB.getProducts(companyId);
    return `<div class="modal-overlay" id="txnModal">
      <div class="modal">
        <div class="modal-header">
          <h3>입출고 등록</h3>
          <button class="modal-close" onclick="History.closeTxnModal()"><i data-lucide="x" style="width:20px;height:20px"></i></button>
        </div>
        <form id="txnForm" onsubmit="History.saveTxn(event)">
          <div class="txn-type-toggle">
            <button type="button" class="txn-type-btn active-inbound" id="txnTypeIn" onclick="History.setTxnType('inbound')">📥 입고</button>
            <button type="button" class="txn-type-btn" id="txnTypeOut" onclick="History.setTxnType('outbound')">📤 출고</button>
          </div>
          <input type="hidden" id="txnType" value="inbound">
          <div class="form-group"><label class="form-label">제품 선택</label>
            <select class="form-select" id="txnProduct" required>
              <option value="">제품을 선택하세요</option>
              ${products.map(p=>`<option value="${p.id}">${p.name} (재고: ${p.currentStock}${p.unit})</option>`).join('')}
            </select></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="form-group"><label class="form-label">수량</label>
              <input class="form-input" id="txnQty" type="number" min="1" required></div>
            <div class="form-group"><label class="form-label">참조번호</label>
              <input class="form-input" id="txnRef" placeholder="PO-2024-0001"></div>
          </div>
          <div class="form-group"><label class="form-label">비고</label>
            <input class="form-input" id="txnNote" placeholder="메모"></div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="History.closeTxnModal()">취소</button>
            <button type="submit" class="btn btn-primary">등록</button>
          </div>
        </form>
      </div>
    </div>`;
  },

  txnType: 'inbound',
  setTxnType(type) {
    this.txnType = type;
    document.getElementById('txnType').value = type;
    document.getElementById('txnTypeIn').className = 'txn-type-btn' + (type==='inbound'?' active-inbound':'');
    document.getElementById('txnTypeOut').className = 'txn-type-btn' + (type==='outbound'?' active-outbound':'');
  },

  showTxnModal() { document.getElementById('txnModal')?.classList.add('active'); },
  closeTxnModal() { document.getElementById('txnModal')?.classList.remove('active'); document.getElementById('txnForm')?.reset(); this.setTxnType('inbound'); },

  saveTxn(e) {
    e.preventDefault();
    const user = DB.getCurrentUser();
    const product = DB.getProduct(document.getElementById('txnProduct').value);
    if (!product) return;
    DB.addTransaction({
      companyId: product.companyId,
      productId: product.id,
      type: this.txnType,
      quantity: parseInt(document.getElementById('txnQty').value),
      reference: document.getElementById('txnRef').value || 'N/A',
      note: document.getElementById('txnNote').value,
      processedBy: user.contactName
    });
    this.closeTxnModal();
    this.refreshTable(user.id);
  }
};
