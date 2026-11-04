import { AppError } from "@/lib/domain/errors";

/**
 * 기본 구조용 고정 윈도우 Rate Limiter (프로세스 메모리).
 * 서버리스(Vercel)에서는 인스턴스마다 따로 계산되므로, 프로덕션에서는 Upstash Redis 등으로 교체하세요.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number, nowMs = Date.now()) {
  const b = buckets.get(key);
  if (!b || b.resetAt <= nowMs) {
    buckets.set(key, { count: 1, resetAt: nowMs + windowMs });
    return;
  }
  b.count += 1;
  if (b.count > limit) throw new AppError("RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
}

export function resetRateLimits() {
  buckets.clear();
}
