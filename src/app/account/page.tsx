import { pageCtx } from "@/lib/auth/guards";
import { ProfileForm, DeletionForm } from "@/components/account-forms";
import { Notice, PageHeader, fmtDate } from "@/components/ui";

export const metadata = { title: "계정 설정" };

export default async function Account() {
  const { user, store } = await pageCtx("/account");
  const u = user!;
  const cats = await store.listCategories();
  return (
    <div className="mx-auto max-w-xl space-y-10">
      <PageHeader title="계정 설정" />
      <section aria-labelledby="p" className="space-y-4">
        <h2 id="p" className="text-lg font-bold">프로필</h2>
        <p className="text-sm text-muted">이메일: {u.email} · 가입일 {fmtDate(u.createdAt)} · 유형: {u.role === "customer" ? "고객" : u.role === "company" ? "기업" : "관리자"}</p>
        <ProfileForm displayName={u.displayName} interests={u.interests} categories={cats} isCustomer={u.role === "customer"} />
      </section>
      <section aria-labelledby="d" className="space-y-3 border-t border-line pt-8">
        <h2 id="d" className="text-lg font-bold">데이터 삭제 요청</h2>
        <p className="text-sm text-muted">요청하면 운영자가 확인 후 계정과 관련 데이터를 삭제합니다. 접수 후에는 서비스 이용이 제한됩니다. (샘플 절차 · 보관 의무 검토 필요)</p>
        {u.deletionRequestedAt ? <Notice tone="warn">{fmtDate(u.deletionRequestedAt)}에 삭제 요청이 접수되었습니다.</Notice> : <DeletionForm />}
      </section>
    </div>
  );
}
