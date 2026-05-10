-- =====================================================
-- NPP 재고 관리 시스템 — Supabase Schema
-- =====================================================

-- 1. User Profiles (Supabase Auth와 연결)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'client')),
  company_name TEXT NOT NULL,
  company_code TEXT UNIQUE NOT NULL,
  contact_name TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  business_number TEXT DEFAULT '',
  address TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  contract_date DATE,
  logo_color TEXT DEFAULT '#6366f1',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Manager Permissions (매니저가 볼 수 있는 화주 목록)
CREATE TABLE manager_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  UNIQUE(manager_id, company_id)
);

-- 3. Products (화주별 제품)
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT DEFAULT '',
  purchase_price DECIMAL(12,2) DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  location TEXT DEFAULT '',
  unit TEXT DEFAULT '개',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Transactions (입출고 이력)
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES user_profiles(id),
  product_id UUID REFERENCES products(id),
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12,2),
  reference TEXT DEFAULT '',
  note TEXT DEFAULT '',
  transaction_date DATE DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Outbound Requests (출고 요청서)
CREATE TABLE outbound_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed')),
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  message TEXT DEFAULT '',
  tracking_number TEXT DEFAULT '',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES user_profiles(id),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Outbound Request Items (출고 요청서 품목)
CREATE TABLE outbound_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES outbound_requests(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- =====================================================
-- RLS 활성화
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbound_request_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 헬퍼 함수
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'manager'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION can_view_company(cid UUID)
RETURNS BOOLEAN AS $$
  SELECT (
    is_admin()
    OR auth.uid() = cid
    OR (is_manager() AND EXISTS (
      SELECT 1 FROM manager_permissions
      WHERE manager_id = auth.uid() AND company_id = cid
    ))
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- RLS Policies — user_profiles
-- =====================================================
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (
  is_admin()
  OR id = auth.uid()
  OR (is_manager() AND id IN (
    SELECT company_id FROM manager_permissions WHERE manager_id = auth.uid()
  ))
);
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (is_admin() OR id = auth.uid());
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (is_admin() OR id = auth.uid());

-- =====================================================
-- RLS Policies — manager_permissions
-- =====================================================
CREATE POLICY "mgr_perm_select" ON manager_permissions FOR SELECT USING (
  is_admin() OR manager_id = auth.uid()
);
CREATE POLICY "mgr_perm_all" ON manager_permissions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS Policies — products
-- =====================================================
CREATE POLICY "products_select" ON products FOR SELECT USING (can_view_company(company_id));
CREATE POLICY "products_admin" ON products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS Policies — transactions
-- =====================================================
CREATE POLICY "trans_select" ON transactions FOR SELECT USING (can_view_company(company_id));
CREATE POLICY "trans_admin" ON transactions FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =====================================================
-- RLS Policies — outbound_requests
-- =====================================================
CREATE POLICY "req_select" ON outbound_requests FOR SELECT USING (can_view_company(company_id));
CREATE POLICY "req_admin" ON outbound_requests FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "req_client_insert" ON outbound_requests FOR INSERT
  WITH CHECK (company_id = auth.uid() AND NOT is_admin());
CREATE POLICY "req_client_update" ON outbound_requests FOR UPDATE
  USING (company_id = auth.uid() AND status = 'pending');
CREATE POLICY "req_client_delete" ON outbound_requests FOR DELETE
  USING (company_id = auth.uid() AND status = 'pending');

-- =====================================================
-- RLS Policies — outbound_request_items
-- =====================================================
CREATE POLICY "items_select" ON outbound_request_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM outbound_requests r WHERE r.id = request_id AND can_view_company(r.company_id))
);
CREATE POLICY "items_admin" ON outbound_request_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "items_client_insert" ON outbound_request_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM outbound_requests r WHERE r.id = request_id AND r.company_id = auth.uid() AND r.status = 'pending')
);
CREATE POLICY "items_client_delete" ON outbound_request_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM outbound_requests r WHERE r.id = request_id AND r.company_id = auth.uid() AND r.status = 'pending')
);

-- =====================================================
-- RPC Functions (원자적 처리)
-- =====================================================

-- 출고 확인완료 (pending → confirmed)
CREATE OR REPLACE FUNCTION confirm_request(p_request_id UUID)
RETURNS void AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Permission denied'; END IF;
  UPDATE outbound_requests SET
    status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = auth.uid()
  WHERE id = p_request_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or not pending'; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 출고 완료 처리 (confirmed → completed) + 재고 차감 + 이력 생성
