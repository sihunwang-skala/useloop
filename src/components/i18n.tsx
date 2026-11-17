"use client";

import { useLayoutEffect } from "react";

export type Locale = "ko" | "en";

const EN: Record<string, string> = {
  "본문 바로가기": "Skip to content",
  "데모 모드 — 표시되는 기업·서비스·쿠폰은 모두 가상의 예시이며 실제가 아닙니다. 서버를 재시작하면 데이터가 초기화됩니다.": "Demo mode — all companies, services, and coupons shown are fictional. Data resets when the server restarts.",
  "주 메뉴": "Main menu",
  "서비스 탐색": "Discover",
  "내 피드백": "My feedback",
  "내 혜택": "My benefits",
  "대시보드": "Dashboard",
  "피드백": "Feedback",
  "서비스": "Services",
  "혜택": "Benefits",
  "관리자": "Admin",
  "로그아웃": "Log out",
  "로그인": "Log in",
  "시작하기": "Get started",
  "앱 설치": "Install app",
  "Safari의 공유 버튼을 누른 뒤": "Tap Safari's Share button, then choose",
  "홈 화면에 추가": "Add to Home Screen",
  "를 선택하세요.": ".",
  "닫기": "Close",
  "© UseLoop MVP. 오픈소스 테스트 버전입니다.": "© UseLoop MVP. Open-source test version.",
  "정책": "Policies",
  "개인정보처리방침(샘플)": "Privacy Policy (sample)",
  "이용약관(샘플)": "Terms of Service (sample)",
  "피드백·혜택 운영 원칙": "Feedback & Benefit Policy",

  "고객 피드백 · 서비스 발견": "Customer feedback · Service discovery",
  "쓰던 서비스엔 솔직하게,": "Be honest about what you use.",
  "새로운 서비스는 가볍게.": "Discover something new.",
  "UseLoop는 고객이 사용 중인 서비스에 비공개로 피드백을 남기고, 다른 스타트업 서비스를 자유롭게 둘러볼 수 있는 곳입니다. 기업은 피드백에 답하고 개선 진행 상황을 공유합니다.": "UseLoop is where customers privately share feedback on services they use and freely discover new startup products. Companies respond and share improvement progress.",
  "서비스 둘러보기": "Browse services",
  "무료로 시작하기": "Start for free",
  "고객과 기업 모두 기본 기능은 무료입니다. 둘러보기에는 로그인이 필요 없습니다.": "Core features are free for customers and companies. No account is needed to browse.",
  "이용 방법": "How it works",
  "1. 피드백": "1. Feedback",
  "쓰고 있는 서비스를 골라 좋았던 점과 불편한 점을 적습니다. 기업과 나에게만 보이는 비공개 피드백입니다.": "Choose a service you use and share what worked and what did not. Only you and the company can see it.",
  "2. 답변": "2. Response",
  "기업이 답변하고, '검토 중 → 개선 예정 → 개선 완료'처럼 진행 상황을 알려 줍니다.": "The company responds and shares progress such as Reviewing → Planned → Done.",
  "3. 발견": "3. Discovery",
  "카테고리별로 새로운 서비스를 둘러보세요. 체험 혜택이 있는 서비스도 있지만, 이용은 전적으로 내 선택입니다.": "Browse new services by category. Some offer trials, but taking part is always your choice.",
  "우리가 지키는 원칙": "Our principles",
  "피드백은 긍정이든 부정이든 똑같이 취급합니다.": "Positive and negative feedback are treated equally.",
  "혜택은 평점이나 긍정적인 평가와 연결되지 않습니다.": "Benefits are never tied to ratings or positive feedback.",
  "피드백을 쓰지 않아도 서비스를 둘러보고 혜택을 확인할 수 있습니다.": "You can browse services and benefits without leaving feedback.",
  "고객 정보는 동의 없이 다른 기업에 제공하지 않습니다.": "Customer information is never shared with companies without consent.",
  "광고는 ‘광고’ 표시로 일반 추천과 구분합니다.": "Ads are clearly separated from regular recommendations.",
  "앱스토어·외부 리뷰와 연결하지 않습니다.": "We do not connect benefits to app-store or external reviews.",
  "운영 원칙 전문 보기": "Read the full policy",
  "관심사 기반 추천": "Recommendations based on your interests",
  "프로필에 등록한 관심 카테고리·태그 기준의 단순 규칙 추천입니다. 광고가 아닙니다.": "Simple rule-based recommendations using your profile interests and tags. These are not ads.",

  "리뷰를 쓰지 않아도, 로그인하지 않아도 둘러볼 수 있습니다. 서비스 이용 여부는 직접 결정하세요.": "Browse without writing a review or signing in. You decide whether to use a service.",
  "검색어": "Search query",
  "서비스, 태그 검색": "Search services and tags",
  "검색": "Search",
  "카테고리": "Category",
  "전체": "All",
  "해제": "Clear",
  "광고 · 스폰서 서비스": "Ads · Sponsored services",
  "아래 서비스는 광고로 노출됩니다. 일반 추천 결과와 구분되며, 순위에는 영향을 주지 않습니다.": "The services below are sponsored. They are separate from regular results and do not affect ranking.",
  "조건에 맞는 서비스가 없습니다": "No services match",
  "검색어나 카테고리를 바꿔 보세요.": "Try another search or category.",
  "전체 보기": "View all",
  "광고": "Ad",
  "체험 혜택": "Trial benefit",
  "데모 예시": "Demo",

  "데모 계정 (가상 계정)": "Demo accounts (fictional)",
  "고객:": "Customer:",
  "기업:": "Company:",
  "관리자:": "Admin:",
  "비밀번호:": "Password:",
  "이메일": "Email",
  "비밀번호": "Password",
  "계정이 없나요?": "New to UseLoop?",
  "회원가입": "Sign up",
  "고객과 기업 모두 무료입니다. 이메일과 표시 이름만 수집합니다.": "It is free for customers and companies. We only collect your email and display name.",
  "가입 유형": "Account type",
  "고객": "Customer",
  "서비스 제공 기업": "Service provider",
  "표시 이름": "Display name",
  "기업명 (기업 가입 시)": "Company name (company accounts)",
  "고객으로 가입하면 비워 두세요.": "Leave blank for a customer account.",
  "10자 이상": "At least 10 characters",
  "이용약관": "Terms of Service",
  "및": "and",
  "개인정보 수집·이용": "collection and use of personal information",
  "(이메일, 표시 이름)에 동의합니다.": "(email and display name).",
  "(필수 · 샘플 문구)": "(Required · sample copy)",
  "가입하기": "Create account",
  "이미 계정이 있나요?": "Already have an account?",

  "계정 설정": "Account settings",
  "프로필": "Profile",
  "관심 카테고리": "Interest categories",
  "서비스 추천에만 사용되며 다른 기업에 제공되지 않습니다.": "Used only for recommendations and never shared with other companies.",
  "저장": "Save",
  "데이터 삭제 요청": "Data deletion request",
  "요청하면 운영자가 확인 후 계정과 관련 데이터를 삭제합니다. 접수 후에는 서비스 이용이 제한됩니다. (샘플 절차 · 보관 의무 검토 필요)": "An operator will review the request and delete your account and related data. Access is limited after submission. (Sample process; retention duties require review.)",
  "계정·데이터 삭제 요청": "Request account and data deletion",

  "긍정적": "Positive",
  "보통": "Neutral",
  "부정적": "Negative",
  "접수됨": "Received",
  "검토 중": "Reviewing",
  "개선 예정": "Planned",
  "개선 완료": "Done",
  "반영 어려움": "Won't do",
  "승인 대기": "Pending review",
  "승인됨": "Approved",
  "반려됨": "Rejected",
  "일시중지": "Pause",
  "사용 가능": "Available",
  "사용 완료": "Used",
  "만료": "Expired",
  "취소": "Cancelled",
  "처리 중…": "Working…",
  "불러오는 중…": "Loading…",
  "문제가 발생했습니다": "Something went wrong",
  "잠시 후 다시 시도해 주세요. 문제가 계속되면 운영자에게 알려 주세요.": "Try again shortly. If the problem continues, contact the operator.",
  "다시 시도": "Try again",
  "페이지를 찾을 수 없습니다": "Page not found",

  "내가 남긴 비공개 피드백과 기업의 답변, 개선 진행 상황입니다.": "Your private feedback, company responses, and improvement progress.",
  "피드백을 보냈습니다. 기업이 확인하면 이곳에 답변이 표시됩니다.": "Feedback sent. The company's response will appear here.",
  "아직 남긴 피드백이 없어요": "You have not shared feedback yet",
  "사용 중인 서비스를 찾아 피드백을 남겨 보세요.": "Find a service you use and share feedback.",
  "서비스 찾기": "Find a service",
  "좋았던 점": "What worked",
  "불편했던 점": "What did not",
  "개선 의견": "Suggestions",
  "아직 기업의 답변이 없습니다.": "The company has not responded yet.",
  "기업 답변 ·": "Company response ·",
  "받은 쿠폰과 무료 체험권, 사용 이력입니다. 코드는 본인만 볼 수 있으니 타인에게 공유하지 마세요.": "Your coupons, free trials, and usage history. Keep claim codes private.",
  "받은 혜택이 없어요": "You have no benefits yet",
  "서비스 상세 화면에서 마음에 드는 혜택을 받을 수 있습니다.": "Claim a benefit you like from a service page.",
  "데모 · 사용 불가": "Demo · Not usable",
  "유효기간:": "Valid through:",
  "사용 방법:": "How to use:",
  "조건:": "Terms:",
  "사용일:": "Used on:",

  "제공:": "Provided by:",
  "사용자 직접 등록 정보이며 UseLoop 의 공식 제휴나 보증을 의미하지 않습니다.": "User-submitted information; not an official UseLoop partnership or endorsement.",
  "소개가 아직 등록되지 않았습니다.": "No description has been added yet.",
  "서비스 사이트로 이동 ↗": "Visit service website ↗",
  "이 서비스에 피드백 남기기": "Give feedback on this service",
  "로그인하고 피드백 남기기": "Log in to give feedback",
  "서비스 이동·이용은 선택 사항이며, 피드백 작성이나 다른 서비스 이용 의무로 이어지지 않습니다. 이동 시 방문 수만 집계되고 개인정보는 전달되지 않습니다.": "Visiting or using a service is optional. Only the visit count is recorded; no personal data is shared.",
  "현재 등록된 혜택이 없습니다.": "No benefits are currently available.",
  "쿠폰": "Coupon",
  "무료 체험": "Free trial",
  "기간": "Period",
  "남은 수량": "Remaining",
  "조건": "Terms",
  "사용 방법": "How to use",
  "받은 혜택 ·": "Claimed ·",
  "내 혜택 보기": "View my benefits",
  "기간이 종료되었습니다.": "This benefit has expired.",
  "수량이 모두 소진되었습니다.": "This benefit is sold out.",
  "혜택 받기": "Claim benefit",
  "로그인하고 받기": "Log in to claim",
  "데모 예시 · 실제 서비스 아님": "Demo · Not a real service",
  "이 혜택은 비공개 피드백에 대한 감사 표시로, 평가 내용(긍정·부정)이나 평점과 무관하게 동일하게 제공됩니다. 공개 리뷰·앱스토어 평점과 연결되지 않습니다.": "This benefit thanks users for private feedback and is offered regardless of sentiment or rating. It is not tied to public or app-store reviews.",
  "사용하면서 느낀 점을 솔직하게 적어 주세요. 이 피드백은 해당 기업과 나에게만 보이는 비공개 피드백입니다.": "Share your honest experience. This feedback is private to you and the company.",
  "가짜 사용 경험이나 대신 작성한 내용은 올리지 마세요. 실제로 써 본 경험만 적어 주세요. 긍정·부정 어느 쪽이든 동일하게 취급되며, 어떤 보상도 평가 내용에 좌우되지 않습니다.": "Only share your own real experience. Positive and negative feedback are treated equally, and no reward depends on its content.",
  "기업에는 이름·이메일 없이 익명 식별자만 전달됩니다.": "The company receives only an anonymous identifier, never your name or email.",
  "전반적인 느낌": "Overall sentiment",
  "셋 중 하나 이상 작성해 주세요.": "Complete at least one of the three fields.",
  "관련 주제 (선택)": "Related topics (optional)",
  "비공개 피드백 보내기": "Send private feedback",

  "기업 대시보드": "Company dashboard",
  "먼저 서비스를 등록하세요": "Register a service first",
  "등록한 서비스는 관리자 승인 후 탐색 화면에 노출됩니다.": "Your service appears in discovery after admin approval.",
  "서비스 등록": "Register service",
  "등록한 서비스에 들어온 비공개 피드백 요약입니다.": "A summary of private feedback received by your services.",
  "피드백 확인": "View feedback",
  "승인된 서비스만 고객에게 노출됩니다.": "Only approved services are visible to customers.",
  "총 피드백": "Total feedback",
  "답변 완료": "Responded",
  "답변 대기": "Awaiting response",
  "전반적인 느낌 분포": "Sentiment distribution",
  "고객이 직접 고른 느낌이며 평점이 아닙니다.": "Selected by customers; this is not a rating.",
  "자주 나온 개선 요청 주제": "Common improvement topics",
  "아직 집계할 데이터가 없습니다.": "There is no data to summarize yet.",
  "최근 피드백": "Recent feedback",
  "아직 받은 피드백이 없어요": "No feedback received yet",
  "등록 서비스 상태:": "Service status:",
  "받은 피드백": "Received feedback",
  "고객의 이름·이메일은 제공되지 않으며 익명 식별자만 표시됩니다. 답변은 작성한 고객에게만 보입니다.": "Customer names and emails are never shown; only anonymous IDs appear. Replies are visible only to the author.",
  "필터": "Filters",
  "표시할 피드백이 없습니다": "No feedback to show",
  "추가 답변·상태 변경": "Add response · Change status",
  "답변하기": "Respond",
  "답변": "Response",
  "고객이 '내 피드백'에서 확인합니다. 평가 변경·삭제를 요청하거나 보상을 조건으로 제시하지 마세요.": "Customers see this under My Feedback. Do not request edits or deletion, or condition rewards on feedback.",
  "진행 상태": "Progress",
  "답변 등록": "Post response",

  "내 서비스": "My services",
  "등록한 서비스가 없습니다": "No services registered",
  "저장했습니다. 관리자 검토 후 탐색 화면에 노출됩니다.": "Saved. It will appear in discovery after admin review.",
  "반려 사유:": "Rejection reason:",
  "수정": "Edit",
  "서비스 수정": "Edit service",
  "수정하면 관리자 재검토 전까지 탐색 화면에서 숨겨집니다.": "Edits hide the service from discovery until admin review is complete.",
  "본인이 운영하거나 등록 권한이 있는 서비스만 등록하세요. 관리자 승인 후 노출되며, 제휴하지 않은 브랜드를 제휴사로 표기할 수 없습니다.": "Register only services you operate or are authorized to list. Admin approval is required, and unaffiliated brands may not be presented as partners.",
  "서비스 이름": "Service name",
  "한 줄 소개": "Tagline",
  "상세 소개": "Description",
  "서비스 URL": "Service URL",
  "선택하세요": "Select",
  "태그": "Tags",
  "쉼표로 구분 (최대 8개). 추천 규칙에 사용됩니다.": "Comma-separated (up to 8). Used for recommendations.",
  "수정 후 재검토 요청": "Save and request re-review",
  "등록하고 승인 요청": "Register and request approval",

  "혜택 관리": "Benefit management",
  "쿠폰·무료 체험권을 등록하고 수량과 사용 현황을 관리합니다.": "Register coupons and trials, and manage quantities and usage.",
  "등록했습니다. 관리자가 승인하면 고객에게 노출·발급됩니다.": "Registered. It becomes visible and claimable after admin approval.",
  "고객 코드 사용 처리": "Redeem customer code",
  "고객이 제시한 코드를 입력하면 한 번만 사용 처리됩니다. 우리 서비스의 혜택 코드만 처리할 수 있습니다.": "Enter the customer's code to redeem it once. Only codes for your services are accepted.",
  "등록한 혜택": "Registered benefits",
  "등록한 혜택이 없습니다": "No benefits registered",
  "서비스가 승인되면 혜택을 등록할 수 있습니다.": "You can register benefits after a service is approved.",
  "재개": "Resume",
  "새 혜택 등록": "Register new benefit",
  "혜택은 긍정적 평가, 높은 평점, 공개 리뷰, 앱스토어 리뷰·설치 수와 연결할 수 없습니다. 위반 시 승인이 반려되고 계정이 제한될 수 있습니다.": "Benefits cannot be tied to positive feedback, ratings, public reviews, app-store reviews, or installs. Violations may be rejected and accounts restricted.",
  "승인된 서비스가 없습니다": "No approved services",
  "유형": "Type",
  "무료 체험권": "Free trial",
  "제목": "Title",
  "예: 프로 플랜 30일 무료 체험": "e.g. 30-day Pro plan trial",
  "설명": "Description",
  "이용 조건": "Terms",
  "고객이 받기 전에 그대로 공개됩니다. 평가·리뷰와 관련된 조건은 넣을 수 없습니다.": "Shown to customers before claiming. Terms tied to ratings or reviews are not allowed.",
  "시작일": "Start date",
  "종료일": "End date",
  "수량": "Quantity",
  "이 혜택을 우리 회사가 직접 발급할 권한이 있으며, 긍정적 평가·평점·공개 리뷰·앱스토어 평점과 연결하지 않음을 확인합니다.": "I confirm that our company is authorized to issue this benefit and that it is not tied to positive feedback, ratings, public reviews, or app-store ratings.",
  "총 수량": "Total quantity",
  "수량 변경": "Update quantity",
  "고객 코드": "Customer code",
  "사용 처리": "Redeem",
  "신고하기": "Report",
  "신고 사유": "Reason for report",
  "허위 정보, 무단 제휴 표시, 부적절한 보상 요구 등을 알려 주세요.": "Report false information, unauthorized partnership claims, or improper reward requests.",
  "신고 제출": "Submit report",

  "관리자 검토": "Admin review",
  "승인 대기 서비스·혜택, 신고, 삭제 요청을 처리합니다.": "Review pending services and benefits, reports, and deletion requests.",
  "반려 사유": "Rejection reason",
  "반려 시 사유": "Reason if rejected",
  "승인": "Approve",
  "반려": "Reject",
  "서비스 승인 대기": "Services pending approval",
  "대기 중인 서비스가 없습니다": "No services are pending",
  "혜택 승인 대기": "Benefits pending approval",
  "대기 중인 혜택이 없습니다": "No benefits are pending",
  "발급 권한 확인:": "Issuer authorization:",
  "체크됨": "Confirmed",
  "미확인": "Unconfirmed",
  "열린 신고": "Open reports",
  "처리할 신고가 없습니다": "No reports to process",
  "처리 메모": "Resolution note",
  "조치 완료": "Resolve",
  "기각": "Dismiss",
  "삭제 요청이 없습니다": "No deletion requests",
  "광고(스폰서) 표시 관리": "Sponsored-label management",
  "광고 해제": "Remove ad label",
  "광고로 표시": "Mark as ad",

  // --- additional coverage: legal pages, categories, topics, labels, demo data ---
  "개인정보처리방침 (샘플)": "Privacy Policy (sample)",
  "이용약관 (샘플)": "Terms of Service (sample)",
  "샘플 문구입니다. 실제 서비스 출시 전 법률 검토가 필요합니다.": "Sample text. Legal review is required before a real launch.",
  "수집 항목: 이메일, 표시 이름, (선택) 관심 카테고리, 작성한 비공개 피드백, 혜택 수령 이력.": "Collected: email, display name, (optional) interest categories, private feedback you write, and benefit claim history.",
  "이용 목적: 계정 관리, 비공개 피드백 전달, 혜택 발급·사용 관리, 서비스 추천(관심 카테고리 기반).": "Purpose: account management, delivering private feedback, issuing and tracking benefits, and recommendations based on interest categories.",
  "제3자 제공: 고객의 이름·이메일 등 개인정보는 다른 기업에 제공하지 않습니다. 기업에는 익명 식별자와 피드백 내용만 전달됩니다.": "Third parties: customers' names, emails, and other personal data are not shared with companies. Companies receive only an anonymous identifier and the feedback content.",
  "보유 기간 및 삭제: 계정 설정에서 삭제를 요청할 수 있으며, 운영자가 확인 후 처리합니다.": "Retention and deletion: you can request deletion in account settings; an operator reviews and processes it.",
  "※ 이 문서는 개발용 샘플이며 법적 효력이 없습니다. 출시 전 LEGAL_REVIEW.md 의 항목을 법률 전문가와 검토해야 합니다.": "* This is a development sample with no legal effect. Review the items in LEGAL_REVIEW.md with a legal professional before launch.",
  "※ 이 문서는 개발용 샘플이며 법적 효력이 없습니다.": "* This is a development sample with no legal effect.",
  "UseLoop 는 고객 피드백 전달과 서비스 발견을 돕는 플랫폼이며, 기본 기능은 무료입니다.": "UseLoop helps deliver customer feedback and discover services. Core features are free.",
  "이용자는 실제 사용 경험에 근거해 피드백을 작성해야 하며, 허위·대리 작성·AI 생성 가짜 후기를 올릴 수 없습니다.": "Users must write feedback based on real experience and must not post false, ghost-written, or AI-generated fake reviews.",
  "기업은 발급 권한이 있는 혜택만 등록할 수 있으며, 긍정적 평가나 리뷰 수정·삭제를 조건으로 혜택을 제공할 수 없습니다.": "Companies may register only benefits they are authorized to issue, and may not condition benefits on positive ratings or on editing or deleting reviews.",
  "모든 피드백은 긍정·부정과 관계없이 동일한 정책으로 취급합니다.": "All feedback, positive or negative, is treated under the same policy.",
  "혜택은 긍정적 평가, 높은 평점, 공개 리뷰, 앱스토어 평점·설치 수와 연결되지 않습니다.": "Benefits are not tied to positive feedback, high ratings, public reviews, or app-store ratings and installs.",
  "혜택 조건·유효기간·수량·사용 방법은 받기 전에 모두 공개됩니다.": "Benefit terms, validity, quantity, and usage instructions are disclosed before claiming.",
  "관리자가 승인한 혜택만 발급되며, 코드 중복 사용과 수량 초과는 시스템이 차단합니다.": "Only admin-approved benefits are issued; the system blocks duplicate code use and over-issuance.",
  "현재는 '사용자 직접 등록' 정보이며, 실제 사용자 인증(Verified)은 제공하지 않습니다.": "Information is currently self-registered; real user verification (\"Verified\") is not provided.",
  "광고(스폰서)는 '광고' 라벨로 표시하고 일반 추천과 구분합니다. 제휴하지 않은 기업을 공식 제휴사로 표시하지 않습니다.": "Sponsored listings carry an \"Ad\" label and are kept separate from regular recommendations. Non-partners are never shown as official partners.",
  "생산성": "Productivity", "금융·재무": "Finance", "교육": "Education", "헬스케어": "Healthcare",
  "디자인·크리에이티브": "Design & Creative", "개발 도구": "Developer tools",
  "가격": "Pricing", "성능·속도": "Performance & speed", "사용성(UI/UX)": "Usability (UI/UX)", "기능 추가": "Feature requests",
  "버그·오류": "Bugs & errors", "고객지원": "Support", "기타": "Other",
  "이메일:": "Email:", "· 가입일": "· Joined", "· 유형:": "· Type:", "기업": "Company",
  "발급": "Issued", "건": " ", "데모": "Demo",
  "서비스 승인 대기 (": "Services pending approval (", "혜택 승인 대기 (": "Benefits pending approval (",
  "열린 신고 (": "Open reports (", "데이터 삭제 요청 (": "Data deletion requests (",
  "확인: 본인 소유 서비스인지, 제휴 사칭이나 허위 소개가 없는지 확인하세요.": "Check: is it the company's own service, with no false partnership claims or misleading description?",
  "확인: 긍정적 평가·평점·외부 리뷰와 연결된 조건이 없는지, 실제 발급 권한이 있는지 확인하세요.": "Check: no terms tied to positive feedback, ratings, or external reviews, and real authority to issue.",
  "MVP 에서는 요청 접수까지만 지원합니다. 실제 삭제 처리 절차는 LEGAL_REVIEW.md / FUTURE_ROADMAP.md 참고.": "The MVP only records requests. See LEGAL_REVIEW.md / FUTURE_ROADMAP.md for the actual deletion process.",
  "— 승인된 서비스만 고객에게 노출됩니다.": "— only approved services are shown to customers.",
  "· 사용자 직접 등록 정보이며 UseLoop 의 공식 제휴나 보증을 의미하지 않습니다.": "· Self-registered information; it does not imply official partnership with or endorsement by UseLoop.",
  "데모 고객": "Demo customer", "데모 기업 담당자": "Demo company rep", "데모 관리자": "Demo admin",
  "[데모] 노트웨이브": "[Demo] Notewave", "노트웨이브 (데모)": "Notewave (demo)", "페이로그 (데모)": "Paylog (demo)",
  "스터디핀 (데모)": "StudyPin (demo)", "코드랜턴 (데모)": "CodeLantern (demo)", "무브핏 (데모)": "MoveFit (demo)",
  "승인 대기 중인 서비스 (데모)": "Service pending approval (demo)", "승인 대기 쿠폰 (데모)": "Coupon pending approval (demo)",
  "승인 대기 중인 서비스 (데모)(승인 대기)": "Service pending approval (demo) (pending)",
  "관리자 승인 대기 예시": "Example of a service awaiting admin approval",
  "팀 회의록을 자동 정리하는 노트 앱": "A note app that organizes team meeting notes automatically",
  "프리랜서를 위한 간편 정산 도구": "A simple settlement tool for freelancers",
  "함께 공부하는 온라인 스터디룸": "An online study room to learn together",
  "코드 리뷰를 빠르게 만드는 개발자 도구": "A developer tool that speeds up code review",
  "홈트레이닝 루틴 코치": "A home-workout routine coach",
  "프로 플랜 30일 무료 체험": "30-day Pro plan free trial", "팀 플랜 14일 무료 체험": "14-day Team plan free trial",
  "첫 3개월 20% 할인 쿠폰": "20% off first 3 months coupon",
  "피드백 작성 여부와 관계없이 누구나 받을 수 있습니다.": "Available to everyone, whether or not they write feedback.",
  "데모용 가상 혜택입니다. 실제로 사용할 수 없습니다.": "A fictional demo benefit. It cannot actually be used.",
  "실제 서비스가 아니므로 사용 방법이 없습니다.": "Not a real service, so there are no usage instructions.",
  "회의록 정리가 빨라졌어요.": "Organizing meeting notes got faster.",
  "모바일 앱에서 검색이 느립니다.": "Search is slow in the mobile app.",
  "오프라인에서도 노트를 볼 수 있으면 좋겠습니다.": "I'd like to view notes offline too.",
  "의견 감사합니다. 검색 속도는 다음 업데이트에서 개선할 예정이고, 오프라인 모드는 로드맵에 넣었습니다. (데모 답변)": "Thanks for the feedback. We plan to improve search speed in the next update and have added offline mode to the roadmap. (demo reply)",
};

