-- RLS / 권한 상승 / 쿠폰 스모크 테스트 (순수 PostgreSQL + auth 스텁). 실행: supabase/tests/run-local-pg.sh
create table _results (name text, ok boolean, detail text);
grant all on _results to anon, authenticated;

-- 테스트 사용자 (handle_new_user 트리거가 profiles/companies 생성)
insert into auth.users (id, email, raw_user_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','custa@t.test','{"role":"customer","display_name":"custA"}'),
 ('00000000-0000-0000-0000-00000000000b','custb@t.test','{"role":"customer","display_name":"custB"}'),
 ('00000000-0000-0000-0000-0000000000c1','coa@t.test','{"role":"company","display_name":"coA","company_name":"CoA"}'),
 ('00000000-0000-0000-0000-0000000000c2','cob@t.test','{"role":"company","display_name":"coB","company_name":"CoB"}'),
 ('00000000-0000-0000-0000-0000000000ad','adm@t.test','{"role":"admin","display_name":"adm"}');   -- 메타데이터로 admin 요청 → customer 로 강등되어야 함
select set_config('app.t','',false);

insert into _results select 'signup: metadata role=admin 은 customer 로 강등', role='customer', role from profiles where id='00000000-0000-0000-0000-0000000000ad';
update profiles set role='admin' where id='00000000-0000-0000-0000-0000000000ad';  -- 운영자가 DB 에서 직접 승격

-- 서비스/혜택 준비 (소유자 권한으로 직접)
insert into services (id, company_id, name, tagline, url, category_slug, status)
 select '10000000-0000-0000-0000-00000000000a', company_id, 'SvcA', 'tagline-a', 'https://example.com', 'productivity', 'approved' from company_members where user_id='00000000-0000-0000-0000-0000000000c1';
insert into services (id, company_id, name, tagline, url, category_slug, status)
 select '10000000-0000-0000-0000-00000000000b', company_id, 'SvcB', 'tagline-b', 'https://example.com', 'productivity', 'approved' from company_members where user_id='00000000-0000-0000-0000-0000000000c2';
insert into benefits (id, service_id, type, title, terms, how_to_use, valid_from, valid_until, total_quantity, issuer_authority_confirmed, status)
 values ('20000000-0000-0000-0000-00000000000a','10000000-0000-0000-0000-00000000000a','coupon','Cpn','terms-ok','how-to-use', now()-interval '1 day', now()+interval '1 day', 1, true, 'approved'),
        ('20000000-0000-0000-0000-00000000000b','10000000-0000-0000-0000-00000000000a','coupon','Pend','terms-ok','how-to-use', now()-interval '1 day', now()+interval '1 day', 5, true, 'pending');
insert into benefits (id, service_id, type, kind, title, terms, how_to_use, valid_from, valid_until, total_quantity, issuer_authority_confirmed, status)
 values ('20000000-0000-0000-0000-00000000000c','10000000-0000-0000-0000-00000000000a','coupon','thanks','Thanks','terms-ok','how-to-use', now()-interval '1 day', now()+interval '1 day', 5, true, 'approved');

-- 헬퍼: 지정 사용자로 SQL 실행하여 (성공 여부, 반환 행 수) 확인
create or replace function pg_temp.as_user(uid text, role_name text, stmt text, out ok boolean, out msg text, out n int) language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid,''), true);
  execute format('set local role %I', role_name);
  begin
    execute stmt; get diagnostics n = row_count; ok := true; msg := '';
  exception when others then ok := false; msg := sqlerrm; n := 0;
  end;
  execute 'reset role';
end $$;
grant execute on function pg_temp.as_user(text,text,text) to public;

do $$
declare r record;
  A text := '00000000-0000-0000-0000-00000000000a'; B text := '00000000-0000-0000-0000-00000000000b';
  C1 text := '00000000-0000-0000-0000-0000000000c1'; C2 text := '00000000-0000-0000-0000-0000000000c2';
  AD text := '00000000-0000-0000-0000-0000000000ad';
  fbid uuid;
  procedure_t text;
