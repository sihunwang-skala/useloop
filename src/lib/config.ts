const flag = (v: string | undefined, def = false) => (v === undefined || v === "" ? def : v === "true");

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Supabase 값이 없거나 DEMO_MODE=true 이면 데모 모드 */
export function isDemoMode() {
  if (process.env.DEMO_MODE === "true") return true;
  if (process.env.DEMO_MODE === "false") return !hasSupabaseEnv();
  return !hasSupabaseEnv();
}

export const features = {
  /** 법적 검토 전까지 기본 비활성. LEGAL_REVIEW.md 참고 */
  feedbackThanks: () => flag(process.env.FEATURE_FEEDBACK_THANKS, false),
  sponsoredLabel: () => flag(process.env.FEATURE_SPONSORED_LABEL, true),
};
