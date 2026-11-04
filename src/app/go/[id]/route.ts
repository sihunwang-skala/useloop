import { NextResponse } from "next/server";
import { getCtx } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/** 외부 서비스로 이동하기 전에 방문 수만 기록합니다(이동 여부는 고객이 자율 결정). 승인된 서비스의 등록 URL 로만 리다이렉트. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCtx();
  const svc = await ctx.store.getService(id);
  if (!svc || svc.status !== "approved") return NextResponse.redirect(new URL("/discover", req.url));
  try {
    rateLimit(`visit:${ctx.user?.id ?? req.headers.get("x-forwarded-for") ?? "anon"}:${id}`, 30, 60 * 60 * 1000);
    await ctx.store.recordVisit(id, ctx.user?.id ?? null);
  } catch {
    // 방문 기록 실패가 이동을 막지 않도록 무시
  }
  return NextResponse.redirect(svc.url);
}
