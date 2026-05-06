// 3PL - Dashboard Module
const Dashboard = {
  lineChart: null,
  doughnutChart: null,

  render(companyId) {
    const stats = DB.getStats(companyId);
    const page = document.getElementById('page-dashboard');
    page.innerHTML = `
      <div class="dashboard-grid">
        ${this.renderKPI('kpi-products', 'box', '총 제품 수', stats.totalProducts, '종')}
        ${this.renderKPI('kpi-stock', 'package', '총 재고 수량', stats.totalStock, '개')}
        ${this.renderKPI('kpi-settlement', 'dollar-sign', '총 정산금액', stats.totalSettlement, '원')}
        ${this.renderKPI('kpi-inbound', 'arrow-down-circle', '금일 입고', stats.todayInbound, '개')}
        ${this.renderKPI('kpi-outbound', 'arrow-up-circle', '금일 출고', stats.todayOutbound, '개')}
      </div>
      <div class="chart-grid">
        <div class="chart-card glass-card animate-fade-in stagger-2">
          <div class="chart-card-header">
            <h3>📈 입출고 추이 (최근 7일)</h3>
          </div>
          <div class="chart-container"><canvas id="trendChart"></canvas></div>
        </div>
        <div class="chart-card glass-card animate-fade-in stagger-3">
          <div class="chart-card-header">
            <h3>📊 카테고리별 재고</h3>
          </div>
          <div class="chart-container"><canvas id="categoryChart"></canvas></div>
        </div>
      </div>
      <div class="bottom-grid">
        <div class="glass-card animate-fade-in stagger-3">
          <div class="chart-card-header"><h3>🚨 재고 부족 알림</h3>
            <span class="badge badge-danger">${stats.lowStockProducts.length}건</span>
          </div>
          <div class="alert-list" id="alertList"></div>
        </div>
        <div class="glass-card animate-fade-in stagger-4">
          <div class="chart-card-header"><h3>🕐 최근 입출고</h3></div>
          <div class="activity-list" id="activityList"></div>
        </div>
      </div>
    `;
    this.renderAlerts(stats.lowStockProducts);
    this.renderActivity(stats.recentTxns);
    this.renderCharts(companyId);
    this.animateCounters();
  },

  renderKPI(cls, icon, label, value, unit) {
    return `<div class="kpi-card ${cls} animate-fade-in">
      <div class="kpi-header">
        <div class="kpi-icon"><i data-lucide="${icon}"></i></div>
      </div>
      <div class="kpi-value" data-count="${value}">0</div>
      <div class="kpi-label">${label} <span style="color:var(--text-tertiary)">${unit}</span></div>
    </div>`;
  },

  animateCounters() {
    document.querySelectorAll('.kpi-value[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count);
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    if (window.lucide) lucide.createIcons();
  },

  renderAlerts(products) {
    const list = document.getElementById('alertList');
    if (!list) return;
    if (products.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>재고 부족 제품이 없습니다 👍</p></div>';
      return;
    }
    list.innerHTML = products.map(p => {
      const ratio = p.currentStock / p.safetyStock;
      const level = ratio <= 0.5 ? 'danger' : 'warning';
      return `<div class="alert-item">
        <div class="alert-dot ${level}"></div>
        <div class="alert-info">
          <div class="alert-name">${p.name}</div>
          <div class="alert-detail">안전재고 ${p.safetyStock}${p.unit} / 위치 ${p.location}</div>
        </div>
        <div class="alert-stock ${level === 'danger' ? 'text-danger' : 'text-warning'}">${p.currentStock}${p.unit}</div>
      </div>`;
    }).join('');
  },

  renderActivity(txns) {
    const list = document.getElementById('activityList');
    if (!list) return;
    if (txns.length === 0) {
      list.innerHTML = '<div class="empty-state"><p>최근 입출고 내역이 없습니다</p></div>';
      return;
    }
    list.innerHTML = txns.map(t => {
      const product = DB.getProduct(t.productId);
      const pName = product ? product.name : '삭제된 제품';
      const icon = t.type === 'inbound' ? 'arrow-down' : 'arrow-up';
      const date = new Date(t.date);
      const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
      return `<div class="activity-item">
        <div class="activity-icon ${t.type}"><i data-lucide="${icon}" style="width:16px;height:16px"></i></div>
        <div class="activity-info">
          <div class="activity-title">${pName}</div>
          <div class="activity-meta">${t.type==='inbound'?'입고':'출고'} · ${timeStr}</div>
        </div>
        <div class="activity-qty" style="color:${t.type==='inbound'?'var(--color-inbound)':'var(--color-outbound)'}">
          ${t.type==='inbound'?'+':'-'}${t.quantity}
        </div>
      </div>`;
    }).join('');
    if (window.lucide) lucide.createIcons();
  },

  renderCharts(companyId) {
    this.renderTrendChart(companyId);
    this.renderCategoryChart(companyId);
  },

  renderTrendChart(companyId) {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    if (this.lineChart) this.lineChart.destroy();
    const txns = DB.getTransactions(companyId);
    const labels = []; const inData = []; const outData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      labels.push(`${d.getMonth()+1}/${d.getDate()}`);
      const dayTxns = txns.filter(t => new Date(t.date).toDateString() === ds);
      inData.push(dayTxns.filter(t=>t.type==='inbound').reduce((s,t)=>s+t.quantity,0));
      outData.push(dayTxns.filter(t=>t.type==='outbound').reduce((s,t)=>s+t.quantity,0));
    }
    this.lineChart = new Chart(canvas, {
      type:'line',
      data:{
        labels,
        datasets:[
          { label:'입고', data:inData, borderColor:'#10b981', backgroundColor:'rgba(16,185,129,0.1)', fill:true, tension:0.4, borderWidth:2, pointRadius:4, pointBackgroundColor:'#10b981' },
          { label:'출고', data:outData, borderColor:'#f97316', backgroundColor:'rgba(249,115,22,0.1)', fill:true, tension:0.4, borderWidth:2, pointRadius:4, pointBackgroundColor:'#f97316' }
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ labels:{ color:'#94a3b8', font:{family:'Inter'} } } },
        scales:{
          x:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{family:'Inter'}} },
          y:{ grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b', font:{family:'Inter'}} }
        }
      }
    });
  },

  renderCategoryChart(companyId) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    if (this.doughnutChart) this.doughnutChart.destroy();
    const products = DB.getProducts(companyId);
    const catMap = {};
    products.forEach(p => { catMap[p.category] = (catMap[p.category]||0) + p.currentStock; });
    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];
    this.doughnutChart = new Chart(canvas, {
      type:'doughnut',
      data:{ labels, datasets:[{ data, backgroundColor:colors.slice(0,labels.length), borderWidth:0 }] },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8', font:{family:'Inter',size:11}, padding:12 } } }
      }
    });
  }
};
