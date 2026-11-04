import { notFound } from "next/navigation";
import { pageCtx } from "@/lib/auth/guards";
import { ServiceForm } from "@/components/company-forms";
import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "서비스 수정" };

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await pageCtx(`/company/services/${id}`, "company");
  const svc = await ctx.store.getService(id);
  if (!svc || svc.companyId !== ctx.user!.companyId) notFound(); // 타 기업 서비스는 존재 자체를 숨김
  const cats = await ctx.store.listCategories();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="서비스 수정" />
      <div className="mb-6"><Notice tone="warn">수정하면 관리자 재검토 전까지 탐색 화면에서 숨겨집니다.</Notice></div>
      <ServiceForm service={svc} categories={cats} />
    </div>
  );
}
