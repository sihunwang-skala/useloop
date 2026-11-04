import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/domain/types";
import { getCtx } from "./index";

/** 페이지 접근 제어: 비로그인 → 로그인 화면, 권한 없음 → 홈. (데이터 접근은 services/ 에서 한 번 더 검사) */
export async function pageCtx(path: string, ...roles: Role[]) {
  const ctx = await getCtx();
  if (!ctx.user) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (roles.length && !roles.includes(ctx.user.role)) redirect("/");
  return ctx;
}
