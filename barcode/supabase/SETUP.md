# 바코드북 Supabase 연동 (현재 구성)

바코드북은 **Supabase 전용 프로젝트 `barcode-book`** 의 `products` 테이블을 사용합니다.
상품 추가/수정/삭제가 **커밋 없이 바로 반영**되고, 전 기기가 같은 데이터를 봅니다.

## 동작
- **조회 화면(index.html)**: 열 때 Supabase에서 상품을 읽어옵니다.
  네트워크 차단 등으로 실패하면 `data.js`(스냅샷)로 fallback.
- **관리 화면(update.html)**: 추가/수정/삭제/엑셀 일괄 → Supabase에 바로 기록.
  쓰기는 **관리자 비밀번호**가 있어야만 가능(서버에서 확인). 비밀번호는 브라우저에 저장됩니다.

## 키 / 설정
- `config.js` 에 `SUPABASE_URL` 과 **publishable 키**(공개용, 안전)만 있습니다.
- **관리자 비밀번호**는 코드/저장소에 두지 않습니다. DB 함수 안에만 있고(= `schema.sql` 의 `__WRITE_PASSCODE__` 자리),
  관리자가 update.html에서 한 번 입력하면 그 브라우저에 저장됩니다.

## 스키마 변경/재적용
- `schema.sql` 의 `__WRITE_PASSCODE__` 를 실제 비밀번호로 바꿔 Supabase SQL Editor에서 실행.

## 보안 (RLS)
- `products` 읽기: 공개(anon)
- 직접 쓰기: 차단 — `barcode_upsert` / `barcode_bulk_upsert` / `barcode_delete` RPC(비밀번호 확인)로만

## 주의 (무료 플랜)
- 무료 플랜 프로젝트는 **약 1주간 아무 요청이 없으면 일시중단(pause)** 됩니다.
  매장에서 매일 쓰면 깨어 있지만, 오래 안 쓰면 대시보드에서 "Restore"가 필요할 수 있습니다.
