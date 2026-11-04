import { notFound } from "next/navigation";
import { feedbackAction } from "@/app/actions";
import { pageCtx } from "@/lib/auth/guards";
import { TOPICS } from "@/lib/domain/types";
import { ActionForm, FieldError, Submit, TextArea } from "@/components/forms";
import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "피드백 작성" };

export default async function FeedbackForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await pageCtx(`/services/${id}/feedback`, "customer");
  const svc = await ctx.store.getService(id);
  if (!svc || svc.status !== "approved") notFound();
  const radio = "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white has-[:focus-visible]:outline-2";
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={`${svc.name} 피드백`} desc="사용하면서 느낀 점을 솔직하게 적어 주세요. 이 피드백은 해당 기업과 나에게만 보이는 비공개 피드백입니다." />
      <div className="mb-6 space-y-2">
        <Notice>가짜 사용 경험이나 대신 작성한 내용은 올리지 마세요. 실제로 써 본 경험만 적어 주세요. 긍정·부정 어느 쪽이든 동일하게 취급되며, 어떤 보상도 평가 내용에 좌우되지 않습니다.</Notice>
        <p className="text-xs text-muted">기업에는 이름·이메일 없이 익명 식별자만 전달됩니다.</p>
      </div>
      <ActionForm action={feedbackAction} className="space-y-6">
        <input type="hidden" name="serviceId" value={svc.id} />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">전반적인 느낌 <span className="text-bad" aria-hidden>*</span></legend>
          <div className="flex gap-2">
            <label className={radio}><input type="radio" name="sentiment" value="positive" className="sr-only" />긍정적</label>
            <label className={radio}><input type="radio" name="sentiment" value="neutral" className="sr-only" />보통</label>
            <label className={radio}><input type="radio" name="sentiment" value="negative" className="sr-only" />부정적</label>
          </div>
          <FieldError name="sentiment" />
        </fieldset>
        <TextArea name="liked" label="좋았던 점" />
        <TextArea name="disliked" label="불편했던 점" />
        <TextArea name="suggestion" label="개선 의견" hint="셋 중 하나 이상 작성해 주세요." />
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">관련 주제 (선택)</legend>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <label key={t} className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line bg-white px-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="checkbox" name="topics" value={t} className="sr-only" />{t}
              </label>
            ))}
          </div>
        </fieldset>
        <Submit>비공개 피드백 보내기</Submit>
      </ActionForm>
    </div>
  );
}
