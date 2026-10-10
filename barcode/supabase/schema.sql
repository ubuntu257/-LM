-- ============================================================
-- 바코드북 Supabase 스키마 (실제 배포 반영)
-- 프로젝트: barcode-book  (전용 프로젝트)
-- 공개 조회 + 비밀번호로 보호되는 쓰기 (RPC)
--
-- ⚠️ 아래 '__WRITE_PASSCODE__' 는 실제 배포 시 관리자 비밀번호로 바꿔서
--    Supabase SQL Editor에서 실행합니다. (실제 값은 공개 저장소에 두지 않음)
-- ============================================================

create table if not exists public.products (
  id         bigint generated always as identity primary key,
  n          integer,
  code       text not null unique,
  name       text not null,
  grp        text not null default '',
  bc         text not null default '',
  fmt        text not null default '',   -- EAN13 | CODE128 | ''
  price      integer not null default 0,
  dis        boolean not null default false,
  updated_at timestamptz not null default now()
);
create index if not exists products_name_idx on public.products(name);

-- 조회는 공개(anon), 직접 쓰기는 차단 — 쓰기는 아래 RPC로만
alter table public.products enable row level security;
drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);

-- 단건 업서트 (상품코드 기준)
create or replace function public.barcode_upsert(pass text, p jsonb)
returns void language plpgsql security definer set search_path=public as $fn$
begin
  if pass is distinct from '__WRITE_PASSCODE__' then raise exception '인증 실패'; end if;
  insert into public.products (n,code,name,grp,bc,fmt,price,dis)
  values (nullif(p->>'n','')::int, p->>'code', p->>'name',
          coalesce(p->>'grp',''), coalesce(p->>'bc',''), coalesce(p->>'fmt',''),
          coalesce(nullif(p->>'price','')::int,0), coalesce((p->>'dis')::boolean,false))
  on conflict (code) do update set
    n=excluded.n,name=excluded.name,grp=excluded.grp,bc=excluded.bc,
    fmt=excluded.fmt,price=excluded.price,dis=excluded.dis,updated_at=now();
end $fn$;

-- 일괄 업서트 (엑셀용)
create or replace function public.barcode_bulk_upsert(pass text, arr jsonb)
returns int language plpgsql security definer set search_path=public as $fn$
declare p jsonb; c int := 0;
begin
  if pass is distinct from '__WRITE_PASSCODE__' then raise exception '인증 실패'; end if;
  for p in select * from jsonb_array_elements(arr) loop
    insert into public.products (n,code,name,grp,bc,fmt,price,dis)
    values (nullif(p->>'n','')::int, p->>'code', p->>'name',
            coalesce(p->>'grp',''), coalesce(p->>'bc',''), coalesce(p->>'fmt',''),
            coalesce(nullif(p->>'price','')::int,0), coalesce((p->>'dis')::boolean,false))
    on conflict (code) do update set
      n=excluded.n,name=excluded.name,grp=excluded.grp,bc=excluded.bc,
      fmt=excluded.fmt,price=excluded.price,dis=excluded.dis,updated_at=now();
    c:=c+1;
  end loop;
  return c;
end $fn$;

-- 삭제
create or replace function public.barcode_delete(pass text, p_code text)
returns void language plpgsql security definer set search_path=public as $fn$
begin
  if pass is distinct from '__WRITE_PASSCODE__' then raise exception '인증 실패'; end if;
  delete from public.products where code = p_code;
end $fn$;

grant execute on function public.barcode_upsert(text,jsonb)      to anon;
grant execute on function public.barcode_bulk_upsert(text,jsonb) to anon;
grant execute on function public.barcode_delete(text,text)       to anon;
