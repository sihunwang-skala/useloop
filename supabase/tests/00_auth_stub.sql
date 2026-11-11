-- 로컬 순수 PostgreSQL 에서 0001_init.sql 을 돌려 보기 위한 최소 Supabase 스텁입니다.
-- ⚠️ 실제 Supabase(GoTrue/PostgREST)가 아닙니다. SQL·RLS 로직의 스모크 테스트용이며 Supabase 통합 검증을 대체하지 않습니다.
create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}'::jsonb);
create or replace function auth.uid() returns uuid language sql stable as
  $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end $$;
grant usage on schema public, auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
-- Supabase 는 public 스키마에 기본 권한을 anon/authenticated 에 부여하고 RLS 로 막는다
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
