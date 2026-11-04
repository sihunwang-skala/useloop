import { z } from "zod";
import { type Ctx, ownedService, parse, requireCompanyUser } from "./ctx";

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  }, "http:// 또는 https:// 로 시작하는 올바른 URL을 입력해 주세요.");

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "서비스 이름은 2자 이상이어야 합니다.").max(60, "60자 이내로 입력해 주세요."),
  tagline: z.string().trim().min(5, "한 줄 소개는 5자 이상이어야 합니다.").max(100, "100자 이내로 입력해 주세요."),
  description: z.string().trim().max(3000, "3000자 이내로 입력해 주세요.").default(""),
  url: httpUrl,
  categorySlug: z.string().min(1, "카테고리를 선택해 주세요."),
  tags: z.array(z.string().trim().min(1).max(20)).max(8, "태그는 8개까지 가능합니다.").default([]),
});

export const splitTags = (raw: string) => [...new Set(raw.split(/[,\n]/).map((t) => t.trim()).filter(Boolean))];

async function validCategory(ctx: Ctx, slug: string) {
  const cats = await ctx.store.listCategories();
  return parse(
    serviceSchema.shape.categorySlug.refine((s) => cats.some((c) => c.slug === s), "올바른 카테고리가 아닙니다."),
    slug,
  );
}

/** 새 서비스는 항상 승인 대기(pending)로 시작합니다. */
export async function createService(ctx: Ctx, input: unknown) {
  const user = requireCompanyUser(ctx);
  const data = parse(serviceSchema, input);
  await validCategory(ctx, data.categorySlug);
  return ctx.store.createService({ ...data, companyId: user.companyId });
}

/** 수정하면 다시 관리자 검토를 받습니다(승인 후 내용을 바꿔 우회하는 것 방지). */
export async function updateService(ctx: Ctx, id: string, input: unknown) {
  await ownedService(ctx, id);
  const data = parse(serviceSchema, input);
  await validCategory(ctx, data.categorySlug);
  return ctx.store.updateService(id, { ...data, status: "pending", rejectionReason: null });
}

export async function myServices(ctx: Ctx) {
  const user = requireCompanyUser(ctx);
  return ctx.store.listServices({ companyId: user.companyId });
}
