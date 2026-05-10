// ═══════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════
const Dashboard = {
  chart: null,

  async render() {
    const el = document.getElementById('pg-dashboard');
    UI.loading(el);

    try {
      const companies = await DB.getPermittedCompanies();
      const companyIds = companies.map(c => c.id);
      const stats = await DB.getDashboardStats(Auth.isClient() ? [Auth.profile.id] : companyIds.length ? companyIds : null);

      const isAdmin = Auth.isAdmin();
      const now = new Date();
      const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

      el.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue"><i data-lucide="package"></i></div>
            <div class="stat-info">
              <div class="stat-label">전체 SKU</div>
              <div class="stat-value">${UI.fmtNum(stats.totalProducts)}</div>
              <div class="stat-sub">등록 제품 수</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red"><i data-lucide="alert-triangle"></i></div>
            <div class="stat-info">
              <div class="stat-label">재고 부족</div>
              <div class="stat-value">${UI.fmtNum(stats.lowStock)}</div>
              <div class="stat-sub">최소 재고 이하</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green"><i data-lucide="arrow-down-circle"></i></div>
            <div class="stat-info">
              <div class="stat-label">${monthLabel} 입고</div>
              <div class="stat-value">${UI.fmtNum(stats.monthInbound)}</div>
              <div class="stat-sub">이번 달 총 입고 수량</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon amber"><i data-lucide="arrow-up-circle"></i></div>
            <div class="stat-info">
              <div class="stat-label">${monthLabel} 출고</div>
              <div class="stat-value">${UI.fmtNum(stats.monthOutbound)}</div>
              <div class="stat-sub">이번 달 총 출고 수량</div>
            </div>
          </div>
          ${isAdmin ? `
          <div class="stat-card" style="cursor:pointer" onclick="App.go('requests')">
            <div class="stat-icon purple"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <div class="stat-label">대기 중인 요청</div>
              <div class="stat-value">${UI.fmtNum(stats.pendingRequests)}</div>
              <div class="stat-sub">확인 필요 출고 요청서</div>
            </div>
          </div>
          <div class="stat-card" style="cursor:pointer" onclick="App.go('requests')">
            <div class="stat-icon blue"><i data-lucide="check-circle"></i></div>
            <div class="stat-info">
              <div class="stat-label">확인완료 처리 대기</div>
              <div class="stat-value">${UI.fmtNum(stats.confirmedRequests)}</div>
              <div class="stat-sub">출고 처리 대기 중</div>
            </div>
          </div>
          ` : ''}
        </div>

        ${isAdmin && companies.length > 0 ? `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">업체별 재고 현황</div>
            <div id="companyStockList"></div>
          </div>
          <div class="card">
            <div class="card-title">최근 입출고 추이 (7일)</div>
            <div class="chart-container">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>
        ` : `
        <div class="grid-2">
          <div class="card">
            <div class="card-title">내 재고 현황</div>
            <div id="myStockList"></div>
          </div>
          <div class="card">
            <div class="card-title">최근 입출고 (30일)</div>
            <div class="chart-container">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>
        `}
      `;

      UI.icons();

      if (isAdmin) {
        await Dashboard._renderCompanyList(companies, el);
      } else {
        await Dashboard._renderMyStock(el);
      }

      await Dashboard._renderChart(Auth.isClient() ? Auth.profile.id : null);

    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">데이터를 불러오지 못했습니다: ${err.message}</div>`;
    }
  },

  async _renderCompanyList(companies, el) {
    const listEl = document.getElementById('companyStockList');
    if (!listEl) return;

    const products = await DB.getProducts();
    const byCompany = {};
    products.forEach(p => {
      if (!byCompany[p.company_id]) byCompany[p.company_id] = { total: 0, low: 0 };
      byCompany[p.company_id].total++;
      if (p.current_stock <= p.min_stock) byCompany[p.company_id].low++;
    });

    listEl.innerHTML = companies.map(c => {
      const s = byCompany[c.id] || { total: 0, low: 0 };
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);cursor:pointer"
             onclick="App.go('inventory')">
          <div style="width:10px;height:10px;border-radius:50%;background:${c.logo_color};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--text-1);font-size:0.875rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              ${c.company_name}
            </div>
            <div style="font-size:0.75rem;color:var(--text-3)">SKU ${s.total}종</div>
          </div>
          ${s.low > 0 ? `<span class="badge badge-red">${s.low} 부족</span>` : '<span class="badge badge-green">정상</span>'}
        </div>
      `;
    }).join('') || '<div style="color:var(--text-3);text-align:center;padding:24px">등록된 업체가 없습니다</div>';
  },

  async _renderMyStock(el) {
    const listEl = document.getElementById('myStockList');
    if (!listEl) return;

    const products = await DB.getProducts(Auth.profile.id);
    const low = products.filter(p => p.current_stock <= p.min_stock);

    if (low.length === 0) {
      listEl.innerHTML = `<div class="alert alert-success" style="margin:0">모든 제품의 재고가 정상입니다</div>`;
      return;
    }

    listEl.innerHTML = `
      <div class="alert alert-warning" style="margin-bottom:12px">
        ${low.length}개 제품이 최소 재고 이하입니다
      </div>
      ${low.slice(0, 8).map(p => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--text-1);font-size:0.85rem">${p.name}</div>
            <div style="font-size:0.75rem;color:var(--text-3)">${p.sku || '-'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700;color:var(--red)">${UI.fmtNum(p.current_stock)}${p.unit}</div>
            <div style="font-size:0.72rem;color:var(--text-3)">최소 ${UI.fmtNum(p.min_stock)}${p.unit}</div>
          </div>
        </div>
      `).join('')}
    `;
  },

  async _renderChart(companyId) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const days = 7;
    const labels = [];
    const inboundData = [];
    const outboundData = [];

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days + 1);
    const startStr = UI.fmtDate(startDate.toISOString());

    const txns = await DB.getTransactions({
      companyId,
      startDate: startStr,
    });

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = UI.fmtDate(d.toISOString());
      labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
      const dayTxns = txns.filter(t => t.transaction_date === dateStr);
      inboundData.push(dayTxns.filter(t => t.type === 'inbound').reduce((s, t) => s + t.quantity, 0));
      outboundData.push(dayTxns.filter(t => t.type === 'outbound').reduce((s, t) => s + t.quantity, 0));
    }

    if (Dashboard.chart) Dashboard.chart.destroy();

    Dashboard.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '입고',
            data: inboundData,
            backgroundColor: 'rgba(34,197,94,0.7)',
            borderRadius: 4,
          },
          {
            label: '출고',
            data: outboundData,
            backgroundColor: 'rgba(245,158,11,0.7)',
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#9aa5b8', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#5c6880' }, grid: { color: '#2a3347' } },
          y: { ticks: { color: '#5c6880' }, grid: { color: '#2a3347' }, beginAtZero: true },
        },
      },
    });
  },
};
