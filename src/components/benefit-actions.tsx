"use client";

import { claimAction, reportAction } from "@/app/actions";
import { ActionForm, Submit, TextArea } from "./forms";

export function ClaimForm({ benefitId, serviceId, label }: { benefitId: string; serviceId: string; label: string }) {
  return (
    <ActionForm action={claimAction}>
      <input type="hidden" name="benefitId" value={benefitId} />
      <input type="hidden" name="serviceId" value={serviceId} />
      <Submit>{label}</Submit>
    </ActionForm>
  );
}

export function ReportForm({ targetType, targetId }: { targetType: "feedback" | "service" | "benefit"; targetId: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted underline">신고하기</summary>
      <ActionForm action={reportAction} className="mt-3 max-w-md space-y-3">
        <input type="hidden" name="targetType" value={targetType} />
        <input type="hidden" name="targetId" value={targetId} />
        <TextArea name="reason" label="신고 사유" rows={3} hint="허위 정보, 무단 제휴 표시, 부적절한 보상 요구 등을 알려 주세요." />
        <Submit variant="secondary">신고 제출</Submit>
      </ActionForm>
    </details>
  );
}
