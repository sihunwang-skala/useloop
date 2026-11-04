import Link from "next/link";
import type { ReactNode } from "react";

export const btn = {
  primary: "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60",
  secondary: "inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-neutral-50 disabled:opacity-60",
  danger: "inline-flex min-h-11 items-center justify-center rounded-lg border border-bad/30 bg-white px-4 text-sm font-semibold text-bad hover:bg-red-50 disabled:opacity-60",
  small: "inline-flex min-h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-medium hover:bg-neutral-50",
};

export const inputCls = "block w-full rounded-lg border border-line bg-white px-3 py-2.5 text-base text-ink placeholder:text-neutral-400 aria-[invalid=true]:border-bad";

const tones = {
  neutral: "bg-neutral-100 text-neutral-700",
  brand: "bg-brand-soft text-brand-dark",
  good: "bg-green-50 text-good",
  warn: "bg-amber-50 text-warn",
  bad: "bg-red-50 text-bad",
} as const;

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {desc && <p className="mt-2 max-w-2xl text-muted">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Empty({ title, desc, href, cta }: { title: string; desc?: string; href?: string; cta?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <p className="font-semibold">{title}</p>
      {desc && <p className="mx-auto mt-1 max-w-md text-sm text-muted">{desc}</p>}
      {href && cta && (
        <Link href={href} className={`${btn.primary} mt-5`}>
          {cta}
        </Link>
      )}
    </div>
  );
}

export function Notice({ tone = "brand", children }: { tone?: "brand" | "warn" | "bad" | "good"; children: ReactNode }) {
  return (
    <div role={tone === "bad" ? "alert" : "note"} className={`rounded-lg px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export const sentimentLabel = { positive: "긍정적", neutral: "보통", negative: "부정적" } as const;
export const sentimentTone = { positive: "good", neutral: "neutral", negative: "bad" } as const;
export const progressLabel = { received: "접수됨", reviewing: "검토 중", planned: "개선 예정", done: "개선 완료", wont_do: "반영 어려움" } as const;
export const reviewLabel = { pending: "승인 대기", approved: "승인됨", rejected: "반려됨", paused: "일시중지" } as const;
export const reviewTone = { pending: "warn", approved: "good", rejected: "bad", paused: "neutral" } as const;
export const claimLabel = { issued: "사용 가능", used: "사용 완료", expired: "만료", cancelled: "취소" } as const;
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
