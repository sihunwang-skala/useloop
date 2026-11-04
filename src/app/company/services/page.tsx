import Link from "next/link";
import { pageCtx } from "@/lib/auth/guards";
import { myServices } from "@/lib/services/company";
import { Badge, Empty, Notice, PageHeader, btn, reviewLabel, reviewTone } from "@/components/ui";

export const metadata = { title: "내 서비스" };

export default async function CompanyServices({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const ctx = await pageCtx("/company/services", "company");
  const [list, sp] = [await myServices(ctx), await searchParams];
  return (
    <>
      <PageHeader title="내 서비스" action={<Link href="/company/services/new" className={btn.primary}>서비스 등록</Link>} />
      {sp.saved && <div className="mb-6"><Notice tone="good">저장했습니다. 관리자 검토 후 탐색 화면에 노출됩니다.</Notice></div>}
      {list.length === 0 ? <Empty title="등록한 서비스가 없습니다" href="/company/services/new" cta="서비스 등록" /> : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {list.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{s.name}</p>
                <p className="text-sm text-muted">{s.tagline}</p>
                {s.rejectionReason && <p className="mt-1 text-sm text-bad">반려 사유: {s.rejectionReason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={reviewTone[s.status]}>{reviewLabel[s.status]}</Badge>
                <Link href={`/company/services/${s.id}`} className={btn.small}>수정</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
