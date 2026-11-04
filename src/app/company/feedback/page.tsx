import Link from "next/link";
import { pageCtx } from "@/lib/auth/guards";
import { companyFeedback } from "@/lib/services/feedback";
import { myServices } from "@/lib/services/company";
import { RespondForm } from "@/components/company-forms";
import { ReportForm } from "@/components/benefit-actions";
import { Badge, Empty, PageHeader, fmtDate, progressLabel, sentimentLabel, sentimentTone } from "@/components/ui";

export const metadata = { title: "받은 피드백" };

export default async function CompanyFeedback({ searchParams }: { searchParams: Promise<{ service?: string; filter?: string }> }) {
  const sp = await searchParams;
  const ctx = await pageCtx("/company/feedback", "company");
  const [rows, services] = await Promise.all([companyFeedback(ctx, sp.service), myServices(ctx)]);
  const shown = sp.filter === "unreplied" ? rows.filter((r) => r.responses.length === 0) : rows;
  const chip = (active: boolean) => `inline-flex min-h-9 items-center rounded-full border px-3 text-sm ${active ? "border-ink bg-ink text-white" : "border-line bg-white"}`;
  return (
    <>
      <PageHeader title="받은 피드백" desc="고객의 이름·이메일은 제공되지 않으며 익명 식별자만 표시됩니다. 답변은 작성한 고객에게만 보입니다." />
      <nav aria-label="필터" className="mb-6 flex flex-wrap gap-2">
        <Link href="/company/feedback" className={chip(!sp.filter && !sp.service)}>전체</Link>
        <Link href="/company/feedback?filter=unreplied" className={chip(sp.filter === "unreplied")}>답변 대기</Link>
        {services.map((s) => <Link key={s.id} href={`/company/feedback?service=${s.id}`} className={chip(sp.service === s.id)}>{s.name}</Link>)}
      </nav>
      {shown.length === 0 ? <Empty title="표시할 피드백이 없습니다" /> : (
        <ul className="space-y-5">
          {shown.map(({ feedback: f, serviceName, responses, anonymousId }) => (
            <li key={f.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{serviceName}</span>
                <Badge tone={sentimentTone[f.sentiment]}>{sentimentLabel[f.sentiment]}</Badge>
                <Badge tone="brand">{progressLabel[f.progress]}</Badge>
                {f.topics.map((t) => <Badge key={t}>{t}</Badge>)}
                <span className="text-xs text-muted">{anonymousId} · {fmtDate(f.createdAt)}</span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {f.liked && <div><dt className="font-medium">좋았던 점</dt><dd className="whitespace-pre-line text-muted">{f.liked}</dd></div>}
                {f.disliked && <div><dt className="font-medium">불편했던 점</dt><dd className="whitespace-pre-line text-muted">{f.disliked}</dd></div>}
                {f.suggestion && <div><dt className="font-medium">개선 의견</dt><dd className="whitespace-pre-line text-muted">{f.suggestion}</dd></div>}
              </dl>
              {responses.map((r) => (
                <div key={r.id} className="mt-3 border-l-2 border-brand pl-4 text-sm">
                  <p className="whitespace-pre-line">{r.body}</p>
                  <p className="mt-1 text-xs text-muted">{fmtDate(r.createdAt)} · {progressLabel[r.progress]}</p>
                </div>
              ))}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-brand">{responses.length ? "추가 답변·상태 변경" : "답변하기"}</summary>
                <RespondForm feedbackId={f.id} current={f.progress} />
              </details>
              <div className="mt-3"><ReportForm targetType="feedback" targetId={f.id} /></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
