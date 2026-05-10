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

  // 관리자가 새 업체 계정 생성 (기존 세션 유지)
  async createUser(code, password, profileData) {
    if (!Auth.isAdmin()) throw new Error('관리자만 계정을 생성할 수 있습니다');

    const { data: { session: adminSession } } = await _sb.auth.getSession();
    const email = `${code.trim().toLowerCase()}@npp.internal`;

    const { data, error } = await _sb.auth.signUp({ email, password });
    if (error) throw error;

    const newUserId = data.user.id;

    // 관리자 세션 복구
    if (adminSession) {
      await _sb.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });
    }

    // 프로필 생성 (관리자 권한으로)
    const { error: profileError } = await _sb.from('user_profiles').insert({
      id: newUserId,
      company_code: code.trim().toUpperCase(),
      ...profileData,
    });
    if (profileError) throw profileError;

    return newUserId;
  },

  isAdmin() { return Auth.profile?.role === 'admin'; },
  isManager() { return Auth.profile?.role === 'manager'; },
  isClient() { return Auth.profile?.role === 'client'; },

  getRole() { return Auth.profile?.role || ''; },
  getRoleLabel() {
    const map = { admin: '관리자', manager: '매니저', client: '화주' };
    return map[Auth.profile?.role] || '';
  },
};
