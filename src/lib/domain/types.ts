export type Role = "customer" | "company" | "admin";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type Sentiment = "positive" | "neutral" | "negative";
export type Progress = "received" | "reviewing" | "planned" | "done" | "wont_do";
export type BenefitType = "coupon" | "free_trial";
/** discovery: 서비스 소개용 체험 혜택 / thanks: 비공개 피드백 감사 혜택(기능 플래그 뒤에 숨김) */
export type BenefitKind = "discovery" | "thanks";
export type ClaimStatus = "issued" | "used" | "expired" | "cancelled";
export type ReportTarget = "feedback" | "service" | "benefit";
export type ReportStatus = "open" | "resolved" | "dismissed";

export const TOPICS = ["가격", "성능·속도", "사용성(UI/UX)", "기능 추가", "버그·오류", "고객지원", "기타"] as const;
export type Topic = (typeof TOPICS)[number];

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  interests: string[];
  consentAt: string | null;
  deletionRequestedAt: string | null;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Category {
  slug: string;
  name: string;
}

export interface Service {
  id: string;
  companyId: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  categorySlug: string;
  tags: string[];
  status: ReviewStatus;
  rejectionReason: string | null;
  /** 광고(스폰서) 표시. MVP 에서는 관리자만 설정할 수 있고 일반 추천과 시각적으로 구분됩니다. */
  sponsored: boolean;
  isDemo: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  serviceId: string;
  authorId: string;
  liked: string;
  disliked: string;
  suggestion: string;
  sentiment: Sentiment;
  topics: Topic[];
  progress: Progress;
  createdAt: string;
}

export interface FeedbackResponse {
  id: string;
  feedbackId: string;
  authorId: string;
  body: string;
  progress: Progress;
  createdAt: string;
}

export interface Benefit {
  id: string;
  serviceId: string;
  type: BenefitType;
  kind: BenefitKind;
  title: string;
  description: string;
  terms: string;
  howToUse: string;
  validFrom: string;
  validUntil: string;
  totalQuantity: number;
  claimedCount: number;
  /** 기업이 이 혜택을 직접 발급할 권한이 있음을 확인(체크)했는지 */
  issuerAuthorityConfirmed: boolean;
  status: ReviewStatus | "paused";
  rejectionReason: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface Claim {
  id: string;
  benefitId: string;
  userId: string;
  code: string;
  status: ClaimStatus;
  claimedAt: string;
  usedAt: string | null;
}

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportTarget;
  targetId: string;
  reason: string;
  status: ReportStatus;
  resolution: string | null;
  createdAt: string;
}

export interface Membership {
  userId: string;
  companyId: string;
}

/** 로그인한 사용자 + 소속 기업 */
export interface SessionUser extends Profile {
  companyId: string | null;
}
