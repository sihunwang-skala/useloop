# Database Schema

정본은 [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 입니다.

| 테이블 | 용도 | 주요 제약 |
|---|---|---|
| `profiles` | auth.users 1:1. role(customer/company/admin), 관심 카테고리, 동의·삭제요청 시각 | role 컬럼은 사용자 UPDATE 불가(컬럼 권한) |
| `companies`, `company_members` | 기업과 소속 | 가입 트리거가 생성 |
| `service_categories` | 카테고리 | |
| `services` | 서비스. status(pending/approved/rejected), `sponsored`, `is_demo` | 기업은 pending/비광고로만 insert·update (RLS) |
| `feedback` | 비공개 피드백. sentiment(고객 선택), topics, progress | 작성자·해당 기업·관리자만 SELECT |
| `feedback_responses` | 기업 답변 | 해당 서비스 기업 구성원만 INSERT |
| `benefits` | 쿠폰/무료 체험. 수량, 기간, 조건, 사용 방법, 발급권한 확인 | `claimed_count <= total_quantity` CHECK, 상태·발급 수는 트리거로 보호 |
| `benefit_claims` | 발급 이력/코드. issued/used/expired/cancelled | `(benefit_id,user_id)` 부분 유니크(중복 방지), 코드 유니크, INSERT/UPDATE 정책 없음(RPC 전용) |
| `service_visits` | 외부 이동 클릭 수 | 개인정보 없음(user_id 선택) |
| `reports` | 신고 | 작성자·관리자만 조회 |
| `app_settings` | 서버측 기능 플래그(`feedback_thanks_enabled=false`) | |

## RLS 요약
- 고객: 자기 프로필·피드백·혜택 발급만 접근
- 기업: 자기 기업 서비스와 그 피드백/혜택/발급만 접근
- 관리자: 검토에 필요한 범위
- 승인된 서비스/혜택만 비로그인·타 사용자에게 보임

## RPC
- `claim_benefit(benefit_id)`: `FOR UPDATE` 행 잠금 → 승인/기간/중복/수량/플래그 검사 → 수량 증가 + 고유 코드 발급 (단일 트랜잭션)
- `redeem_claim(code)`: 소유 기업만, 1회만 사용 처리

> 상태 주의: 위 SQL 은 실제 Supabase 인스턴스에서 실행해 검증하지 못했습니다.

## Demo ↔ 요구 엔티티 매핑
Users=profiles, ServiceCategories=service_categories, BenefitRedemptions=benefit_claims(발급~사용 상태 통합). "예약(reserved)" 상태는 MVP 에서 제외했습니다.
