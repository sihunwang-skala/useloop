import { z } from "zod";
import { AppError } from "@/lib/domain/errors";
import type { ReportTarget } from "@/lib/domain/types";
import { rateLimit } from "@/lib/rate-limit";
import { type Ctx, parse, requireRole, requireUser } from "./ctx";

export async function adminQueue(ctx: Ctx) {
  requireRole(ctx, "admin");
  const [services, benefits, reports, deletions] = await Promise.all([
    ctx.store.listServices({ status: "pending" }),
    ctx.store.listBenefits({ status: "pending" }),
    ctx.store.listReports("open"),
    ctx.store.listDeletionRequests(),
  ]);
  const allServices = await ctx.store.listServices();
  const names = new Map(allServices.map((s) => [s.id, s.name]));
  return { services, benefits: benefits.map((b) => ({ benefit: b, serviceName: names.get(b.serviceId) ?? "" })), reports, deletions };
}

const reviewSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(500).default(""),
});
function reviewInput(input: unknown) {
  const d = parse(reviewSchema, input);
  if (d.decision === "rejected" && !d.reason) throw new AppError("VALIDATION", "반려 사유를 입력해 주세요.", { reason: "반려 사유를 입력해 주세요." });
  return d;
}

export async function reviewService(ctx: Ctx, id: string, input: unknown) {
  requireRole(ctx, "admin");
  const d = reviewInput(input);
  return ctx.store.updateService(id, { status: d.decision, rejectionReason: d.decision === "rejected" ? d.reason : null });
}

export async function reviewBenefit(ctx: Ctx, id: string, input: unknown) {
  requireRole(ctx, "admin");
  const d = reviewInput(input);
  const b = await ctx.store.getBenefit(id);
  if (!b) throw new AppError("NOT_FOUND", "혜택을 찾을 수 없습니다.");
  // 발급 권한 확인이 없는 혜택은 승인할 수 없음
  if (d.decision === "approved" && !b.issuerAuthorityConfirmed) throw new AppError("VALIDATION", "발급 권한 확인이 없는 혜택은 승인할 수 없습니다.");
  return ctx.store.updateBenefit(id, { status: d.decision, rejectionReason: d.decision === "rejected" ? d.reason : null });
}

export async function setSponsored(ctx: Ctx, serviceId: string, sponsored: boolean) {
  requireRole(ctx, "admin");
  return ctx.store.updateService(serviceId, { sponsored });
}

const reportSchema = z.object({
  targetType: z.enum(["feedback", "service", "benefit"]),
  targetId: z.string().min(1),
  reason: z.string().trim().min(5, "사유를 5자 이상 입력해 주세요.").max(1000),
});

export async function createReport(ctx: Ctx, input: unknown) {
  const user = requireUser(ctx);
  const d = parse(reportSchema, input);
  rateLimit(`report:${user.id}`, 10, 60 * 60 * 1000);
  return ctx.store.createReport({ reporterId: user.id, targetType: d.targetType as ReportTarget, targetId: d.targetId, reason: d.reason });
}

export async function resolveReport(ctx: Ctx, id: string, status: "resolved" | "dismissed", resolution: string) {
  requireRole(ctx, "admin");
  await ctx.store.resolveReport(id, status, resolution.trim().slice(0, 500));
}
