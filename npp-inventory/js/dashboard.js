// ═══════════════════════════════════════════
// Dashboard Page
// ═══════════════════════════════════════════
const Dashboard = {
  chart: null,

  async render() {
    const el = document.getElementById('pg-dashboard');
    UI.loading(el);

    try {
      const isAdmin    = Auth.isAdmin();
      const isManager  = Auth.isManager();
      const isObserver = Auth.isObserver();
      const isClient   = Auth.isClient();
      const canViewAll = isAdmin || isManager || isObserver;

      const companies  = await DB.getPermittedCompanies();
      const companyIds = canViewAll ? companies.map(c => c.id) : [Auth.profile.id];
      const myId       = Auth.profile.id;

      // 병렬 데이터 로드
      const [stats, pendingReqs, recentTxns] = await Promise.all([
        DB.getDashboardStats(isClient ? [myId] : (companyIds.length ? companyIds : null)),
        DB.getRequests({ status: 'pending', companyId: isClient ? myId : undefined }),
        DB.getTransactions({ companyId: isClient ? myId : undefined, limit: 6 }),
      ]);

      // 화주: 요청서 상태별 카운트
      let myReqStats = null;
      if (isClient) {
        const allMyReqs = await DB.getRequests({ companyId: myId });
        myReqStats = {
          pending:   allMyReqs.filter(r => r.status === 'pending').length,
          confirmed: allMyReqs.filter(r => r.status === 'confirmed').length,
          completed: allMyReqs.filter(r => r.status === 'completed').length,
        };
      }

      const now        = new Date();
      const monthLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월`;

      // 어제 대비 증감 뱃지
      const diffBadge = (today, yd) => {
        const d = today - yd;
        if (d === 0) return '<span style="font-size:0.7rem;color:var(--text-3)">어제와 동일</span>';
        return d > 0
          ? `<span style="font-size:0.7rem;color:var(--green)">▲ ${UI.fmtNum(d)}</span>`
          : `<span style="font-size:0.7rem;color:var(--red)">▼ ${UI.fmtNum(Math.abs(d))}</span>`;
      };

      el.innerHTML = `

        ${isAdmin ? `
        <!-- ── 빠른 실행 버튼 ── -->
        <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
          <button class="btn btn-primary btn-sm"
            onclick="App.go('transactions');setTimeout(()=>Transactions.openTxnInputModal(),400)">
            <i data-lucide="plus-circle"></i>입출고 입력
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.go('requests')">
            <i data-lucide="send"></i>출고요청서 관리
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.go('inventory')">
            <i data-lucide="package"></i>재고 현황
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.go('settlement')">
            <i data-lucide="calculator"></i>정산 관리
          </button>
          <button class="btn btn-secondary btn-sm" onclick="App.go('settings')">
            <i data-lucide="settings-2"></i>업체 관리
          </button>
        </div>
        ` : ''}

        <!-- ── 통계 카드 ── -->
        <div class="stats-grid" style="margin-bottom:20px">

          ${canViewAll ? `
          <div class="stat-card">
            <div class="stat-icon green"><i data-lucide="arrow-down-circle"></i></div>
            <div class="stat-info">
              <div class="stat-label">오늘 입고</div>
              <div class="stat-value">${UI.fmtNum(stats.todayInbound)}</div>
              <div class="stat-sub">${stats.todayInCount}건 &nbsp;${diffBadge(stats.todayInbound, stats.ydInbound)}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon amber"><i data-lucide="arrow-up-circle"></i></div>
            <div class="stat-info">
              <div class="stat-label">오늘 출고</div>
              <div class="stat-value">${UI.fmtNum(stats.todayOutbound)}</div>
              <div class="stat-sub">${stats.todayOutCount}건 &nbsp;${diffBadge(stats.todayOutbound, stats.ydOutbound)}</div>
            </div>
          </div>
          ` : ''}

          <div class="stat-card">
            <div class="stat-icon blue"><i data-lucide="package"></i></div>
            <div class="stat-info">
              <div class="stat-label">전체 SKU</div>
              <div class="stat-value">${UI.fmtNum(stats.totalProducts)}</div>
              <div class="stat-sub">등록 제품 수</div>
            </div>
          </div>

          <div class="stat-card" style="cursor:pointer" onclick="App.go('inventory')">
            <div class="stat-icon red"><i data-lucide="alert-triangle"></i></div>
            <div class="stat-info">
              <div class="stat-label">재고 부족</div>
              <div class="stat-value">${UI.fmtNum(stats.lowStock)}</div>
              <div class="stat-sub">최소 재고 이하 품목</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon green"><i data-lucide="trending-up"></i></div>
            <div class="stat-info">
              <div class="stat-label">${monthLabel} 입고</div>
              <div class="stat-value">${UI.fmtNum(stats.monthInbound)}</div>
              <div class="stat-sub">이번 달 누계</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon amber"><i data-lucide="trending-down"></i></div>
            <div class="stat-info">
              <div class="stat-label">${monthLabel} 출고</div>
              <div class="stat-value">${UI.fmtNum(stats.monthOutbound)}</div>
              <div class="stat-sub">이번 달 누계</div>
            </div>
          </div>

          ${isAdmin ? `
          <div class="stat-card" style="cursor:pointer" onclick="App.go('requests')">
            <div class="stat-icon purple"><i data-lucide="clock"></i></div>
            <div class="stat-info">
              <div class="stat-label">대기 중인 요청</div>
              <div class="stat-value">${UI.fmtNum(stats.pendingRequests)}</div>
              <div class="stat-sub">확인 필요 출고요청서</div>
            </div>
          </div>
          <div class="stat-card" style="cursor:pointer" onclick="App.go('requests')">
            <div class="stat-icon blue"><i data-lucide="check-circle"></i></div>
            <div class="stat-info">
              <div class="stat-label">출고 처리 대기</div>
              <div class="stat-value">${UI.fmtNum(stats.confirmedRequests)}</div>
              <div class="stat-sub">확인완료 후 대기 중</div>
            </div>
          </div>
          ` : ''}
        </div>

        ${isClient && myReqStats ? `
        <!-- ── 화주: 내 출고 요청 진행 현황 ── -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-title">내 출고 요청 진행 현황</div>
          <div style="display:flex;border-radius:8px;overflow:hidden;border:1px solid var(--border)">
            <div style="flex:1;padding:18px;text-align:center;border-right:1px solid var(--border);cursor:pointer"
                 onclick="App.go('requests')">
              <div style="font-size:1.6rem;font-weight:700;color:var(--amber)">${myReqStats.pending}</div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-top:3px">⏳ 대기 중</div>
            </div>
            <div style="flex:1;padding:18px;text-align:center;border-right:1px solid var(--border);cursor:pointer"
                 onclick="App.go('requests')">
              <div style="font-size:1.6rem;font-weight:700;color:var(--accent)">${myReqStats.confirmed}</div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-top:3px">✅ 확인완료</div>
            </div>
            <div style="flex:1;padding:18px;text-align:center;cursor:pointer"
                 onclick="App.go('requests')">
              <div style="font-size:1.6rem;font-weight:700;color:var(--green)">${myReqStats.completed}</div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-top:3px">🚚 출고완료</div>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- ── 재고부족 목록 | 대기 요청서 ── -->
        <div class="grid-2" style="margin-bottom:20px">
          <div class="card">
            <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
              재고 부족 상품
              ${stats.lowStock > 0 ? `<span class="badge badge-red">${stats.lowStock}건</span>` : '<span class="badge badge-green">정상</span>'}
            </div>
            <div id="lowStockList"></div>
          </div>
          <div class="card">
            <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
              ${isAdmin ? '대기 중인 출고 요청서' : '최근 출고 요청서'}
              ${pendingReqs.length > 0 ? `<span class="badge badge-amber">${pendingReqs.length}건</span>` : ''}
            </div>
            <div id="pendingReqList"></div>
          </div>
        </div>

        <!-- ── 업체별 출고 순위 | 30일 차트 ── -->
        <div class="grid-2" style="margin-bottom:20px">
          ${canViewAll ? `
          <div class="card">
            <div class="card-title">${monthLabel} 업체별 출고 순위</div>
            <div id="companyRankList"></div>
          </div>
          ` : '<div class="card" style="display:none"></div>'}
          <div class="card" ${!canViewAll ? 'style="grid-column:1/-1"' : ''}>
            <div class="card-title">입출고 추이 (최근 30일)</div>
            <div class="chart-container">
              <canvas id="trendChart"></canvas>
            </div>
          </div>
        </div>

        <!-- ── 최근 입출고 이력 ── -->
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;justify-content:space-between">
            최근 입출고 이력
            <button class="btn btn-secondary btn-sm" onclick="App.go('transactions')">
              <i data-lucide="list"></i>전체 보기
            </button>
          </div>
          <div id="recentTxnList"></div>
        </div>
      `;

      UI.icons();

      // 섹션별 렌더링 (병렬)
      await Promise.all([
        Dashboard._renderLowStock(stats.lowStockProducts),
        Dashboard._renderPendingReqs(pendingReqs, isAdmin),
        canViewAll ? Dashboard._renderCompanyRank(stats.companyOutbound, companies) : Promise.resolve(),
        Dashboard._renderRecentTxns(recentTxns, canViewAll),
        Dashboard._renderChart(isClient ? myId : null),
      ]);

    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">데이터를 불러오지 못했습니다: ${err.message}</div>`;
    }
  },

  // ── 재고 부족 목록 ─────────────────────────
  _renderLowStock(products) {
    const el = document.getElementById('lowStockList');
    if (!el) return;

    if (!products || products.length === 0) {
      el.innerHTML = `
        <div class="alert alert-success" style="margin:0;text-align:center">
          <i data-lucide="check-circle" style="width:16px;height:16px;vertical-align:middle;margin-right:6px"></i>
          모든 제품 재고 정상
        </div>`;
      UI.icons();
      return;
    }

    el.innerHTML = products.slice(0, 8).map(p => {
      const isZero    = p.current_stock === 0;
      const shortage  = p.min_stock - p.current_stock;
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;
                    border-bottom:1px solid var(--border);cursor:pointer"
             onclick="App.go('inventory')">
          ${p.company ? `<div style="width:8px;height:8px;border-radius:50%;
            background:${p.company.logo_color};flex-shrink:0"></div>` : ''}
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--text-1);font-size:0.85rem;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</div>
            <div style="font-size:0.73rem;color:var(--text-3)">
              ${p.company?.company_name || ''}${p.sku ? ' · ' + p.sku : ''}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-weight:700;font-size:0.88rem;color:${isZero ? 'var(--red)' : 'var(--amber)'}">
              ${UI.fmtNum(p.current_stock)}${p.unit}
            </div>
            <div style="font-size:0.7rem;color:var(--text-3)">최소 ${UI.fmtNum(p.min_stock)}</div>
          </div>
          ${isZero
            ? '<span class="badge badge-red" style="flex-shrink:0">품절</span>'
            : `<span class="badge badge-amber" style="flex-shrink:0">-${UI.fmtNum(shortage)}</span>`}
        </div>`;
    }).join('');

    if (products.length > 8) {
      el.innerHTML += `
        <div style="text-align:center;padding:10px 0;font-size:0.8rem;color:var(--accent);
                    cursor:pointer;font-weight:600" onclick="App.go('inventory')">
          + ${products.length - 8}개 더 보기 →
        </div>`;
    }
    UI.icons();
  },

  // ── 대기 요청서 목록 ────────────────────────
  _renderPendingReqs(reqs, isAdmin) {
    const el = document.getElementById('pendingReqList');
    if (!el) return;

    if (!reqs || reqs.length === 0) {
      el.innerHTML = `
        <div style="color:var(--text-3);text-align:center;padding:32px;font-size:0.85rem">
          ${isAdmin ? '🎉 대기 중인 요청이 없습니다' : '진행 중인 요청이 없습니다'}
        </div>`;
      return;
    }

    const now = new Date();
    el.innerHTML = reqs.slice(0, 6).map(r => {
      const created  = new Date(r.created_at);
      const daysDiff = Math.floor((now - created) / 86400000);
      const ageColor = daysDiff >= 3 ? 'var(--red)' : daysDiff >= 1 ? 'var(--amber)' : 'var(--green)';
      const ageLabel = daysDiff === 0 ? '오늘' : `${daysDiff}일 전`;
      const itemCount = r.items?.length || 0;
      const shortId   = r.id.slice(0, 8).toUpperCase();

      return `
        <div style="display:flex;align-items:center;gap:10px;padding:9px 0;
                    border-bottom:1px solid var(--border);cursor:pointer"
             onclick="App.go('requests')">
          ${r.company ? `<div style="width:8px;height:8px;border-radius:50%;
            background:${r.company.logo_color};flex-shrink:0"></div>` : ''}
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;color:var(--text-1);font-size:0.85rem;
                        white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${r.company?.company_name || '-'}
            </div>
            <div style="font-size:0.73rem;color:var(--text-3)">
              REQ-${shortId} · ${itemCount}품목 · ${r.recipient_name || ''}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:0.78rem;font-weight:600;color:${ageColor}">${ageLabel}</div>
            ${daysDiff >= 3 ? '<div style="font-size:0.68rem;color:var(--red)">처리 필요</div>' : ''}
          </div>
        </div>`;
    }).join('');

    if (reqs.length > 6) {
      el.innerHTML += `
        <div style="text-align:center;padding:10px 0;font-size:0.8rem;color:var(--accent);
                    cursor:pointer;font-weight:600" onclick="App.go('requests')">
          + ${reqs.length - 6}건 더 보기 →
        </div>`;
    }
  },

  // ── 업체별 출고 순위 ────────────────────────
  _renderCompanyRank(companyOutbound, companies) {
    const el = document.getElementById('companyRankList');
    if (!el) return;

    const sorted = companies
      .map(c => ({ ...c, outbound: companyOutbound[c.id] || 0 }))
      .filter(c => c.outbound > 0)
      .sort((a, b) => b.outbound - a.outbound);

    if (sorted.length === 0) {
      el.innerHTML = `
        <div style="color:var(--text-3);text-align:center;padding:32px;font-size:0.85rem">
          이번 달 출고 내역이 없습니다
        </div>`;
      return;
    }

    const maxVal = sorted[0].outbound;
    const medals = ['🥇', '🥈', '🥉'];

    el.innerHTML = sorted.slice(0, 8).map((c, i) => {
      const pct = maxVal > 0 ? Math.round((c.outbound / maxVal) * 100) : 0;
      return `
        <div style="padding:9px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:0.82rem;width:20px;text-align:center">
              ${medals[i] || `<span style="color:var(--text-3)">${i+1}</span>`}
            </span>
            <div style="width:8px;height:8px;border-radius:50%;background:${c.logo_color};flex-shrink:0"></div>
            <span style="font-size:0.85rem;font-weight:600;color:var(--text-1);flex:1;
                         white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.company_name}</span>
            <span style="font-size:0.85rem;font-weight:700;color:var(--amber);flex-shrink:0">
              ${UI.fmtNum(c.outbound)}
            </span>
          </div>
          <div style="margin-left:28px;height:6px;background:var(--bg-4);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${c.logo_color};
                        border-radius:3px;transition:width 0.6s ease"></div>
          </div>
        </div>`;
    }).join('');
  },

  // ── 최근 입출고 이력 ────────────────────────
  _renderRecentTxns(txns, canViewAll) {
    const el = document.getElementById('recentTxnList');
    if (!el) return;

    if (!txns || txns.length === 0) {
      el.innerHTML = `
        <div style="color:var(--text-3);text-align:center;padding:24px;font-size:0.85rem">
          최근 입출고 이력이 없습니다
        </div>`;
      return;
    }

    el.innerHTML = `
      <div class="table-overflow">
        <table class="data-table">
          <thead><tr>
            <th>날짜</th>
            ${canViewAll ? '<th>업체</th>' : ''}
            <th>유형</th>
            <th>제품명</th>
            <th>수량</th>
            <th>참조번호</th>
          </tr></thead>
          <tbody>
            ${txns.map(t => {
              const isIn = t.type === 'inbound';
              return `<tr>
                <td style="white-space:nowrap;color:var(--text-3);font-size:0.8rem">${t.transaction_date}</td>
                ${canViewAll ? `<td>
                  <div style="display:flex;align-items:center;gap:6px">
                    <div style="width:6px;height:6px;border-radius:50%;
                      background:${t.company?.logo_color||'#6366f1'};flex-shrink:0"></div>
                    <span style="font-size:0.8rem;color:var(--text-2)">${t.company?.company_name||'-'}</span>
                  </div>
                </td>` : ''}
                <td><span class="badge ${isIn ? 'badge-green' : 'badge-amber'}">${isIn ? '입고' : '출고'}</span></td>
                <td class="td-main">${t.product?.name || '-'}</td>
                <td style="font-weight:700;color:${isIn ? 'var(--green)' : 'var(--amber)'}">
                  ${isIn ? '+' : '-'}${UI.fmtNum(t.quantity)}${t.product?.unit || ''}
                </td>
                <td style="color:var(--text-3);font-size:0.78rem;font-family:monospace">${t.reference || '-'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  // ── 30일 추이 차트 ──────────────────────────
  async _renderChart(companyId) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;

    const days      = 30;
    const now       = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days + 1);
    const startStr  = UI.fmtDate(startDate.toISOString());

    const txns = await DB.getTransactions({ companyId, startDate: startStr, limit: 3000 });

    const labels  = [];
    const inData  = [];
    const outData = [];

    for (let i = 0; i < days; i++) {
      const d       = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = UI.fmtDate(d.toISOString());
      // 5일 간격으로 레이블 표시
      labels.push((i % 5 === 0 || i === days - 1) ? `${d.getMonth() + 1}/${d.getDate()}` : '');
      const dayTxns = txns.filter(t => t.transaction_date === dateStr);
      inData.push( dayTxns.filter(t => t.type === 'inbound' ).reduce((s, t) => s + t.quantity, 0));
      outData.push(dayTxns.filter(t => t.type === 'outbound').reduce((s, t) => s + t.quantity, 0));
    }

    if (Dashboard.chart) Dashboard.chart.destroy();

    // 테마에 맞는 색상 (다크/라이트 모두 대응)
    const cs       = getComputedStyle(document.body);
    const textClr  = cs.getPropertyValue('--text-3').trim()  || '#5c6880';
    const gridClr  = cs.getPropertyValue('--border').trim()  || '#2a3347';

    Dashboard.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '입고', data: inData,  backgroundColor: 'rgba(34,197,94,0.75)',  borderRadius: 3 },
          { label: '출고', data: outData, backgroundColor: 'rgba(245,158,11,0.75)', borderRadius: 3 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textClr, font: { size: 11 } } },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { ticks: { color: textClr, font: { size: 10 } }, grid: { color: gridClr } },
          y: { ticks: { color: textClr }, grid: { color: gridClr }, beginAtZero: true },
        },
      },
    });
  },
};
