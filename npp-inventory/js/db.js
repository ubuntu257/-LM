// ═══════════════════════════════════════════
// DB Module — Supabase 쿼리 래퍼
// ═══════════════════════════════════════════
const DB = {

  // ── Profiles ────────────────────────────
  async getClients() {
    const { data, error } = await _sb
      .from('user_profiles')
      .select('*')
      .eq('role', 'client')
      .eq('is_active', true)
      .order('company_name');
    if (error) throw error;
    return data;
  },

  async getManagers() {
    const { data, error } = await _sb
      .from('user_profiles')
      .select('*')
      .eq('role', 'manager')
      .eq('is_active', true)
      .order('company_name');
    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    const { data, error } = await _sb
      .from('user_profiles')
      .select('*')
      .order('role')
      .order('company_name');
    if (error) throw error;
    return data;
  },

  async updateProfile(id, updates) {
    const { error } = await _sb.from('user_profiles').update(updates).eq('id', id);
    if (error) throw error;
  },

  // ── Manager Permissions ─────────────────
  async getManagerPermissions(managerId) {
    const { data, error } = await _sb
      .from('manager_permissions')
      .select('company_id')
      .eq('manager_id', managerId);
    if (error) throw error;
    return data.map(r => r.company_id);
  },

  async setManagerPermissions(managerId, companyIds) {
    // 기존 삭제 후 재삽입
    await _sb.from('manager_permissions').delete().eq('manager_id', managerId);
    if (companyIds.length === 0) return;
    const rows = companyIds.map(cid => ({ manager_id: managerId, company_id: cid }));
    const { error } = await _sb.from('manager_permissions').insert(rows);
    if (error) throw error;
  },

  // 역할별 볼 수 있는 업체 목록
  async getPermittedCompanies() {
    if (Auth.isAdmin() || Auth.isObserver()) return DB.getClients();
    if (Auth.isManager()) {
      const ids = await DB.getManagerPermissions(Auth.profile.id);
      if (ids.length === 0) return [];
      const { data, error } = await _sb
        .from('user_profiles')
        .select('*')
        .in('id', ids)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    }
    return [Auth.profile];
  },

  // ── Products ─────────────────────────────
  async getProducts(companyId) {
    let q = _sb.from('products').select('*, company:user_profiles(company_name, logo_color)').eq('is_active', true);
    if (companyId) q = q.eq('company_id', companyId);
    q = q.order('name');
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async createProduct(data) {
    const { error } = await _sb.from('products').insert(data);
    if (error) throw error;
  },

  async updateProduct(id, updates) {
    const { error } = await _sb.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async deleteProduct(id) {
    const { error } = await _sb.from('products').update({ is_active: false }).eq('id', id);
    if (error) throw error;
  },

  // ── Transactions ─────────────────────────
  async getTransactions({ companyId, type, startDate, endDate, limit = 200 } = {}) {
    let q = _sb
      .from('transactions')
      .select(`
        *,
        product:products(name, sku, unit),
        company:user_profiles!transactions_company_id_fkey(company_name, logo_color)
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (companyId) q = q.eq('company_id', companyId);
    if (type) q = q.eq('type', type);
    if (startDate) q = q.gte('transaction_date', startDate);
    if (endDate) q = q.lte('transaction_date', endDate);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async processTransactionBatch(rows) {
    const { data, error } = await _sb.rpc('process_transaction_batch', { p_rows: rows });
    if (error) throw error;
    return data;
  },

  // ── Outbound Requests ────────────────────
  async getRequests({ companyId, status } = {}) {
    let q = _sb
      .from('outbound_requests')
      .select(`
        *,
        company:user_profiles!outbound_requests_company_id_fkey(company_name, logo_color),
        items:outbound_request_items(*, product:products(name, sku, unit, purchase_price))
      `)
      .order('created_at', { ascending: false });

    if (companyId) q = q.eq('company_id', companyId);
    if (status) q = q.eq('status', status);

    const { data, error } = await q;
    if (error) throw error;
    return data;
  },

  async createRequest({ companyId, recipientName, recipientPhone, address, message, items }) {
    const { data: req, error } = await _sb
      .from('outbound_requests')
      .insert({
        company_id: companyId,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        address,
        message,
      })
      .select()
      .single();
    if (error) throw error;

    const itemRows = items.map(i => ({
      request_id: req.id,
      product_id: i.productId,
      quantity: i.quantity,
    }));
    const { error: itemErr } = await _sb.from('outbound_request_items').insert(itemRows);
    if (itemErr) throw itemErr;

    return req;
  },

  async updateRequest(id, { recipientName, recipientPhone, address, message, items }) {
    const { error } = await _sb.from('outbound_requests').update({
      recipient_name: recipientName,
      recipient_phone: recipientPhone,
      address,
      message,
    }).eq('id', id);
    if (error) throw error;

    // 아이템 교체
    await _sb.from('outbound_request_items').delete().eq('request_id', id);
    const itemRows = items.map(i => ({
      request_id: id,
      product_id: i.productId,
      quantity: i.quantity,
    }));
    const { error: itemErr } = await _sb.from('outbound_request_items').insert(itemRows);
    if (itemErr) throw itemErr;
  },

  async deleteRequest(id) {
    await _sb.from('outbound_request_items').delete().eq('request_id', id);
    const { error } = await _sb.from('outbound_requests').delete().eq('id', id);
    if (error) throw error;
  },

  async confirmRequest(id) {
    const { error } = await _sb.rpc('confirm_request', { p_request_id: id });
    if (error) throw error;
  },

  async completeRequest(id, tracking = '') {
    const { error } = await _sb.rpc('complete_request', { p_request_id: id, p_tracking: tracking });
    if (error) throw error;
  },

  // ── Settlement ───────────────────────────
  async getSettlement(companyId, year, month) {
    const { data, error } = await _sb.rpc('get_settlement', {
      p_company_id: companyId,
      p_year: year,
      p_month: month,
    });
    if (error) throw error;
    return data;
  },

  // ── Tracking Numbers ─────────────────────
  async updateTrackingNumber(requestId, trackingNumber) {
    const { error } = await _sb
      .from('outbound_requests')
      .update({ tracking_number: trackingNumber })
      .eq('id', requestId);
    if (error) throw error;
  },

  async getRequestById(id) {
    const { data, error } = await _sb
      .from('outbound_requests')
      .select(`*, company:user_profiles!outbound_requests_company_id_fkey(company_name, logo_color), items:outbound_request_items(*, product:products(name, sku, unit))`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // REQ-XXXXXXXX 단축 참조번호로 조회 (첫 8자리 UUID 범위 검색)
  async getRequestByShortRef(shortRef) {
    const lower = shortRef.toLowerCase();
    const { data, error } = await _sb
      .from('outbound_requests')
      .select(`*, company:user_profiles!outbound_requests_company_id_fkey(company_name, logo_color), items:outbound_request_items(*, product:products(name, sku, unit))`)
      .gte('id', `${lower}-0000-0000-0000-000000000000`)
      .lte('id', `${lower}-ffff-ffff-ffff-ffffffffffff`)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // ── Account Management (Admin) ───────────
  async setUserPassword(userId, password) {
    const { error } = await _sb.rpc('admin_set_password', {
      p_user_id: userId,
      p_password: password,
    });
    if (error) throw error;
  },

  async setCompanyCode(userId, newCode) {
    const { error } = await _sb.rpc('admin_set_company_code', {
      p_user_id: userId,
      p_new_code: newCode,
    });
    if (error) throw error;
  },

  async setUserActive(userId, isActive) {
    const { error } = await _sb.from('user_profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    if (error) throw error;
  },

  async getAllProfilesAll() {
    // is_active 관계없이 전체 조회 (관리자 설정용)
    const { data, error } = await _sb
      .from('user_profiles')
      .select('*')
      .order('role')
      .order('company_name');
    if (error) throw error;
    return data;
  },

  // ── Dashboard Stats ──────────────────────
  async getDashboardStats(companyIds) {
    // 제품 수 및 재고 현황
    let pq = _sb.from('products').select('id, current_stock, min_stock, company_id').eq('is_active', true);
    if (companyIds && companyIds.length > 0) pq = pq.in('company_id', companyIds);
    const { data: products } = await pq;

    // 이번 달 입출고
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    let tq = _sb.from('transactions').select('type, quantity, company_id').gte('transaction_date', monthStart);
    if (companyIds && companyIds.length > 0) tq = tq.in('company_id', companyIds);
    const { data: txns } = await tq;

    // 대기 중인 출고 요청
    let rq = _sb.from('outbound_requests').select('id, status, company_id').eq('status', 'pending');
    if (companyIds && companyIds.length > 0) rq = rq.in('company_id', companyIds);
    const { data: pendingReqs } = await rq;

    // 확인완료 대기 요청
    let cq = _sb.from('outbound_requests').select('id, company_id').eq('status', 'confirmed');
    if (companyIds && companyIds.length > 0) cq = cq.in('company_id', companyIds);
    const { data: confirmedReqs } = await cq;

    const totalProducts = products?.length || 0;
    const lowStock = products?.filter(p => p.current_stock <= p.min_stock).length || 0;
    const monthInbound = txns?.filter(t => t.type === 'inbound').reduce((s, t) => s + t.quantity, 0) || 0;
    const monthOutbound = txns?.filter(t => t.type === 'outbound').reduce((s, t) => s + t.quantity, 0) || 0;

    return {
      totalProducts,
      lowStock,
      monthInbound,
      monthOutbound,
      pendingRequests: pendingReqs?.length || 0,
      confirmedRequests: confirmedReqs?.length || 0,
    };
  },
};
