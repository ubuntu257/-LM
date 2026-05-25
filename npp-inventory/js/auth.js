// ═══════════════════════════════════════════
// Auth Module
// ═══════════════════════════════════════════
const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const Auth = {
  user: null,      // Supabase auth user
  profile: null,   // user_profiles row

  async init() {
    const { data: { session } } = await _sb.auth.getSession();
    if (session) {
      await Auth._loadProfile(session.user);
    }
    _sb.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await Auth._loadProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        Auth.user = null;
        Auth.profile = null;
      }
    });
  },

  async _loadProfile(user) {
    Auth.user = user;
    const { data, error } = await _sb
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (!error && data) Auth.profile = data;
  },

  async login(code, password) {
    const email = `${code.trim().toLowerCase()}@npp.internal`;
    const { data, error } = await _sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await Auth._loadProfile(data.user);
    return Auth.profile;
  },

  async logout() {
    await _sb.auth.signOut();
    location.reload();
  },

  // 관리자가 새 업체 계정 생성 (RPC 사용, 세션 영향 없음)
  async createUser(code, password, profileData) {
    if (!Auth.isAdmin()) throw new Error('관리자만 계정을 생성할 수 있습니다');

    const { data, error } = await _sb.rpc('admin_create_user', {
      p_company_code:   code.trim(),
      p_password:       password,
      p_role:           profileData.role,
      p_company_name:   profileData.company_name,
      p_contact_name:   profileData.contact_name  || null,
      p_contact_phone:  profileData.contact_phone || null,
      p_logo_color:     profileData.logo_color    || '#6366f1',
      p_business_number: profileData.business_number || null,
      p_contract_date:  profileData.contract_date  || null,
      p_address:        profileData.address        || null,
      p_account_number: profileData.account_number || null,
    });

    if (error) throw error;
    return data; // 생성된 user UUID
  },

  isAdmin() { return Auth.profile?.role === 'admin'; },
  isManager() { return Auth.profile?.role === 'manager'; },
  isClient() { return Auth.profile?.role === 'client'; },
  isObserver() { return Auth.profile?.role === 'observer'; },

  // 읽기 전용 역할 (observer) — 수정/생성/삭제 불가
  isReadOnly() { return Auth.isObserver(); },

  getRole() { return Auth.profile?.role || ''; },
  getRoleLabel() {
    const map = { admin: '관리자', manager: '매니저', client: '화주', observer: '열람자' };
    return map[Auth.profile?.role] || '';
  },
};
