const flag = (v: string | undefined, def = false) => (v === undefined || v === "" ? def : v === "true");

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * 데모 모드 판정 (fail-closed).
 * - 데모 모드는 `DEMO_MODE=true` 로 **명시**했을 때만 켜집니다. 값이 없다고 해서 조용히 데모로 떨어지지 않습니다.
 * - NODE_ENV=production 에서 Supabase 값이 설정돼 있으면 DEMO_MODE=true 여도 무시합니다(공개 데모 계정 노출 방지).
 * - production 인데 Supabase 값도 DEMO_MODE=true 도 없으면 설정 오류로 중단합니다.
 */
export function isDemoMode(env: Record<string, string | undefined> = process.env): boolean {
  const supabase = Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const production = env.NODE_ENV === "production";
  if (production && supabase) return false;
  if (env.DEMO_MODE === "true") return true;
  if (supabase) return false;
  if (production) {
    throw new Error("UseLoop 설정 오류: Supabase 환경변수가 없습니다. 로컬 데모는 DEMO_MODE=true 를 명시하세요.");
  }
  return true; // 개발 환경(next dev/test)에서 환경변수가 전혀 없으면 편의상 데모
}

export const features = {
  /** 법적 검토 전까지 기본 비활성. LEGAL_REVIEW.md 참고 */
  feedbackThanks: () => flag(process.env.FEATURE_FEEDBACK_THANKS, false),
  sponsoredLabel: () => flag(process.env.FEATURE_SPONSORED_LABEL, true),
};
