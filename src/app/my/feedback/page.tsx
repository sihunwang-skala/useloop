import Link from "next/link";
import { pageCtx } from "@/lib/auth/guards";
import { myFeedback } from "@/lib/services/feedback";
import { Badge, Empty, Notice, PageHeader, fmtDate, progressLabel, sentimentLabel, sentimentTone } from "@/components/ui";

export const metadata = { title: "내 피드백" };

export default async function MyFeedback({ searchParams }: { searchParams: Promise<{ submitted?: string }> }) {
  const ctx = await pageCtx("/my/feedback", "customer");
  const list = await myFeedback(ctx);
  const sp = await searchParams;
  return (
    <>
      <PageHeader title="내 피드백" desc="내가 남긴 비공개 피드백과 기업의 답변, 개선 진행 상황입니다." />
      {sp.submitted && <div className="mb-6"><Notice tone="good">피드백을 보냈습니다. 기업이 확인하면 이곳에 답변이 표시됩니다.</Notice></div>}
      {list.length === 0 ? (
        <Empty title="아직 남긴 피드백이 없어요" desc="사용 중인 서비스를 찾아 피드백을 남겨 보세요." href="/discover" cta="서비스 찾기" />
      ) : (
        <ul className="space-y-5">
          {list.map(({ feedback: f, serviceName, responses }) => (
            <li key={f.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/services/${f.serviceId}`} className="font-semibold hover:underline">{serviceName}</Link>
                <Badge tone={sentimentTone[f.sentiment]}>{sentimentLabel[f.sentiment]}</Badge>
                <Badge tone="brand">{progressLabel[f.progress]}</Badge>
                <span className="text-xs text-muted">{fmtDate(f.createdAt)}</span>
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                {f.liked && <div><dt className="font-medium">좋았던 점</dt><dd className="whitespace-pre-line text-muted">{f.liked}</dd></div>}
                {f.disliked && <div><dt className="font-medium">불편했던 점</dt><dd className="whitespace-pre-line text-muted">{f.disliked}</dd></div>}
                {f.suggestion && <div><dt className="font-medium">개선 의견</dt><dd className="whitespace-pre-line text-muted">{f.suggestion}</dd></div>}
              </dl>
              {responses.length === 0 ? (
                <p className="mt-4 text-sm text-muted">아직 기업의 답변이 없습니다.</p>
              ) : (
                <div className="mt-4 space-y-2 border-l-2 border-brand pl-4">
                  {responses.map((r) => (
                    <div key={r.id} className="text-sm">
                      <p className="whitespace-pre-line">{r.body}</p>
                      <p className="mt-1 text-xs text-muted">기업 답변 · {fmtDate(r.createdAt)} · {progressLabel[r.progress]}</p>
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
