import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { getCtx } from "@/lib/auth";
import { isDemoMode } from "@/lib/config";

const link = "rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-ink";

export async function Header() {
  const { user } = await getCtx();
  return (
    <>
      {isDemoMode() && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs text-warn">
          데모 모드 — 표시되는 기업·서비스·쿠폰은 모두 가상의 예시이며 실제가 아닙니다. 서버를 재시작하면 데이터가 초기화됩니다.
        </div>
      )}
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight">
            Use<span className="text-brand">Loop</span>
          </Link>
          <nav aria-label="주 메뉴" className="flex flex-wrap items-center">
            <Link href="/discover" className={link}>서비스 탐색</Link>
            {user?.role === "customer" && (
              <>
                <Link href="/my/feedback" className={link}>내 피드백</Link>
                <Link href="/my/benefits" className={link}>내 혜택</Link>
              </>
            )}
            {user?.role === "company" && (
              <>
                <Link href="/company" className={link}>대시보드</Link>
                <Link href="/company/feedback" className={link}>피드백</Link>
                <Link href="/company/services" className={link}>서비스</Link>
                <Link href="/company/benefits" className={link}>혜택</Link>
              </>
            )}
            {user?.role === "admin" && <Link href="/admin" className={link}>관리자</Link>}
            {user ? (
              <>
                <Link href="/account" className={link}>{user.displayName}</Link>
                <form action={logoutAction}>
                  <button className={link}>로그아웃</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className={link}>로그인</Link>
                <Link href="/signup" className="ml-1 inline-flex min-h-9 items-center rounded-lg bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark">시작하기</Link>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-4 py-8 text-sm text-muted sm:px-6">
        <p>© UseLoop MVP. 오픈소스 테스트 버전입니다.</p>
        <nav aria-label="정책" className="flex gap-4">
          <Link href="/legal/privacy" className="hover:text-ink">개인정보처리방침(샘플)</Link>
          <Link href="/legal/terms" className="hover:text-ink">이용약관(샘플)</Link>
          <Link href="/legal/policy" className="hover:text-ink">피드백·혜택 운영 원칙</Link>
        </nav>
      </div>
    </footer>
  );
}
