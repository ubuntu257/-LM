// 3PL - Settlement Module
const Settlement = {
  currentMonth: new Date().toISOString().slice(0, 7), // YYYY-MM
  companyFilter: 'all',

  render(companyId) {
    const page = document.getElementById('page-settlements');
    const isAdmin = DB.getCurrentUser()?.role === 'admin';
    
    page.innerHTML = `
      <div class="settlement-toolbar animate-fade-in">
        <div class="toolbar-left" style="display:flex;gap:12px">
          <input type="month" id="settleMonth" class="form-input" value="${this.currentMonth}" style="width:160px">
          ${isAdmin ? `<select class="filter-select" id="settleCompany">
            <option value="all">전체 업체</option>
          </select>` : ''}
        </div>
        <div class="toolbar-right">
          <button class="btn btn-secondary" onclick="Settlement.downloadExcel()">
            <i data-lucide="download" style="width:16px;height:16px"></i>엑셀 다운로드
          </button>
        </div>
      </div>
      
      <div class="settlement-summary-grid animate-fade-in stagger-2" id="settleSummary">
        <!-- Summary rendered here -->
      </div>
      
      <div class="inventory-table-wrap animate-fade-in stagger-3">
        <table class="data-table">
          <thead><tr>
            <th>업체</th><th>제품명</th><th>SKU</th><th>판매수량</th><th>총 판매금액</th><th>총 정산금액</th><th>마진액</th>
          </tr></thead>
          <tbody id="settleBody"></tbody>
        </table>
      </div>
    `;

    if (isAdmin) this.populateCompanies();
    this.bindEvents(companyId);
    this.refreshData(companyId);
    if (window.lucide) lucide.createIcons();
  },

  populateCompanies() {
    const sel = document.getElementById('settleCompany');
    if (!sel) return;
    const companies = DB.getCompanies().filter(c => c.role === 'client');
    companies.forEach(c => {
      const o = document.createElement('option');
      o.value = c.id; o.textContent = c.name;
      sel.appendChild(o);
    });
    sel.value = this.companyFilter;
  },

  bindEvents(companyId) {
    document.getElementById('settleMonth')?.addEventListener('change', (e) => {
      this.currentMonth = e.target.value;
      this.refreshData(DB.getCurrentUser()?.id);
    });
    document.getElementById('settleCompany')?.addEventListener('change', (e) => {
      this.companyFilter = e.target.value;
      this.refreshData(DB.getCurrentUser()?.id);
    });
  },

  refreshData(companyId) {
    const effectiveId = (this.companyFilter !== 'all') ? this.companyFilter : companyId;
    const txns = DB.getTransactions(effectiveId);
    const products = DB.getProducts(effectiveId);
    
    // Filter outbounds in current month
    const monthPrefix = this.currentMonth; // 'YYYY-MM'
    const outbounds = txns.filter(t => t.type === 'outbound' && t.date.startsWith(monthPrefix));
    
    // Group by product
    const stats = {};
    outbounds.forEach(t => {
      if (!stats[t.productId]) stats[t.productId] = 0;
      stats[t.productId] += t.quantity;
    });

    let totalSales = 0;
    let totalSettlement = 0;
    
    const rows = [];
    products.forEach(p => {
      const qty = stats[p.id] || 0;
      if (qty > 0) {
        const sales = qty * p.price;
        const settlement = qty * (p.incomingPrice || 0);
        const margin = sales - settlement;
        totalSales += sales;
        totalSettlement += settlement;
        rows.push({
          product: p,
          qty, sales, settlement, margin
        });
      }
    });

    const totalMargin = totalSales - totalSettlement;

    // Render summary
    document.getElementById('settleSummary').innerHTML = `
      <div class="summary-card total-sales">
        <div class="summary-title">총 판매금액 (소비자가 기준)</div>
        <div class="summary-value">₩${totalSales.toLocaleString()}</div>
      </div>
      <div class="summary-card total-settlement">
        <div class="summary-title">총 정산금액 (입고가 기준)</div>
        <div class="summary-value">₩${totalSettlement.toLocaleString()}</div>
      </div>
      <div class="summary-card total-margin">
        <div class="summary-title">총 마진액 (물류/판매 수익)</div>
        <div class="summary-value">₩${totalMargin.toLocaleString()}</div>
      </div>
    `;

    // Render table
    const body = document.getElementById('settleBody');
    if (rows.length === 0) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary)">해당 월에 판매(출고) 내역이 없습니다</td></tr>';
    } else {
      body.innerHTML = rows.map(r => {
        const comp = DB.getCompany(r.product.companyId);
        return `<tr>
          <td><span class="badge badge-info">${comp ? comp.name : '-'}</span></td>
          <td style="font-weight:500">${r.product.name}</td>
          <td><span style="color:var(--text-tertiary);font-size:0.85rem">${r.product.sku}</span></td>
          <td><strong style="color:var(--color-outbound)">${r.qty}</strong> <span style="font-size:0.8rem">${r.product.unit}</span></td>
          <td>₩${r.sales.toLocaleString()}</td>
          <td style="color:#eab308;font-weight:600">₩${r.settlement.toLocaleString()}</td>
          <td style="color:var(--color-inbound)">₩${r.margin.toLocaleString()}</td>
        </tr>`;
      }).join('');
    }
  },

  downloadExcel() {
    const isAdmin = DB.getCurrentUser()?.role === 'admin';
    const effectiveId = (isAdmin && this.companyFilter !== 'all') ? this.companyFilter : DB.getCurrentUser()?.id;
    const txns = DB.getTransactions(effectiveId);
    const products = DB.getProducts(effectiveId);
    
    const outbounds = txns.filter(t => t.type === 'outbound' && t.date.startsWith(this.currentMonth));
    const stats = {};
    outbounds.forEach(t => {
      if (!stats[t.productId]) stats[t.productId] = 0;
      stats[t.productId] += t.quantity;
    });

    const data = [];
    products.forEach(p => {
      const qty = stats[p.id] || 0;
      if (qty > 0) {
        const comp = DB.getCompany(p.companyId);
        const sales = qty * p.price;
        const settlement = qty * (p.incomingPrice || 0);
        data.push({
          '업체명': comp ? comp.name : '-',
          '정산월': this.currentMonth,
          '제품명': p.name,
          'SKU': p.sku,
          '판매수량': qty,
          '소비자가(원)': p.price,
          '입고단가(원)': p.incomingPrice || 0,
          '총 판매금액(원)': sales,
          '총 정산금액(원)': settlement,
          '마진액(원)': sales - settlement
        });
      }
    });

    if (data.length === 0) {
      alert('다운로드할 정산 데이터가 없습니다.');
      return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch:15},{wch:10},{wch:20},{wch:15},{wch:10},{wch:12},{wch:12},{wch:15},{wch:15},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Settlement');
    XLSX.writeFile(wb, \`settlement_\${this.currentMonth}.xlsx\`);
  }
};
