import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/domain/errors";
import { reviewBenefit } from "@/lib/services/admin";
import { claimBenefit, createBenefit, myBenefits, redeemCode, setBenefitPaused, updateBenefitQuantity } from "@/lib/services/benefits";
import { submitFeedback } from "@/lib/services/feedback";
import { ADMIN, COMPANY, CUSTOMER, setup } from "./helpers";

const err = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return e as AppError; }
  return null;
};

afterEach(() => vi.unstubAllEnvs());

const benefitInput = (serviceId: string, over: object = {}) => ({
  serviceId, type: "coupon", kind: "discovery", title: "10% 할인", description: "", terms: "신규 가입자 한정", howToUse: "결제 시 코드 입력",
  validFrom: new Date(Date.now() - 86400000).toISOString(), validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
  totalQuantity: 3, issuerAuthorityConfirmed: true, ...over,
});

describe("혜택 등록·승인", () => {
  it("발급 권한 확인 없이는 등록 불가, 타 기업 서비스에도 등록 불가", async () => {
    const { asUser, svcByName } = setup();
    const company = await asUser(COMPANY);
    expect((await err(createBenefit(company, benefitInput(svcByName("노트웨이브").id, { issuerAuthorityConfirmed: false }))))?.fieldErrors?.issuerAuthorityConfirmed).toBeTruthy();
    expect((await err(createBenefit(company, benefitInput(svcByName("페이로그").id))))?.code).toBe("NOT_FOUND");
  });
  it("승인 전에는 고객이 받을 수 없고, 승인 후에는 받을 수 있다", async () => {
    const { asUser, svcByName } = setup();
    const b = await createBenefit(await asUser(COMPANY), benefitInput(svcByName("노트웨이브").id));
    const customer = await asUser(CUSTOMER);
    expect((await err(claimBenefit(customer, b.id)))?.code).toBe("NOT_FOUND");
    await reviewBenefit(await asUser(ADMIN), b.id, { decision: "approved" });
    const claim = await claimBenefit(customer, b.id);
    expect(claim.code).toMatch(/^UL-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });
  it("감사 혜택(thanks)은 기능 플래그가 꺼져 있으면 등록·발급 모두 불가", async () => {
    const { asUser, svcByName, benByTitle, store } = setup();
    expect((await err(createBenefit(await asUser(COMPANY), benefitInput(svcByName("노트웨이브").id, { kind: "thanks" }))))?.code).toBe("FEATURE_DISABLED");
    const b = benByTitle("프로 플랜");
    store.benefits.set(b.id, { ...b, kind: "thanks" });
    expect((await err(claimBenefit(await asUser(CUSTOMER), b.id)))?.code).toBe("FEATURE_DISABLED");
  });
  it("감사 혜택은 플래그를 켜도 피드백 내용의 긍정/부정과 무관하게 동일 조건", async () => {
    vi.stubEnv("FEATURE_FEEDBACK_THANKS", "true");
    const { asUser, benByTitle, store, newCustomer, ctxFor, svcByName } = setup();
    const b = benByTitle("프로 플랜");
    store.benefits.set(b.id, { ...b, kind: "thanks" });
    const noFeedback = await ctxFor(newCustomer(1).id);
    expect((await err(claimBenefit(noFeedback, b.id)))?.code).toBe("FORBIDDEN");
    const neg = await ctxFor(newCustomer(2).id);
    await submitFeedback(neg, { serviceId: svcByName("노트웨이브").id, disliked: "매우 불만", sentiment: "negative" });
    const pos = await ctxFor(newCustomer(3).id);
    await submitFeedback(pos, { serviceId: svcByName("노트웨이브").id, liked: "최고", sentiment: "positive" });
    await expect(claimBenefit(neg, b.id)).resolves.toBeTruthy();
    await expect(claimBenefit(pos, b.id)).resolves.toBeTruthy();
    void asUser;
  });
});

describe("쿠폰 발급·수량·중복", () => {
  it("같은 사용자는 같은 혜택을 두 번 받을 수 없다", async () => {
    const { asUser, benByTitle } = setup();
    const c = await asUser(CUSTOMER);
    const b = benByTitle("프로 플랜");
    await claimBenefit(c, b.id);
    expect((await err(claimBenefit(c, b.id)))?.code).toBe("CONFLICT");
    expect(b.claimedCount).toBe(1);
  });
  it("수량 초과는 차단된다 (수량 2개, 3번째 사용자 실패)", async () => {
    const { benByTitle, newCustomer, ctxFor } = setup();
    const b = benByTitle("첫 3개월");
    const users = await Promise.all([1, 2, 3].map((n) => ctxFor(newCustomer(n).id)));
    await claimBenefit(users[0], b.id);
    await claimBenefit(users[1], b.id);
    expect((await err(claimBenefit(users[2], b.id)))?.code).toBe("SOLD_OUT");
    expect(b.claimedCount).toBe(2);
  });
  it("동시 요청 50건이어도 정확히 수량만큼만 발급되고 코드는 모두 고유하다", async () => {
    const { benByTitle, newCustomer, ctxFor, store } = setup();
    const b = benByTitle("프로 플랜"); // 수량 20
    const ctxs = await Promise.all(Array.from({ length: 50 }, (_, i) => ctxFor(newCustomer(i + 10).id)));
    const results = await Promise.allSettled(ctxs.map((c) => claimBenefit(c, b.id)));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(20);
    expect(b.claimedCount).toBe(20);
    expect(new Set([...store.claims.values()].map((c) => c.code)).size).toBe(store.claims.size);
  });
  it("같은 사용자의 동시 중복 요청도 1건만 성공", async () => {
    const { asUser, benByTitle } = setup();
    const c = await asUser(CUSTOMER);
    const b = benByTitle("프로 플랜");
    const r = await Promise.allSettled([claimBenefit(c, b.id), claimBenefit(c, b.id), claimBenefit(c, b.id)]);
    expect(r.filter((x) => x.status === "fulfilled")).toHaveLength(1);
  });
  it("유효기간 밖, 일시중지된 혜택은 받을 수 없다", async () => {
    const { asUser, benByTitle } = setup();
    const b = benByTitle("프로 플랜");
    const future = new Date(Date.now() + 365 * 86400000);
    expect((await err(claimBenefit(await asUser(CUSTOMER, future), b.id)))?.code).toBe("EXPIRED");
    await setBenefitPaused(await asUser(COMPANY), b.id, true);
    expect((await err(claimBenefit(await asUser(CUSTOMER), b.id)))?.code).toBe("NOT_FOUND");
  });
  it("기업·비로그인은 발급받을 수 없다", async () => {
    const { asUser, anon, benByTitle } = setup();
    const b = benByTitle("프로 플랜");
    expect((await err(claimBenefit(await asUser(COMPANY), b.id)))?.code).toBe("FORBIDDEN");
    expect((await err(claimBenefit(anon, b.id)))?.code).toBe("UNAUTHENTICATED");
  });
  it("총 수량은 이미 발급된 수보다 줄일 수 없다", async () => {
    const { asUser, benByTitle, newCustomer, ctxFor, store } = setup();
    const b = benByTitle("프로 플랜");
    await claimBenefit(await asUser(CUSTOMER), b.id);
    await claimBenefit(await ctxFor(newCustomer(1).id), b.id);
    const company = await asUser(COMPANY);
    expect((await err(updateBenefitQuantity(company, b.id, 1)))?.code).toBe("VALIDATION");
    await expect(updateBenefitQuantity(company, b.id, 5)).resolves.toBeTruthy();
    expect(store.benefits.get(b.id)!.totalQuantity).toBe(5);
    expect(store.benefits.get(b.id)!.claimedCount).toBe(2);
  });
});

describe("사용·만료 상태", () => {
  it("기업이 코드를 사용 처리하면 1회만 가능하고 고객 화면에 반영된다", async () => {
    const { asUser, benByTitle } = setup();
    const claim = await claimBenefit(await asUser(CUSTOMER), benByTitle("프로 플랜").id);
    const company = await asUser(COMPANY);
    await redeemCode(company, claim.code.toLowerCase());
    expect((await err(redeemCode(company, claim.code)))?.code).toBe("CONFLICT");
    expect((await myBenefits(await asUser(CUSTOMER)))[0].status).toBe("used");
  });
  it("다른 기업의 코드는 처리할 수 없다", async () => {
    const { asUser, benByTitle, store } = setup();
    const claim = await claimBenefit(await asUser(CUSTOMER), benByTitle("프로 플랜").id);
    const rival = store.registerAccount({ email: "rival@t.test", password: "password-12345", displayName: "r", role: "company", companyName: "경쟁사" });
    expect((await err(redeemCode({ store, user: rival }, claim.code)))?.code).toBe("NOT_FOUND");
  });
  it("기간이 지나면 만료로 표시되고 사용 처리 불가", async () => {
    const { asUser, benByTitle } = setup();
    const claim = await claimBenefit(await asUser(CUSTOMER), benByTitle("프로 플랜").id);
    const future = new Date(Date.now() + 365 * 86400000);
    expect((await myBenefits(await asUser(CUSTOMER, future)))[0].status).toBe("expired");
    expect((await err(redeemCode(await asUser(COMPANY, future), claim.code)))?.code).toBe("EXPIRED");
  });
  it("고객은 자기 혜택만 본다", async () => {
    const { asUser, benByTitle, newCustomer, ctxFor } = setup();
    await claimBenefit(await asUser(CUSTOMER), benByTitle("프로 플랜").id);
    expect(await myBenefits(await ctxFor(newCustomer(1).id))).toHaveLength(0);
  });
});