begin
  -- 고객 A 피드백 작성 / 타인 명의 작성 / 기업 계정의 작성
  select * into r from pg_temp.as_user(A,'authenticated', format($q$insert into feedback (service_id, author_id, liked, sentiment) values ('10000000-0000-0000-0000-00000000000a', %L, 'good', 'positive')$q$, A));
  insert into _results values ('고객 A: 본인 명의 피드백 작성 가능', r.ok, r.msg);
  select * into r from pg_temp.as_user(B,'authenticated', format($q$insert into feedback (service_id, author_id, liked, sentiment) values ('10000000-0000-0000-0000-00000000000a', %L, 'spoof', 'positive')$q$, A));
  insert into _results values ('고객 B: 타인 명의 피드백 작성 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', format($q$insert into feedback (service_id, author_id, liked, sentiment) values ('10000000-0000-0000-0000-00000000000a', %L, 'self-review', 'positive')$q$, C1));
  insert into _results values ('기업 계정: 피드백 작성 차단', not r.ok, r.msg);
  select id into fbid from feedback limit 1;

  -- 데이터 격리
  select * into r from pg_temp.as_user(B,'authenticated', 'select * from feedback');
  insert into _results values ('고객 B: 고객 A 피드백 조회 불가(0행)', r.n = 0, 'rows='||r.n);
  select * into r from pg_temp.as_user(C2,'authenticated', 'select * from feedback');
  insert into _results values ('기업 B: 기업 A 서비스 피드백 조회 불가(0행)', r.n = 0, 'rows='||r.n);
  select * into r from pg_temp.as_user(C1,'authenticated', 'select * from feedback');
  insert into _results values ('기업 A: 자기 서비스 피드백 조회 가능(1행)', r.n = 1, 'rows='||r.n);
  select * into r from pg_temp.as_user(C1,'authenticated', 'select * from profiles where id <> '||quote_literal(C1));
  insert into _results values ('기업 A: 고객 프로필(이메일) 조회 불가', r.n = 0, 'rows='||r.n);
  select * into r from pg_temp.as_user(A,'authenticated', 'select * from profiles');
  insert into _results values ('고객 A: 본인 프로필 1행만 조회', r.n = 1, 'rows='||r.n);

  -- 기업 답변
  select * into r from pg_temp.as_user(C2,'authenticated', format($q$insert into feedback_responses (feedback_id, author_id, body, progress) values (%L, %L, 'x', 'reviewing')$q$, fbid, C2));
  insert into _results values ('기업 B: 타 기업 피드백에 답변 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', format($q$insert into feedback_responses (feedback_id, author_id, body, progress) values (%L, %L, '감사합니다', 'reviewing')$q$, fbid, C1));
  insert into _results values ('기업 A: 자기 서비스 피드백에 답변 가능', r.ok, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', 'select * from feedback_responses');
  insert into _results values ('고객 A: 본인 피드백의 답변 조회 가능', r.n = 1, 'rows='||r.n);
  select * into r from pg_temp.as_user(C1,'authenticated', format($q$update feedback set liked='tampered' where id=%L$q$, fbid));
  insert into _results values ('기업 A: 고객 피드백 내용 수정 차단(컬럼 권한)', not r.ok, r.msg);

  -- 권한 상승
  select * into r from pg_temp.as_user(A,'authenticated', format($q$update profiles set role='admin' where id=%L$q$, A));
  insert into _results values ('고객: 본인 role 을 admin 으로 변경 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', format($q$update profiles set role='customer', display_name='newname' where id=%L$q$, A));
  insert into _results values ('고객: role 컬럼을 건드리면 같은 값이어도 차단(컬럼 권한)', not r.ok, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', format($q$update profiles set display_name='newname' where id=%L$q$, A));
  insert into _results values ('고객: 표시 이름 변경은 가능', r.ok and r.n=1, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', format($q$update profiles set display_name='hack' where id=%L$q$, B));
  insert into _results values ('고객 A: 타인 프로필 수정 불가(0행)', r.n = 0, 'rows='||r.n);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$update services set status='approved', sponsored=true where id='10000000-0000-0000-0000-00000000000a'$q$);
  insert into _results values ('기업: 서비스 스스로 승인/스폰서 지정 차단', not r.ok or r.n=0, coalesce(nullif(r.msg,''),'rows='||r.n));
  select * into r from pg_temp.as_user(C1,'authenticated', $q$update benefits set status='approved' where id='20000000-0000-0000-0000-00000000000b'$q$);
  insert into _results values ('기업: 대기 중 혜택 스스로 승인 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$update benefits set claimed_count=2 where id='20000000-0000-0000-0000-00000000000a'$q$);
  insert into _results values ('기업: 발급 수(claimed_count) 직접 조작 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$update benefits set title='changed' where id='20000000-0000-0000-0000-00000000000a'$q$);
  insert into _results values ('기업: 승인 후 혜택 내용 변경 차단(재제출 필요)', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$update benefits set status='paused' where id='20000000-0000-0000-0000-00000000000a'$q$);
  insert into _results values ('기업: 승인된 혜택 일시중지는 가능', r.ok and r.n=1, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$update benefits set status='approved' where id='20000000-0000-0000-0000-00000000000a'$q$);
  insert into _results values ('기업: 일시중지 해제 가능', r.ok and r.n=1, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$insert into benefits (service_id,type,title,terms,how_to_use,valid_from,valid_until,total_quantity,issuer_authority_confirmed,status) values ('10000000-0000-0000-0000-00000000000a','coupon','X','terms-ok','how-to-use',now(),now()+interval '1 day',5,true,'approved')$q$);
  insert into _results values ('기업: 승인 상태로 혜택 직접 등록 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$insert into benefits (service_id,type,kind,title,terms,how_to_use,valid_from,valid_until,total_quantity,issuer_authority_confirmed) values ('10000000-0000-0000-0000-00000000000a','coupon','thanks','X','terms-ok','how-to-use',now(),now()+interval '1 day',5,true)$q$);
  insert into _results values ('기업: 감사 혜택(thanks) 등록 차단(설정 false)', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$insert into benefits (service_id,type,title,terms,how_to_use,valid_from,valid_until,total_quantity,issuer_authority_confirmed) values ('10000000-0000-0000-0000-00000000000b','coupon','X','terms-ok','how-to-use',now(),now()+interval '1 day',5,true)$q$);
  insert into _results values ('기업 A: 타 기업 서비스에 혜택 등록 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(B,'authenticated', $q$select * from benefits$q$);
  insert into _results values ('고객: 승인된 혜택만 조회(승인 대기 제외)', r.n = 2, 'rows='||r.n);   -- Cpn, Thanks(approved) ; Pend 제외
  select * into r from pg_temp.as_user(AD,'authenticated', $q$update benefits set status='approved' where id='20000000-0000-0000-0000-00000000000b'$q$);
  insert into _results values ('관리자: 혜택 승인 가능', r.ok and r.n=1, r.msg);

  -- 쿠폰
  select * into r from pg_temp.as_user(A,'authenticated', $q$insert into benefit_claims (benefit_id,user_id,code) values ('20000000-0000-0000-0000-00000000000a','00000000-0000-0000-0000-00000000000a','UL-HACK-HACK')$q$);
  insert into _results values ('고객: benefit_claims 직접 insert 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(null,'anon', $q$select claim_benefit('20000000-0000-0000-0000-00000000000a')$q$);
  insert into _results values ('anon: claim_benefit 호출 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', $q$select claim_benefit('20000000-0000-0000-0000-00000000000a')$q$);
  insert into _results values ('기업 계정: 쿠폰 수령 차단(customer 전용)', not r.ok, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', $q$select claim_benefit('20000000-0000-0000-0000-00000000000b')$q$);
  insert into _results values ('고객: 승인 전/후 상태에 맞는 수령(승인된 대기→수령 가능)', r.ok, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', $q$select claim_benefit('20000000-0000-0000-0000-00000000000b')$q$);
  insert into _results values ('쿠폰 중복 수령 차단', not r.ok and r.msg like '%CONFLICT%', r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', $q$select claim_benefit('20000000-0000-0000-0000-00000000000c')$q$);
  insert into _results values ('감사 혜택(thanks) 발급 차단(FEATURE_DISABLED)', not r.ok and r.msg like '%FEATURE_DISABLED%', r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', $q$select claim_benefit('20000000-0000-0000-0000-00000000000a')$q$);
  insert into _results values ('수량 1 쿠폰: 첫 수령 성공', r.ok, r.msg);
  select * into r from pg_temp.as_user(B,'authenticated', $q$select claim_benefit('20000000-0000-0000-0000-00000000000a')$q$);
  insert into _results values ('수량 초과(SOLD_OUT) 차단', not r.ok and r.msg like '%SOLD_OUT%', r.msg);

  -- 사용 처리
  select * into r from pg_temp.as_user(A,'authenticated', $q$select * from benefit_claims$q$);
  insert into _results values ('고객 A: 본인 클레임만 조회', r.n = 2, 'rows='||r.n);
  select * into r from pg_temp.as_user(B,'authenticated', $q$select * from benefit_claims$q$);
  insert into _results values ('고객 B: 타인 클레임 조회 불가', r.n = 0, 'rows='||r.n);
  select code into procedure_t from benefit_claims where benefit_id='20000000-0000-0000-0000-00000000000a';
  select * into r from pg_temp.as_user(C2,'authenticated', format('select redeem_claim(%L)', procedure_t));
  insert into _results values ('기업 B: 타 기업 코드 사용 처리 차단', not r.ok and r.msg like '%NOT_FOUND%', r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', format('select redeem_claim(%L)', procedure_t));
  insert into _results values ('고객: 본인 코드를 스스로 사용 처리 차단', not r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', format('select redeem_claim(%L)', procedure_t));
  insert into _results values ('기업 A: 코드 사용 처리 성공', r.ok, r.msg);
  select * into r from pg_temp.as_user(C1,'authenticated', format('select redeem_claim(%L)', procedure_t));
  insert into _results values ('코드 재사용(이중 사용) 차단', not r.ok and r.msg like '%CONFLICT%', r.msg);

  -- 신고/방문
  select * into r from pg_temp.as_user(B,'authenticated', format($q$insert into reports (reporter_id,target_type,target_id,reason) values (%L,'service','10000000-0000-0000-0000-00000000000a','부적절한 내용')$q$, B));
  insert into _results values ('고객: 신고 접수 가능', r.ok, r.msg);
  select * into r from pg_temp.as_user(A,'authenticated', 'select * from reports');
  insert into _results values ('고객 A: 타인 신고 조회 불가', r.n = 0, 'rows='||r.n);
  select * into r from pg_temp.as_user(null,'anon', $q$insert into service_visits (service_id) values ('10000000-0000-0000-0000-00000000000a')$q$);
  insert into _results values ('[알려진 한계] anon 방문 기록 insert 가능(스팸 시 통계 오염 가능, DB 레벨 제한 없음)', r.ok, 'accepted by design; app-level rate limit only');
end $$;

select case when ok then 'PASS' else 'FAIL' end as result, name, case when ok then '' else detail end as detail from _results order by ok, name;
