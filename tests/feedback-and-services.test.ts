import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/domain/errors";
import { createService, updateService } from "@/lib/services/company";
import { discover, recommend, serviceDetail } from "@/lib/services/discovery";
import { companyFeedback, companyStats, myFeedback, respondToFeedback, submitFeedback } from "@/lib/services/feedback";
import { reviewService } from "@/lib/services/admin";
import { ADMIN, COMPANY, CUSTOMER, setup } from "./helpers";

const err = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return e as AppError; }
  return null;
};

describe("피드백", () => {
  it("고객이 피드백을 쓰면 내 피드백에 보인다", async () => {
    const { asUser, svcByName } = setup();
    const c = await asUser(CUSTOMER);
    await submitFeedback(c, { serviceId: svcByName("페이로그").id, disliked: "정산 속도", sentiment: "negative", topics: ["성능·속도"] });
    const mine = await myFeedback(c);
    expect(mine).toHaveLength(2);
    expect(mine[0].feedback.sentiment).toBe("negative");
  });
  it("내용이 비어 있거나 평가 느낌이 없으면 검증 오류", async () => {
    const { asUser, svcByName } = setup();
    const c = await asUser(CUSTOMER);
    const id = svcByName("페이로그").id;
    expect((await err(submitFeedback(c, { serviceId: id, sentiment: "positive" })))?.code).toBe("VALIDATION");
    expect((await err(submitFeedback(c, { serviceId: id, liked: "ok" })))?.fieldErrors?.sentiment).toBeTruthy();
    expect((await err(submitFeedback(c, { serviceId: id, liked: "x".repeat(2001), sentiment: "positive" })))?.code).toBe("VALIDATION");
  });
  it("승인되지 않은 서비스에는 피드백을 쓸 수 없다", async () => {
    const { asUser, svcByName } = setup();
    expect((await err(submitFeedback(await asUser(CUSTOMER), { serviceId: svcByName("승인 대기").id, liked: "x", sentiment: "positive" })))?.code).toBe("NOT_FOUND");
  });
  it("기업 계정은 피드백을 작성할 수 없다(자작 후기 방지)", async () => {
    const { asUser, svcByName } = setup();
    expect((await err(submitFeedback(await asUser(COMPANY), { serviceId: svcByName("노트웨이브").id, liked: "x", sentiment: "positive" })))?.code).toBe("FORBIDDEN");
  });
  it("남용 방지: 시간당 10건을 넘기면 제한", async () => {
    const { asUser, svcByName } = setup();
    const c = await asUser(CUSTOMER);
    const input = { serviceId: svcByName("페이로그").id, liked: "ok", sentiment: "neutral" };
    for (let i = 0; i < 10; i++) await submitFeedback(c, input);
    expect((await err(submitFeedback(c, input)))?.code).toBe("RATE_LIMITED");
  });
});

describe("기업 답변·통계", () => {
  it("기업이 답변하면 고객이 답변과 진행 상태를 본다", async () => {
    const { asUser } = setup();
    const company = await asUser(COMPANY);
    const [row] = await companyFeedback(company);
    await respondToFeedback(company, { feedbackId: row.feedback.id, body: "곧 반영하겠습니다.", progress: "done" });
    const [mine] = await myFeedback(await asUser(CUSTOMER));
    expect(mine.responses.map((r) => r.body)).toContain("곧 반영하겠습니다.");
    expect(mine.feedback.progress).toBe("done");
  });
  it("다른 기업은 답변할 수 없다", async () => {
    const { asUser, store } = setup();
    const [row] = await companyFeedback(await asUser(COMPANY));
    const rival = store.registerAccount({ email: "rival@t.test", password: "password-12345", displayName: "r", role: "company", companyName: "경쟁사" });
    expect((await err(respondToFeedback({ store, user: rival }, { feedbackId: row.feedback.id, body: "침입", progress: "done" })))?.code).toBe("NOT_FOUND");
  });
  it("고객은 답변할 수 없다", async () => {
    const { asUser } = setup();
    const [row] = await companyFeedback(await asUser(COMPANY));
    expect((await err(respondToFeedback(await asUser(CUSTOMER), { feedbackId: row.feedback.id, body: "x", progress: "done" })))?.code).toBe("FORBIDDEN");
  });
  it("통계: 총 건수·분포·주제·답변 여부", async () => {
    const { asUser } = setup();
    const s = await companyStats(await asUser(COMPANY));
    expect(s.total).toBe(1);
    expect(s.sentiment.neutral).toBe(1);
    expect(s.replied).toBe(1);
    expect(s.topTopics.map((t) => t.topic)).toContain("성능·속도");
  });
});

