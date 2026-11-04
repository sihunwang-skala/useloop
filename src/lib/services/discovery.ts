import { features } from "@/lib/config";
import type { Benefit, Service } from "@/lib/domain/types";
import { type Ctx } from "./ctx";

export interface DiscoverQuery { category?: string; q?: string; tag?: string }

export async function listCategories(ctx: Ctx) {
  return ctx.store.listCategories();
}

/** 고객에게 보이는 혜택: 승인됨 + (감사 혜택은 기능 플래그가 켜진 경우에만) */
export function visibleBenefits(list: Benefit[]) {
  return list.filter((b) => b.status === "approved" && (b.kind !== "thanks" || features.feedbackThanks()));
}

/** 서비스 탐색은 로그인·리뷰 작성 없이 가능합니다. */
export async function discover(ctx: Ctx, query: DiscoverQuery = {}) {
  const all = await ctx.store.listServices({ status: "approved" });
  const q = query.q?.trim().toLowerCase();
  const filtered = all.filter(
    (s) =>
      (!query.category || s.categorySlug === query.category) &&
      (!query.tag || s.tags.includes(query.tag)) &&
      (!q || [s.name, s.tagline, s.description, ...s.tags].some((t) => t.toLowerCase().includes(q))),
  );
  const benefits = visibleBenefits(await ctx.store.listBenefits({ serviceIds: filtered.map((s) => s.id) }));
  const withBenefit = new Set(benefits.map((b) => b.serviceId));
  const items = filtered.map((s) => ({ service: s, hasBenefit: withBenefit.has(s.id) }));
  return {
    // 광고(스폰서)는 일반 결과와 분리해서 반환 — UI 에서도 "광고" 라벨로 구분
    sponsored: features.sponsoredLabel() ? items.filter((i) => i.service.sponsored) : [],
    organic: items.filter((i) => !i.service.sponsored || !features.sponsoredLabel()),
  };
}

/** Rule-based 추천: 관심 카테고리 +3, 관심 태그 일치 +1. 개인정보는 사용하지 않고 본인의 관심사만 사용. */
export function scoreService(s: Service, interests: string[]) {
  let score = 0;
  if (interests.includes(s.categorySlug)) score += 3;
  for (const t of s.tags) if (interests.includes(t)) score += 1;
  return score;
}

export async function recommend(ctx: Ctx, limit = 3) {
  const interests = ctx.user?.interests ?? [];
  const { organic } = await discover(ctx);
  const ranked = organic
    .map((i) => ({ ...i, score: scoreService(i.service, interests) }))
    .filter((i) => i.score > 0 && !(ctx.user?.companyId && i.service.companyId === ctx.user.companyId))
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit);
}

export async function serviceDetail(ctx: Ctx, id: string) {
  const svc = await ctx.store.getService(id);
  if (!svc) return null;
  const isOwner = !!ctx.user?.companyId && ctx.user.companyId === svc.companyId;
  if (svc.status !== "approved" && !isOwner && ctx.user?.role !== "admin") return null;
  const company = await ctx.store.getCompany(svc.companyId);
  const all = await ctx.store.listBenefits({ serviceIds: [id] });
  const benefits = isOwner || ctx.user?.role === "admin" ? all : visibleBenefits(all);
  const myClaims = ctx.user ? await ctx.store.listClaims({ userId: ctx.user.id, benefitIds: benefits.map((b) => b.id) }) : [];
  return { service: svc, companyName: company?.name ?? "", benefits, myClaims, isOwner };
}
