// 3PL - 화주 전용 출고요청 등록 & 목록 모듈
const Outbound = {

  // 현재 화주의 제품 목록
  products: [],

  // ── 출고요청 등록 페이지 렌더 ──
  renderNewForm() {
    const user = DB.getCurrentUser();
    if (!user) return;
    this.products = DB.getProducts(user.id);
    const page = document.getElementById('page-outbound-new');

    page.innerHTML = `
      <div class="animate-fade-in" style="max-width:720px;margin:0 auto;">
        <div class="card" style="padding:28px;">
          <h3 style="margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid var(--border-color);display:flex;align-items:center;gap:10px;">
            <i data-lucide="send" style="width:20px;height:20px;color:var(--accent-color)"></i>
            새 출고 요청서 작성
          </h3>
          <form id="newReqForm" onsubmit="Outbound.submitForm(event)">

            <h4 style="font-size:0.95rem;margin-bottom:12px;color:var(--text-secondary);">① 수령인 및 배송지 정보</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">받는 사람 이름 *</label>
                <input class="form-input" id="nrRecName" required placeholder="예: 홍길동">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">받는 사람 연락처 *</label>
                <input class="form-input" id="nrRecPhone" required placeholder="예: 010-1234-5678">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">배송지 주소 *</label>
              <input class="form-input" id="nrAddress" required placeholder="상세 주소를 정확히 입력해주세요.">
            </div>
            <div class="form-group">
              <label class="form-label">배송 메시지 (선택)</label>
              <input class="form-input" id="nrMessage" placeholder="예: 문앞에 놓아주세요">
            </div>

            <h4 style="font-size:0.95rem;margin-top:24px;margin-bottom:12px;color:var(--text-secondary);display:flex;justify-content:space-between;align-items:center;">
              ② 출고 품목 리스트
              <button type="button" class="btn btn-sm btn-secondary" onclick="Outbound.addRow()">+ 품목 추가</button>
            </h4>
            ${this.products.length === 0 ? `<div style="padding:20px;text-align:center;color:var(--text-tertiary);background:var(--bg-tertiary);border-radius:8px;margin-bottom:16px;">등록된 제품이 없습니다. 관리자에게 제품 등록을 요청해주세요.</div>` : ''}
            <div id="nrItemsContainer" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:16px;min-height:60px;"></div>

            <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border-color);">
              <button type="button" class="btn btn-secondary" onclick="App.navigate('my-requests')">나의 요청 목록</button>
              <button type="submit" class="btn btn-primary" ${this.products.length === 0 ? 'disabled' : ''}>
                <i data-lucide="send" style="width:16px;height:16px"></i> 출고 요청 접수하기
              </button>
            </div>
          </form>
        </div>
      </div>`;

    this.addRow();
    if (window.lucide) lucide.createIcons();
  },

  addRow(productId, quantity) {
    const container = document.getElementById('nrItemsContainer');
    if (!container) return;
    const pid = productId || '';
    const qty = quantity || 1;
    const rowId = 'nr_' + Date.now() + '_' + Math.floor(Math.random()*9999);
    const opts = this.products.map(p =>
      `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${p.name} (재고: ${p.currentStock}${p.unit||'개'})</option>`
    ).join('');

    container.insertAdjacentHTML('beforeend', `
      <div id="${rowId}" style="display:flex;gap:10px;align-items:flex-end;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed var(--border-color);">
        <div class="form-group" style="flex:2;margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem">제품 선택</label>
          <select class="form-input nr-sel" required>
            <option value="" disabled ${!pid ? 'selected' : ''}>제품을 선택하세요</option>
            ${opts}
          </select>
        </div>
        <div class="form-group" style="flex:1;margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem">수량</label>
          <input class="form-input nr-qty" type="number" min="1" value="${qty}" required>
        </div>
        <button type="button" class="btn btn-danger btn-icon" onclick="document.getElementById('${rowId}').remove()" style="margin-bottom:3px;">
          <i data-lucide="trash-2" style="width:18px;height:18px"></i>
        </button>
      </div>`);
    if (window.lucide) lucide.createIcons();
  },

  submitForm(e) {
    e.preventDefault();
    const name  = document.getElementById('nrRecName').value.trim();
    const phone = document.getElementById('nrRecPhone').value.trim();
    const addr  = document.getElementById('nrAddress').value.trim();
    const msg   = document.getElementById('nrMessage').value.trim();

    const rows = document.querySelectorAll('#nrItemsContainer > div');
    if (!rows.length) { alert('최소 1개 이상의 품목을 추가해야 합니다.'); return; }

    const items = [];
    const agg = {};
    let ok = true;
    rows.forEach(row => {
      const pid = row.querySelector('.nr-sel').value;
      const qty = parseInt(row.querySelector('.nr-qty').value) || 0;
      if (!pid || qty <= 0) { alert('모든 품목의 제품과 수량을 입력해주세요.'); ok = false; return; }
      items.push({ productId: pid, quantity: qty });
      agg[pid] = (agg[pid] || 0) + qty;
    });
    if (!ok) return;

    for (const [pid, total] of Object.entries(agg)) {
      const p = DB.getProduct(pid);
      if (!p) { alert('존재하지 않는 제품이 있습니다.'); return; }
      if (total > p.currentStock) {
        alert(`"${p.name}" 요청 수량(${total})이 재고(${p.currentStock})를 초과합니다.`);
        return;
      }
    }

    DB.addRequest({
      companyId: DB.getCurrentUser().id,
      items, recipientName: name, recipientPhone: phone, address: addr, message: msg
    });

    alert('✅ 출고 요청이 성공적으로 접수되었습니다!\n나의 출고요청에서 상태를 확인할 수 있습니다.');
    App.navigate('my-requests');
  },

  // ── 나의 출고요청 목록 ──
  renderMyRequests() {
    const user = DB.getCurrentUser();
    if (!user) return;
    const page = document.getElementById('page-my-requests');

    page.innerHTML = `
      <div class="animate-fade-in">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div class="history-filters">
            <select class="filter-select" id="myReqFilter">
              <option value="all">전체 상태</option>
              <option value="pending">대기 중</option>
              <option value="approved">승인됨</option>
              <option value="completed">출고 완료</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('outbound-new')">
            <i data-lucide="plus" style="width:16px;height:16px"></i> 새 출고 요청
          </button>
        </div>
        <div class="history-table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>요청일시</th><th>요청 품목</th><th>총 수량</th>
              <th>수령인/도착지</th><th>상태</th><th>관리</th>
            </tr></thead>
            <tbody id="myReqBody"></tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('myReqFilter').addEventListener('change', e => {
      this.renderBody(user.id, e.target.value);
    });
    this.renderBody(user.id, 'all');
    if (window.lucide) lucide.createIcons();
  },

  renderBody(uid, statusFilter) {
    let reqs = DB.getRequests(uid);
    if (statusFilter !== 'all') reqs = reqs.filter(r => r.status === statusFilter);
    const body = document.getElementById('myReqBody');
    if (!body) return;

    if (!reqs.length) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-tertiary)">
        요청 내역이 없습니다. <a href="javascript:App.navigate('outbound-new')" style="color:var(--accent-color)">새 출고 요청 등록하기 →</a>
      </td></tr>`;
      return;
    }

    body.innerHTML = reqs.map(r => {
      // legacy 호환
      if (!r.items) { r.items = [{productId: r.productId, quantity: r.quantity}]; r.recipientName = r.recipientName||'미입력'; r.recipientPhone = r.recipientPhone||'미입력'; r.address = r.address||r.destination||'미입력'; r.message = r.message||''; }
      const d = new Date(r.requestDate);
      const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      const fp = DB.getProduct(r.items[0].productId);
      const prodStr = r.items.length > 1 ? `${fp ? fp.name : '?'} 외 ${r.items.length-1}건` : (fp ? fp.name : '삭제된 제품');
      const totalQty = r.items.reduce((s, i) => s + parseInt(i.quantity), 0);
      const dest = `[${r.recipientName}] ${r.address}`;

      const badge = r.status === 'pending'
        ? '<span class="badge" style="background:var(--bg-tertiary);color:var(--text-primary)">⏳ 대기 중</span>'
        : r.status === 'approved'
        ? '<span class="badge" style="background:#f59e0b;color:#fff">✅ 승인됨</span>'
        : '<span class="badge" style="background:var(--color-inbound);color:#fff">🚚 출고 완료</span>';

      const action = r.status === 'completed'
        ? `<span style="font-size:0.8rem;color:var(--text-tertiary)">송장: ${r.trackingNumber||'-'}</span>`
        : r.status === 'pending'
        ? `<div style="display:flex;gap:5px;">
             <button class="btn btn-sm btn-secondary" onclick="Outbound.editRequest('${r.id}')">수정</button>
             <button class="btn btn-sm btn-danger" onclick="Outbound.cancelRequest('${r.id}')">취소</button>
           </div>`
        : `<span style="font-size:0.8rem;color:var(--text-tertiary)">처리 중</span>`;

      return `<tr>
        <td style="font-size:0.85rem;color:var(--text-secondary)">${date}</td>
        <td style="font-weight:500">${prodStr}</td>
        <td style="font-weight:700;color:var(--color-outbound)">${totalQty.toLocaleString()}</td>
        <td>
          <div style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.85rem">${dest}</div>
          <div style="font-size:0.8rem;color:var(--text-tertiary)">${r.recipientPhone}</div>
        </td>
        <td>${badge}</td>
        <td>${action}</td>
      </tr>`;
    }).join('');

    if (window.lucide) lucide.createIcons();
  },

  editRequest(id) {
    const r = DB.getRequests().find(x => x.id === id);
    if (!r || r.status !== 'pending') return;
    if (!r.items) { r.items = [{productId: r.productId, quantity: r.quantity}]; }
    App.navigate('outbound-new');
    setTimeout(() => {
      document.getElementById('nrRecName').value  = r.recipientName || '';
      document.getElementById('nrRecPhone').value = r.recipientPhone || '';
      document.getElementById('nrAddress').value  = r.address || '';
      document.getElementById('nrMessage').value  = r.message || '';
      document.getElementById('nrItemsContainer').innerHTML = '';
      r.items.forEach(item => this.addRow(item.productId, item.quantity));
      document.getElementById('newReqForm').onsubmit = (e) => {
        e.preventDefault();
        DB.deleteRequest(id);
        this.submitForm(e);
      };
    }, 80);
  },

  cancelRequest(id) {
    if (!confirm('이 출고 요청을 취소하시겠습니까?')) return;
    DB.deleteRequest(id);
    this.renderBody(DB.getCurrentUser().id, 'all');
    alert('출고 요청이 취소되었습니다.');
  }
};
