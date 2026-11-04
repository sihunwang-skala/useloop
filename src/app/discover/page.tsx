import Link from "next/link";
import { getCtx } from "@/lib/auth";
import { discover, listCategories } from "@/lib/services/discovery";
import { Empty, PageHeader } from "@/components/ui";
import { ServiceCard } from "@/components/service-card";
import { inputCls, btn } from "@/components/ui";

export const metadata = { title: "서비스 탐색" };

export default async function Discover({ searchParams }: { searchParams: Promise<{ category?: string; q?: string; tag?: string }> }) {
  const sp = await searchParams;
  const ctx = await getCtx();
  const [cats, res] = await Promise.all([listCategories(ctx), discover(ctx, sp)]);
  const chip = (active: boolean) =>
    `inline-flex min-h-9 items-center rounded-full border px-3 text-sm ${active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-neutral-50"}`;
  return (
    <>
      <PageHeader title="서비스 탐색" desc="리뷰를 쓰지 않아도, 로그인하지 않아도 둘러볼 수 있습니다. 서비스 이용 여부는 직접 결정하세요." />
      <form className="mb-5 flex gap-2" role="search">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <label htmlFor="q" className="sr-only">검색어</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="서비스, 태그 검색" className={inputCls} />
        <button className={btn.primary}>검색</button>
      </form>
      <nav aria-label="카테고리" className="mb-8 flex flex-wrap gap-2">
        <Link href="/discover" className={chip(!sp.category)}>전체</Link>
        {cats.map((c) => (
          <Link key={c.slug} href={`/discover?category=${c.slug}`} className={chip(sp.category === c.slug)}>{c.name}</Link>
        ))}
      </nav>
      {sp.tag && <p className="mb-4 text-sm text-muted">태그 #{sp.tag} <Link href="/discover" className="ml-2 underline">해제</Link></p>}

      {res.sponsored.length > 0 && (
        <section aria-labelledby="ad" className="mb-10">
          <h2 id="ad" className="mb-1 text-sm font-semibold text-warn">광고 · 스폰서 서비스</h2>
          <p className="mb-3 text-xs text-muted">아래 서비스는 광고로 노출됩니다. 일반 추천 결과와 구분되며, 순위에는 영향을 주지 않습니다.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {res.sponsored.map((i) => <ServiceCard key={i.service.id} service={i.service} hasBenefit={i.hasBenefit} />)}
          </div>
        </section>
      )}

      {res.organic.length === 0 ? (
        <Empty title="조건에 맞는 서비스가 없습니다" desc="검색어나 카테고리를 바꿔 보세요." href="/discover" cta="전체 보기" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {res.organic.map((i) => <ServiceCard key={i.service.id} service={i.service} hasBenefit={i.hasBenefit} />)}
        </div>
      )}
    </>
  );
}
