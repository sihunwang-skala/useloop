<div align="center">

# UseLoop

**A two-way feedback platform connecting voluntary customer feedback with company responses and trial benefits.**
**고객의 자발적 피드백과 기업의 응답·체험 혜택을 잇는 양방향 피드백 플랫폼.**

Next.js 16 · React 19 · TypeScript · Supabase (Postgres + RLS) · Tailwind CSS 4 · Vitest

[English](#english) · [한국어](#한국어)

![UseLoop – service discovery](docs/screenshots/02-customer-discover.png)

</div>

---

<a id="english"></a>
# English

> **Status: portfolio MVP — local Demo only. Not production-ready.** The Supabase path has not been verified against a real instance. See [Development status](#development-status).

## Philosophy

UseLoop is **not** a platform that obliges people to test services. Customers browse, use and give feedback **voluntarily**; companies **respond** and may offer trial benefits.

- Feedback is private (visible only to the author and the company) and treated identically whether positive or negative.
- Benefits are never tied to positive reviews, ratings, public reviews or app-store ratings. Benefit copy that links rewards to ratings/reviews is rejected server-side and checked again by admin review.
- "Thank-you" benefits for feedback are **disabled** (env flag and DB setting both `false`) pending legal review.
- Companies see an anonymous identifier only — never a customer's name or email.

## Screenshots

All captured from the running app in Demo Mode (fictional data) via `npm run e2e:capture`. UI text is Korean.

| Customer — discover (no login) | Customer — service detail & benefits |
|---|---|
| ![](docs/screenshots/02-customer-discover.png) | ![](docs/screenshots/04-customer-service-detail.png) |
| **Customer — private feedback form** | **Customer — my benefits (claim code)** |
| ![](docs/screenshots/05-customer-feedback-form.png) | ![](docs/screenshots/06-customer-my-benefits.png) |
| **Company — dashboard** | **Company — feedback & replies** |
| ![](docs/screenshots/07-company-dashboard.png) | ![](docs/screenshots/08-company-feedback.png) |
| **Company — benefits & code redemption** | **Admin — approval queue** |
| ![](docs/screenshots/10-company-benefits.png) | ![](docs/screenshots/09-admin-queue.png) |

<details><summary>Home & login (Demo)</summary>

![](docs/screenshots/01-home.png)
![](docs/screenshots/03-login-demo.png)

</details>

## User flows

| Role | Flow |
|---|---|
| Customer | Browse without an account → (optional) sign in → write private feedback → see company replies and progress → optionally claim a benefit and view the code |
| Company | Register a service (admin-approved) → read/answer feedback, set progress, basic stats → submit coupons/free trials (admin-approved) → redeem customer codes once |
| Admin | Approve/reject services and benefits (checklist: no rating linkage, issuer authority) → handle reports → review deletion requests → manage sponsored ("Ad") labels |

## Architecture

```
Next.js App Router (Server Components + Server Actions)
├─ src/app            pages & actions (input parsing only)
├─ src/lib/services   domain rules, authorization, zod validation, rate limits
├─ src/lib/store      Store interface
│   ├─ memory.ts      Demo Mode: in-memory + signed-cookie session
│   └─ supabase.ts    Production: anon key + user JWT → RLS always applies (no service-role key)
└─ supabase/migrations/0001_init.sql   schema, RLS, column grants, triggers, RPC (claim_benefit, redeem_claim)
```

- **Defense in depth:** service-layer checks plus database RLS/triggers.
- **Coupons:** quantity, per-user uniqueness and single redemption are enforced atomically in DB functions (row lock + constraints).
- **Demo Mode is fail-closed:** ignored in production when Supabase is configured; the app refuses to start when neither is configured.

More: [ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

## Verification

| Check | Scope | Result | Command |
|---|---|---|---|
| Unit / domain tests | auth, permissions, feedback, benefits, Demo-mode guard, reward-wording guard | 54 pass | `npm test` |
| Browser E2E (Demo) | discover → feedback → benefit submit → admin approve → claim → redeem → role boundaries | 18/18 pass | `npm run e2e:capture` |
| SQL/RLS smoke (plain PostgreSQL 17 + auth stub) | user/company isolation, privilege escalation, self-approval, coupon duplicate/quantity/double-redeem, 10 concurrent claims on qty 3 → exactly 3 | 45 checks + concurrency pass | `npm run test:rls-local` |
| lint · typecheck · build | | pass | `npm run lint && npm run typecheck && npm run build` |
| **Real Supabase integration** | RLS, privilege escalation, coupon concurrency | **Not run — unverified** | `tests/integration/supabase-rls.test.ts` |

> The SQL smoke test runs on plain Postgres with a minimal `auth` stub. It is **not** Supabase (GoTrue/PostgREST/JWT) and does not replace integration testing.

## Quick start (Demo Mode)

```bash
npm install
cp .env.example .env.local     # contains DEMO_MODE=true
npm run dev                    # http://localhost:3000
```

Demo data is in-memory and fictional (labelled "[데모]"); a banner is always shown. For a production build, set `DEMO_MODE=true` explicitly. Demo accounts (local only, password `demo-password-1234`): `customer@demo.useloop.test`, `company@demo.useloop.test`, `admin@demo.useloop.test`.

## Environment variables

| Name | Description |
|---|---|
| `DEMO_MODE` | Demo only when explicitly `true`. Leave unset in production |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project. In production, if both are set the app is always in production mode |
| `SESSION_SECRET` | Signs the demo session cookie |
| `FEATURE_FEEDBACK_THANKS` | Thank-you benefits. Keep `false` until legal review |
| `FEATURE_SPONSORED_LABEL` | Ad label and separate placement |

No service-role key is used. `.env*` files are git-ignored.

## Development status

| Area | Status |
|---|---|
| Local Demo Mode | ✅ Working, verified |
| Supabase SQL logic (schema/RLS/RPC) | 🟡 Verified on plain Postgres only |
| App ↔ real Supabase path | ❌ **Unverified** |
| Public launch | ❌ Not possible yet |

Launch blockers: real-Supabase integration run; legal review of terms/privacy (current text is a **sample**); **account/data deletion workflow** (only a request flag exists today); distributed rate limiting (currently in-process memory); email verification and bot protection. Details, risk review (spam, multi-accounts, fake reviews, coupon abuse, ads) and proposals: [docs/PRELAUNCH_CHECKLIST.md](docs/PRELAUNCH_CHECKLIST.md) · [LEGAL_REVIEW.md](LEGAL_REVIEW.md).

**Production setup (unverified path):** create a Supabase project → enable email sign-up with confirmation → run `supabase/migrations/0001_init.sql` → set the two Supabase env vars (leave `DEMO_MODE` unset) → promote an admin via SQL → run the integration test against a **dedicated test project** before deploying.

```bash
SUPABASE_TEST_URL=... SUPABASE_TEST_ANON_KEY=... SUPABASE_TEST_ADMIN_EMAIL=... SUPABASE_TEST_ADMIN_PASSWORD=... npm test
```

---

<a id="한국어"></a>
# 한국어

> **상태: 포트폴리오용 MVP — 로컬 Demo만 가능, 운영 불가.** Supabase 경로는 실제 인스턴스에서 검증되지 않았습니다. [개발 상태](#개발-상태) 참고.

## 제품 철학

UseLoop는 서비스를 **의무적으로 테스트**시키는 플랫폼이 아닙니다. 고객은 **자발적으로** 서비스를 둘러보고 사용하고 피드백을 남기며, 기업은 **응답**하고 체험 혜택을 제공할 수 있습니다.

- 피드백은 비공개(작성자와 해당 기업만 열람)이며 긍정·부정 모두 동일하게 취급합니다.
- 혜택은 긍정 평가·평점·공개 리뷰·앱스토어 평점과 연결되지 않습니다. 평점/리뷰와 보상을 연결한 문구는 서버에서 거절하고 관리자 승인 때 다시 확인합니다.
- 피드백 "감사 혜택"은 법률 검토 전까지 **비활성**입니다(환경변수와 DB 설정 모두 `false`).
- 기업에는 익명 식별자만 전달되며 이름·이메일은 제공하지 않습니다.

## 화면

위 [Screenshots](#screenshots) 표와 동일한 화면입니다. 모두 Demo Mode(가상 데이터)의 실제 실행 화면이며 `npm run e2e:capture` 로 재생성할 수 있습니다.

| 화면 | 파일 |
|---|---|
| 고객 — 서비스 탐색(로그인 불필요) | [02](docs/screenshots/02-customer-discover.png) |
| 고객 — 서비스 상세·혜택 | [04](docs/screenshots/04-customer-service-detail.png) |
| 고객 — 비공개 피드백 작성 | [05](docs/screenshots/05-customer-feedback-form.png) |
| 고객 — 내 혜택(코드) | [06](docs/screenshots/06-customer-my-benefits.png) |
| 기업 — 대시보드 | [07](docs/screenshots/07-company-dashboard.png) |
| 기업 — 피드백·답변 | [08](docs/screenshots/08-company-feedback.png) |
| 관리자 — 승인 대기열 | [09](docs/screenshots/09-admin-queue.png) |
| 기업 — 혜택·코드 사용 처리 | [10](docs/screenshots/10-company-benefits.png) |

## 사용자 흐름

| 역할 | 흐름 |
|---|---|
| 고객 | 가입 없이 탐색 → (선택) 로그인 → 비공개 피드백 작성 → 기업 답변·진행 상황 확인 → 원하면 혜택 받기·코드 확인 |
| 기업 | 서비스 등록(관리자 승인) → 피드백 조회·답변·진행 상태·기본 통계 → 쿠폰/무료 체험 등록(관리자 승인) → 고객 코드 1회 사용 처리 |
| 관리자 | 서비스·혜택 승인/반려(평점 연계·발급 권한 체크리스트) → 신고 처리 → 삭제 요청 확인 → 광고 라벨 관리 |

## 아키텍처

영어 섹션의 다이어그램을 참고하세요. 요약:

- **이중 방어:** 서비스 계층 권한 검사 + DB RLS/트리거. service-role 키 미사용(anon key + 사용자 JWT).
- **쿠폰:** 수량·사용자당 1회·1회 사용을 DB 함수(행 잠금 + 제약)에서 원자적으로 처리.
- **Demo Mode fail-closed:** 운영에서 Supabase 값이 있으면 무시, 둘 다 없으면 기동 거부.

## 검증 결과

| 검증 | 결과 |
|---|---|
| 단위/도메인 테스트 (`npm test`) | 54건 통과 |
| 브라우저 E2E, Demo (`npm run e2e:capture`) | 18/18 통과 |
| SQL/RLS 스모크, 순수 PostgreSQL 17 + auth 스텁 (`npm run test:rls-local`) | 45개 점검 + 동시 발급(수량 3에 10명 → 정확히 3건) 통과 |
| lint · typecheck · build | 통과 |
| **실제 Supabase 통합 테스트** | **미실행 — 검증되지 않음** |

> SQL 스모크는 최소 `auth` 스텁을 둔 순수 Postgres에서 실행했습니다. Supabase(GoTrue/PostgREST/JWT)가 **아니며** 통합 테스트를 대체하지 않습니다.

## 빠른 시작 (Demo Mode)

```bash
npm install
cp .env.example .env.local     # DEMO_MODE=true 포함
npm run dev                    # http://localhost:3000
```

데모 데이터는 인메모리 가상 데이터(`[데모]` 표시)이며 상단 배너가 항상 표시됩니다. 운영 빌드로 데모를 띄울 때는 `DEMO_MODE=true` 를 명시해야 합니다. 데모 계정(로컬 전용, 비밀번호 `demo-password-1234`): `customer@` / `company@` / `admin@demo.useloop.test`.

## 개발 상태

| 영역 | 상태 |
|---|---|
| 로컬 Demo Mode | ✅ 동작·검증됨 |
| Supabase SQL 로직(스키마/RLS/RPC) | 🟡 순수 Postgres에서만 검증 |
| 앱 ↔ 실제 Supabase 경로 | ❌ **검증되지 않음** |
| 공개 서비스 출시 | ❌ 아직 불가 |

**출시 전 필수:** 실제 Supabase 통합 테스트 실행, 약관·개인정보처리방침 법률 검토(현재 **샘플**), **계정·데이터 삭제 절차**(현재는 요청 표시만), 분산 Rate Limit(현재 프로세스 메모리), 이메일 인증·봇 방지. 스팸·다중 계정·허위 리뷰·쿠폰 악용·광고 표시 리스크와 개선안은 [docs/PRELAUNCH_CHECKLIST.md](docs/PRELAUNCH_CHECKLIST.md), [LEGAL_REVIEW.md](LEGAL_REVIEW.md) 참고.

## Docs / 문서

[ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) · [LEGAL_REVIEW.md](LEGAL_REVIEW.md) · [docs/PRELAUNCH_CHECKLIST.md](docs/PRELAUNCH_CHECKLIST.md) · [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md)

---

## Copyright & Usage / 저작권 및 이용 안내

Copyright © 2026 Sihun Wang. All Rights Reserved.

This project is publicly available for viewing and portfolio demonstration purposes.

All rights to the original source code, documentation, designs, and project-specific assets are reserved by the author.

No permission is granted to reproduce, modify, redistribute, or commercially use the original materials without prior written authorization, except as permitted by applicable law or GitHub's Terms of Service.

Third-party libraries, dependencies, and other externally sourced materials remain subject to their respective licenses and ownership rights.

For licensing, collaboration, or commercial inquiries, please contact the repository owner.

---

저작권 © 2026 Sihun Wang. 모든 권리 보유.

이 프로젝트는 열람 및 포트폴리오 시연 목적으로 공개되어 있습니다.

원본 소스 코드, 문서, 디자인 및 프로젝트 고유 자산에 대한 모든 권리는 저작자에게 있습니다.

관련 법령 또는 GitHub 이용약관이 허용하는 범위를 제외하고, 사전 서면 허가 없이 원본 자료를 복제, 수정, 재배포하거나 상업적으로 이용할 수 있는 권한은 부여되지 않습니다.

제3자 라이브러리, 의존성 및 외부에서 가져온 자료는 각각의 라이선스와 소유권에 따릅니다.

라이선스, 협업 또는 상업적 문의는 저장소 소유자에게 연락해 주세요.
