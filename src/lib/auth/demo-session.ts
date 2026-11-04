import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// 데모 모드 전용 서명 쿠키. SESSION_SECRET 이 없으면 프로세스마다 임의 값을 사용합니다(재시작 시 로그아웃).
const g = globalThis as unknown as { __useloopSecret?: string };
function secret() {
  return process.env.SESSION_SECRET || (g.__useloopSecret ??= randomBytes(32).toString("hex"));
}
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");

export const DEMO_COOKIE = "ul_demo_session";

export function makeToken(userId: string) {
  return `${userId}.${sign(userId)}`;
}

export function readToken(token: string | undefined): string | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 0) return null;
  const id = token.slice(0, i);
  const sig = Buffer.from(token.slice(i + 1), "hex");
  const exp = Buffer.from(sign(id), "hex");
  return sig.length === exp.length && timingSafeEqual(sig, exp) ? id : null;
}
