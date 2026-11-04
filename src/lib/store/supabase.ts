import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppError, type ErrorCode } from "@/lib/domain/errors";
import type { Claim, Profile, SessionUser } from "@/lib/domain/types";
import type { Store } from "./types";

type Row = Record<string, any>;

const toCamel = (k: string) => k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const fromRow = <T,>(r: Row | null): T => (r ? Object.fromEntries(Object.entries(r).map(([k, v]) => [toCamel(k), v])) : r) as T;
const toRow = (o: Row) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [toSnake(k), v]));

const CODES: ErrorCode[] = ["UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "CONFLICT", "SOLD_OUT", "EXPIRED", "FEATURE_DISABLED"];
const MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: "로그인이 필요합니다.", FORBIDDEN: "이 작업을 수행할 권한이 없습니다.", NOT_FOUND: "찾을 수 없습니다.",
  CONFLICT: "이미 처리된 요청입니다.", SOLD_OUT: "준비된 수량이 모두 소진되었습니다.", EXPIRED: "사용 기간이 아닙니다.",
  FEATURE_DISABLED: "현재 비활성화된 기능입니다.",
};

/** DB 오류는 내부 정보를 숨기고, RPC 가 던진 도메인 코드만 사용자 메시지로 변환 */
function fail(error: { message?: string } | null): never {
  const code = CODES.find((c) => error?.message?.includes(c));
  if (code) throw new AppError(code, MESSAGES[code]);
  console.error("[db-error]", error?.message?.slice(0, 120));
  throw new AppError("VALIDATION", "요청을 처리하지 못했습니다. 입력값과 권한을 확인해 주세요.");
}
function ok<T>(res: { data: T; error: any }): T {
  if (res.error) fail(res.error);
  return res.data;
}

