import Link from "next/link";
import { pageCtx } from "@/lib/auth/guards";
import { myBenefits } from "@/lib/services/benefits";
import { Badge, Empty, PageHeader, claimLabel, fmtDate } from "@/components/ui";

export const metadata = { title: "내 혜택" };

export default async function MyBenefits() {
  const ctx = await pageCtx("/my/benefits", "customer");
  const list = await myBenefits(ctx);
  const tone = { issued: "good", used: "neutral", expired: "bad", cancelled: "neutral" } as const;
  return (
    <>
      <PageHeader title="내 혜택" desc="받은 쿠폰과 무료 체험권, 사용 이력입니다. 코드는 본인만 볼 수 있으니 타인에게 공유하지 마세요." />
      {list.length === 0 ? (
        <Empty title="받은 혜택이 없어요" desc="서비스 상세 화면에서 마음에 드는 혜택을 받을 수 있습니다." href="/discover" cta="서비스 둘러보기" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map(({ claim, benefit, service, status }) => (
            <li key={claim.id} className="rounded-xl border border-line bg-white p-5">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone={tone[status]}>{claimLabel[status]}</Badge>
                {benefit.isDemo && <Badge>데모 · 사용 불가</Badge>}
              </div>
              <h2 className="font-semibold">{benefit.title}</h2>
              {service && <Link href={`/services/${service.id}`} className="text-sm text-muted hover:underline">{service.name}</Link>}
              <p className="mt-3 rounded-md bg-neutral-100 px-3 py-2 font-mono text-lg tracking-wider">{claim.code}</p>
              <dl className="mt-3 space-y-1 text-sm text-muted">
                <div>유효기간: ~ {fmtDate(benefit.validUntil)}</div>
                <div>사용 방법: {benefit.howToUse}</div>
                <div>조건: {benefit.terms}</div>
                {claim.usedAt && <div>사용일: {fmtDate(claim.usedAt)}</div>}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
