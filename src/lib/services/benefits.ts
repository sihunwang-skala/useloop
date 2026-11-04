import { z } from "zod";
import { features } from "@/lib/config";
import { AppError } from "@/lib/domain/errors";
import type { Benefit, Claim, ClaimStatus } from "@/lib/domain/types";
import { rateLimit } from "@/lib/rate-limit";
import { type Ctx, nowOf, ownedService, parse, requireCompanyUser, requireRole, requireUser } from "./ctx";

const dateStr = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "올바른 날짜를 입력해 주세요.");

export const benefitSchema = z
  .object({
    serviceId: z.string().min(1, "서비스를 선택해 주세요."),
    type: z.enum(["coupon", "free_trial"]),
    kind: z.enum(["discovery", "thanks"]).default("discovery"),
    title: z.string().trim().min(2, "제목은 2자 이상이어야 합니다.").max(80),
    description: z.string().trim().max(1000).default(""),
    terms: z.string().trim().min(5, "이용 조건을 5자 이상 입력해 주세요.").max(2000),
    howToUse: z.string().trim().min(5, "사용 방법을 5자 이상 입력해 주세요.").max(1000),
    validFrom: dateStr,
    validUntil: dateStr,
    totalQuantity: z.coerce.number().int("정수를 입력해 주세요.").min(1, "수량은 1 이상이어야 합니다.").max(100000),
    issuerAuthorityConfirmed: z.literal(true, { error: "혜택을 직접 발급할 권한이 있음을 확인해야 합니다." }),
  })
  .refine((v) => Date.parse(v.validUntil) > Date.parse(v.validFrom), { message: "종료일은 시작일 이후여야 합니다.", path: ["validUntil"] });

function guardKind(kind: Benefit["kind"]) {
  if (kind === "thanks" && !features.feedbackThanks()) {
    throw new AppError("FEATURE_DISABLED", "피드백 감사 혜택은 법률 검토가 끝나기 전까지 비활성화되어 있습니다.");
  }
}

/** 새 혜택은 승인 대기. 관리자가 승인하기 전에는 고객에게 보이지 않고 발급되지 않습니다. */
export async function createBenefit(ctx: Ctx, input: unknown) {
  const data = parse(benefitSchema, input);
  guardKind(data.kind);
  await ownedService(ctx, data.serviceId);
  rateLimit(`benefit:${ctx.user!.id}`, 30, 60 * 60 * 1000);
  return ctx.store.createBenefit(data);
}

/** 수량은 이미 발급된 수 아래로 줄일 수 없고, 일시중지/재개만 승인 없이 가능합니다. */
export async function updateBenefitQuantity(ctx: Ctx, benefitId: string, quantity: number) {
  const b = await ctx.store.getBenefit(benefitId);
  if (!b) throw new AppError("NOT_FOUND", "혜택을 찾을 수 없습니다.");
  await ownedService(ctx, b.serviceId);
  const qty = parse(benefitSchema.shape.totalQuantity, quantity);
  if (qty < b.claimedCount) throw new AppError("VALIDATION", `이미 ${b.claimedCount}개가 발급되어 그 아래로 줄일 수 없습니다.`, { totalQuantity: "발급된 수량보다 작을 수 없습니다." });
  return ctx.store.updateBenefit(b.id, { totalQuantity: qty });
}

export async function setBenefitPaused(ctx: Ctx, benefitId: string, paused: boolean) {
  const b = await ctx.store.getBenefit(benefitId);
  if (!b) throw new AppError("NOT_FOUND", "혜택을 찾을 수 없습니다.");
  await ownedService(ctx, b.serviceId);
  if (b.status === "pending" || b.status === "rejected") throw new AppError("CONFLICT", "승인된 혜택만 일시중지할 수 있습니다.");
  return ctx.store.updateBenefit(b.id, { status: paused ? "paused" : "approved" });
}

