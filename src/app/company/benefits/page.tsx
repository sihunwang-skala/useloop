import { pageCtx } from "@/lib/auth/guards";
import { pauseAction } from "@/app/actions";
import { companyBenefits } from "@/lib/services/benefits";
import { BenefitForm, QuantityForm, RedeemForm } from "@/components/company-forms";
import { Badge, Empty, Notice, PageHeader, btn, fmtDate, reviewLabel, reviewTone } from "@/components/ui";

export const metadata = { title: "혜택 관리" };

export default async function CompanyBenefits({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const ctx = await pageCtx("/company/benefits", "company");
  const [{ services, benefits }, sp] = [await companyBenefits(ctx), await searchParams];
  return (
    <>
      <PageHeader title="혜택 관리" desc="쿠폰·무료 체험권을 등록하고 수량과 사용 현황을 관리합니다." />
      {sp.saved && <div className="mb-6"><Notice tone="good">등록했습니다. 관리자가 승인하면 고객에게 노출·발급됩니다.</Notice></div>}
      <section aria-labelledby="redeem" className="mb-10 rounded-xl border border-line bg-white p-5">
        <h2 id="redeem" className="mb-1 font-semibold">고객 코드 사용 처리</h2>
        <p className="mb-3 text-sm text-muted">고객이 제시한 코드를 입력하면 한 번만 사용 처리됩니다. 우리 서비스의 혜택 코드만 처리할 수 있습니다.</p>
        <RedeemForm />
      </section>

      <h2 className="mb-3 text-lg font-bold">등록한 혜택</h2>
      {benefits.length === 0 ? <Empty title="등록한 혜택이 없습니다" desc="서비스가 승인되면 혜택을 등록할 수 있습니다." /> : (
        <ul className="mb-12 space-y-4">
          {benefits.map(({ benefit: b, serviceName }) => (
            <li key={b.id} className="rounded-xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{b.title}</span>
                <Badge tone={reviewTone[b.status]}>{reviewLabel[b.status]}</Badge>
                <span className="text-sm text-muted">{serviceName} · ~{fmtDate(b.validUntil)}</span>
              </div>
              <p className="mt-1 text-sm">발급 {b.claimedCount} / {b.totalQuantity}</p>
              {b.rejectionReason && <p className="mt-1 text-sm text-bad">반려 사유: {b.rejectionReason}</p>}
              <div className="mt-3 flex flex-wrap items-start gap-4">
                <QuantityForm benefitId={b.id} quantity={b.totalQuantity} />
                {(b.status === "approved" || b.status === "paused") && (
                  <form action={pauseAction}>
                    <input type="hidden" name="benefitId" value={b.id} />
                    <input type="hidden" name="paused" value={b.status === "approved" ? "true" : "false"} />
                    <button className={btn.secondary}>{b.status === "approved" ? "일시중지" : "재개"}</button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby="new" className="max-w-2xl">
        <h2 id="new" className="mb-3 text-lg font-bold">새 혜택 등록</h2>
        <div className="mb-4"><Notice tone="warn">혜택은 긍정적 평가, 높은 평점, 공개 리뷰, 앱스토어 리뷰·설치 수와 연결할 수 없습니다. 위반 시 승인이 반려되고 계정이 제한될 수 있습니다.</Notice></div>
        {services.some((s) => s.status === "approved") ? <BenefitForm services={services} /> : <Empty title="승인된 서비스가 없습니다" desc="서비스가 승인되면 혜택을 등록할 수 있습니다." />}
      </section>
    </>
  );
}