describe("서비스 등록·수정·탐색", () => {
  const input = { name: "새 서비스", tagline: "한 줄 소개입니다", description: "", url: "https://example.org", categorySlug: "design", tags: ["a"] };
  it("기업이 등록하면 승인 대기이고 탐색에 나오지 않는다. 승인하면 나온다", async () => {
    const { asUser, anon } = setup();
    const company = await asUser(COMPANY);
    const svc = await createService(company, input);
    expect(svc.status).toBe("pending");
    expect((await discover(anon, { q: "새 서비스" })).organic).toHaveLength(0);
    await reviewService(await asUser(ADMIN), svc.id, { decision: "approved" });
    expect((await discover(anon, { q: "새 서비스" })).organic).toHaveLength(1);
  });
  it("수정하면 다시 승인 대기로 돌아간다", async () => {
    const { asUser } = setup();
    const company = await asUser(COMPANY);
    const svc = await createService(company, input);
    await reviewService(await asUser(ADMIN), svc.id, { decision: "approved" });
    const updated = await updateService(company, svc.id, { ...input, name: "이름 변경" });
    expect(updated.status).toBe("pending");
    expect(updated.name).toBe("이름 변경");
  });
  it("타 기업 서비스는 수정할 수 없고, 위험한 URL·잘못된 카테고리는 거절", async () => {
    const { asUser, svcByName } = setup();
    const company = await asUser(COMPANY);
    expect((await err(updateService(company, svcByName("페이로그").id, input)))?.code).toBe("NOT_FOUND");
    expect((await err(createService(company, { ...input, url: "javascript:alert(1)" })))?.fieldErrors?.url).toBeTruthy();
    expect((await err(createService(company, { ...input, categorySlug: "nope" })))?.code).toBe("VALIDATION");
  });
  it("반려는 사유가 필수", async () => {
    const { asUser, svcByName } = setup();
    expect((await err(reviewService(await asUser(ADMIN), svcByName("승인 대기").id, { decision: "rejected" })))?.code).toBe("VALIDATION");
  });
  it("비로그인도 탐색·카테고리 필터가 가능하고 광고는 분리된다", async () => {
    const { anon } = setup();
    const all = await discover(anon);
    expect(all.sponsored.map((i) => i.service.name)).toEqual(["코드랜턴 (데모)"]);
    expect(all.organic.some((i) => i.service.sponsored)).toBe(false);
    expect((await discover(anon, { category: "finance" })).organic).toHaveLength(1);
  });
  it("승인 대기 서비스 상세는 일반 고객에게 숨겨진다", async () => {
    const { anon, asUser, svcByName } = setup();
    const pending = svcByName("승인 대기");
    expect(await serviceDetail(anon, pending.id)).toBeNull();
    expect(await serviceDetail(await asUser(COMPANY), pending.id)).not.toBeNull();
  });
  it("규칙 기반 추천: 관심 카테고리 우선, 광고는 제외", async () => {
    const { asUser } = setup();
    const recs = await recommend(await asUser(CUSTOMER));
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.every((r) => !r.service.sponsored)).toBe(true);
    expect(recs[0].service.categorySlug).toBe("productivity");
  });
});