export async function companyBenefits(ctx: Ctx) {
  const user = requireCompanyUser(ctx);
  const services = await ctx.store.listServices({ companyId: user.companyId });
  const benefits = await ctx.store.listBenefits({ serviceIds: services.map((s) => s.id) });
  const names = new Map(services.map((s) => [s.id, s.name]));
  return { services, benefits: benefits.map((b) => ({ benefit: b, serviceName: names.get(b.serviceId) ?? "" })) };
}

export async function claimBenefit(ctx: Ctx, benefitId: string): Promise<Claim> {
  const user = requireRole(ctx, "customer");
  rateLimit(`claim:${user.id}`, 20, 60 * 60 * 1000);
  const b = await ctx.store.getBenefit(benefitId);
  if (!b || b.status !== "approved") throw new AppError("NOT_FOUND", "이용할 수 없는 혜택입니다.");
  const svc = await ctx.store.getService(b.serviceId);
  if (!svc || svc.status !== "approved") throw new AppError("NOT_FOUND", "이용할 수 없는 혜택입니다.");
  guardKind(b.kind);
  if (b.kind === "thanks") {
    // 감사 혜택: 내용의 긍정/부정·평점과 무관하게 해당 서비스에 비공개 피드백을 남긴 사람이면 동일하게 받음
    const mine = await ctx.store.listFeedback({ serviceIds: [b.serviceId], authorId: user.id });
    if (!mine.length) throw new AppError("FORBIDDEN", "이 혜택은 해당 서비스에 비공개 피드백을 남긴 분께 제공됩니다.");
  }
  return ctx.store.claimBenefit(benefitId, user.id, nowOf(ctx));
}

export function effectiveStatus(claim: Claim, benefit: Benefit, at: Date): ClaimStatus {
  if (claim.status === "issued" && at > new Date(benefit.validUntil)) return "expired";
  return claim.status;
}

export async function myBenefits(ctx: Ctx) {
  const user = requireUser(ctx);
  const claims = await ctx.store.listClaims({ userId: user.id });
  const benefits = await Promise.all([...new Set(claims.map((c) => c.benefitId))].map((id) => ctx.store.getBenefit(id)));
  const bMap = new Map(benefits.filter((b): b is Benefit => !!b).map((b) => [b.id, b]));
  const services = await ctx.store.listServices({ ids: [...new Set([...bMap.values()].map((b) => b.serviceId))] });
  const sMap = new Map(services.map((s) => [s.id, s]));
  const at = nowOf(ctx);
  return claims.flatMap((c) => {
    const benefit = bMap.get(c.benefitId);
    if (!benefit) return [];
    return [{ claim: c, benefit, service: sMap.get(benefit.serviceId) ?? null, status: effectiveStatus(c, benefit, at) }];
  });
}

/** 기업이 고객이 제시한 코드를 사용 처리. 자기 서비스의 혜택 코드만 처리 가능. */
export async function redeemCode(ctx: Ctx, rawCode: string) {
  const user = requireCompanyUser(ctx);
  rateLimit(`redeem:${user.id}`, 60, 60 * 60 * 1000);
  const code = rawCode.trim().toUpperCase();
  const claim = code ? await ctx.store.getClaimByCode(code) : null;
  const benefit = claim ? await ctx.store.getBenefit(claim.benefitId) : null;
  const svc = benefit ? await ctx.store.getService(benefit.serviceId) : null;
  // 존재 여부를 숨기기 위해 타 기업 코드도 동일한 메시지
  if (!claim || !benefit || !svc || svc.companyId !== user.companyId) throw new AppError("NOT_FOUND", "유효하지 않은 코드입니다.");
  const st = effectiveStatus(claim, benefit, nowOf(ctx));
  if (st === "used") throw new AppError("CONFLICT", "이미 사용된 코드입니다.");
  if (st !== "issued") throw new AppError("EXPIRED", "사용할 수 없는 코드입니다. (만료 또는 취소)");
  await ctx.store.setClaimStatus(claim.id, "used");
  return { benefitTitle: benefit.title };
}
