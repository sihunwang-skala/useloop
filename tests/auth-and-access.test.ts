import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/domain/errors";
import { signupSchema } from "@/lib/services/account";
import { adminQueue, reviewService } from "@/lib/services/admin";
import { companyFeedback, myFeedback, submitFeedback } from "@/lib/services/feedback";
import { myBenefits } from "@/lib/services/benefits";
import { rateLimit } from "@/lib/rate-limit";
import { ADMIN, COMPANY, CUSTOMER, setup } from "./helpers";

const code = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return e instanceof AppError ? e.code : "OTHER"; }
  return "NO_ERROR";
};

describe("회원가입·로그인", () => {
  it("고객 가입 후 올바른 비밀번호로만 로그인된다", () => {
    const { store } = setup();
    store.registerAccount({ email: "New@Test.test", password: "password-12345", displayName: "새 고객", role: "customer" });
    expect(store.verifyLogin("new@test.test", "password-12345")?.role).toBe("customer");
    expect(store.verifyLogin("new@test.test", "wrong-password")).toBeNull();
    expect(store.verifyLogin("nobody@test.test", "password-12345")).toBeNull();
  });
  it("중복 이메일은 거절된다", () => {
    const { store } = setup();
    expect(() => store.registerAccount({ email: CUSTOMER, password: "password-12345", displayName: "x", role: "customer" })).toThrow(AppError);
  });
  it("가입 입력 검증: 짧은 비밀번호·동의 누락·admin 역할 불가", () => {
    const base = { email: "a@b.test", password: "password-12345", displayName: "a", role: "customer", consent: true };
    expect(signupSchema.safeParse(base).success).toBe(true);
    expect(signupSchema.safeParse({ ...base, password: "short" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, consent: false }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, role: "admin" }).success).toBe(false);
  });
});

describe("접근 제어", () => {
  it("비로그인은 피드백·혜택 조회/작성이 불가하다", async () => {
    const { anon, svcByName } = setup();
    expect(await code(submitFeedback(anon, { serviceId: svcByName("노트웨이브").id, liked: "x", sentiment: "positive" }))).toBe("UNAUTHENTICATED");
    expect(await code(myFeedback(anon))).toBe("UNAUTHENTICATED");
    expect(await code(myBenefits(anon))).toBe("UNAUTHENTICATED");
    expect(await code(companyFeedback(anon))).toBe("UNAUTHENTICATED");
  });
  it("고객은 타인의 피드백을 볼 수 없고 기업 기능을 쓸 수 없다", async () => {
    const { asUser, newCustomer, ctxFor } = setup();
    const other = await ctxFor(newCustomer(1).id);
    expect(await myFeedback(other)).toHaveLength(0); // 데모 고객의 피드백이 보이지 않음
    expect((await myFeedback(await asUser(CUSTOMER))).length).toBe(1);
    expect(await code(companyFeedback(other))).toBe("FORBIDDEN");
  });
  it("기업은 자기 서비스 피드백만 보고, 작성자 식별정보는 노출되지 않는다", async () => {
    const { asUser, store } = setup();
    const rows = await companyFeedback(await asUser(COMPANY));
    expect(rows).toHaveLength(1);
    const json = JSON.stringify(rows);
    expect(json).not.toContain(CUSTOMER);
    expect(json).not.toContain("데모 고객");
    // 다른 기업 계정은 같은 서비스 피드백을 볼 수 없다
    const rival = store.registerAccount({ email: "rival@t.test", password: "password-12345", displayName: "r", role: "company", companyName: "경쟁사" });
    expect(await companyFeedback({ store, user: rival })).toHaveLength(0);
  });
  it("관리자 기능은 관리자만 쓸 수 있다", async () => {
    const { asUser, svcByName } = setup();
    expect(await code(adminQueue(await asUser(CUSTOMER)))).toBe("FORBIDDEN");
    expect(await code(adminQueue(await asUser(COMPANY)))).toBe("FORBIDDEN");
    const pending = svcByName("승인 대기");
    expect(await code(reviewService(await asUser(COMPANY), pending.id, { decision: "approved" }))).toBe("FORBIDDEN");
    expect((await adminQueue(await asUser(ADMIN))).services.length).toBe(1);
  });
  it("삭제 요청한 계정은 쓰기 작업이 막힌다", async () => {
    const { asUser, store, svcByName } = setup();
    const ctx = await asUser(CUSTOMER);
    await store.requestDeletion(ctx.user!.id);
    const after = await asUser(CUSTOMER);
    expect(await code(submitFeedback(after, { serviceId: svcByName("노트웨이브").id, liked: "x", sentiment: "positive" }))).toBe("FORBIDDEN");
  });
});

describe("Rate limit", () => {
  it("한도를 넘으면 RATE_LIMITED", () => {
    for (let i = 0; i < 3; i++) rateLimit("t:1", 3, 1000, 0);
    expect(() => rateLimit("t:1", 3, 1000, 10)).toThrow(AppError);
    expect(() => rateLimit("t:1", 3, 1000, 2000)).not.toThrow();
  });
});
