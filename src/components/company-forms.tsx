"use client";

import { createBenefitAction, quantityAction, redeemAction, respondAction, saveServiceAction } from "@/app/actions";
import type { Category, Service } from "@/lib/domain/types";
import { ActionForm, Field, Submit, TextArea, TextInput } from "./forms";
import { inputCls } from "./ui";

const PROGRESS = [["received", "접수됨"], ["reviewing", "검토 중"], ["planned", "개선 예정"], ["done", "개선 완료"], ["wont_do", "반영 어려움"]] as const;

export function RespondForm({ feedbackId, current }: { feedbackId: string; current: string }) {
  return (
    <ActionForm action={respondAction} className="mt-4 space-y-3">
      <input type="hidden" name="feedbackId" value={feedbackId} />
      <TextArea name="body" label="답변" rows={3} hint="고객이 '내 피드백'에서 확인합니다. 평가 변경·삭제를 요청하거나 보상을 조건으로 제시하지 마세요." />
      <Field name="progress" label="진행 상태">
        {(p) => (
          <select {...p} name="progress" defaultValue={current === "received" ? "reviewing" : current} className={inputCls}>
            {PROGRESS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        )}
      </Field>
      <Submit>답변 등록</Submit>
    </ActionForm>
  );
}

export function ServiceForm({ service, categories }: { service?: Service; categories: Category[] }) {
  return (
    <ActionForm action={saveServiceAction} className="space-y-5">
      {service && <input type="hidden" name="id" value={service.id} />}
      <TextInput name="name" label="서비스 이름" defaultValue={service?.name} required />
      <TextInput name="tagline" label="한 줄 소개" defaultValue={service?.tagline} required />
      <TextArea name="description" label="상세 소개" rows={6} defaultValue={service?.description} />
      <TextInput name="url" label="서비스 URL" type="url" defaultValue={service?.url} placeholder="https://" required />
      <Field name="categorySlug" label="카테고리" required>
        {(p) => (
          <select {...p} name="categorySlug" defaultValue={service?.categorySlug ?? ""} className={inputCls}>
            <option value="" disabled>선택하세요</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
        )}
      </Field>
      <TextInput name="tags" label="태그" defaultValue={service?.tags.join(", ")} hint="쉼표로 구분 (최대 8개). 추천 규칙에 사용됩니다." />
      <Submit>{service ? "수정 후 재검토 요청" : "등록하고 승인 요청"}</Submit>
    </ActionForm>
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

export function BenefitForm({ services }: { services: Service[] }) {
  return (
    <ActionForm action={createBenefitAction} className="space-y-4">
      <Field name="serviceId" label="서비스" required>
        {(p) => (
          <select {...p} name="serviceId" defaultValue="" className={inputCls}>
            <option value="" disabled>선택하세요</option>
            {services.filter((s) => s.status === "approved").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
      </Field>
      <Field name="type" label="유형" required>
        {(p) => (
          <select {...p} name="type" defaultValue="free_trial" className={inputCls}>
            <option value="free_trial">무료 체험권</option>
            <option value="coupon">쿠폰</option>
          </select>
        )}
      </Field>
      <TextInput name="title" label="제목" required placeholder="예: 프로 플랜 30일 무료 체험" />
      <TextArea name="description" label="설명" rows={2} />
      <TextArea name="terms" label="이용 조건" rows={2} hint="고객이 받기 전에 그대로 공개됩니다. 평가·리뷰와 관련된 조건은 넣을 수 없습니다." required />
      <TextArea name="howToUse" label="사용 방법" rows={2} required />
      <div className="grid gap-4 sm:grid-cols-3">
        <TextInput name="validFrom" label="시작일" type="date" defaultValue={today()} required />
        <TextInput name="validUntil" label="종료일" type="date" defaultValue={inDays(60)} required />
        <TextInput name="totalQuantity" label="수량" type="number" defaultValue="50" required />
      </div>
      <Field name="issuerAuthorityConfirmed" label="">
        {() => (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="issuerAuthorityConfirmed" className="mt-1 size-4" />
            <span>이 혜택을 우리 회사가 직접 발급할 권한이 있으며, 긍정적 평가·평점·공개 리뷰·앱스토어 평점과 연결하지 않음을 확인합니다.</span>
          </label>
        )}
      </Field>
      <Submit>등록하고 승인 요청</Submit>
    </ActionForm>
  );
}

export function QuantityForm({ benefitId, quantity }: { benefitId: string; quantity: number }) {
  return (
    <ActionForm action={quantityAction} className="flex items-start gap-2">
      <input type="hidden" name="benefitId" value={benefitId} />
      <label className="sr-only" htmlFor={`q-${benefitId}`}>총 수량</label>
      <input id={`q-${benefitId}`} name="quantity" type="number" min={1} defaultValue={quantity} className={`${inputCls} w-28`} />
      <Submit variant="secondary">수량 변경</Submit>
    </ActionForm>
  );
}

export function RedeemForm() {
  return (
    <ActionForm action={redeemAction} className="flex flex-wrap items-start gap-2">
      <label className="sr-only" htmlFor="code">고객 코드</label>
      <input id="code" name="code" placeholder="UL-XXXX-XXXX" className={`${inputCls} w-56 font-mono uppercase`} autoComplete="off" />
      <Submit>사용 처리</Submit>
    </ActionForm>
  );
}
