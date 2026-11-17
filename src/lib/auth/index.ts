import "server-only";
import { cookies, headers } from "next/headers";
import { isDemoMode } from "@/lib/config";
import { AppError } from "@/lib/domain/errors";
import type { SessionUser } from "@/lib/domain/types";
import { rateLimit } from "@/lib/rate-limit";
import type { Ctx } from "@/lib/services/ctx";
import { parse } from "@/lib/services/ctx";
import { signupSchema } from "@/lib/services/account";
import { demoStore, getStore } from "@/lib/store";
import { DEMO_COOKIE, makeToken, readToken } from "./demo-session";

async function currentUser(): Promise<SessionUser | null> {
  if (isDemoMode()) {
    const id = readToken((await cookies()).get(DEMO_COOKIE)?.value);
    return id ? demoStore().getSessionUser(id) : null;
  }
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  return (await getStore()).getSessionUser(data.user.id);
}

/** 서버 컴포넌트/액션에서 사용하는 요청 컨텍스트 */
export async function getCtx(): Promise<Ctx> {
  const [store, user] = await Promise.all([getStore(), currentUser()]);
  return { store, user };
}

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function signUp(input: unknown): Promise<void> {
  const d = parse(signupSchema, input);
  if (d.role === "company" && !d.companyName) throw new AppError("VALIDATION", "기업명을 입력해 주세요.", { companyName: "기업명을 입력해 주세요." });
  rateLimit(`signup:${await clientKey()}`, 10, 60 * 60 * 1000);
  if (isDemoMode()) {
    const user = demoStore().registerAccount(d);
    (await cookies()).set(DEMO_COOKIE, makeToken(user.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return;
  }
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  // 역할(customer/company)과 기업명은 DB 트리거가 검증해 profiles/companies 를 만듭니다. admin 은 이 경로로 만들 수 없습니다.
  const { error } = await supabase.auth.signUp({
    email: d.email, password: d.password,
    options: { data: { display_name: d.displayName, role: d.role, company_name: d.companyName ?? null } },
  });
  if (error) throw new AppError("VALIDATION", "가입에 실패했습니다. 입력값을 확인하거나 이미 가입된 이메일인지 확인해 주세요.");
}

export async function signIn(email: string, password: string): Promise<void> {
  rateLimit(`login:${await clientKey()}`, 20, 15 * 60 * 1000);
  rateLimit(`login-email:${email.toLowerCase()}`, 8, 15 * 60 * 1000);
  const fail = new AppError("UNAUTHENTICATED", "이메일 또는 비밀번호가 올바르지 않습니다.");
  if (isDemoMode()) {
    const user = demoStore().verifyLogin(email, password);
    if (!user) throw fail;
    (await cookies()).set(DEMO_COOKIE, makeToken(user.id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
    return;
  }
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw fail;
}

export async function signOut(): Promise<void> {
  if (isDemoMode()) {
    (await cookies()).delete(DEMO_COOKIE);
    return;
  }
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  await (await createSupabaseServerClient()).auth.signOut();
}
