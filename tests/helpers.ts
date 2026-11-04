import { MemoryStore } from "@/lib/store/memory";
import type { Ctx } from "@/lib/services/ctx";
import { resetRateLimits } from "@/lib/rate-limit";

export function setup() {
  resetRateLimits();
  const store = new MemoryStore(true);
  const find = (email: string) => [...store.accounts.values()].find((a) => a.profile.email === email)!;
  const asUser = async (email: string, now?: Date): Promise<Ctx> => {
    const a = find(email);
    return { store, user: await store.getSessionUser(a.profile.id), now };
  };
  const anon: Ctx = { store, user: null };
  const svcByName = (n: string) => [...store.services.values()].find((s) => s.name.startsWith(n))!;
  const benByTitle = (t: string) => [...store.benefits.values()].find((b) => b.title.startsWith(t))!;
  const newCustomer = (n: number) => store.registerAccount({ email: `c${n}@t.test`, password: "password-12345", displayName: `c${n}`, role: "customer" });
  const ctxFor = async (id: string, now?: Date): Promise<Ctx> => ({ store, user: await store.getSessionUser(id), now });
  return { store, asUser, anon, svcByName, benByTitle, newCustomer, ctxFor };
}
export const CUSTOMER = "customer@demo.useloop.test";
export const COMPANY = "company@demo.useloop.test";
export const ADMIN = "admin@demo.useloop.test";
