import { z } from "zod";
import { AppError } from "@/lib/domain/errors";
import type { Role, SessionUser } from "@/lib/domain/types";
import type { Store } from "@/lib/store/types";

export interface Ctx {
  store: Store;
  user: SessionUser | null;
  now?: Date;
}

export function requireUser(ctx: Ctx): SessionUser {
  if (!ctx.user) throw new AppError("UNAUTHENTICATED", "로그인이 필요합니다.");
  if (ctx.user.deletionRequestedAt) throw new AppError("FORBIDDEN", "삭제 요청 처리 중인 계정입니다.");
  return ctx.user;
}

export function requireRole(ctx: Ctx, ...roles: Role[]): SessionUser {
  const u = requireUser(ctx);
  if (!roles.includes(u.role)) throw new AppError("FORBIDDEN", "이 작업을 수행할 권한이 없습니다.");
  return u;
}

/** 기업 계정이며 companyId 를 가진 사용자 */
export function requireCompanyUser(ctx: Ctx): SessionUser & { companyId: string } {
  const u = requireRole(ctx, "company");
  if (!u.companyId) throw new AppError("FORBIDDEN", "소속 기업이 없습니다.");
  return u as SessionUser & { companyId: string };
}

export function parse<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  const fieldErrors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const k = String(issue.path[0] ?? "_");
    fieldErrors[k] ??= issue.message;
  }
  throw new AppError("VALIDATION", "입력값을 확인해 주세요.", fieldErrors);
}

export const nowOf = (ctx: Ctx) => ctx.now ?? new Date();

/** 서비스가 해당 기업 소유인지 확인하고 반환 (타 기업 데이터 접근 차단) */
export async function ownedService(ctx: Ctx, serviceId: string) {
  const u = requireCompanyUser(ctx);
  const svc = await ctx.store.getService(serviceId);
  if (!svc || svc.companyId !== u.companyId) throw new AppError("NOT_FOUND", "서비스를 찾을 수 없습니다.");
  return svc;
}