function translateText(value: string): string {
  const compact = value.trim().replace(/\s+/g, " ");
  const exact = EN[compact];
  if (exact) return value.replace(value.trim(), exact);

  return value
    .replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g, (_, y, m, d) => new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))
    .replace(/(\d+)건/g, "$1")
    .replace(/^발급\s+(\d+)\s*\/\s*(\d+)$/, "Issued $1 / $2")
    .replace(/^이용자\s+(\w+)$/, "User $1")
    .replace(/^태그\s+#(.+)$/, "Tag #$1")
    .replace(/^(.+)\s+피드백$/, "$1 feedback");
}

function translateTree(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest("script, style, code, pre, [data-no-translate]")) return NodeFilter.FILTER_REJECT;
      return /[가-힣]/.test(node.textContent ?? "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) node.textContent = translateText(node.textContent ?? "");

  for (const element of root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]")) {
    for (const attribute of ["placeholder", "aria-label", "title"]) {
      const value = element.getAttribute(attribute);
      if (value && /[가-힣]/.test(value)) element.setAttribute(attribute, translateText(value));
    }
  }
}

export function TranslationLayer({ locale }: { locale: Locale }) {
  useLayoutEffect(() => {
    if (locale !== "en") return;
    translateTree(document.body);
    document.title = translateText(document.title);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLElement) translateTree(node);
          else if (node instanceof Text && /[가-힣]/.test(node.textContent ?? "")) node.textContent = translateText(node.textContent ?? "");
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale]);

  return null;
}

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  function change(next: Locale) {
    document.cookie = `useloop_locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.location.reload();
  }

  return (
    <label className="ml-1 inline-flex min-h-9 items-center rounded-lg border border-line bg-white px-2 text-xs font-medium text-muted">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => change(event.target.value as Locale)}
        className="cursor-pointer bg-transparent text-ink outline-none"
      >
        <option value="ko">한국어</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
