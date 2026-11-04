import Link from "next/link";
import { loginAction } from "@/app/actions";
import { isDemoMode } from "@/lib/config";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/store/seed";
import { ActionForm, Submit, TextInput } from "@/components/forms";
import { Notice } from "@/components/ui";

export const metadata = { title: "로그인" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-bold">로그인</h1>
      {isDemoMode() && (
        <div className="mb-6">
          <Notice tone="warn">
            <p className="font-semibold">데모 계정 (가상 계정)</p>
            <ul className="mt-1 space-y-0.5 font-mono text-xs">
              <li>고객: {DEMO_ACCOUNTS.customer}</li>
              <li>기업: {DEMO_ACCOUNTS.company}</li>
              <li>관리자: {DEMO_ACCOUNTS.admin}</li>
              <li>비밀번호: {DEMO_PASSWORD}</li>
            </ul>
          </Notice>
        </div>
      )}
      <ActionForm action={loginAction} className="space-y-4">
        <input type="hidden" name="next" value={next ?? "/"} />
        <TextInput name="email" label="이메일" type="email" autoComplete="email" required />
        <TextInput name="password" label="비밀번호" type="password" autoComplete="current-password" required />
        <Submit>로그인</Submit>
      </ActionForm>
      <p className="mt-6 text-sm text-muted">계정이 없나요? <Link href="/signup" className="font-medium text-brand underline">회원가입</Link></p>
    </div>
  );
}
