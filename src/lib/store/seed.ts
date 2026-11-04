import { randomUUID } from "node:crypto";
import type { MemoryStore } from "./memory";
import { hashPassword } from "./memory";
import type { Benefit, Feedback, Profile, Service } from "@/lib/domain/types";

/** 데모 계정 비밀번호. 데모 모드 전용이며 실제 서비스에서는 사용되지 않습니다. */
export const DEMO_PASSWORD = "demo-password-1234";
export const DEMO_ACCOUNTS = {
  customer: "customer@demo.useloop.test",
  company: "company@demo.useloop.test",
  admin: "admin@demo.useloop.test",
};

const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * 86400000).toISOString();

/** 모든 데모 데이터는 가상이며 실제 기업·이용자·쿠폰이 아닙니다. */
export function seed(s: MemoryStore) {
  s.categories = [
    { slug: "productivity", name: "생산성" },
    { slug: "finance", name: "금융·재무" },
    { slug: "education", name: "교육" },
    { slug: "health", name: "헬스케어" },
    { slug: "design", name: "디자인·크리에이티브" },
    { slug: "dev-tools", name: "개발 도구" },
  ];

  const mkProfile = (email: string, name: string, role: Profile["role"], interests: string[]): Profile => ({
    id: randomUUID(), email, displayName: name, role, interests, consentAt: iso(-30), deletionRequestedAt: null, createdAt: iso(-30),
  });
  const pw = hashPassword(DEMO_PASSWORD);
  const cust = mkProfile(DEMO_ACCOUNTS.customer, "데모 고객", "customer", ["productivity", "dev-tools"]);
  const comp = mkProfile(DEMO_ACCOUNTS.company, "데모 기업 담당자", "company", []);
  const adm = mkProfile(DEMO_ACCOUNTS.admin, "데모 관리자", "admin", []);

  const demoCompany = { id: randomUUID(), name: "[데모] 노트웨이브", createdAt: iso(-30) };
  const otherCompany = { id: randomUUID(), name: "[데모] 가상 스타트업 그룹", createdAt: iso(-30) };
  s.companies.set(demoCompany.id, demoCompany);
  s.companies.set(otherCompany.id, otherCompany);
  s.accounts.set(cust.id, { profile: cust, companyId: null, passwordHash: pw });
  s.accounts.set(comp.id, { profile: comp, companyId: demoCompany.id, passwordHash: pw });
  s.accounts.set(adm.id, { profile: adm, companyId: null, passwordHash: pw });

  const mkService = (p: Partial<Service> & Pick<Service, "name" | "tagline" | "categorySlug" | "tags" | "companyId">): Service => ({
    id: randomUUID(), description: "", url: "https://example.com", status: "approved", rejectionReason: null,
    sponsored: false, isDemo: true, createdAt: iso(-20), ...p,
  });
  const svc = [
    mkService({ companyId: demoCompany.id, name: "노트웨이브 (데모)", tagline: "팀 회의록을 자동 정리하는 노트 앱", categorySlug: "productivity", tags: ["노트", "협업", "회의"],
      description: "가상의 데모 서비스입니다. 실제 제품이 아니며 example.com 으로 연결됩니다.\n\n회의 중 메모를 구조화하고 팀원과 공유하는 노트 도구라는 설정의 예시 서비스입니다." }),
    mkService({ companyId: otherCompany.id, name: "페이로그 (데모)", tagline: "프리랜서를 위한 간편 정산 도구", categorySlug: "finance", tags: ["정산", "프리랜서", "세금"],
      description: "가상의 데모 서비스입니다. 실제 금융 서비스가 아닙니다." }),
    mkService({ companyId: otherCompany.id, name: "스터디핀 (데모)", tagline: "함께 공부하는 온라인 스터디룸", categorySlug: "education", tags: ["스터디", "학습"],
      description: "가상의 데모 서비스입니다." }),
    mkService({ companyId: otherCompany.id, name: "코드랜턴 (데모)", tagline: "코드 리뷰를 빠르게 만드는 개발자 도구", categorySlug: "dev-tools", tags: ["코드리뷰", "개발", "협업"],
      description: "가상의 데모 서비스입니다.", sponsored: true }),
    mkService({ companyId: otherCompany.id, name: "무브핏 (데모)", tagline: "홈트레이닝 루틴 코치", categorySlug: "health", tags: ["운동", "루틴"],
      description: "가상의 데모 서비스입니다." }),
    mkService({ companyId: demoCompany.id, name: "승인 대기 중인 서비스 (데모)", tagline: "관리자 승인 대기 예시", categorySlug: "design", tags: ["디자인"],
      description: "관리자 화면의 승인 대기 목록을 보여주기 위한 예시입니다.", status: "pending" }),
  ];
  svc.forEach((x) => s.services.set(x.id, x));

  const mkBenefit = (p: Partial<Benefit> & Pick<Benefit, "serviceId" | "title" | "type">): Benefit => ({
    id: randomUUID(), kind: "discovery", description: "", terms: "데모용 가상 혜택입니다. 실제로 사용할 수 없습니다.",
    howToUse: "실제 서비스가 아니므로 사용 방법이 없습니다.", validFrom: iso(-5), validUntil: iso(60), totalQuantity: 20, claimedCount: 0,
    issuerAuthorityConfirmed: true, status: "approved", rejectionReason: null, isDemo: true, createdAt: iso(-5), ...p,
  });
  const ben = [
    mkBenefit({ serviceId: svc[0].id, type: "free_trial", title: "프로 플랜 30일 무료 체험", description: "피드백 작성 여부와 관계없이 누구나 받을 수 있습니다.", totalQuantity: 20 }),
    mkBenefit({ serviceId: svc[1].id, type: "coupon", title: "첫 3개월 20% 할인 쿠폰", totalQuantity: 2 }),
    mkBenefit({ serviceId: svc[3].id, type: "free_trial", title: "팀 플랜 14일 무료 체험", totalQuantity: 50 }),
    mkBenefit({ serviceId: svc[0].id, type: "coupon", title: "승인 대기 쿠폰 (데모)", status: "pending" }),
  ];
  ben.forEach((x) => s.benefits.set(x.id, x));

  const fb: Feedback = {
    id: randomUUID(), serviceId: svc[0].id, authorId: cust.id, liked: "회의록 정리가 빨라졌어요.",
    disliked: "모바일 앱에서 검색이 느립니다.", suggestion: "오프라인에서도 노트를 볼 수 있으면 좋겠습니다.",
    sentiment: "neutral", topics: ["성능·속도", "기능 추가"], progress: "planned", createdAt: iso(-3),
  };
  s.feedback.set(fb.id, fb);
  const r = { id: randomUUID(), feedbackId: fb.id, authorId: comp.id, body: "의견 감사합니다. 검색 속도는 다음 업데이트에서 개선할 예정이고, 오프라인 모드는 로드맵에 넣었습니다. (데모 답변)", progress: "planned" as const, createdAt: iso(-2) };
  s.responses.set(r.id, r);
}
