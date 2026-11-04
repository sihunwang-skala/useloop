import { pageCtx } from "@/lib/auth/guards";
import { adminQueue } from "@/lib/services/admin";
import { resolveReportAction, reviewBenefitAction, reviewServiceAction, sponsoredAction } from "@/app/actions";
import { Badge, Empty, PageHeader, btn, fmtDate, inputCls } from "@/components/ui";

export const metadata = { title: "관리자 검토" };

function ReviewForm({ id, action, label }: { id: string; action: (fd: FormData) => Promise<void>; label: string }) {
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`r-${id}`}>반려 사유</label>
      <input id={`r-${id}`} name="reason" placeholder="반려 시 사유" className={`${inputCls} max-w-xs`} />
      <button name="decision" value="approved" className={btn.primary}>{label} 승인</button>
      <button name="decision" value="rejected" className={btn.danger}>반려</button>
    </form>
  );
}

export default async function Admin() {
  const ctx = await pageCtx("/admin", "admin");
  const q = await adminQueue(ctx);
  const approved = await ctx.store.listServices({ status: "approved" });
  return (
    <>
      <PageHeader title="관리자 검토" desc="승인 대기 서비스·혜택, 신고, 삭제 요청을 처리합니다." />
      <div className="space-y-12">
        <section aria-labelledby="s">
          <h2 id="s" className="mb-3 text-lg font-bold">서비스 승인 대기 ({q.services.length})</h2>
          {q.services.length === 0 ? <Empty title="대기 중인 서비스가 없습니다" /> : (
            <ul className="space-y-3">{q.services.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-white p-5">
                <p className="font-semibold">{s.name} {s.isDemo && <Badge>데모</Badge>}</p>
                <p className="text-sm text-muted">{s.tagline}</p>
                <p className="mt-1 text-sm">URL: <span className="break-all font-mono text-xs">{s.url}</span></p>
                <p className="mt-1 text-xs text-muted">확인: 본인 소유 서비스인지, 제휴 사칭이나 허위 소개가 없는지 확인하세요.</p>
                <ReviewForm id={s.id} action={reviewServiceAction} label="서비스" />
              </li>
            ))}</ul>
          )}
        </section>

        <section aria-labelledby="b">
          <h2 id="b" className="mb-3 text-lg font-bold">혜택 승인 대기 ({q.benefits.length})</h2>
          {q.benefits.length === 0 ? <Empty title="대기 중인 혜택이 없습니다" /> : (
            <ul className="space-y-3">{q.benefits.map(({ benefit: b, serviceName }) => (
              <li key={b.id} className="rounded-xl border border-line bg-white p-5">
                <p className="font-semibold">{b.title} <span className="text-sm font-normal text-muted">· {serviceName}</span></p>
                <dl className="mt-2 space-y-1 text-sm text-muted">
                  <div>수량 {b.totalQuantity} · {fmtDate(b.validFrom)} ~ {fmtDate(b.validUntil)}</div>
                  <div>조건: {b.terms}</div>
                  <div>사용 방법: {b.howToUse}</div>
                  <div>발급 권한 확인: {b.issuerAuthorityConfirmed ? "체크됨" : "미확인"}</div>
                </dl>
                <p className="mt-1 text-xs text-muted">확인: 긍정적 평가·평점·외부 리뷰와 연결된 조건이 없는지, 실제 발급 권한이 있는지 확인하세요.</p>
                <ReviewForm id={b.id} action={reviewBenefitAction} label="혜택" />
              </li>
            ))}</ul>
          )}
        </section>

        <section aria-labelledby="r">
          <h2 id="r" className="mb-3 text-lg font-bold">열린 신고 ({q.reports.length})</h2>
          {q.reports.length === 0 ? <Empty title="처리할 신고가 없습니다" /> : (
            <ul className="space-y-3">{q.reports.map((r) => (
              <li key={r.id} className="rounded-xl border border-line bg-white p-5 text-sm">
                <p><Badge tone="warn">{r.targetType}</Badge> <span className="font-mono text-xs">{r.targetId}</span> · {fmtDate(r.createdAt)}</p>
                <p className="mt-2 whitespace-pre-line">{r.reason}</p>
                <form action={resolveReportAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <label className="sr-only" htmlFor={`rs-${r.id}`}>처리 메모</label>
                  <input id={`rs-${r.id}`} name="resolution" placeholder="처리 메모" className={`${inputCls} max-w-xs`} />
                  <button name="status" value="resolved" className={btn.primary}>조치 완료</button>
                  <button name="status" value="dismissed" className={btn.secondary}>기각</button>
                </form>
              </li>
            ))}</ul>
          )}
        </section>

        <section aria-labelledby="d">
          <h2 id="d" className="mb-3 text-lg font-bold">데이터 삭제 요청 ({q.deletions.length})</h2>
          {q.deletions.length === 0 ? <Empty title="삭제 요청이 없습니다" /> : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">{q.deletions.map((p) => (
              <li key={p.id} className="px-5 py-3">{p.email} · 요청일 {p.deletionRequestedAt && fmtDate(p.deletionRequestedAt)}</li>
            ))}</ul>
          )}
          <p className="mt-2 text-xs text-muted">MVP 에서는 요청 접수까지만 지원합니다. 실제 삭제 처리 절차는 LEGAL_REVIEW.md / FUTURE_ROADMAP.md 참고.</p>
        </section>

        <section aria-labelledby="sp">
          <h2 id="sp" className="mb-3 text-lg font-bold">광고(스폰서) 표시 관리</h2>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">{approved.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <span>{s.name} {s.sponsored && <Badge tone="warn">광고</Badge>}</span>
              <form action={sponsoredAction}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="sponsored" value={s.sponsored ? "false" : "true"} />
                <button className={btn.small}>{s.sponsored ? "광고 해제" : "광고로 표시"}</button>
              </form>
            </li>
          ))}</ul>
        </section>
      </div>
    </>
  );
}
