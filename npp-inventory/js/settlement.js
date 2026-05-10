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

    const canViewAll = Auth.isAdmin() || Auth.isManager();

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
                <th>정산 금액</th>
              </tr></thead>
              <tbody id="settBody">
                <tr><td colspan="6"><div class="loading"><div class="spinner"></div>조회 중...</div></td></tr>
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

      document.getElementById('settCompany')?.addEventListener('change', e => { this.filterCompany = e.target.value; this._load(); });
      document.getElementById('settYear')?.addEventListener('change', e => { this.filterYear = parseInt(e.target.value); this._load(); });
      document.getElementById('settMonth')?.addEventListener('change', e => { this.filterMonth = parseInt(e.target.value); this._load(); });

      UI.icons();
      await this._load();
    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">오류: ${err.message}</div>`;
    }
  },

  async _load() {
    if (!this.filterCompany) return;
    const tbody = document.getElementById('settBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6"><div class="loading"><div class="spinner"></div>조회 중...</div></td></tr>';

    try {
      const data = await DB.getSettlement(this.filterCompany, this.filterYear, this.filterMonth);
      this._renderTable(data);
    } catch (err) {
      const tbody = document.getElementById('settBody');
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:var(--red);text-align:center;padding:24px">오류: ${err.message}</td></tr>`;
    }
  },

  _renderTable(data) {
    const tbody = document.getElementById('settBody');
    const totalEl = document.getElementById('settTotal');
    if (!tbody) return;

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="6">해당 기간의 출고 내역이 없습니다</td></tr>`;
      if (totalEl) totalEl.style.display = 'none';
      return;
    }

    let totalQty = 0;
    let totalAmount = 0;

    tbody.innerHTML = data.map(row => {
      totalQty += Number(row.total_outbound);
      totalAmount += Number(row.total_amount);
      return `<tr>
        <td class="td-main">${row.product_name}</td>
        <td style="color:var(--text-3);font-family:monospace;font-size:0.82rem">${row.sku || '-'}</td>
        <td style="color:var(--text-2)">${UI.fmtMoney(row.purchase_price)}</td>
        <td style="font-weight:700;color:${Number(row.total_outbound) > 0 ? 'var(--amber)' : 'var(--text-3)'}">${UI.fmtNum(row.total_outbound)}</td>
        <td style="color:var(--text-3)">${row.unit}</td>
        <td style="font-weight:700;color:${Number(row.total_amount) > 0 ? 'var(--accent)' : 'var(--text-3)'}">
          ${UI.fmtMoney(row.total_amount)}
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

    const data = await DB.getSettlement(this.filterCompany, this.filterYear, this.filterMonth);
    const company = this.companies.find(c => c.id === this.filterCompany);

    let totalQty = 0;
    let totalAmount = 0;

    const rows = (data || []).map(row => {
      totalQty += Number(row.total_outbound);
      totalAmount += Number(row.total_amount);
      return {
        '제품명': row.product_name,
        'SKU': row.sku || '',
        '매입단가(원)': Number(row.purchase_price),
        '출고수량': Number(row.total_outbound),
        '단위': row.unit,
        '정산금액(원)': Number(row.total_amount),
      };
    });

    rows.push({
      '제품명': '합계',
      'SKU': '',
      '매입단가(원)': '',
      '출고수량': totalQty,
      '단위': '',
      '정산금액(원)': totalAmount,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{wch:25},{wch:15},{wch:15},{wch:12},{wch:8},{wch:18}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '정산내역');
    XLSX.writeFile(wb, `정산_${company?.company_name || ''}_${this.filterYear}년${this.filterMonth}월.xlsx`);
  },
};
