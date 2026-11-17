#!/usr/bin/env bash
# 순수 PostgreSQL(auth 스텁)에서 0001_init.sql + RLS 스모크 테스트를 실행합니다. 실제 Supabase 가 아닙니다.
# 사용: PGBIN=/opt/homebrew/opt/postgresql@17/bin supabase/tests/run-local-pg.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
PGBIN="${PGBIN:-$(dirname "$(command -v postgres)")}"
export PATH="$PGBIN:$PATH" LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
D="$(mktemp -d)"; PORT="${PGPORT:-54330}"; SOCK="$D"
trap 'pg_ctl -D "$D/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$D"' EXIT
initdb -D "$D/data" -U postgres --auth=trust --locale=en_US.UTF-8 >/dev/null
pg_ctl -D "$D/data" -o "-p $PORT -k $SOCK" -l "$D/log" -w start >/dev/null
P="psql -h $SOCK -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "create database t" ; P="$P -d t"
$P -c "create extension if not exists pgcrypto"
$P -f supabase/tests/00_auth_stub.sql
$P -f supabase/migrations/0001_init.sql
$P -f supabase/tests/rls_smoke.sql | tee "$D/out.txt"
echo "--- 동시 발급(수량 3, 10명 동시 요청) ---"
$P -q -c "insert into auth.users (id,email,raw_user_meta_data) select ('00000000-0000-0000-0001-'||lpad(g::text,12,'0'))::uuid, 'p'||g||'@t.test', '{\"role\":\"customer\"}' from generate_series(1,10) g;
insert into companies (id,name) values ('30000000-0000-0000-0000-000000000001','Cc');
insert into services (id,company_id,name,tagline,url,category_slug,status) values ('30000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','SvcC','tagline-c','https://example.com','productivity','approved');
insert into benefits (id,service_id,type,title,terms,how_to_use,valid_from,valid_until,total_quantity,issuer_authority_confirmed,status) values ('30000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','coupon','Race','terms-ok','how-to-use',now()-interval '1 day',now()+interval '1 day',3,true,'approved');"
for g in $(seq 1 10); do
  ( $P -At -c "begin; select set_config('request.jwt.claim.sub','00000000-0000-0000-0001-$(printf %012d $g)',true); set local role authenticated; select claim_benefit('30000000-0000-0000-0000-000000000003'); commit;" >/dev/null 2>&1 && echo ok || echo no ) > "$D/r$g" &
done; wait
OKN=$(cat "$D"/r* | grep -c ok || true)
CLAIMED=$($P -At -c "select claimed_count from benefits where id='30000000-0000-0000-0000-000000000003'")
ROWS=$($P -At -c "select count(*) from benefit_claims where benefit_id='30000000-0000-0000-0000-000000000003'")
echo "성공 요청=$OKN, claimed_count=$CLAIMED, claims 행=$ROWS (기대: 3/3/3)"
FAILS=$(grep -c '^ *FAIL' "$D/out.txt" || true)
[ "$FAILS" = "0" ] && [ "$OKN" = "3" ] && [ "$CLAIMED" = "3" ] && [ "$ROWS" = "3" ] && echo "ALL PASS" || { echo "FAILURES: $FAILS"; exit 1; }
