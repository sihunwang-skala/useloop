"use client";

import { btn } from "@/components/ui";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="py-20 text-center">
      <h1 className="text-xl font-bold">문제가 발생했습니다</h1>
      <p className="mt-2 text-muted">잠시 후 다시 시도해 주세요. 문제가 계속되면 운영자에게 알려 주세요.</p>
      <button onClick={reset} className={`${btn.primary} mt-6`}>다시 시도</button>
    </div>
  );
}
