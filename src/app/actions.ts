"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCtx, signIn, signOut, signUp } from "@/lib/auth";
import { AppError } from "@/lib/domain/errors";
import { requestAccountDeletion, updateProfile } from "@/lib/services/account";
import { createReport, resolveReport, reviewBenefit, reviewService, setSponsored } from "@/lib/services/admin";
import { claimBenefit, createBenefit, redeemCode, setBenefitPaused, updateBenefitQuantity } from "@/lib/services/benefits";
import { createService, splitTags, updateService } from "@/lib/services/company";
import { respondToFeedback, submitFeedback } from "@/lib/services/feedback";

export type FormState = { ok?: boolean; message?: string; fieldErrors?: Record<string, string> } | null;

/** AppError 는 사용자에게 그대로, 그 외 오류는 일반 메시지로 변환 (내부 정보 비노출) */
async function run(fn: () => Promise<string | void>): Promise<FormState> {
  try {
    const message = await fn();
    return { ok: true, message: message ?? undefined };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, message: e.message, fieldErrors: e.fieldErrors };
    if (e && typeof e === "object" && "digest" in e && String((e as { digest: string }).digest).startsWith("NEXT_")) throw e;
    console.error("[action-error]", e instanceof Error ? e.name : "unknown");
    return { ok: false, message: "처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "/");

// ---- 인증 ----
export async function signupAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(() =>
    signUp({
      email: str(fd, "email"), password: str(fd, "password"), displayName: str(fd, "displayName"),
      role: str(fd, "role"), companyName: str(fd, "companyName") || undefined, consent: fd.get("consent") === "on",
    }),
  );
  if (r?.ok) redirect(str(fd, "role") === "company" ? "/company" : "/discover");
  return r;
}

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(() => signIn(str(fd, "email"), str(fd, "password")));
  if (r?.ok) redirect(safeNext(str(fd, "next")));
  return r;
}

export async function logoutAction() {
  await signOut();
  redirect("/");
}

// ---- 고객 ----
export async function feedbackAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    await submitFeedback(await getCtx(), {
      serviceId: str(fd, "serviceId"), liked: str(fd, "liked"), disliked: str(fd, "disliked"), suggestion: str(fd, "suggestion"),
      sentiment: str(fd, "sentiment"), topics: fd.getAll("topics").map(String),
    });
  });
  if (r?.ok) {
    revalidatePath("/my/feedback");
    redirect("/my/feedback?submitted=1");
  }
  return r;
}

export async function claimAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    await claimBenefit(await getCtx(), str(fd, "benefitId"));
    return "혜택을 받았습니다. '내 혜택'에서 코드를 확인하세요.";
  });
  revalidatePath("/my/benefits");
  revalidatePath(`/services/${str(fd, "serviceId")}`);
  return r;
}

export async function reportAction(_: FormState, fd: FormData): Promise<FormState> {
  return run(async () => {
    await createReport(await getCtx(), { targetType: str(fd, "targetType"), targetId: str(fd, "targetId"), reason: str(fd, "reason") });
    return "신고가 접수되었습니다. 운영자가 검토합니다.";
  });
}

export async function profileAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    await updateProfile(await getCtx(), { displayName: str(fd, "displayName"), interests: fd.getAll("interests").map(String) });
    return "저장했습니다.";
  });
  revalidatePath("/account");
  return r;
}

export async function deletionAction(_: FormState): Promise<FormState> {
  const r = await run(async () => {
    await requestAccountDeletion(await getCtx());
    return "삭제 요청이 접수되었습니다. 운영자가 확인 후 처리합니다.";
  });
  revalidatePath("/account");
  return r;
}

// ---- 기업 ----
export async function respondAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    await respondToFeedback(await getCtx(), { feedbackId: str(fd, "feedbackId"), body: str(fd, "body"), progress: str(fd, "progress") });
    return "답변을 등록했습니다.";
  });
  revalidatePath("/company/feedback");
  return r;
}

export async function saveServiceAction(_: FormState, fd: FormData): Promise<FormState> {
  const id = str(fd, "id");
  const input = {
    name: str(fd, "name"), tagline: str(fd, "tagline"), description: str(fd, "description"), url: str(fd, "url"),
    categorySlug: str(fd, "categorySlug"), tags: splitTags(str(fd, "tags")),
  };
  const r = await run(async () => {
    const ctx = await getCtx();
    if (id) await updateService(ctx, id, input);
    else await createService(ctx, input);
  });
  if (r?.ok) {
    revalidatePath("/company/services");
    redirect("/company/services?saved=1");
  }
  return r;
}

export async function createBenefitAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    await createBenefit(await getCtx(), {
      serviceId: str(fd, "serviceId"), type: str(fd, "type"), kind: "discovery", title: str(fd, "title"),
      description: str(fd, "description"), terms: str(fd, "terms"), howToUse: str(fd, "howToUse"),
      validFrom: str(fd, "validFrom"), validUntil: str(fd, "validUntil"), totalQuantity: str(fd, "totalQuantity"),
      issuerAuthorityConfirmed: fd.get("issuerAuthorityConfirmed") === "on",
    });
  });
  if (r?.ok) {
    revalidatePath("/company/benefits");
    redirect("/company/benefits?saved=1");
  }
  return r;
}

export async function quantityAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    await updateBenefitQuantity(await getCtx(), str(fd, "benefitId"), Number(str(fd, "quantity")));
    return "수량을 변경했습니다.";
  });
  revalidatePath("/company/benefits");
  return r;
}

export async function pauseAction(fd: FormData) {
  await run(async () => void (await setBenefitPaused(await getCtx(), str(fd, "benefitId"), str(fd, "paused") === "true")));
  revalidatePath("/company/benefits");
}

export async function redeemAction(_: FormState, fd: FormData): Promise<FormState> {
  const r = await run(async () => {
    const res = await redeemCode(await getCtx(), str(fd, "code"));
    return `사용 처리되었습니다: ${res.benefitTitle}`;
  });
  revalidatePath("/company/benefits");
  return r;
}

// ---- 관리자 ----
export async function reviewServiceAction(fd: FormData) {
  await run(async () => void (await reviewService(await getCtx(), str(fd, "id"), { decision: str(fd, "decision"), reason: str(fd, "reason") })));
  revalidatePath("/admin");
}
export async function reviewBenefitAction(fd: FormData) {
  await run(async () => void (await reviewBenefit(await getCtx(), str(fd, "id"), { decision: str(fd, "decision"), reason: str(fd, "reason") })));
  revalidatePath("/admin");
}
export async function resolveReportAction(fd: FormData) {
  await run(async () => resolveReport(await getCtx(), str(fd, "id"), str(fd, "status") === "resolved" ? "resolved" : "dismissed", str(fd, "resolution")));
  revalidatePath("/admin");
}
export async function sponsoredAction(fd: FormData) {
  await run(async () => void (await setSponsored(await getCtx(), str(fd, "id"), str(fd, "sponsored") === "true")));
  revalidatePath("/admin");
  revalidatePath("/discover");
}
