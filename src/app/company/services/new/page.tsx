import { pageCtx } from "@/lib/auth/guards";
import { ServiceForm } from "@/components/company-forms";
import { Notice, PageHeader } from "@/components/ui";

export const metadata = { title: "서비스 등록" };

export default async function NewService() {
  const ctx = await pageCtx("/company/services/new", "company");
  const cats = await ctx.store.listCategories();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="서비스 등록" />
      <div className="mb-6"><Notice>본인이 운영하거나 등록 권한이 있는 서비스만 등록하세요. 관리자 승인 후 노출되며, 제휴하지 않은 브랜드를 제휴사로 표기할 수 없습니다.</Notice></div>
      <ServiceForm categories={cats} />
    </div>
  );
}
