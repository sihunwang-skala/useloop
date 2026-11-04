import Link from "next/link";
import { getCtx } from "@/lib/auth";
import { recommend } from "@/lib/services/discovery";
import { btn } from "@/components/ui";
import { ServiceCard } from "@/components/service-card";

export default async function Home() {
  const ctx = await getCtx();
  const picks = await recommend(ctx);
  return (
    <div className="space-y-20">
      <section className="max-w-3xl pt-6">
        <p className="text-sm font-semibold text-brand">고객 피드백 · 서비스 발견</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">쓰던 서비스엔 솔직하게,<br />새로운 서비스는 가볍게.</h1>
        <p className="mt-5 text-lg text-muted">
          UseLoop는 고객이 사용 중인 서비스에 비공개로 피드백을 남기고, 다른 스타트업 서비스를 자유롭게 둘러볼 수 있는 곳입니다. 기업은 피드백에 답하고 개선 진행 상황을 공유합니다.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/discover" className={btn.primary}>서비스 둘러보기</Link>
          <Link href="/signup" className={btn.secondary}>무료로 시작하기</Link>
        </div>
        <p className="mt-4 text-sm text-muted">고객과 기업 모두 기본 기능은 무료입니다. 둘러보기에는 로그인이 필요 없습니다.</p>
      </section>

      <section aria-labelledby="how" className="grid gap-8 sm:grid-cols-3">
        <h2 id="how" className="sr-only">이용 방법</h2>
        {[
          ["1. 피드백", "쓰고 있는 서비스를 골라 좋았던 점과 불편한 점을 적습니다. 기업과 나에게만 보이는 비공개 피드백입니다."],
          ["2. 답변", "기업이 답변하고, '검토 중 → 개선 예정 → 개선 완료'처럼 진행 상황을 알려 줍니다."],
          ["3. 발견", "카테고리별로 새로운 서비스를 둘러보세요. 체험 혜택이 있는 서비스도 있지만, 이용은 전적으로 내 선택입니다."],
        ].map(([t, d]) => (
          <div key={t} className="border-t-2 border-ink pt-4">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-2 text-sm text-muted">{d}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="principles" className="rounded-2xl border border-line bg-white p-6 sm:p-10">
        <h2 id="principles" className="text-xl font-bold">우리가 지키는 원칙</h2>
        <ul className="mt-5 grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2">
          <li>피드백은 긍정이든 부정이든 똑같이 취급합니다.</li>
          <li>혜택은 평점이나 긍정적인 평가와 연결되지 않습니다.</li>
          <li>피드백을 쓰지 않아도 서비스를 둘러보고 혜택을 확인할 수 있습니다.</li>
          <li>고객 정보는 동의 없이 다른 기업에 제공하지 않습니다.</li>
          <li>광고는 &lsquo;광고&rsquo; 표시로 일반 추천과 구분합니다.</li>
          <li>앱스토어·외부 리뷰와 연결하지 않습니다.</li>
        </ul>
        <p className="mt-4 text-sm"><Link href="/legal/policy" className="font-medium text-brand underline">운영 원칙 전문 보기</Link></p>
      </section>

      {picks.length > 0 && (
        <section aria-labelledby="picks">
          <h2 id="picks" className="mb-1 text-xl font-bold">관심사 기반 추천</h2>
          <p className="mb-5 text-sm text-muted">프로필에 등록한 관심 카테고리·태그 기준의 단순 규칙 추천입니다. 광고가 아닙니다.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {picks.map((p) => <ServiceCard key={p.service.id} service={p.service} hasBenefit={p.hasBenefit} />)}
          </div>
        </section>
      )}
    </div>
  );
}
