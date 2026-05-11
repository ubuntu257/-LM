// ═══════════════════════════════════════════
// Requests Page (출고 요청서)
// ═══════════════════════════════════════════
const Requests = {
  filterStatus: 'all',
  filterCompany: '',
  companies: [],
  myProducts: [],

  async render() {
    const el = document.getElementById('pg-requests');
    UI.loading(el);

    const isAdmin = Auth.isAdmin();
    const isManager = Auth.isManager();
    const isClient = Auth.isClient();
    const canViewAll = isAdmin || isManager;

    try {
      this.companies = canViewAll ? await DB.getPermittedCompanies() : [Auth.profile];
      if (isClient) this.myProducts = await DB.getProducts(Auth.profile.id);

      el.innerHTML = `
        <div class="toolbar">
          <div class="toolbar-filters">
            <select class="filter-select" id="reqStatusFilter">
              <option value="all">전체 상태</option>
              <option value="pending">대기 중</option>
              <option value="confirmed">확인완료</option>
              <option value="completed">출고완료</option>
            </select>
            ${canViewAll && this.companies.length > 1 ? `
            <select class="filter-select" id="reqCompanyFilter">
              <option value="">전체 업체</option>
              ${this.companies.map(c => `<option value="${c.id}">${c.company_name}</option>`).join('')}
            </select>
            ` : ''}
          </div>
          ${isClient ? `
          <button class="btn btn-primary" onclick="Requests.openCreateModal()">
            <i data-lucide="plus"></i>출고 요청서 작성
          </button>
          ` : ''}
        </div>

        <div class="table-wrap">
          <div class="table-overflow">
            <table class="data-table">
              <thead><tr>
                <th>요청일시</th>
                ${canViewAll ? '<th>업체</th>' : ''}
                <th>수령인/배송지</th>
                <th>품목</th>
                <th>총수량</th>
                <th>상태</th>
                <th>관리</th>
              </tr></thead>
              <tbody id="reqBody">
                <tr><td colspan="8"><div class="loading"><div class="spinner"></div>조회 중...</div></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        ${this._modalsHTML(isAdmin, isClient)}
      `;

      document.getElementById('reqStatusFilter')?.addEventListener('change', e => {
        this.filterStatus = e.target.value;
        this._load();
      });
      document.getElementById('reqCompanyFilter')?.addEventListener('change', e => {
        this.filterCompany = e.target.value;
        this._load();
      });

      UI.icons();
      await this._load();
    } catch (err) {
      el.innerHTML = `<div class="alert alert-danger">오류: ${err.message}</div>`;
    }
  },

  async _load() {
    const isAdmin = Auth.isAdmin();
    const companyId = Auth.isClient()
      ? Auth.profile.id
      : (this.filterCompany || undefined);
    const status = this.filterStatus === 'all' ? undefined : this.filterStatus;

    try {
      const reqs = await DB.getRequests({ companyId, status });
      this._renderTable(reqs);
    } catch (err) {
      document.getElementById('reqBody').innerHTML =
        `<tr><td colspan="8" style="color:var(--red);text-align:center;padding:24px">오류: ${err.message}</td></tr>`;
    }
  },

  _renderTable(reqs) {
    const isAdmin = Auth.isAdmin();
    const isClient = Auth.isClient();
    const canViewAll = Auth.isAdmin() || Auth.isManager();
    const tbody = document.getElementById('reqBody');
    if (!tbody) return;

    if (!reqs || reqs.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="8">요청 내역이 없습니다</td></tr>`;
      return;
    }

    const statusBadge = {
      pending:   '<span class="badge badge-gray">대기 중</span>',
      confirmed: '<span class="badge badge-amber">확인완료</span>',
      completed: '<span class="badge badge-green">출고완료</span>',
    };

    tbody.innerHTML = reqs.map(r => {
      const items = r.items || [];
      const first = items[0];
      const prodLabel = first
        ? (first.product?.name || '?') + (items.length > 1 ? ` 외 ${items.length - 1}건` : '')
        : '-';
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);

      let actions = '';
      if (isAdmin) {
        if (r.status === 'pending') {
          actions = `
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-sm btn-success" onclick="Requests.confirm('${r.id}')">
                <i data-lucide="check"></i>확인완료
              </button>
              <button class="btn btn-sm btn-secondary" onclick="Requests.openEditModal('${r.id}')">
                <i data-lucide="pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="Requests.deleteReq('${r.id}')">
                <i data-lucide="trash-2"></i>
              </button>
            </div>`;
        } else if (r.status === 'confirmed') {
          actions = `
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn btn-sm btn-secondary" onclick="Requests.printSpec('${r.id}')">
                <i data-lucide="printer"></i>명세서
              </button>
              <button class="btn btn-sm btn-primary" onclick="Requests.openCompleteModal('${r.id}')">
                <i data-lucide="package-check"></i>출고완료
              </button>
            </div>`;
        } else {
          // 출고완료 — 관리자는 명세서 보기 + 수정 가능
          actions = `
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <span style="font-size:0.78rem;color:var(--text-3);white-space:nowrap">${r.tracking_number ? '송장: ' + r.tracking_number : '송장없음'}</span>
              <button class="btn btn-sm btn-secondary" onclick="Requests.printSpec('${r.id}')">
                <i data-lucide="printer"></i>명세서
              </button>
              <button class="btn btn-sm btn-secondary" onclick="Requests.openEditModal('${r.id}')">
                <i data-lucide="pencil"></i>수정
              </button>
            </div>`;
        }
      } else if (isClient) {
        if (r.status === 'pending') {
          actions = `
            <div style="display:flex;gap:6px">
              <button class="btn btn-sm btn-secondary" onclick="Requests.openEditModal('${r.id}')">
                <i data-lucide="pencil"></i>수정
              </button>
              <button class="btn btn-sm btn-danger" onclick="Requests.deleteReq('${r.id}')">
                <i data-lucide="trash-2"></i>
              </button>
            </div>`;
        } else if (r.status === 'confirmed') {
          actions = '<span style="font-size:0.8rem;color:var(--amber)">확인완료 (수정불가)</span>';
        } else {
          actions = `<span style="font-size:0.8rem;color:var(--text-3)">송장: ${r.tracking_number || '-'}</span>`;
        }
      } else {
        // manager
        actions = '-';
      }

      return `<tr>
        <td style="color:var(--text-3);font-size:0.8rem;white-space:nowrap">${UI.fmtDatetime(r.created_at)}</td>
        ${canViewAll ? `<td>
          <div style="display:flex;align-items:center;gap:7px">
            <div style="width:7px;height:7px;border-radius:50%;background:${r.company?.logo_color || '#6366f1'}"></div>
            <span style="font-size:0.8rem">${r.company?.company_name || '-'}</span>
          </div>
        </td>` : ''}
        <td>
          <div style="font-weight:600;color:var(--text-1);font-size:0.85rem">${r.recipient_name}</div>
          <div style="font-size:0.78rem;color:var(--text-3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
               title="${r.address}">${r.address}</div>
          <div style="font-size:0.75rem;color:var(--text-3)">${r.recipient_phone}</div>
        </td>
        <td class="td-main" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap"
            title="${prodLabel}">${prodLabel}</td>
        <td style="font-weight:700;color:var(--amber)">${UI.fmtNum(totalQty)}</td>
        <td>${statusBadge[r.status] || ''}</td>
        <td>${actions}</td>
      </tr>`;
    }).join('');

    UI.icons();
  },

  _modalsHTML(isAdmin, isClient) {
    const createEditModal = `
      <div class="modal-overlay" id="reqFormModal">
        <div class="modal" style="max-width:680px">
          <div class="modal-header">
            <div class="modal-title" id="reqFormTitle">출고 요청서 작성</div>
            <button class="btn-icon" onclick="UI.closeModal('reqFormModal')"><i data-lucide="x"></i></button>
          </div>
          <form id="reqForm" onsubmit="Requests.submitForm(event)">
            <input type="hidden" id="reqEditId">
            <div class="modal-body">
              <h4 style="font-size:0.88rem;font-weight:700;color:var(--text-2);margin-bottom:12px">1. 수령인 정보</h4>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                <div class="form-group" style="margin:0">
                  <label class="form-label">받는 분 성함 *</label>
                  <input class="form-input" id="reqRecipient" required placeholder="홍길동">
                </div>
                <div class="form-group" style="margin:0">
                  <label class="form-label">연락처 *</label>
                  <input class="form-input" id="reqPhone" required placeholder="010-1234-5678">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">배송지 주소 *</label>
                <input class="form-input" id="reqAddress" required placeholder="상세 주소를 정확히 입력하세요">
              </div>
              <div class="form-group">
                <label class="form-label">배송 메시지</label>
                <input class="form-input" id="reqMessage" placeholder="문앞 배치 등 (선택사항)">
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;margin-top:8px">
                <h4 style="font-size:0.88rem;font-weight:700;color:var(--text-2)">2. 출고 품목</h4>
                <button type="button" class="btn btn-sm btn-secondary" onclick="Requests.addItemRow()">
                  <i data-lucide="plus"></i>품목 추가
                </button>
              </div>
              <div class="req-items-container" id="reqItemsContainer"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="UI.closeModal('reqFormModal')">취소</button>
              <button type="submit" class="btn btn-primary" id="reqSubmitBtn">요청서 제출</button>
            </div>
          </form>
        </div>
      </div>`;

    const completeModal = isAdmin ? `
      <div class="modal-overlay" id="reqCompleteModal">
        <div class="modal" style="max-width:400px">
          <div class="modal-header">
            <div class="modal-title">출고완료 처리</div>
            <button class="btn-icon" onclick="UI.closeModal('reqCompleteModal')"><i data-lucide="x"></i></button>
          </div>
          <form id="reqCompleteForm" onsubmit="Requests.submitComplete(event)">
            <input type="hidden" id="reqCompleteId">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">운송장 번호 (선택)</label>
                <input class="form-input" id="reqTracking" placeholder="CJ대한통운 1234567890">
              </div>
              <div class="alert alert-info">
                완료 처리 시 재고가 자동으로 차감되고 출고 이력이 생성됩니다.
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" onclick="UI.closeModal('reqCompleteModal')">취소</button>
              <button type="submit" class="btn btn-primary">완료 처리</button>
            </div>
          </form>
        </div>
      </div>` : '';

    return createEditModal + completeModal;
  },

  openCreateModal() {
    document.getElementById('reqFormTitle').textContent = '출고 요청서 작성';
    document.getElementById('reqSubmitBtn').textContent = '요청서 제출';
    document.getElementById('reqEditId').value = '';
    document.getElementById('reqForm').reset();
    document.getElementById('reqItemsContainer').innerHTML = '';
    this.addItemRow();
    UI.openModal('reqFormModal');
    UI.icons();
  },

  openEditModal(id) {
    // 현재 로드된 테이블에서 바로 찾을 수 없으므로 DB에서 재조회
    DB.getRequests({ companyId: Auth.isClient() ? Auth.profile.id : undefined }).then(reqs => {
      const r = reqs.find(x => x.id === id);
      if (!r) return;
      // 화주는 대기 중만 수정 가능, 관리자는 모든 상태 수정 가능
      if (!Auth.isAdmin() && r.status !== 'pending') {
        UI.toast('대기 중 상태에서만 수정 가능합니다', 'warning'); return;
      }

      const statusLabel = { pending: '대기 중', confirmed: '확인완료', completed: '출고완료' };
      document.getElementById('reqFormTitle').textContent = `출고 요청서 수정 [${statusLabel[r.status] || r.status}]`;
      document.getElementById('reqSubmitBtn').textContent = '수정 완료';
      document.getElementById('reqEditId').value = id;
      document.getElementById('reqRecipient').value = r.recipient_name;
      document.getElementById('reqPhone').value = r.recipient_phone;
      document.getElementById('reqAddress').value = r.address;
      document.getElementById('reqMessage').value = r.message || '';

      const container = document.getElementById('reqItemsContainer');
      container.innerHTML = '';
      (r.items || []).forEach(item => this.addItemRow(item.product_id, item.quantity));

      // 매니저/관리자가 수정하는 경우 업체 제품 목록 설정
      if (Auth.isAdmin()) {
        this.myProducts = [];
        DB.getProducts(r.company_id).then(prods => {
          this.myProducts = prods;
          container.innerHTML = '';
          (r.items || []).forEach(item => this.addItemRow(item.product_id, item.quantity));
          UI.icons();
        });
      }

      UI.openModal('reqFormModal');
      UI.icons();
    });
  },

  addItemRow(productId = '', quantity = 1) {
    const container = document.getElementById('reqItemsContainer');
    const rowId = 'row_' + Date.now() + Math.random().toString(36).slice(2, 6);
    const productOpts = this.myProducts.map(p =>
      `<option value="${p.id}" ${p.id === productId ? 'selected' : ''}>
        ${p.name} (재고: ${UI.fmtNum(p.current_stock)}${p.unit})
      </option>`
    ).join('');

    container.insertAdjacentHTML('beforeend', `
      <div id="${rowId}" class="req-item-row">
        <select class="form-input req-item-product" required>
          <option value="" disabled ${!productId ? 'selected' : ''}>제품 선택</option>
          ${productOpts}
        </select>
        <input class="form-input req-item-qty" type="number" min="1" value="${quantity}" required>
        <button type="button" class="btn-icon" style="color:var(--red)" onclick="document.getElementById('${rowId}').remove()">
          <i data-lucide="x" style="width:16px;height:16px"></i>
        </button>
      </div>
    `);
    UI.icons();
  },

  async submitForm(e) {
    e.preventDefault();
    const editId = document.getElementById('reqEditId').value;
    const btn = document.getElementById('reqSubmitBtn');
    btn.disabled = true;

    const recipientName = document.getElementById('reqRecipient').value.trim();
    const recipientPhone = document.getElementById('reqPhone').value.trim();
    const address = document.getElementById('reqAddress').value.trim();
    const message = document.getElementById('reqMessage').value.trim();

    const rows = document.querySelectorAll('#reqItemsContainer .req-item-row');
    if (rows.length === 0) { UI.toast('품목을 1개 이상 추가하세요', 'warning'); btn.disabled = false; return; }

    const items = [];
    const seen = {};
    let valid = true;

    const skipStockCheck = Auth.isAdmin() && !!editId; // 관리자가 기존 요청 수정 시 재고 검증 생략

    rows.forEach(row => {
      const productId = row.querySelector('.req-item-product').value;
      const quantity = parseInt(row.querySelector('.req-item-qty').value) || 0;
      if (!productId || quantity <= 0) { valid = false; return; }

      // 재고 확인 (관리자 수정 시 생략)
      if (!skipStockCheck) {
        const product = this.myProducts.find(p => p.id === productId);
        const alreadyReq = seen[productId] || 0;
        if (product && (alreadyReq + quantity) > product.current_stock) {
          UI.toast(`"${product.name}" 재고 부족 (현재: ${UI.fmtNum(product.current_stock)}${product.unit})`, 'danger');
          valid = false;
          return;
        }
        seen[productId] = alreadyReq + quantity;
      }
      items.push({ productId, quantity });
    });

    if (!valid) { btn.disabled = false; return; }

    try {
      if (editId) {
        await DB.updateRequest(editId, { recipientName, recipientPhone, address, message, items });
        UI.toast('수정되었습니다');
      } else {
        await DB.createRequest({
          companyId: Auth.profile.id,
          recipientName, recipientPhone, address, message, items,
        });
        UI.toast('출고 요청서가 제출되었습니다');
      }
      UI.closeModal('reqFormModal');
      await this._load();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    } finally {
      btn.disabled = false;
    }
  },

  async confirm(id) {
    if (!await UI.confirm('이 요청을 확인완료 처리하시겠습니까?\n확인완료 후 화주가 수정할 수 없습니다.')) return;
    try {
      await DB.confirmRequest(id);
      UI.toast('확인완료 처리되었습니다');
      App._updateBadges();
      await this._load();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    }
  },

  openCompleteModal(id) {
    document.getElementById('reqCompleteId').value = id;
    document.getElementById('reqTracking').value = '';
    UI.openModal('reqCompleteModal');
  },

  async submitComplete(e) {
    e.preventDefault();
    const id = document.getElementById('reqCompleteId').value;
    const tracking = document.getElementById('reqTracking').value.trim();
    try {
      await DB.completeRequest(id, tracking);
      UI.closeModal('reqCompleteModal');
      UI.toast('출고완료 처리되었습니다. 재고가 차감되었습니다.');
      await this._load();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    }
  },

  async deleteReq(id) {
    if (!await UI.confirm('이 요청서를 삭제하시겠습니까?')) return;
    try {
      await DB.deleteRequest(id);
      UI.toast('삭제되었습니다');
      await this._load();
    } catch (err) {
      UI.toast('오류: ' + err.message, 'danger');
    }
  },

  async printSpec(id) {
    const reqs = await DB.getRequests({});
    const r = reqs.find(x => x.id === id);
    if (!r) return;

    const dateStr = UI.fmtDatetime(r.created_at);
    const reqNum = 'REQ-' + r.id.slice(0, 8).toUpperCase();

    const itemsHtml = (r.items || []).map((item, i) => `
      <tr>
        <td style="border:1px solid #000;padding:10px;text-align:center">${i + 1}</td>
        <td style="border:1px solid #000;padding:10px">${item.product?.name || '-'}</td>
        <td style="border:1px solid #000;padding:10px;text-align:center">${item.product?.sku || '-'}</td>
        <td style="border:1px solid #000;padding:10px;text-align:center;font-weight:bold;font-size:1.1em">${item.quantity}</td>
        <td style="border:1px solid #000;padding:10px;text-align:center">${item.product?.unit || '개'}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>출고 명세서 ${reqNum}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Malgun Gothic', sans-serif; color:#000; background:#fff; padding:40px; }
  h1 { text-align:center; font-size:24px; margin-bottom:32px; padding-bottom:14px; border-bottom:2px solid #000; }
  table { width:100%; border-collapse:collapse; margin-bottom:20px; }
  th { background:#f0f0f0; }
  .sign { text-align:right; margin-top:48px; font-size:14px; }
  @media print {
    body { padding:20px; }
    button { display:none; }
  }
</style>
</head>
<body>
  <h1>출고 명세서</h1>
  <table>
    <tr>
      <th style="border:1px solid #000;padding:10px;width:15%">요청번호</th>
      <td style="border:1px solid #000;padding:10px;width:35%">${reqNum}</td>
      <th style="border:1px solid #000;padding:10px;width:15%">요청일시</th>
      <td style="border:1px solid #000;padding:10px">${dateStr}</td>
    </tr>
    <tr>
      <th style="border:1px solid #000;padding:10px">요청업체</th>
      <td style="border:1px solid #000;padding:10px">${r.company?.company_name || ''}</td>
      <th style="border:1px solid #000;padding:10px">담당자</th>
      <td style="border:1px solid #000;padding:10px">${r.recipient_phone}</td>
    </tr>
  </table>

  <div style="border:2px solid #000;margin-bottom:20px">
    <div style="padding:10px;background:#f0f0f0;border-bottom:1px solid #000;font-weight:bold;text-align:center">배송 정보</div>
    <table>
      <tr>
        <th style="border-right:1px solid #ccc;border-bottom:1px solid #ccc;padding:10px;width:18%;background:#f9f9f9">수령인</th>
        <td style="border-right:1px solid #ccc;border-bottom:1px solid #ccc;padding:10px;width:32%">${r.recipient_name}</td>
        <th style="border-right:1px solid #ccc;border-bottom:1px solid #ccc;padding:10px;width:18%;background:#f9f9f9">연락처</th>
        <td style="border-bottom:1px solid #ccc;padding:10px">${r.recipient_phone}</td>
      </tr>
      <tr>
        <th style="border-right:1px solid #ccc;border-bottom:1px solid #ccc;padding:10px;background:#f9f9f9">배송주소</th>
        <td colspan="3" style="border-bottom:1px solid #ccc;padding:10px">${r.address}</td>
      </tr>
      <tr>
        <th style="border-right:1px solid #ccc;padding:10px;background:#f9f9f9">배송메시지</th>
        <td colspan="3" style="padding:10px">${r.message || '없음'}</td>
      </tr>
    </table>
  </div>

  <div style="font-weight:bold;margin-bottom:8px">출고 품목</div>
  <table>
    <thead>
      <tr>
        <th style="border:1px solid #000;padding:10px;width:8%">No.</th>
        <th style="border:1px solid #000;padding:10px">제품명</th>
        <th style="border:1px solid #000;padding:10px;width:15%">SKU</th>
        <th style="border:1px solid #000;padding:10px;width:12%">수량</th>
        <th style="border:1px solid #000;padding:10px;width:10%">단위</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div class="sign">출고 담당자 확인 : ________________________ (서명)</div>

</body>
</html>`;

    // iframe으로 인쇄 (팝업 차단 우회)
    let iframe = document.getElementById('_printFrame');
    if (iframe) iframe.remove();
    iframe = document.createElement('iframe');
    iframe.id = '_printFrame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none';
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 600);
  },
};
