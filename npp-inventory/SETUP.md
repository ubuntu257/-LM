# NPP 재고관리 시스템 — 초기 설정 가이드

## 1. Supabase 프로젝트 생성

1. https://supabase.com 접속 → 무료 계정 가입
2. "New Project" 클릭 → 프로젝트 이름 입력 (예: `npp-inventory`)
3. 데이터베이스 비밀번호 설정 (저장해두세요)
4. 리전: Northeast Asia (Seoul) 선택

## 2. 이메일 인증 비활성화

1. Supabase 대시보드 → Authentication → Providers → Email
2. "Confirm email" 토글 OFF
3. Save 클릭

## 3. 데이터베이스 스키마 실행

1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.sql` 파일 내용 전체 복사 후 붙여넣기
3. "Run" 클릭

## 4. API 키 설정

1. Supabase 대시보드 → Settings → API
2. `Project URL` 과 `anon public` 키를 복사
3. `js/config.js` 파일 열기 → 해당 값 입력

```javascript
const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';  // 복사한 URL
const SUPABASE_ANON_KEY = 'eyJ...';                    // 복사한 anon key
```

## 5. 관리자 계정 생성

1. Supabase 대시보드 → Authentication → Users → "Add user"
2. Email: `admin@npp.internal`
3. Password: 원하는 비밀번호
4. "Create user" 클릭
5. 생성된 유저의 UUID 복사

6. SQL Editor에서 아래 쿼리 실행 (UUID를 복사한 값으로 교체):

```sql
INSERT INTO user_profiles (id, role, company_name, company_code, contact_name)
VALUES (
  '여기에-유저-UUID-붙여넣기',
  'admin',
  '관리자',
  'ADMIN',
  '시스템 관리자'
);
```

## 6. 앱 실행

- `index.html` 을 브라우저로 열기
- 업체 코드: `ADMIN`
- 비밀번호: 위에서 설정한 비밀번호

## 7. 화주/매니저 계정 추가

앱에 관리자로 로그인 후:
1. 사이드바 → 설정/업체관리
2. "계정 추가" 탭 → 역할 선택 후 정보 입력

---

## 배포 (GitHub Pages)

1. 이 폴더를 GitHub 저장소에 Push
2. Settings → Pages → Source: main branch / root
3. 생성된 URL로 접속

> ⚠️ 주의: `js/config.js` 의 anon key는 공개되어도 안전합니다 (Row Level Security로 보호됨)
