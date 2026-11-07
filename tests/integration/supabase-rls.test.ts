/**
 * 실제 Supabase 인스턴스 통합 테스트 (RLS · 권한 상승 · 데이터 격리 · 쿠폰 중복/동시 발급).
 *
 * ⚠️ 별도의 **테스트 전용** Supabase 프로젝트에서만 실행하세요. 운영 DB 에 연결하지 마세요.
 * 필요 환경변수가 없으면 전체 스킵됩니다(= "검증되지 않음" 상태 유지).
 *   SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY            테스트 프로젝트
 *   SUPABASE_TEST_ADMIN_EMAIL, SUPABASE_TEST_ADMIN_PASSWORD   미리 role='admin' 으로 승격해 둔 계정
 * 전제: 이메일 확인(confirm email)을 끈 테스트 프로젝트, 0001_init.sql 적용 완료.
 * 이 파일은 아직 실제 인스턴스에 대해 실행된 적이 없습니다.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, beforeAll } from "vitest";

const URL = process.env.SUPABASE_TEST_URL;
const KEY = process.env.SUPABASE_TEST_ANON_KEY;
const ADMIN = { email: process.env.SUPABASE_TEST_ADMIN_EMAIL, password: process.env.SUPABASE_TEST_ADMIN_PASSWORD };
const enabled = Boolean(URL && KEY && ADMIN.email && ADMIN.password);

const run = Date.now().toString(36);
const PW = "integration-test-pw-1234";
const client = () => createClient(URL!, KEY!, { auth: { persistSession: false, autoRefreshToken: false } });

async function signUp(tag: string, role: "customer" | "company") {
  const c = client();
  const email = `it-${tag}-${run}@useloop-test.invalid`;
  const { data, error } = await c.auth.signUp({ email, password: PW, options: { data: { role, display_name: tag, company_name: `IT ${tag} ${run}` } } });
  if (error || !data.session) throw new Error(`signUp failed for ${tag}: ${error?.message ?? "no session (email confirmation must be disabled)"}`);
  return { c, id: data.user!.id };
}

describe.skipIf(!enabled)("Supabase RLS 통합 테스트", () => {
  let admin: SupabaseClient;
  let custA: Awaited<ReturnType<typeof signUp>>, custB: typeof custA, coA: typeof custA, coB: typeof custA;
  let svcA: string, svcB: string, benefitId: string, feedbackA: string;

  beforeAll(async () => {
    admin = client();
    const { error } = await admin.auth.signInWithPassword({ email: ADMIN.email!, password: ADMIN.password! });
    if (error) throw error;
    [custA, custB, coA, coB] = await Promise.all([signUp("custA", "customer"), signUp("custB", "customer"), signUp("coA", "company"), signUp("coB", "company")]);
    const companyOf = async (u: typeof coA) => (await u.c.from("company_members").select("company_id").eq("user_id", u.id).single()).data!.company_id as string;
    const mk = async (u: typeof coA, name: string) => {
      const { data, error } = await u.c.from("services").insert({ company_id: await companyOf(u), name, tagline: "통합 테스트 서비스", url: "https://example.com", category_slug: "productivity", status: "pending" }).select().single();
      if (error) throw error;
      await admin.from("services").update({ status: "approved" }).eq("id", data.id);
      return data.id as string;
    };
    svcA = await mk(coA, `IT-A-${run}`);
    svcB = await mk(coB, `IT-B-${run}`);
    const { data: b, error: be } = await coA.c.from("benefits").insert({
      service_id: svcA, type: "coupon", title: "IT 쿠폰", terms: "테스트 조건입니다", how_to_use: "테스트 사용 방법",
      valid_from: new Date(Date.now() - 3600e3).toISOString(), valid_until: new Date(Date.now() + 86400e3).toISOString(),
      total_quantity: 1, issuer_authority_confirmed: true,
    }).select().single();
    if (be) throw be;
    benefitId = b.id;
    await admin.from("benefits").update({ status: "approved" }).eq("id", benefitId);
    const { data: f, error: fe } = await custA.c.from("feedback").insert({ service_id: svcA, author_id: custA.id, liked: "IT 피드백", sentiment: "neutral" }).select().single();
    if (fe) throw fe;
    feedbackA = f.id;
  }, 60_000);

  it("고객 B 는 고객 A 의 피드백을 읽을 수 없다", async () => {
    const { data } = await custB.c.from("feedback").select("id").eq("id", feedbackA);
    expect(data).toEqual([]);
  });
  it("기업 B 는 기업 A 서비스의 피드백을 읽거나 답변할 수 없다", async () => {
    expect((await coB.c.from("feedback").select("id").eq("id", feedbackA)).data).toEqual([]);
    const r = await coB.c.from("feedback_responses").insert({ feedback_id: feedbackA, author_id: coB.id, body: "x", progress: "reviewing" });
    expect(r.error).not.toBeNull();
  });
  it("기업 A 는 고객 프로필(이메일 등)을 읽을 수 없다", async () => {
    const { data } = await coA.c.from("profiles").select("id").eq("id", custA.id);
    expect(data).toEqual([]);
  });
  it("권한 상승 차단: 자신의 role 을 admin 으로 바꿀 수 없다", async () => {
    const r = await custA.c.from("profiles").update({ role: "admin" }).eq("id", custA.id);
    expect(r.error).not.toBeNull();
    expect((await custA.c.from("profiles").select("role").eq("id", custA.id).single()).data?.role).toBe("customer");
  });
  it("기업은 혜택을 스스로 승인하거나 발급 수를 조작할 수 없다", async () => {
    const { data: p } = await coA.c.from("benefits").insert({
      service_id: svcA, type: "coupon", title: "자가 승인 시도", terms: "테스트 조건입니다", how_to_use: "테스트 사용 방법",
      valid_from: new Date().toISOString(), valid_until: new Date(Date.now() + 86400e3).toISOString(), total_quantity: 5, issuer_authority_confirmed: true, status: "approved",
    }).select();
    expect(p ?? []).toEqual([]); // insert 정책: status='pending' 만 허용
    expect((await coA.c.from("benefits").update({ claimed_count: 0, total_quantity: 99 }).eq("id", benefitId)).error).not.toBeNull();
  });
  it("고객은 benefit_claims 를 직접 insert/update 할 수 없다", async () => {
    const r = await custB.c.from("benefit_claims").insert({ benefit_id: benefitId, user_id: custB.id, code: "UL-HACK-HACK" });
    expect(r.error).not.toBeNull();
  });
  it("쿠폰 수량 1: 두 고객이 동시에 요청해도 정확히 1건만 발급되고, 같은 고객의 재요청은 거절된다", async () => {
    const [a, b] = await Promise.all([custA.c.rpc("claim_benefit", { p_benefit_id: benefitId }), custB.c.rpc("claim_benefit", { p_benefit_id: benefitId })]);
    expect([a.error, b.error].filter(Boolean)).toHaveLength(1);
    const winner = a.error ? custB : custA;
    expect((await winner.c.rpc("claim_benefit", { p_benefit_id: benefitId })).error?.message).toMatch(/CONFLICT|SOLD_OUT/);
  });
  it("타 기업은 코드를 사용 처리할 수 없고, 소유 기업은 한 번만 사용 처리할 수 있다", async () => {
    const { data: claims } = await admin.from("benefit_claims").select("code").eq("benefit_id", benefitId);
    const code = claims![0].code as string;
    expect((await coB.c.rpc("redeem_claim", { p_code: code })).error?.message).toMatch(/NOT_FOUND/);
    expect((await coA.c.rpc("redeem_claim", { p_code: code })).error).toBeNull();
    expect((await coA.c.rpc("redeem_claim", { p_code: code })).error?.message).toMatch(/CONFLICT/);
  });
  it("비로그인(anon)은 claim_benefit RPC 를 호출할 수 없다", async () => {
    expect((await client().rpc("claim_benefit", { p_benefit_id: benefitId })).error).not.toBeNull();
  });
});
