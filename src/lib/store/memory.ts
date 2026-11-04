import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { AppError } from "@/lib/domain/errors";
import type {
  Benefit, Category, Claim, Company, Feedback, FeedbackResponse, Profile, Report, Role, Service, SessionUser,
} from "@/lib/domain/types";
import type { Store } from "./types";
import { seed } from "./seed";

interface Account { profile: Profile; companyId: string | null; passwordHash: string }

export function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(pw, salt, 32).toString("hex")}`;
}
function verifyPassword(pw: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(pw, Buffer.from(saltHex, "hex"), 32);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const now = () => new Date().toISOString();
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function makeCode() {
  const b = randomBytes(8);
  const chars = Array.from(b, (x) => CODE_ALPHABET[x % CODE_ALPHABET.length]).join("");
  return `UL-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

/** 데모 모드용 인메모리 저장소. 프로세스를 재시작하면 초기 데모 데이터로 돌아갑니다. */
export class MemoryStore implements Store {
  accounts = new Map<string, Account>();
  companies = new Map<string, Company>();
  categories: Category[] = [];
  services = new Map<string, Service>();
  feedback = new Map<string, Feedback>();
  responses = new Map<string, FeedbackResponse>();
  benefits = new Map<string, Benefit>();
  claims = new Map<string, Claim>();
  visits: { serviceId: string; userId: string | null }[] = [];
  reports = new Map<string, Report>();

  constructor(withSeed = true) {
    if (withSeed) seed(this);
  }

  // ---- 인증 (데모 전용) ----
  registerAccount(a: { email: string; password: string; displayName: string; role: Role; companyName?: string }): SessionUser {
    const email = a.email.toLowerCase();
    if ([...this.accounts.values()].some((x) => x.profile.email === email)) {
      throw new AppError("CONFLICT", "이미 가입된 이메일입니다.", { email: "이미 가입된 이메일입니다." });
    }
    let companyId: string | null = null;
    if (a.role === "company") {
      companyId = randomUUID();
      this.companies.set(companyId, { id: companyId, name: a.companyName ?? "이름 없는 기업", createdAt: now() });
    }
    const profile: Profile = {
      id: randomUUID(), email, displayName: a.displayName, role: a.role, interests: [],
      consentAt: now(), deletionRequestedAt: null, createdAt: now(),
    };
    this.accounts.set(profile.id, { profile, companyId, passwordHash: hashPassword(a.password) });
    return { ...profile, companyId };
  }
  verifyLogin(email: string, password: string): SessionUser | null {
    const acc = [...this.accounts.values()].find((x) => x.profile.email === email.toLowerCase());
    // 계정 존재 여부와 상관없이 비슷한 시간이 걸리도록 항상 해시를 계산
    const ok = verifyPassword(password, acc?.passwordHash ?? hashPassword("dummy-password"));
    return acc && ok ? { ...acc.profile, companyId: acc.companyId } : null;
  }

  // ---- 사용자 ----
  async getSessionUser(id: string) {
    const a = this.accounts.get(id);
    return a ? { ...a.profile, companyId: a.companyId } : null;
  }
  async updateProfile(id: string, patch: Partial<Pick<Profile, "displayName" | "interests" | "consentAt">>) {
    const a = this.accounts.get(id);
    if (a) a.profile = { ...a.profile, ...patch };
  }
  async requestDeletion(id: string) {
    const a = this.accounts.get(id);
    if (a) a.profile.deletionRequestedAt = now();
  }
  async listDeletionRequests() {
    return [...this.accounts.values()].map((a) => a.profile).filter((p) => p.deletionRequestedAt);
  }
  async getCompany(id: string) {
    return this.companies.get(id) ?? null;
  }