CREATE OR REPLACE FUNCTION complete_request(p_request_id UUID, p_tracking TEXT)
RETURNS void AS $$
DECLARE
  v_req outbound_requests;
  v_item RECORD;
  v_stock INTEGER;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Permission denied'; END IF;

  SELECT * INTO v_req FROM outbound_requests WHERE id = p_request_id;
  IF v_req.status != 'confirmed' THEN
    RAISE EXCEPTION '확인완료 상태의 요청서만 처리할 수 있습니다';
  END IF;

  FOR v_item IN
    SELECT i.*, p.current_stock, p.name AS product_name
    FROM outbound_request_items i
    JOIN products p ON p.id = i.product_id
    WHERE i.request_id = p_request_id
  LOOP
    IF v_item.current_stock < v_item.quantity THEN
      RAISE EXCEPTION '재고 부족: % (현재: %, 요청: %)', v_item.product_name, v_item.current_stock, v_item.quantity;
    END IF;

    UPDATE products SET
      current_stock = current_stock - v_item.quantity,
      updated_at = NOW()
    WHERE id = v_item.product_id;

    INSERT INTO transactions (company_id, product_id, type, quantity, reference, note, created_by)
    VALUES (
      v_req.company_id,
      v_item.product_id,
      'outbound',
      v_item.quantity,
      'REQ-' || UPPER(LEFT(p_request_id::TEXT, 8)),
      '출고요청 완료' || CASE WHEN p_tracking != '' THEN ' (송장: ' || p_tracking || ')' ELSE '' END,
      auth.uid()
    );
  END LOOP;

  UPDATE outbound_requests SET
    status = 'completed',
    tracking_number = p_tracking,
    completed_at = NOW(),
    completed_by = auth.uid()
  WHERE id = p_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 엑셀 일괄 입출고 처리 (재고 업데이트 포함)
CREATE OR REPLACE FUNCTION process_transaction_batch(p_rows JSONB)
RETURNS INTEGER AS $$
DECLARE
  v_row JSONB;
  v_count INTEGER := 0;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Permission denied'; END IF;

  FOR v_row IN SELECT * FROM jsonb_array_elements(p_rows) LOOP
    INSERT INTO transactions (company_id, product_id, type, quantity, reference, note, transaction_date, created_by)
    VALUES (
      (v_row->>'company_id')::UUID,
      (v_row->>'product_id')::UUID,
      v_row->>'type',
      (v_row->>'quantity')::INTEGER,
      COALESCE(v_row->>'reference', ''),
      COALESCE(v_row->>'note', ''),
      COALESCE((v_row->>'transaction_date')::DATE, CURRENT_DATE),
      auth.uid()
    );

    IF v_row->>'type' = 'inbound' THEN
      UPDATE products SET
        current_stock = current_stock + (v_row->>'quantity')::INTEGER,
        updated_at = NOW()
      WHERE id = (v_row->>'product_id')::UUID;
    ELSE
      UPDATE products SET
        current_stock = GREATEST(0, current_stock - (v_row->>'quantity')::INTEGER),
        updated_at = NOW()
      WHERE id = (v_row->>'product_id')::UUID;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 정산 데이터 조회 (품목별 매입금액 기준)
CREATE OR REPLACE FUNCTION get_settlement(p_company_id UUID, p_year INT, p_month INT)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  purchase_price DECIMAL,
  unit TEXT,
  total_outbound BIGINT,
  total_amount DECIMAL
) AS $$
BEGIN
  IF NOT can_view_company(p_company_id) THEN RAISE EXCEPTION 'Permission denied'; END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    p.purchase_price,
    p.unit,
    COALESCE(SUM(t.quantity), 0)::BIGINT AS total_outbound,
    COALESCE(SUM(t.quantity) * p.purchase_price, 0) AS total_amount
  FROM products p
  LEFT JOIN transactions t ON t.product_id = p.id
    AND t.type = 'outbound'
    AND EXTRACT(YEAR FROM t.transaction_date) = p_year
    AND EXTRACT(MONTH FROM t.transaction_date) = p_month
  WHERE p.company_id = p_company_id AND p.is_active = true
  GROUP BY p.id, p.name, p.sku, p.purchase_price, p.unit
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
