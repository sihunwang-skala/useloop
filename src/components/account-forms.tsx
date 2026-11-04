"use client";

import { deletionAction, profileAction } from "@/app/actions";
import type { Category } from "@/lib/domain/types";
import { ActionForm, Submit, TextInput } from "./forms";

export function ProfileForm({ displayName, interests, categories, isCustomer }: { displayName: string; interests: string[]; categories: Category[]; isCustomer: boolean }) {
  return (
    <ActionForm action={profileAction} className="space-y-4">
      <TextInput name="displayName" label="표시 이름" defaultValue={displayName} required />
      {isCustomer && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">관심 카테고리</legend>
          <p className="mb-2 text-sm text-muted">서비스 추천에만 사용되며 다른 기업에 제공되지 않습니다.</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.slug} className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line bg-white px-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="checkbox" name="interests" value={c.slug} defaultChecked={interests.includes(c.slug)} className="sr-only" />{c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <Submit>저장</Submit>
    </ActionForm>
  );
}

export function DeletionForm() {
  return (
    <ActionForm action={deletionAction}>
      <Submit variant="danger">계정·데이터 삭제 요청</Submit>
    </ActionForm>
  );
}
