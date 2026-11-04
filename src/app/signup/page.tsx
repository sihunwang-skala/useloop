import Link from "next/link";
import { signupAction } from "@/app/actions";
import { ActionForm, Submit, TextInput } from "@/components/forms";
import { Field } from "@/components/forms";

export const metadata = { title: "회원가입" };

export default function Signup() {
  const radio = "flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border border-line bg-white px-3 text-sm has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-2 text-2xl font-bold">회원가입</h1>
      <p className="mb-6 text-sm text-muted">고객과 기업 모두 무료입니다. 이메일과 표시 이름만 수집합니다.</p>
      <ActionForm action={signupAction} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">가입 유형</legend>
          <div className="flex gap-2">
            <label className={radio}><input type="radio" name="role" value="customer" defaultChecked className="sr-only" />고객</label>
            <label className={radio}><input type="radio" name="role" value="company" className="sr-only" />서비스 제공 기업</label>
          </div>
        </fieldset>
        <TextInput name="displayName" label="표시 이름" required />
        <TextInput name="companyName" label="기업명 (기업 가입 시)" hint="고객으로 가입하면 비워 두세요." />
        <TextInput name="email" label="이메일" type="email" autoComplete="email" required />
        <TextInput name="password" label="비밀번호" type="password" autoComplete="new-password" hint="10자 이상" required />
        <Field name="consent" label="">
          {() => (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="consent" className="mt-1 size-4" />
              <span>
                <Link href="/legal/terms" className="underline">이용약관</Link> 및 <Link href="/legal/privacy" className="underline">개인정보 수집·이용</Link>(이메일, 표시 이름)에 동의합니다. <span className="text-muted">(필수 · 샘플 문구)</span>
              </span>
            </label>
          )}
        </Field>
        <Submit>가입하기</Submit>
      </ActionForm>
      <p className="mt-6 text-sm text-muted">이미 계정이 있나요? <Link href="/login" className="font-medium text-brand underline">로그인</Link></p>
    </div>
  );
}
