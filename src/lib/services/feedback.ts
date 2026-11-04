import { z } from "zod";
import { AppError } from "@/lib/domain/errors";
import { TOPICS, type Feedback, type FeedbackResponse, type Progress, type Topic } from "@/lib/domain/types";
import { rateLimit } from "@/lib/rate-limit";
import { type Ctx, ownedService, parse, requireCompanyUser, requireRole, requireUser } from "./ctx";

const text = z.string().trim().max(2000, "2000자 이내로 작성해 주세요.");

export const feedbackSchema = z
  .object({
    serviceId: z.string().min(1),
    liked: text.default(""),
    disliked: text.default(""),
    suggestion: text.default(""),
    // 평점이 아니라 사용자가 스스로 고르는 전반적인 느낌. 보상 조건과 무관합니다.
    sentiment: z.enum(["positive", "neutral", "negative"], { error: "전반적인 느낌을 선택해 주세요." }),
    topics: z.array(z.enum(TOPICS)).max(TOPICS.length).default([]),
  })
  .refine((v) => v.liked || v.disliked || v.suggestion, { message: "좋았던 점, 불편했던 점, 개선 의견 중 하나 이상 작성해 주세요.", path: ["liked"] });

export async function submitFeedback(ctx: Ctx, input: unknown) {
  const user = requireRole(ctx, "customer");
  const data = parse(feedbackSchema, input);
  rateLimit(`feedback:${user.id}`, 10, 60 * 60 * 1000);
  const svc = await ctx.store.getService(data.serviceId);
  if (!svc || svc.status !== "approved") throw new AppError("NOT_FOUND", "서비스를 찾을 수 없습니다.");
  return ctx.store.createFeedback({
    serviceId: svc.id, authorId: user.id, liked: data.liked, disliked: data.disliked,
    suggestion: data.suggestion, sentiment: data.sentiment, topics: data.topics as Topic[],
  });
}

export interface FeedbackThread { feedback: Feedback; serviceName: string; responses: FeedbackResponse[] }

/** 내 피드백: 본인 것만 반환 */
export async function myFeedback(ctx: Ctx): Promise<FeedbackThread[]> {
  const user = requireUser(ctx);
  const list = await ctx.store.listFeedback({ authorId: user.id });
  const responses = await ctx.store.listResponses(list.map((f) => f.id));
  const services = await ctx.store.listServices({ ids: [...new Set(list.map((f) => f.serviceId))] });
  const names = new Map(services.map((s) => [s.id, s.name]));
  return list.map((f) => ({ feedback: f, serviceName: names.get(f.serviceId) ?? "삭제된 서비스", responses: responses.filter((r) => r.feedbackId === f.id) }));
}

export interface CompanyFeedbackRow extends FeedbackThread { anonymousId: string }

/** 기업은 자신의 서비스 피드백만 조회. 작성자 이름·이메일은 제공하지 않고 익명 식별자만 노출합니다. */
export async function companyFeedback(ctx: Ctx, serviceId?: string): Promise<CompanyFeedbackRow[]> {
  const user = requireCompanyUser(ctx);
  const mine = await ctx.store.listServices({ companyId: user.companyId });
  const ids = serviceId ? mine.filter((s) => s.id === serviceId).map((s) => s.id) : mine.map((s) => s.id);
  if (!ids.length) return [];
  const list = await ctx.store.listFeedback({ serviceIds: ids });
  const responses = await ctx.store.listResponses(list.map((f) => f.id));
  const names = new Map(mine.map((s) => [s.id, s.name]));
  return list.map((f) => ({
    feedback: f, serviceName: names.get(f.serviceId) ?? "", responses: responses.filter((r) => r.feedbackId === f.id),
    anonymousId: `이용자 ${f.authorId.slice(0, 4).toUpperCase()}`,
  }));
}

const responseSchema = z.object({
  feedbackId: z.string().min(1),
  body: z.string().trim().min(1, "답변 내용을 입력해 주세요.").max(2000, "2000자 이내로 작성해 주세요."),
  progress: z.enum(["received", "reviewing", "planned", "done", "wont_do"]),
});

export async function respondToFeedback(ctx: Ctx, input: unknown) {
  const user = requireCompanyUser(ctx);
  const data = parse(responseSchema, input);
  rateLimit(`respond:${user.id}`, 60, 60 * 60 * 1000);
  const fb = await ctx.store.getFeedback(data.feedbackId);
  if (!fb) throw new AppError("NOT_FOUND", "피드백을 찾을 수 없습니다.");
  await ownedService(ctx, fb.serviceId); // 타 기업 피드백이면 NOT_FOUND
  const r = await ctx.store.createResponse({ feedbackId: fb.id, authorId: user.id, body: data.body, progress: data.progress as Progress });
  await ctx.store.setFeedbackProgress(fb.id, data.progress as Progress);
  return r;
}

/** 기본 통계 (AI 분석 없음) */
export async function companyStats(ctx: Ctx) {
  const rows = await companyFeedback(ctx);
  const sentiment = { positive: 0, neutral: 0, negative: 0 };
  const topics = new Map<string, number>();
  let replied = 0;
  for (const r of rows) {
    sentiment[r.feedback.sentiment] += 1;
    if (r.responses.length) replied += 1;
    // 개선 요청 빈도: 불편/개선 내용이 있는 피드백의 주제 태그를 센다
    if (r.feedback.disliked || r.feedback.suggestion) for (const t of r.feedback.topics) topics.set(t, (topics.get(t) ?? 0) + 1);
  }
  return {
    total: rows.length, sentiment, replied, unreplied: rows.length - replied,
    topTopics: [...topics.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, count]) => ({ topic, count })),
    recent: rows.slice(0, 5),
  };
}
