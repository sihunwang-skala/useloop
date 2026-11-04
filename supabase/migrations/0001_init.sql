-- UseLoop MVP schema. Supabase(Postgres) 에서 실행하세요. 모든 테이블에 RLS 를 켭니다.
create extension if not exists pgcrypto;

-- ---------- 테이블 ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null check (char_length(display_name) between 1 and 30),
  role text not null default 'customer' check (role in ('customer','company','admin')),
  interests text[] not null default '{}',
  consent_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.company_members (
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary key (user_id, company_id)
);

create table public.service_categories (slug text primary key, name text not null);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  tagline text not null check (char_length(tagline) between 5 and 100),
  description text not null default '' check (char_length(description) <= 3000),
  url text not null check (url ~* '^https?://'),
  category_slug text not null references public.service_categories(slug),
  tags text[] not null default '{}' check (cardinality(tags) <= 8),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  rejection_reason text,
  sponsored boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  liked text not null default '' check (char_length(liked) <= 2000),
  disliked text not null default '' check (char_length(disliked) <= 2000),
  suggestion text not null default '' check (char_length(suggestion) <= 2000),
  sentiment text not null check (sentiment in ('positive','neutral','negative')),
  topics text[] not null default '{}',
  progress text not null default 'received' check (progress in ('received','reviewing','planned','done','wont_do')),
  created_at timestamptz not null default now(),
  check (liked <> '' or disliked <> '' or suggestion <> '')
);

create table public.feedback_responses (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 2000),
  progress text not null check (progress in ('received','reviewing','planned','done','wont_do')),
  created_at timestamptz not null default now()
);

create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  type text not null check (type in ('coupon','free_trial')),
  kind text not null default 'discovery' check (kind in ('discovery','thanks')),
  title text not null check (char_length(title) between 2 and 80),
  description text not null default '',
  terms text not null check (char_length(terms) >= 5),
  how_to_use text not null check (char_length(how_to_use) >= 5),
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  total_quantity int not null check (total_quantity between 1 and 100000),
  claimed_count int not null default 0,
  issuer_authority_confirmed boolean not null check (issuer_authority_confirmed),
  status text not null default 'pending' check (status in ('pending','approved','rejected','paused')),
  rejection_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  check (valid_until > valid_from),
  check (claimed_count between 0 and total_quantity)  -- 수량 초과 방지의 최후 방어선
);

create table public.benefit_claims (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  code text not null unique,
  status text not null default 'issued' check (status in ('issued','used','expired','cancelled')),
  claimed_at timestamptz not null default now(),
  used_at timestamptz
);
-- 중복 발급 방지: 한 사용자는 같은 혜택을 (취소 제외) 한 번만 받을 수 있음
create unique index benefit_claims_one_per_user on public.benefit_claims (benefit_id, user_id) where status <> 'cancelled';

create table public.service_visits (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('feedback','service','benefit')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolution text,
  created_at timestamptz not null default now()
);

-- 운영 설정(읽기 전용). 법률 검토 전 기능은 false 로 유지
create table public.app_settings (key text primary key, bool_value boolean not null);
insert into public.app_settings values ('feedback_thanks_enabled', false);

create index on public.services (company_id);
create index on public.feedback (service_id);
create index on public.feedback (author_id);
create index on public.benefits (service_id);
create index on public.benefit_claims (user_id);

-- ---------- 헬퍼 ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_company_member(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from company_members where user_id = auth.uid() and company_id = cid);
$$;

create or replace function public.service_company(sid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select company_id from services where id = sid;
$$;

-- ---------- 가입 트리거: 역할은 customer/company 만 허용 (admin 은 DB 에서 직접 지정) ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_user_meta_data->>'role', 'customer');
  cid uuid;
