import { z } from "zod";
import { type Ctx, parse, requireUser } from "./ctx";

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "표시 이름을 입력해 주세요.").max(30),
  interests: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
});

export async function updateProfile(ctx: Ctx, input: unknown) {
  const user = requireUser(ctx);
  const d = parse(profileSchema, input);
  await ctx.store.updateProfile(user.id, d);
}

/** 삭제 요청 접수. 실제 삭제는 운영자가 처리(법정 보관 의무 검토 포함) — LEGAL_REVIEW.md 참고 */
export async function requestAccountDeletion(ctx: Ctx) {
  const user = requireUser(ctx);
  await ctx.store.requestDeletion(user.id);
}

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("올바른 이메일 주소를 입력해 주세요.")),
  password: z.string().min(10, "비밀번호는 10자 이상이어야 합니다.").max(128),
  displayName: z.string().trim().min(1, "표시 이름을 입력해 주세요.").max(30),
  role: z.enum(["customer", "company"]),
  companyName: z.string().trim().max(60).optional(),
  consent: z.literal(true, { error: "이용약관과 개인정보 수집·이용에 동의해 주세요." }),
});
