import Link from "next/link";
import { notFound } from "next/navigation";
import { getCtx } from "@/lib/auth";
import { features } from "@/lib/config";
import { effectiveStatus } from "@/lib/services/benefits";
import { serviceDetail } from "@/lib/services/discovery";
import { Badge, Notice, btn, claimLabel, fmtDate, reviewLabel } from "@/components/ui";
import { ClaimForm, ReportForm } from "@/components/benefit-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCtx();
  const d = await serviceDetail(ctx, id);
  return { title: d?.service.name ?? "서비스" };
}

export default async function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getCtx();
  const d = await serviceDetail(ctx, id);
  if (!d) notFound();
  const { service: s, benefits, myClaims } = d;
  const user = ctx.user;
  const now = new Date();
  const categories = await ctx.store.listCategories();
  const cat = categories.find((c) => c.slug === s.categorySlug)?.name;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <article>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {cat && <Badge>{cat}</Badge>}
          {s.sponsored && <Badge tone="warn">광고</Badge>}
          {s.isDemo && <Badge>데모 예시 · 실제 서비스 아님</Badge>}
          {s.status !== "approved" && <Badge tone="warn">{reviewLabel[s.status]}</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{s.name}</h1>
        <p className="mt-2 text-lg text-muted">{s.tagline}</p>
        <p className="mt-1 text-sm text-muted">제공: {d.companyName} · 사용자 직접 등록 정보이며 UseLoop 의 공식 제휴나 보증을 의미하지 않습니다.</p>
        <div className="mt-6 whitespace-pre-line leading-relaxed">{s.description || "소개가 아직 등록되지 않았습니다."}</div>
        <p className="mt-4 text-sm text-muted">{s.tags.map((t) => <Link key={t} href={`/discover?tag=${encodeURIComponent(t)}`} className="mr-2 hover:underline">#{t}</Link>)}</p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {s.status === "approved" && <a href={`/go/${s.id}`} rel="noopener" className={btn.secondary}>서비스 사이트로 이동 ↗</a>}
          {s.status === "approved" && user?.role === "customer" && <Link href={`/services/${s.id}/feedback`} className={btn.primary}>이 서비스에 피드백 남기기</Link>}
          {s.status === "approved" && !user && <Link href={`/login?next=/services/${s.id}/feedback`} className={btn.primary}>로그인하고 피드백 남기기</Link>}
        </div>
        <p className="mt-3 text-xs text-muted">서비스 이동·이용은 선택 사항이며, 피드백 작성이나 다른 서비스 이용 의무로 이어지지 않습니다. 이동 시 방문 수만 집계되고 개인정보는 전달되지 않습니다.</p>
        {user && <div className="mt-8"><ReportForm targetType="service" targetId={s.id} /></div>}
      </article>

      <aside aria-labelledby="benefits" className="space-y-4">
        <h2 id="benefits" className="text-lg font-bold">체험 혜택</h2>
        {benefits.length === 0 && <p className="rounded-xl border border-dashed border-line bg-white p-5 text-sm text-muted">현재 등록된 혜택이 없습니다.</p>}
        {benefits.map((b) => {
          const claim = myClaims.find((c) => c.benefitId === b.id && c.status !== "cancelled");
          const left = Math.max(0, b.totalQuantity - b.claimedCount);
          const expired = now > new Date(b.validUntil);
          return (
            <div key={b.id} className="rounded-xl border border-line bg-white p-5">
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone="brand">{b.type === "coupon" ? "쿠폰" : "무료 체험"}</Badge>
                {b.status !== "approved" && <Badge tone="warn">{reviewLabel[b.status]}</Badge>}
                {b.isDemo && <Badge>데모 · 사용 불가</Badge>}
              </div>
              <h3 className="font-semibold">{b.title}</h3>
              {b.description && <p className="mt-1 text-sm text-muted">{b.description}</p>}
              <dl className="mt-3 space-y-1 text-sm">
                <div className="flex gap-2"><dt className="w-16 shrink-0 text-muted">기간</dt><dd>{fmtDate(b.validFrom)} ~ {fmtDate(b.validUntil)}</dd></div>
                <div className="flex gap-2"><dt className="w-16 shrink-0 text-muted">남은 수량</dt><dd>{left} / {b.totalQuantity}</dd></div>
                <div className="flex gap-2"><dt className="w-16 shrink-0 text-muted">조건</dt><dd className="whitespace-pre-line">{b.terms}</dd></div>
                <div className="flex gap-2"><dt className="w-16 shrink-0 text-muted">사용 방법</dt><dd className="whitespace-pre-line">{b.howToUse}</dd></div>
              </dl>
              {b.kind === "thanks" && features.feedbackThanks() && (
                <div className="mt-3"><Notice tone="warn">이 혜택은 비공개 피드백에 대한 감사 표시로, 평가 내용(긍정·부정)이나 평점과 무관하게 동일하게 제공됩니다. 공개 리뷰·앱스토어 평점과 연결되지 않습니다.</Notice></div>
              )}
              <div className="mt-4">
                {claim ? (
                  <p className="text-sm font-medium text-good">받은 혜택 · {claimLabel[effectiveStatus(claim, b, now)]} — <Link href="/my/benefits" className="underline">내 혜택 보기</Link></p>
                ) : b.status !== "approved" ? null : expired ? (
                  <p className="text-sm text-muted">기간이 종료되었습니다.</p>
                ) : left === 0 ? (
                  <p className="text-sm text-muted">수량이 모두 소진되었습니다.</p>
                ) : user?.role === "customer" ? (
                  <ClaimForm benefitId={b.id} serviceId={s.id} label="혜택 받기" />
                ) : !user ? (
                  <Link href={`/login?next=/services/${s.id}`} className={btn.secondary}>로그인하고 받기</Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </aside>
    </div>
  );
}
