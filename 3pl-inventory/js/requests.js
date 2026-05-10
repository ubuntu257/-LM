// 3PL - Outbound Requests Module
const Requests = {
  statusFilter: 'all',
  companyFilter: 'all',
  currentProducts: [], // Used for dynamic row generation

  render(companyId) {
    const page = document.getElementById('page-requests');
    const user = DB.getCurrentUser();
    if (!user) return; // 세션 없으면 렌더 안 함

    const isAdmin = user.role === 'admin';
    const effectiveId = (isAdmin && this.companyFilter !== 'all') ? this.companyFilter : user.id;

    if (!isAdmin) {
      this.currentProducts = DB.getProducts(user.id);
    }

    page.innerHTML = `
      <div class="history-toolbar">
        <div class="history-filters">
          <select class="filter-select" id="reqStatusFilter">
            <option value="all">전체 상태</option>
            <option value="pending">대기 중</option>
            <option value="approved">승인 (명세서출력)</option>
            <option value="completed">출고 완료</option>
          </select>
          ${isAdmin ? `<select class="filter-select" id="reqCompanyFilter">
            <option value="all">전체 업체</option>
            ${DB.getCompanies().filter(c=>c.role==='client').map(c=>`<option value="${c.id}" ${this.companyFilter===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>` : ''}
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          ${!isAdmin ? `
          <button class="btn btn-primary" id="btnNewRequest">
            <i data-lucide="plus" style="width:16px;height:16px"></i>새 출고 요청
          </button>` : ''}
        </div>
      </div>
      <div class="history-table-wrap animate-fade-in">
        <table class="data-table">
          <thead><tr>
            <th>요청일시</th>
            ${isAdmin ? '<th>업체명</th>' : ''}
            <th>요청 품목</th>
            <th>총 수량</th>
            <th>도착지/수령인</th>
            <th>상태</th>
            <th>관리</th>
          </tr></thead>
          <tbody id="reqBody"></tbody>
        </table>
      </div>
      ${this.getModalsHTML(isAdmin)}
    `;
    this.bindEvents();
    this.refreshTable(effectiveId);
    if (window.lucide) lucide.createIcons();
  },

  bindEvents() {
    document.getElementById('reqStatusFilter')?.addEventListener('change', e => {
      this.statusFilter = e.target.value;
      this.refreshTable();
    });
    document.getElementById('reqCompanyFilter')?.addEventListener('change', e => {
      this.companyFilter = e.target.value;
      this.refreshTable();
    });
    const btnNewReq = document.getElementById('btnNewRequest');
    if (btnNewReq) {
      btnNewReq.addEventListener('click', () => this.showCreateModal());
    }
  },

  // Legacy fallback: convert old request format to items array
  normalizeRequest(req) {
    if (!req.items) {
      req.items = [{ productId: req.productId, quantity: req.quantity }];
      req.recipientName = '미입력';
      req.recipientPhone = '미입력';
      req.address = req.destination || '미입력';
      req.message = '';
    }
    return req;
  },

  refreshTable() {
    const user = DB.getCurrentUser();
    if (!user) return;
    const isAdmin = user.role === 'admin';
    const effectiveId = (isAdmin && this.companyFilter !== 'all') ? this.companyFilter : user.id;
    let reqs = DB.getRequests(effectiveId);

    if (this.statusFilter !== 'all') {
      reqs = reqs.filter(r => r.status === this.statusFilter);
    }

    const body = document.getElementById('reqBody');
    if (!body) return;

    body.innerHTML = reqs.length === 0
      ? `<tr><td colspan="${isAdmin?7:6}" style="text-align:center;padding:40px;color:var(--text-tertiary)">요청 내역이 없습니다</td></tr>`
      : reqs.map(r => {
        const req = this.normalizeRequest(r);
        const company = DB.getCompany(req.companyId);
        const d = new Date(req.requestDate);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        
        // Items Display
        const firstProduct = DB.getProduct(req.items[0].productId);
        const firstProdName = firstProduct ? firstProduct.name : '삭제된 제품';
        const prodDisplay = req.items.length > 1 ? `${firstProdName} 외 ${req.items.length - 1}건` : firstProdName;
        const totalQty = req.items.reduce((sum, item) => sum + parseInt(item.quantity), 0);

        // Destination Display
        const destDisplay = `[${req.recipientName}] ${req.address}`;

        let statusBadge = '';
        if (req.status === 'pending') statusBadge = '<span class="badge" style="background:var(--bg-tertiary);color:var(--text-primary)">대기 중</span>';
        else if (req.status === 'approved') statusBadge = '<span class="badge" style="background:#f59e0b;color:#fff">승인됨</span>';
        else if (req.status === 'completed') statusBadge = '<span class="badge" style="background:var(--color-inbound);color:#fff">출고 완료</span>';

        let actionHtml = '';
        if (isAdmin) {
          if (req.status === 'pending') {
            actionHtml = `
              <div style="display:flex;gap:5px;">
                <button class="btn btn-sm btn-primary" onclick="Requests.approve('${req.id}')">승인</button>
                <button class="btn btn-sm btn-secondary" onclick="Requests.editRequest('${req.id}')">수정</button>
                <button class="btn btn-sm btn-danger" onclick="Requests.deleteRequest('${req.id}')">삭제</button>
              </div>`;
          } else if (req.status === 'approved') {
            actionHtml = `
              <div style="display:flex;gap:5px;">
                <button class="btn btn-sm btn-secondary" onclick="Requests.printSpec('${req.id}')" title="명세서 출력"><i data-lucide="printer" style="width:14px;height:14px"></i></button>
                <button class="btn btn-sm btn-primary" onclick="Requests.showCompleteModal('${req.id}')">완료 처리</button>
              </div>`;
          } else if (req.status === 'completed') {
            actionHtml = `<span style="font-size:0.8rem;color:var(--text-tertiary)">${req.trackingNumber||'송장없음'}</span>`;
          }
        } else {
          if (req.status === 'completed') {
            actionHtml = `<span style="font-size:0.8rem;color:var(--text-tertiary)">송장: ${req.trackingNumber||'-'}</span>`;
          } else if (req.status === 'pending') {
            actionHtml = `
              <div style="display:flex;gap:5px;">
                <button class="btn btn-sm btn-secondary" onclick="Requests.editRequest('${req.id}')">수정</button>
                <button class="btn btn-sm btn-danger" onclick="Requests.deleteRequest('${req.id}')">삭제</button>
              </div>`;
          } else {
            actionHtml = `<span style="font-size:0.8rem;color:var(--text-tertiary)">승인됨 (처리중)</span>`;
          }
        }

        return `<tr>
          <td style="color:var(--text-secondary);font-size:0.85rem">${dateStr}</td>
          ${isAdmin ? `<td style="color:var(--text-tertiary)">${company?company.name:'-'}</td>` : ''}
          <td style="font-weight:500">${prodDisplay}</td>
          <td style="font-weight:700;color:var(--color-outbound)">${totalQty.toLocaleString()}</td>
          <td>
            <div style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.85rem" title="${destDisplay}">
              ${destDisplay}
            </div>
            <div style="font-size:0.8rem;color:var(--text-tertiary);margin-top:2px;">${req.recipientPhone}</div>
          </td>
          <td>${statusBadge}</td>
          <td>${actionHtml}</td>
        </tr>`;
      }).join('');

    if (window.lucide) lucide.createIcons();
  },

  getModalsHTML(isAdmin) {
    const createModal = `
        <!-- 출고 요청 생성/수정 모달 -->
        <div class="modal-overlay" id="reqCreateModalOverlay">
          <div class="modal animate-scale-in" style="background:var(--card-bg);width:700px;max-width:95%;border-radius:12px;padding:24px;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <h3 id="reqModalTitle" style="margin-bottom:16px;border-bottom:1px solid var(--border-color);padding-bottom:12px;">새 출고 요청서 작성</h3>
            <form id="reqCreateForm" onsubmit="Requests.submitCreate(event)">
              <input type="hidden" id="reqId" value="">
              
              <h4 style="font-size:0.95rem;color:var(--text-primary);margin-bottom:12px;">1. 수령인 및 배송지 정보</h4>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
                <div class="form-group" style="margin-bottom:0;"><label class="form-label">받는 사람 이름</label>
                  <input class="form-input" id="reqRecName" required placeholder="예: 홍길동"></div>
                <div class="form-group" style="margin-bottom:0;"><label class="form-label">받는 사람 연락처</label>
                  <input class="form-input" id="reqRecPhone" required placeholder="예: 010-1234-5678"></div>
              </div>
              <div class="form-group"><label class="form-label">배송지 주소</label>
                <input class="form-input" id="reqAddress" required placeholder="상세 주소를 정확히 입력해주세요."></div>
              <div class="form-group"><label class="form-label">배송 메시지 (특이사항)</label>
                <input class="form-input" id="reqMessage" placeholder="문앞에 놓아주세요 등 (선택사항)"></div>

              <h4 style="font-size:0.95rem;color:var(--text-primary);margin-top:24px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
                2. 출고 품목 리스트
                <button type="button" class="btn btn-sm btn-secondary" onclick="Requests.addReqItemRow()">
                  + 품목 추가
                </button>
              </h4>
              <div id="reqItemsContainer" style="background:rgba(255,255,255,0.02);border:1px solid var(--border-color);border-radius:8px;padding:16px;">
                <!-- 동적으로 아이템 행이 추가됨 -->
              </div>

              <div class="modal-footer" style="margin-top:24px;">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('reqCreateModalOverlay').classList.remove('active')">취소</button>
                <button type="submit" class="btn btn-primary" id="reqSubmitBtn">출고 요청하기</button>
              </div>
            </form>
          </div>
        </div>
    `;

    if (isAdmin) {
      return `
        <!-- 완료 처리 모달 -->
        <div class="modal-overlay" id="reqCompleteModalOverlay">
          <div class="modal animate-scale-in" style="background:var(--card-bg);width:400px;border-radius:12px;padding:24px;box-shadow:0 10px 25px rgba(0,0,0,0.2);">
            <h3 style="margin-bottom:16px;border-bottom:1px solid var(--border-color);padding-bottom:12px;">✅ 출고 완료 처리</h3>
            <form id="reqCompleteForm" onsubmit="Requests.submitComplete(event)">
              <input type="hidden" id="completeReqId">
              <div class="form-group"><label class="form-label">운송장 번호 (선택)</label>
                <input class="form-input" id="reqTracking" placeholder="예: CJ대한통운 123456789"></div>
              <p style="font-size:0.8rem;color:var(--text-tertiary);margin-bottom:20px;">* 완료 처리 시 재고가 자동으로 차감됩니다.</p>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('reqCompleteModalOverlay').classList.remove('active')">취소</button>
                <button type="submit" class="btn btn-primary">완료</button>
              </div>
            </form>
          </div>
        </div>
        ${createModal}
      `;
    } else {
      return createModal;
    }
  },

  showCreateModal() {
    document.getElementById('reqCreateForm').reset();
    document.getElementById('reqId').value = '';
    document.getElementById('reqModalTitle').innerText = '새 출고 요청서 작성';
    document.getElementById('reqSubmitBtn').innerText = '출고 요청하기';
    document.getElementById('reqItemsContainer').innerHTML = '';
    this.addReqItemRow();
    document.getElementById('reqCreateModalOverlay').classList.add('active');
  },

  addReqItemRow(productId = '', quantity = 1) {
    const container = document.getElementById('reqItemsContainer');
    const rowId = 'reqRow_' + Date.now() + Math.random().toString(36).substr(2, 4);
    
    const rowHTML = `
      <div id="${rowId}" style="display:flex;gap:10px;align-items:end;margin-bottom:12px;padding-bottom:12px;border-bottom:1px dashed var(--border-color);">
        <div class="form-group" style="flex:2;margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem">제품 선택</label>
          <select class="form-input req-item-select" required>
            <option value="" disabled ${!productId ? 'selected' : ''}>제품을 선택하세요</option>
            ${this.currentProducts.map(p => `<option value="${p.id}" ${p.id === productId ? 'selected' : ''}>${p.name} (현재재고: ${p.currentStock})</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="flex:1;margin-bottom:0;">
          <label class="form-label" style="font-size:0.8rem">수량</label>
          <input class="form-input req-item-qty" type="number" min="1" value="${quantity}" required>
        </div>
        <button type="button" class="btn btn-danger btn-icon" onclick="document.getElementById('${rowId}').remove()" title="행 삭제" style="margin-bottom:3px;">
          <i data-lucide="trash-2" style="width:18px;height:18px"></i>
        </button>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', rowHTML);
    if (window.lucide) lucide.createIcons();
  },

  submitCreate(e) {
    e.preventDefault();
    
    // 배송지 정보
    const recipientName = document.getElementById('reqRecName').value.trim();
    const recipientPhone = document.getElementById('reqRecPhone').value.trim();
    const address = document.getElementById('reqAddress').value.trim();
    const message = document.getElementById('reqMessage').value.trim();
    
    // 품목 정보 수집
    const itemRows = document.querySelectorAll('#reqItemsContainer > div');
    if (itemRows.length === 0) {
      alert('최소 1개 이상의 품목을 추가해야 합니다.');
      return;
    }

    const items = [];
    const aggregatedQty = {}; // productId -> total requested qty
    let isValid = true;

    itemRows.forEach(row => {
      const select = row.querySelector('.req-item-select');
      const qtyInput = row.querySelector('.req-item-qty');
      const pid = select.value;
      const qty = parseInt(qtyInput.value) || 0;

      if (!pid || qty <= 0) {
        alert('모든 품목의 제품을 선택하고 수량을 1 이상 입력해주세요.');
        isValid = false;
        return;
      }

      items.push({ productId: pid, quantity: qty });
      aggregatedQty[pid] = (aggregatedQty[pid] || 0) + qty;
    });

    if (!isValid) return;

    // 전체 재고 검증
    for (const [pid, totalRequested] of Object.entries(aggregatedQty)) {
      const product = DB.getProduct(pid);
      if (!product) {
        alert('선택한 제품 중 존재하지 않는 제품이 있습니다.');
        return;
      }
      if (totalRequested > product.currentStock) {
        alert(\`제품 "\${product.name}"의 총 요청 수량(\${totalRequested}개)이 현재 재고(\${product.currentStock}개)를 초과합니다.\`);
        return;
      }
    }

    const reqId = document.getElementById('reqId').value;
    
    if (reqId) {
      // update
      DB.updateRequest(reqId, {
        items: items,
        recipientName: recipientName,
        recipientPhone: recipientPhone,
        address: address,
        message: message
      });
      alert('출고 요청이 수정되었습니다.');
    } else {
      // create
      DB.addRequest({
        companyId: DB.getCurrentUser().id,
        items: items,
        recipientName: recipientName,
        recipientPhone: recipientPhone,
        address: address,
        message: message
      });
      alert('출고 요청이 완료되었습니다.');
    }

    document.getElementById('reqCreateModalOverlay').classList.remove('active');
    this.refreshTable();
  },

  approve(id) {
    if (!confirm('이 요청을 승인하시겠습니까?\\n승인 후 출고 명세서를 출력할 수 있습니다.')) return;
    DB.updateRequest(id, { status: 'approved' });
    this.refreshTable();
  },

  editRequest(id) {
    const reqRaw = DB.getRequests().find(r => r.id === id);
    if (!reqRaw || reqRaw.status !== 'pending') return;
    const req = this.normalizeRequest(reqRaw);
    
    const user = DB.getCurrentUser();
    if (user?.role === 'admin') {
      this.currentProducts = DB.getProducts(req.companyId);
    }
    
    document.getElementById('reqId').value = req.id;
    document.getElementById('reqModalTitle').innerText = '출고 요청서 수정';
    document.getElementById('reqSubmitBtn').innerText = '수정 완료';
    
    document.getElementById('reqRecName').value = req.recipientName;
    document.getElementById('reqRecPhone').value = req.recipientPhone;
    document.getElementById('reqAddress').value = req.address;
    document.getElementById('reqMessage').value = req.message || '';
    
    document.getElementById('reqItemsContainer').innerHTML = '';
    req.items.forEach(item => {
      this.addReqItemRow(item.productId, item.quantity);
    });
    
    document.getElementById('reqCreateModalOverlay').classList.add('active');
  },

  deleteRequest(id) {
    if (!confirm('이 출고 요청을 삭제하시겠습니까?')) return;
    DB.deleteRequest(id);
    this.refreshTable();
    alert('삭제되었습니다.');
  },

  showCompleteModal(id) {
    document.getElementById('completeReqId').value = id;
    document.getElementById('reqTracking').value = '';
    document.getElementById('reqCompleteModalOverlay').classList.add('active');
  },

  submitComplete(e) {
    e.preventDefault();
    const id = document.getElementById('completeReqId').value;
    const tracking = document.getElementById('reqTracking').value;

    const reqRaw = DB.getRequests().find(r => r.id === id);
    if (!reqRaw) return;
    const req = this.normalizeRequest(reqRaw);

    // 출고 내역 자동 생성 (다중 품목 처리)
    const txns = req.items.map(item => ({
      companyId: req.companyId,
      productId: item.productId,
      type: 'outbound',
      quantity: item.quantity,
      reference: 'REQ-' + req.id.split('_')[1],
      note: '출고 요청 완료' + (tracking ? ` (송장: ${tracking})` : ''),
      processedBy: DB.getCurrentUser().name
    }));

    DB.addBulkTransactions(txns);

    // 요청 상태 업데이트
    DB.updateRequest(id, { 
      status: 'completed', 
      trackingNumber: tracking,
      completedDate: new Date().toISOString()
    });

    document.getElementById('reqCompleteModalOverlay').classList.remove('active');
    this.refreshTable();
    alert('출고 처리가 완료되었으며, 재고가 차감되었습니다.');
  },

  printSpec(id) {
    const reqRaw = DB.getRequests().find(r => r.id === id);
    if (!reqRaw) return;
    const req = this.normalizeRequest(reqRaw);
    const company = DB.getCompany(req.companyId);
    
    const d = new Date(req.requestDate);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

    // 품목 테이블 행 생성
    const itemsHtml = req.items.map((item, idx) => {
      const product = DB.getProduct(item.productId);
      return `
        <tr>
          <td style="border: 1px solid #000; padding: 12px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 12px;">${product ? product.name : '삭제된 제품'}</td>
          <td style="border: 1px solid #000; padding: 12px; text-align: center;">${product ? product.sku : '-'}</td>
          <td style="border: 1px solid #000; padding: 12px; text-align: center; font-weight: bold; font-size: 1.1em;">${item.quantity}</td>
          <td style="border: 1px solid #000; padding: 12px; text-align: center;">${product ? product.location : '-'}</td>
        </tr>
      `;
    }).join('');

    const printArea = document.getElementById('printArea');
    printArea.innerHTML = `
      <div style="padding: 40px; font-family: sans-serif; max-width: 800px; margin: 0 auto; color: #000;">
        <h1 style="text-align: center; font-size: 28px; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px;">출고 명세서 (Outbound Specification)</h1>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <th style="border: 1px solid #000; padding: 10px; background: #eee; width: 15%;">요청 번호</th>
            <td style="border: 1px solid #000; padding: 10px; width: 35%;">REQ-${req.id.split('_')[1]}</td>
            <th style="border: 1px solid #000; padding: 10px; background: #eee; width: 15%;">요청 일시</th>
            <td style="border: 1px solid #000; padding: 10px; width: 35%;">${dateStr}</td>
          </tr>
          <tr>
            <th style="border: 1px solid #000; padding: 10px; background: #eee;">요청 업체</th>
            <td style="border: 1px solid #000; padding: 10px;">${company ? company.name : ''}</td>
            <th style="border: 1px solid #000; padding: 10px; background: #eee;">업체 연락처</th>
            <td style="border: 1px solid #000; padding: 10px;">${company ? company.contactPhone : ''}</td>
          </tr>
        </table>

        <div style="border: 2px solid #000; margin-bottom: 30px;">
          <h3 style="margin: 0; padding: 10px; background: #eee; border-bottom: 1px solid #000; text-align: center;">수령인 및 배송 정보</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <th style="border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 10px; width: 20%; background:#f9f9f9;">수령인</th>
              <td style="border-bottom: 1px solid #ccc; padding: 10px; width: 30%;">${req.recipientName}</td>
              <th style="border-left: 1px solid #ccc; border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 10px; width: 20%; background:#f9f9f9;">연락처</th>
              <td style="border-bottom: 1px solid #ccc; padding: 10px; width: 30%;">${req.recipientPhone}</td>
            </tr>
            <tr>
              <th style="border-right: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 10px; background:#f9f9f9;">배송지 주소</th>
              <td colspan="3" style="border-bottom: 1px solid #ccc; padding: 10px;">${req.address}</td>
            </tr>
            <tr>
              <th style="border-right: 1px solid #ccc; padding: 10px; background:#f9f9f9;">배송 메시지</th>
              <td colspan="3" style="padding: 10px;">${req.message || '없음'}</td>
            </tr>
          </table>
        </div>

        <h3 style="margin-bottom: 10px;">출고 품목 내역</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr>
              <th style="border: 1px solid #000; padding: 10px; background: #eee; width: 8%;">No.</th>
              <th style="border: 1px solid #000; padding: 10px; background: #eee;">제품명</th>
              <th style="border: 1px solid #000; padding: 10px; background: #eee; width: 15%;">SKU</th>
              <th style="border: 1px solid #000; padding: 10px; background: #eee; width: 15%;">수량</th>
              <th style="border: 1px solid #000; padding: 10px; background: #eee; width: 20%;">창고 위치</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 50px;">
          <p>출고 담당자 확인 : ________________________ (서명)</p>
        </div>
      </div>
    `;

    // Print logic
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printArea.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    
    // Re-initialize app since innerHTML was completely swapped
    App.init();
    App.navigate('requests');
  }
};
