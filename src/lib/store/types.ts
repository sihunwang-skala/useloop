import type {
  Benefit, Category, Claim, Company, Feedback, FeedbackResponse, Progress, Report,
  ReportStatus, Service, SessionUser, Profile,
} from "@/lib/domain/types";

export type NewService = Omit<Service, "id" | "createdAt" | "status" | "rejectionReason" | "sponsored" | "isDemo">;
export type NewFeedback = Omit<Feedback, "id" | "createdAt" | "progress">;
export type NewBenefit = Omit<Benefit, "id" | "createdAt" | "claimedCount" | "status" | "rejectionReason" | "isDemo">;

/**
 * 데이터 접근 계층. 권한 검사는 services/ 에서 수행하며,
 * Supabase 구현은 추가로 Row Level Security 로 같은 규칙을 DB 에서 강제합니다.
 */
export interface Store {
  // 사용자
  getSessionUser(id: string): Promise<SessionUser | null>;
  updateProfile(id: string, patch: Partial<Pick<Profile, "displayName" | "interests" | "consentAt">>): Promise<void>;
  requestDeletion(id: string): Promise<void>;
  listDeletionRequests(): Promise<Profile[]>;
  getCompany(id: string): Promise<Company | null>;

  // 서비스
  listCategories(): Promise<Category[]>;
  listServices(f?: { status?: Service["status"]; companyId?: string; ids?: string[] }): Promise<Service[]>;
  getService(id: string): Promise<Service | null>;
  createService(s: NewService): Promise<Service>;
  updateService(id: string, patch: Partial<Service>): Promise<Service>;

  // 피드백
  listFeedback(f: { serviceIds?: string[]; authorId?: string }): Promise<Feedback[]>;
  getFeedback(id: string): Promise<Feedback | null>;
  createFeedback(fb: NewFeedback): Promise<Feedback>;
  setFeedbackProgress(id: string, progress: Progress): Promise<void>;
  listResponses(feedbackIds: string[]): Promise<FeedbackResponse[]>;
  createResponse(r: Omit<FeedbackResponse, "id" | "createdAt">): Promise<FeedbackResponse>;

  // 혜택
  listBenefits(f?: { serviceIds?: string[]; status?: Benefit["status"] }): Promise<Benefit[]>;
  getBenefit(id: string): Promise<Benefit | null>;
  createBenefit(b: NewBenefit): Promise<Benefit>;
  updateBenefit(id: string, patch: Partial<Benefit>): Promise<Benefit>;
  /** 원자적으로 수량을 차감하고 고유 코드를 발급. 중복·초과 시 AppError */
  claimBenefit(benefitId: string, userId: string, now: Date): Promise<Claim>;
  listClaims(f: { userId?: string; benefitIds?: string[] }): Promise<Claim[]>;
  getClaimByCode(code: string): Promise<Claim | null>;
  setClaimStatus(id: string, status: Claim["status"]): Promise<void>;

  // 방문·신고
  recordVisit(serviceId: string, userId: string | null): Promise<void>;
  countVisits(serviceIds: string[]): Promise<Record<string, number>>;
  createReport(r: Omit<Report, "id" | "createdAt" | "status" | "resolution">): Promise<Report>;
  listReports(status?: ReportStatus): Promise<Report[]>;
  resolveReport(id: string, status: ReportStatus, resolution: string): Promise<void>;
}