begin
  if r not in ('customer','company') then r := 'customer'; end if;
  insert into profiles (id, email, display_name, role, consent_at)
  values (new.id, new.email, left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''), split_part(new.email,'@',1)), 30), r, now());
  if r = 'company' then
    insert into companies (name) values (left(coalesce(nullif(new.raw_user_meta_data->>'company_name',''), '이름 없는 기업'), 60)) returning id into cid;
    insert into company_members (user_id, company_id) values (new.id, cid);
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- 혜택 변경 가드: 기업은 승인 상태·발급 수를 직접 바꿀 수 없음 ----------
create or replace function public.benefits_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if current_setting('app.claiming', true) = '1' or public.is_admin() then return new; end if;
  if new.claimed_count <> old.claimed_count then raise exception 'claimed_count is managed by the system'; end if;
  if new.total_quantity < old.claimed_count then raise exception 'quantity below claimed count'; end if;
  if new.status is distinct from old.status and not (old.status in ('approved','paused') and new.status in ('approved','paused')) then
    raise exception 'status change requires admin review';
  end if;
  if (new.title, new.description, new.terms, new.how_to_use, new.valid_from, new.valid_until, new.type, new.kind, new.service_id,
      new.issuer_authority_confirmed, new.is_demo, new.rejection_reason)
     is distinct from (old.title, old.description, old.terms, old.how_to_use, old.valid_from, old.valid_until, old.type, old.kind, old.service_id,
      old.issuer_authority_confirmed, old.is_demo, old.rejection_reason) then
    raise exception 'content change requires a new benefit submission';
  end if;
  return new;
end $$;
create trigger benefits_guard_trg before update on public.benefits for each row execute function public.benefits_guard();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.feedback enable row level security;
alter table public.feedback_responses enable row level security;
alter table public.benefits enable row level security;
alter table public.benefit_claims enable row level security;
alter table public.service_visits enable row level security;
alter table public.reports enable row level security;
alter table public.app_settings enable row level security;

create policy settings_read on public.app_settings for select using (true);
create policy categories_read on public.service_categories for select using (true);
create policy companies_read on public.companies for select using (true);

create policy profiles_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- role 등 민감 컬럼은 사용자가 바꿀 수 없도록 컬럼 단위 권한만 부여
revoke update on public.profiles from authenticated, anon;
grant update (display_name, interests, consent_at, deletion_requested_at) on public.profiles to authenticated;

create policy members_select on public.company_members for select using (user_id = auth.uid() or public.is_admin());

create policy services_select on public.services for select
  using (status = 'approved' or public.is_company_member(company_id) or public.is_admin());
create policy services_insert on public.services for insert
  with check (public.is_company_member(company_id) and status = 'pending' and sponsored = false and is_demo = false);
create policy services_update_member on public.services for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id) and status = 'pending' and sponsored = false);
create policy services_update_admin on public.services for update using (public.is_admin()) with check (public.is_admin());

create policy feedback_select on public.feedback for select
  using (author_id = auth.uid() or public.is_company_member(public.service_company(service_id)) or public.is_admin());
create policy feedback_insert on public.feedback for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'customer' and p.deletion_requested_at is null)
    and exists (select 1 from services s where s.id = service_id and s.status = 'approved')
  );
create policy feedback_progress on public.feedback for update
  using (public.is_company_member(public.service_company(service_id)))
  with check (public.is_company_member(public.service_company(service_id)));
revoke update on public.feedback from authenticated, anon;
grant update (progress) on public.feedback to authenticated;

create policy responses_select on public.feedback_responses for select
  using (exists (select 1 from feedback f where f.id = feedback_id));  -- feedback 의 RLS 가 그대로 적용됨
create policy responses_insert on public.feedback_responses for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from feedback f where f.id = feedback_id and public.is_company_member(public.service_company(f.service_id)))
  );

create policy benefits_select on public.benefits for select
  using (
    (status = 'approved' and exists (select 1 from services s where s.id = service_id and s.status = 'approved'))
    or public.is_company_member(public.service_company(service_id)) or public.is_admin()
  );
create policy benefits_insert on public.benefits for insert
  with check (
    public.is_company_member(public.service_company(service_id))
    and status = 'pending' and claimed_count = 0 and is_demo = false
    and (kind = 'discovery' or coalesce((select bool_value from app_settings where key = 'feedback_thanks_enabled'), false))
  );
create policy benefits_update_member on public.benefits for update
  using (public.is_company_member(public.service_company(service_id)))
  with check (public.is_company_member(public.service_company(service_id)));
