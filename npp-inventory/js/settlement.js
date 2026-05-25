// ═══════════════════════════════════════════
// Settlement Page (정산 관리)
// ═══════════════════════════════════════════
const Settlement = {
  companies: [],
  filterCompany: '',
  filterYear: new Date().getFullYear(),
  filterMonth: new Date().getMonth() + 1,

  async render() {
    const el = document.getElementById('pg-settlement');
    UI.loading(el);

    const canViewAll = Auth.isAdmin() || Auth.isManager() || Auth.isObserver();

    try {
      this.companies = canViewAll ? await DB.getPermittedCompanies() : [Auth.profile];
      if (!this.filterCompany && this.companies.length > 0) {
        this.filterCompany = Auth.isClient() ? Auth.profile.id : this.companies[0].id;
      }

      const years = [];
      const cy = new Date().getFullYear();
      for (let y = cy; y >= cy - 3; y--) years.push(y);

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-filters">
            ${canViewAll ? `
            <select class="filter-select" id="settCompany">
              ${this.companies.map(c => `<option value="${c.id}" ${this.filterCompany === c.id ? 'selected' : ''}>${c.company_name}</option>`).join('')}
            </select>
            ` : ''}
            <select class="filter-select" id="settYear">
              ${years.map(y => `<option value="${y}" ${this.filterYear === y ? 'selected' : ''}>${y}년</option>`).join('')}
            </select>
            <select class="filter-select" id="settMonth">
              ${Array.from({length:12}, (_,i) => i+1).map(m =>
                `<option value="${m}" ${this.filterMonth === m ? 'selected' : ''}>${m}월</option>`
              ).join('')}
            </select>
            <button type="button" class="btn btn-primary btn-sm" onclick="Settlement._load()">
              <i data-lucide="search"></i>조회
            </button>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-secondary btn-sm" onclick="Settlement.downloadExcel()">
              <i data-lucide="file-down"></i>엑셀 다운로드
            </button>
          </div>
        </div>

        <div class="table-wrap">
          <div class="table-overflow">
            <table class="data-table">
              <thead><tr>
                <th>제품명</th>
                <th>SKU</th>
                <th>매입 단가</th>
                <th>출고 수량</th>
                <th>단위</th>
                <th>현재 재고</th>
                <th>정산 금액</th>
              </tr></thead>
              <tbody id="settBody">
                <tr><td colspan="7"><div class="loading"><div class="spinner"></div>조회 중...</div></td></tr>
              </tbody>
            </table>
          </div>
          <div class="settlement-total" id="settTotal" style="display:none">
            <span style="color:var(--text-2)">총 출고 수량</span>
            <strong id="settTotalQty">-</strong>
            <span style="color:var(--text-2);margin-left:20px">총 정산 금액</span>
            <strong class="settlement-amount" id="settTotalAmount">-</strong>
          </div>
        </div>
      `;

      // 필터 변경은 값만 저장 → 조회 버튼으로 실행
      document.getElementById('settCompany')?.addEventListener('change', e => { this.filterCompany = e.target.value; });
      document.getElementById('settYear')?.addEventListener('change', e => { this.filterYear = parseInt(e.target.value); });
      document.getElementById('settMonth')?.addEventListener('change', e => { this.filterMonth = parseInt(e.target.value); });

      UI.icons();
      await this._load();
    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">오류: ${err.message}</div>`;
    }
  },

  async _load() {
    if (!this.filterCompany) return;
    const tbody = document.getElementById('settBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7"><div class="loading"><div class="spinner"></div>조회 중...</div></td></tr>';
    const totalEl = document.getElementById('settTotal');
    if (totalEl) totalEl.style.display = 'none';

    const year  = this.filterYear;
    const month = this.filterMonth;
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    try {
      // 전체 제품 + 해당 월 출고 이력 병렬 조회
      const [products, txns] = await Promise.all([
        DB.getProducts(this.filterCompany),
        DB.getTransactions({
          companyId: this.filterCompany,
          type: 'outbound',
          startDate,
          endDate,
          limit: 9999,
        }),
      ]);
      this._renderTable(products, txns);
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="color:var(--red);text-align:center;padding:24px">오류: ${err.message}</td></tr>`;
    }
  },

  _renderTable(products, txns) {
    const tbody = document.getElementById('settBody');
    const totalEl = document.getElementById('settTotal');
    if (!tbody) return;

    if (!products || products.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="7">해당 거래처에 등록된 제품이 없습니다</td></tr>`;
      if (totalEl) totalEl.style.display = 'none';
      return;
    }

    // 출고 이력 → product_id별 수량 집계
    const outMap = {};
    (txns || []).forEach(t => {
      outMap[t.product_id] = (outMap[t.product_id] || 0) + t.quantity;
    });

    // 제품별 정산 행 생성
    const rows = products.map(p => ({
      name:           p.name,
      sku:            p.sku,
      purchase_price: p.purchase_price || 0,
      unit:           p.unit,
      current_stock:  p.current_stock || 0,
      total_outbound: outMap[p.id] || 0,
      total_amount:   (outMap[p.id] || 0) * (p.purchase_price || 0),
    }));

    // 출고 있는 것 먼저 → 이름 오름차순
    rows.sort((a, b) => {
      if (b.total_outbound !== a.total_outbound) return b.total_outbound - a.total_outbound;
      return a.name.localeCompare(b.name, 'ko');
    });

    let totalQty = 0, totalAmount = 0;
    rows.forEach(r => { totalQty += r.total_outbound; totalAmount += r.total_amount; });

    tbody.innerHTML = rows.map(row => {
      const hasActivity = row.total_outbound > 0;
      return `<tr style="${!hasActivity ? 'opacity:0.55' : ''}">
        <td class="td-main" style="${!hasActivity ? 'color:var(--text-3)' : ''}">${row.name}</td>
        <td style="color:var(--text-3);font-family:monospace;font-size:0.82rem">${row.sku || '-'}</td>
        <td style="color:var(--text-2)">${row.purchase_price ? UI.fmtMoney(row.purchase_price) : '-'}</td>
        <td style="font-weight:${hasActivity ? '700' : '400'};color:${hasActivity ? 'var(--amber)' : 'var(--text-3)'}">
          ${hasActivity ? UI.fmtNum(row.total_outbound) : '-'}
        </td>
        <td style="color:var(--text-3)">${row.unit}</td>
        <td style="color:var(--text-3);font-size:0.82rem">${UI.fmtNum(row.current_stock)}${row.unit}</td>
        <td style="font-weight:${hasActivity ? '700' : '400'};color:${hasActivity ? 'var(--accent)' : 'var(--text-3)'}">
          ${hasActivity ? UI.fmtMoney(row.total_amount) : '-'}
        </td>
      </tr>`;
    }).join('');

    if (totalEl) {
      totalEl.style.display = 'flex';
      document.getElementById('settTotalQty').textContent = UI.fmtNum(totalQty);
      document.getElementById('settTotalAmount').textContent = UI.fmtMoney(totalAmount);
    }
  },

  async downloadExcel() {
    if (!this.filterCompany) return;

    const year   = this.filterYear;
    const month  = this.filterMonth;
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

    const [products, txns] = await Promise.all([
      DB.getProducts(this.filterCompany),
      DB.getTransactions({ companyId: this.filterCompany, type: 'outbound', startDate, endDate, limit: 9999 }),
    ]);

    const outMap = {};
    (txns || []).forEach(t => { outMap[t.product_id] = (outMap[t.product_id] || 0) + t.quantity; });

    const company = this.companies.find(c => c.id === this.filterCompany);
    let totalQty = 0, totalAmount = 0;

    const rows = products.map(p => {
      const qty    = outMap[p.id] || 0;
      const amount = qty * (p.purchase_price || 0);
      totalQty    += qty;
      totalAmount += amount;
      return {
        '제품명':        p.name,
        'SKU':          p.sku || '',
        '매입단가(원)':  p.purchase_price || 0,
        '출고수량':      qty,
        '단위':          p.unit,
        '현재재고':      p.current_stock,
        '정산금액(원)':  amount,
      };
    });

    rows.push({
      '제품명': '합계', 'SKU': '', '매입단가(원)': '',
      '출고수량': totalQty, '단위': '', '현재재고': '',
      '정산금액(원)': totalAmount,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:25},{wch:14},{wch:14},{wch:10},{wch:7},{wch:10},{wch:16}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '정산내역');
    XLSX.writeFile(wb, `정산_${company?.company_name || ''}_${year}년${month}월.xlsx`);
  },
};
