import { isDemoMode } from "@/lib/config";
import { MemoryStore } from "./memory";
import type { Store } from "./types";

const g = globalThis as unknown as { __useloopMemory?: MemoryStore };

/** 데모 모드의 인메모리 저장소(프로세스당 하나). */
export function demoStore(): MemoryStore {
  return (g.__useloopMemory ??= new MemoryStore());
}

/** 요청 단위 저장소: 데모 → 메모리, 프로덕션 → Supabase(사용자 JWT 로 RLS 적용) */
export async function getStore(): Promise<Store> {
  if (isDemoMode()) return demoStore();
  const { createSupabaseStore } = await import("./supabase");
  return createSupabaseStore();
}
