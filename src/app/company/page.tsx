import Link from "next/link";
import { pageCtx } from "@/lib/auth/guards";
import { companyStats } from "@/lib/services/feedback";
import { myServices } from "@/lib/services/company";
import { Badge, Empty, Notice, PageHeader, btn, fmtDate, progressLabel, reviewLabel, reviewTone, sentimentLabel, sentimentTone } from "@/components/ui";

export const metadata = { title: "기업 대시보드" };

export default async function CompanyDashboard() {
  const ctx = await pageCtx("/company", "company");
  const [stats, services] = await Promise.all([companyStats(ctx), myServices(ctx)]);
  const total = stats.total || 1;
  const bar = (n: number, cls: string) => <div className={`h-2 rounded-full ${cls}`} style={{ width: `${(n / total) * 100}%` }} />;
  if (services.length === 0) {
    return (
      <>
        <PageHeader title="대시보드" />
        <Empty title="먼저 서비스를 등록하세요" desc="등록한 서비스는 관리자 승인 후 탐색 화면에 노출됩니다." href="/company/services/new" cta="서비스 등록" />
      </>
    );
  }
  const pending = services.filter((s) => s.status !== "approved");
  return (
    <>
      <PageHeader title="대시보드" desc="등록한 서비스에 들어온 비공개 피드백 요약입니다." action={<Link href="/company/feedback" className={btn.primary}>피드백 확인</Link>} />
      {pending.length > 0 && <div className="mb-6"><Notice tone="warn">{pending.map((s) => `${s.name}(${reviewLabel[s.status]})`).join(", ")} — 승인된 서비스만 고객에게 노출됩니다.</Notice></div>}
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="총 피드백" value={stats.total} />
        <Stat label="답변 완료" value={stats.replied} />
        <Stat label="답변 대기" value={stats.unreplied} warn={stats.unreplied > 0} />
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="dist" className="rounded-xl border border-line bg-white p-5">
          <h2 id="dist" className="font-semibold">전반적인 느낌 분포</h2>
          <p className="text-xs text-muted">고객이 직접 고른 느낌이며 평점이 아닙니다.</p>
          <div className="mt-4 space-y-3 text-sm">
            {(["positive", "neutral", "negative"] as const).map((k) => (
              <div key={k}>
                <div className="mb-1 flex justify-between"><span>{sentimentLabel[k]}</span><span>{stats.sentiment[k]}건</span></div>
                {bar(stats.sentiment[k], k === "positive" ? "bg-good" : k === "negative" ? "bg-bad" : "bg-neutral-400")}
              </div>
            ))}
          </div>
        </section>
        <section aria-labelledby="top" className="rounded-xl border border-line bg-white p-5">
          <h2 id="top" className="font-semibold">자주 나온 개선 요청 주제</h2>
          {stats.topTopics.length === 0 ? <p className="mt-3 text-sm text-muted">아직 집계할 데이터가 없습니다.</p> : (
            <ol className="mt-3 space-y-2 text-sm">
              {stats.topTopics.map((t) => <li key={t.topic} className="flex justify-between"><span>{t.topic}</span><span className="text-muted">{t.count}건</span></li>)}
            </ol>
          )}
        </section>
      </div>
      <section aria-labelledby="recent" className="mt-8">
        <h2 id="recent" className="mb-3 font-semibold">최근 피드백</h2>
        {stats.recent.length === 0 ? <Empty title="아직 받은 피드백이 없어요" desc="서비스가 승인되어 노출되면 고객이 피드백을 남길 수 있습니다." /> : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {stats.recent.map((r) => (
              <li key={r.feedback.id} className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
                <span className="font-medium">{r.serviceName}</span>
                <Badge tone={sentimentTone[r.feedback.sentiment]}>{sentimentLabel[r.feedback.sentiment]}</Badge>
                <Badge tone="brand">{progressLabel[r.feedback.progress]}</Badge>
                <span className="text-muted">{r.anonymousId} · {fmtDate(r.feedback.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-6 text-xs text-muted">등록 서비스 상태: {services.map((s) => <Badge key={s.id} tone={reviewTone[s.status]}>{s.name} · {reviewLabel[s.status]}</Badge>)}</p>
    </>
  );
}

function Stat({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${warn ? "text-warn" : ""}`}>{value}</p>
    </div>
  );
}
