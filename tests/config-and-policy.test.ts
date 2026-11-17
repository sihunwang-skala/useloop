import { describe, expect, it } from "vitest";
import { isDemoMode } from "@/lib/config";
import { createBenefit, noRatingLinkage } from "@/lib/services/benefits";
import { AppError } from "@/lib/domain/errors";
import { COMPANY, setup } from "./helpers";

const SB = { NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon" };

describe("Demo Mode 는 운영 환경에서 켜지지 않는다 (fail-closed)", () => {
  it("production + Supabase 설정 → DEMO_MODE=true 라도 데모가 아니다", () => {
    expect(isDemoMode({ NODE_ENV: "production", DEMO_MODE: "true", ...SB })).toBe(false);
    expect(isDemoMode({ NODE_ENV: "production", ...SB })).toBe(false);
  });
  it("production + Supabase 없음 + DEMO_MODE 미지정 → 조용히 데모로 가지 않고 오류", () => {
    expect(() => isDemoMode({ NODE_ENV: "production" })).toThrow();
    expect(() => isDemoMode({ NODE_ENV: "production", DEMO_MODE: "false" })).toThrow();
  });
  it("production + Supabase 없음 + DEMO_MODE=true(명시) → 로컬/단일 인스턴스 데모만 허용", () => {
    expect(isDemoMode({ NODE_ENV: "production", DEMO_MODE: "true" })).toBe(true);
  });
  it("개발 환경: 값이 없으면 데모, Supabase 가 있으면 DEMO_MODE=true 일 때만 데모", () => {
    expect(isDemoMode({ NODE_ENV: "development" })).toBe(true);
    expect(isDemoMode({ NODE_ENV: "development", ...SB })).toBe(false);
    expect(isDemoMode({ NODE_ENV: "development", DEMO_MODE: "true", ...SB })).toBe(true);
  });
});

describe("혜택 문구는 평가·평점·리뷰와 연결될 수 없다", () => {
  it.each(["별점 5점을 남기면 쿠폰", "좋은 후기 작성 시 제공", "긍정적인 평가 부탁드립니다", "앱스토어 리뷰 인증", "leave a 5-star review", "rating required"])(
    "차단: %s", (t) => expect(noRatingLinkage(t)).toBe(false),
  );
  it.each(["첫 3개월 20% 할인", "프로 플랜 30일 무료 체험", "결제 시 코드를 입력하세요"])("허용: %s", (t) => expect(noRatingLinkage(t)).toBe(true));

  it("createBenefit 이 위반 문구를 VALIDATION 으로 거절한다", async () => {
    const { asUser, svcByName } = setup();
    const ctx = await asUser(COMPANY);
    const base = {
      serviceId: svcByName("노트웨이브").id, type: "coupon", title: "10% 할인", terms: "신규 가입자에게 제공됩니다.", howToUse: "결제 화면에서 코드를 입력",
      validFrom: new Date().toISOString(), validUntil: new Date(Date.now() + 86400000 * 30).toISOString(), totalQuantity: 5, issuerAuthorityConfirmed: true,
    };
    await expect(createBenefit(ctx, { ...base, terms: "별점 5점 남기면 제공됩니다." })).rejects.toBeInstanceOf(AppError);
    await expect(createBenefit(ctx, base)).resolves.toMatchObject({ status: "pending" });
  });
});