create policy benefits_update_admin on public.benefits for update using (public.is_admin()) with check (public.is_admin());

create policy claims_select on public.benefit_claims for select
  using (user_id = auth.uid() or exists (select 1 from benefits b where b.id = benefit_id and public.is_company_member(public.service_company(b.service_id))) or public.is_admin());
-- claims 는 insert/update 정책이 없음 → claim_benefit / redeem_claim RPC 로만 변경 가능

create policy visits_insert on public.service_visits for insert with check (user_id is null or user_id = auth.uid());
create policy visits_select on public.service_visits for select using (public.is_company_member(public.service_company(service_id)) or public.is_admin());

create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_select on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy reports_update on public.reports for update using (public.is_admin()) with check (public.is_admin());

-- ---------- RPC: 원자적 혜택 발급 ----------
create or replace function public.claim_benefit(p_benefit_id uuid) returns public.benefit_claims
language plpgsql security definer set search_path = public as $$
declare
  b benefits;
  uid uuid := auth.uid();
  c benefit_claims;
  new_code text;
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
begin
  if uid is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from profiles where id = uid and role = 'customer' and deletion_requested_at is null) then raise exception 'FORBIDDEN'; end if;

  select * into b from benefits where id = p_benefit_id for update;   -- 행 잠금으로 동시 요청 직렬화
  if not found or b.status <> 'approved'
     or not exists (select 1 from services s where s.id = b.service_id and s.status = 'approved') then raise exception 'NOT_FOUND'; end if;
  if now() < b.valid_from or now() > b.valid_until then raise exception 'EXPIRED'; end if;
  if b.kind = 'thanks' then
    if not coalesce((select bool_value from app_settings where key = 'feedback_thanks_enabled'), false) then raise exception 'FEATURE_DISABLED'; end if;
    -- 감사 혜택: 내용의 긍정/부정과 무관하게 비공개 피드백을 남긴 사람이면 동일하게 제공
    if not exists (select 1 from feedback f where f.service_id = b.service_id and f.author_id = uid) then raise exception 'FORBIDDEN'; end if;
  end if;
  if exists (select 1 from benefit_claims where benefit_id = b.id and user_id = uid and status <> 'cancelled') then raise exception 'CONFLICT'; end if;
  if b.claimed_count >= b.total_quantity then raise exception 'SOLD_OUT'; end if;

  loop
    new_code := 'UL-';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % 32), 1);
      if i = 4 then new_code := new_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from benefit_claims where code = new_code);
  end loop;

  perform set_config('app.claiming', '1', true);
  update benefits set claimed_count = claimed_count + 1 where id = b.id;
  perform set_config('app.claiming', '', true);
  insert into benefit_claims (benefit_id, user_id, code) values (b.id, uid, new_code) returning * into c;
  return c;
end $$;

-- ---------- RPC: 기업의 코드 사용 처리 (자기 서비스 혜택만, 1회) ----------
create or replace function public.redeem_claim(p_code text) returns text
language plpgsql security definer set search_path = public as $$
declare c benefit_claims; b benefits;
begin
  select * into c from benefit_claims where code = upper(trim(p_code)) for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into b from benefits where id = c.benefit_id;
  if not public.is_company_member(public.service_company(b.service_id)) then raise exception 'NOT_FOUND'; end if;
  if c.status = 'used' then raise exception 'CONFLICT'; end if;
  if c.status <> 'issued' or now() > b.valid_until then raise exception 'EXPIRED'; end if;
  update benefit_claims set status = 'used', used_at = now() where id = c.id;
  return b.title;
end $$;

revoke all on function public.claim_benefit(uuid), public.redeem_claim(text) from public, anon;
grant execute on function public.claim_benefit(uuid), public.redeem_claim(text) to authenticated;

-- ---------- 기본 카테고리 (실제 서비스 데이터 아님) ----------
insert into public.service_categories (slug, name) values
  ('productivity','생산성'),('finance','금융·재무'),('education','교육'),
  ('health','헬스케어'),('design','디자인·크리에이티브'),('dev-tools','개발 도구');