  // ---- 서비스 ----
  async listCategories() {
    return this.categories;
  }
  async listServices(f: { status?: Service["status"]; companyId?: string; ids?: string[] } = {}) {
    return [...this.services.values()]
      .filter((s) => (!f.status || s.status === f.status) && (!f.companyId || s.companyId === f.companyId) && (!f.ids || f.ids.includes(s.id)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getService(id: string) {
    return this.services.get(id) ?? null;
  }
  async createService(s: Parameters<Store["createService"]>[0]) {
    const svc: Service = { ...s, id: randomUUID(), status: "pending", rejectionReason: null, sponsored: false, isDemo: false, createdAt: now() };
    this.services.set(svc.id, svc);
    return svc;
  }
  async updateService(id: string, patch: Partial<Service>) {
    const cur = this.services.get(id);
    if (!cur) throw new AppError("NOT_FOUND", "서비스를 찾을 수 없습니다.");
    const next = { ...cur, ...patch, id: cur.id };
    this.services.set(id, next);
    return next;
  }

  // ---- 피드백 ----
  async listFeedback(f: { serviceIds?: string[]; authorId?: string }) {
    return [...this.feedback.values()]
      .filter((x) => (!f.serviceIds || f.serviceIds.includes(x.serviceId)) && (!f.authorId || x.authorId === f.authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getFeedback(id: string) {
    return this.feedback.get(id) ?? null;
  }
  async createFeedback(fb: Parameters<Store["createFeedback"]>[0]) {
    const x: Feedback = { ...fb, id: randomUUID(), progress: "received", createdAt: now() };
    this.feedback.set(x.id, x);
    return x;
  }
  async setFeedbackProgress(id: string, progress: Feedback["progress"]) {
    const f = this.feedback.get(id);
    if (f) f.progress = progress;
  }
  async listResponses(ids: string[]) {
    return [...this.responses.values()].filter((r) => ids.includes(r.feedbackId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
  async createResponse(r: Omit<FeedbackResponse, "id" | "createdAt">) {
    const x: FeedbackResponse = { ...r, id: randomUUID(), createdAt: now() };
    this.responses.set(x.id, x);
    return x;
  }

  // ---- 혜택 ----
  async listBenefits(f: { serviceIds?: string[]; status?: Benefit["status"] } = {}) {
    return [...this.benefits.values()]
      .filter((b) => (!f.serviceIds || f.serviceIds.includes(b.serviceId)) && (!f.status || b.status === f.status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async getBenefit(id: string) {
    return this.benefits.get(id) ?? null;
  }
  async createBenefit(b: Parameters<Store["createBenefit"]>[0]) {
    const x: Benefit = { ...b, id: randomUUID(), claimedCount: 0, status: "pending", rejectionReason: null, isDemo: false, createdAt: now() };
    this.benefits.set(x.id, x);
    return x;
  }
  async updateBenefit(id: string, patch: Partial<Benefit>) {
    const cur = this.benefits.get(id);
    if (!cur) throw new AppError("NOT_FOUND", "혜택을 찾을 수 없습니다.");
    const next = { ...cur, ...patch, id: cur.id, claimedCount: cur.claimedCount };
    this.benefits.set(id, next);
    return next;
  }
  /** 동기 구간(await 없음)이라 JS 단일 스레드에서 원자적입니다. DB 구현은 claim_benefit() RPC 가 같은 역할. */
  async claimBenefit(benefitId: string, userId: string, at: Date) {
    const b = this.benefits.get(benefitId);
    if (!b || b.status !== "approved") throw new AppError("NOT_FOUND", "이용할 수 없는 혜택입니다.");
    if (at < new Date(b.validFrom) || at > new Date(b.validUntil)) throw new AppError("EXPIRED", "혜택 사용 기간이 아닙니다.");
    for (const c of this.claims.values()) {
      if (c.benefitId === benefitId && c.userId === userId && c.status !== "cancelled") {
        throw new AppError("CONFLICT", "이미 받은 혜택입니다.");
      }
    }
    if (b.claimedCount >= b.totalQuantity) throw new AppError("SOLD_OUT", "준비된 수량이 모두 소진되었습니다.");
    b.claimedCount += 1;
    let code = makeCode();
    while ([...this.claims.values()].some((c) => c.code === code)) code = makeCode();
    const claim: Claim = { id: randomUUID(), benefitId, userId, code, status: "issued", claimedAt: at.toISOString(), usedAt: null };
    this.claims.set(claim.id, claim);
    return claim;
  }
  async listClaims(f: { userId?: string; benefitIds?: string[] }) {
    return [...this.claims.values()]
      .filter((c) => (!f.userId || c.userId === f.userId) && (!f.benefitIds || f.benefitIds.includes(c.benefitId)))
      .sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));
  }
  async getClaimByCode(code: string) {
    return [...this.claims.values()].find((c) => c.code === code) ?? null;
  }
  async setClaimStatus(id: string, status: Claim["status"]) {
    const c = this.claims.get(id);
    if (!c) return;
    c.status = status;
    if (status === "used") c.usedAt = now();
  }

  // ---- 방문·신고 ----
  async recordVisit(serviceId: string, userId: string | null) {
    this.visits.push({ serviceId, userId });
  }
  async countVisits(ids: string[]) {
    const out: Record<string, number> = {};
    for (const v of this.visits) if (ids.includes(v.serviceId)) out[v.serviceId] = (out[v.serviceId] ?? 0) + 1;
    return out;
  }
  async createReport(r: Omit<Report, "id" | "createdAt" | "status" | "resolution">) {
    const x: Report = { ...r, id: randomUUID(), status: "open", resolution: null, createdAt: now() };
    this.reports.set(x.id, x);
    return x;
  }
  async listReports(status?: Report["status"]) {
    return [...this.reports.values()].filter((r) => !status || r.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async resolveReport(id: string, status: Report["status"], resolution: string) {
    const r = this.reports.get(id);
    if (r) Object.assign(r, { status, resolution });
  }
}