export async function createSupabaseStore(): Promise<Store> {
  const db: SupabaseClient = await createSupabaseServerClient();
  const list = async <T,>(q: PromiseLike<{ data: any; error: any }>) => (ok(await q) as Row[]).map((r) => fromRow<T>(r));
  const one = async <T,>(q: PromiseLike<{ data: any; error: any }>) => {
    const r = ok(await q) as Row | null;
    return r ? fromRow<T>(r) : null;
  };

  return {
    async getSessionUser(id) {
      const p = await one<Profile>(db.from("profiles").select("*").eq("id", id).maybeSingle());
      if (!p) return null;
      const m = ok(await db.from("company_members").select("company_id").eq("user_id", id).limit(1)) as Row[];
      return { ...p, companyId: m[0]?.company_id ?? null } as SessionUser;
    },
    async updateProfile(id, patch) {
      ok(await db.from("profiles").update(toRow(patch)).eq("id", id));
    },
    async requestDeletion(id) {
      ok(await db.from("profiles").update({ deletion_requested_at: new Date().toISOString() }).eq("id", id));
    },
    listDeletionRequests: () => list(db.from("profiles").select("*").not("deletion_requested_at", "is", null)),
    getCompany: (id) => one(db.from("companies").select("*").eq("id", id).maybeSingle()),

    listCategories: () => list(db.from("service_categories").select("*").order("name")),
    listServices(f = {}) {
      let q = db.from("services").select("*").order("created_at", { ascending: false });
      if (f.status) q = q.eq("status", f.status);
      if (f.companyId) q = q.eq("company_id", f.companyId);
      if (f.ids) q = q.in("id", f.ids);
      return list(q);
    },
    getService: (id) => one(db.from("services").select("*").eq("id", id).maybeSingle()),
    async createService(s) {
      return (await one<any>(db.from("services").insert(toRow(s)).select().single()))!;
    },
    async updateService(id, patch) {
      const { id: _id, createdAt: _c, ...rest } = patch as Row;
      void _id; void _c;
      const r = await one<any>(db.from("services").update(toRow(rest)).eq("id", id).select().maybeSingle());
      if (!r) throw new AppError("NOT_FOUND", MESSAGES.NOT_FOUND);
      return r;
    },

    listFeedback(f) {
      let q = db.from("feedback").select("*").order("created_at", { ascending: false });
      if (f.serviceIds) q = q.in("service_id", f.serviceIds);
      if (f.authorId) q = q.eq("author_id", f.authorId);
      return list(q);
    },
    getFeedback: (id) => one(db.from("feedback").select("*").eq("id", id).maybeSingle()),
    async createFeedback(fb) {
      return (await one<any>(db.from("feedback").insert(toRow(fb)).select().single()))!;
    },
    async setFeedbackProgress(id, progress) {
      ok(await db.from("feedback").update({ progress }).eq("id", id));
    },
    listResponses: (ids) => (ids.length ? list(db.from("feedback_responses").select("*").in("feedback_id", ids).order("created_at")) : Promise.resolve([])),
    async createResponse(r) {
      return (await one<any>(db.from("feedback_responses").insert(toRow(r)).select().single()))!;
    },

    listBenefits(f = {}) {
      let q = db.from("benefits").select("*").order("created_at", { ascending: false });
      if (f.serviceIds) q = q.in("service_id", f.serviceIds);
      if (f.status) q = q.eq("status", f.status);
      return list(q);
    },
    getBenefit: (id) => one(db.from("benefits").select("*").eq("id", id).maybeSingle()),
    async createBenefit(b) {
      return (await one<any>(db.from("benefits").insert(toRow(b)).select().single()))!;
    },
    async updateBenefit(id, patch) {
      const { id: _i, createdAt: _c, claimedCount: _n, ...rest } = patch as Row;
      void _i; void _c; void _n;
      const r = await one<any>(db.from("benefits").update(toRow(rest)).eq("id", id).select().maybeSingle());
      if (!r) throw new AppError("NOT_FOUND", MESSAGES.NOT_FOUND);
      return r;
    },
    async claimBenefit(benefitId) {
      // 수량 차감·중복 방지·코드 발급은 DB 함수 안에서 한 트랜잭션으로 처리 (행 잠금)
      const res = await db.rpc("claim_benefit", { p_benefit_id: benefitId });
      return fromRow<Claim>(ok(res) as Row);
    },
    listClaims(f) {
      let q = db.from("benefit_claims").select("*").order("claimed_at", { ascending: false });
      if (f.userId) q = q.eq("user_id", f.userId);
      if (f.benefitIds) q = q.in("benefit_id", f.benefitIds);
      return list(q);
    },
    getClaimByCode: (code) => one(db.from("benefit_claims").select("*").eq("code", code).maybeSingle()),
    async setClaimStatus(id, status) {
      if (status !== "used") throw new AppError("FORBIDDEN", MESSAGES.FORBIDDEN);
      const claim = await one<Claim>(db.from("benefit_claims").select("*").eq("id", id).maybeSingle());
      if (!claim) throw new AppError("NOT_FOUND", MESSAGES.NOT_FOUND);
      ok(await db.rpc("redeem_claim", { p_code: claim.code }));
    },

    async recordVisit(serviceId, userId) {
      ok(await db.from("service_visits").insert({ service_id: serviceId, user_id: userId }));
    },
    async countVisits(ids) {
      const rows = ok(await db.from("service_visits").select("service_id").in("service_id", ids)) as Row[];
      const out: Record<string, number> = {};
      for (const r of rows) out[r.service_id] = (out[r.service_id] ?? 0) + 1;
      return out;
    },
    async createReport(r) {
      return (await one<any>(db.from("reports").insert(toRow(r)).select().single()))!;
    },
    listReports(status) {
      let q = db.from("reports").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      return list(q);
    },
    async resolveReport(id, status, resolution) {
      ok(await db.from("reports").update({ status, resolution }).eq("id", id));
    },
  };
}
