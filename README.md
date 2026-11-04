# UseLoop (CrossFeedback MVP)

고객이 쓰고 있는 서비스에 **비공개 피드백**을 남기고, 다른 스타트업 서비스를 **자유롭게 발견**하며, 기업이 제공하는 체험 혜택을 확인하는 플랫폼의 MVP입니다. 기본 언어는 한국어입니다.

> 상태: 테스트용 MVP. 법률 검토 전이며, 법률 안내 문구는 모두 **샘플**입니다 → [LEGAL_REVIEW.md](LEGAL_REVIEW.md)

## 기능
- **고객**: 회원가입/로그인, 서비스 탐색(비로그인 가능), 비공개 피드백 작성, 기업 답변·진행 상황 확인, 혜택 받기/내 혜택(코드·상태), 신고, 관심 카테고리 설정, 삭제 요청
- **기업**: 서비스 등록/수정(관리자 승인), 받은 피드백 조회·답변·진행 상태 변경, 기본 통계, 쿠폰·무료 체험권 등록/수량/일시중지, 고객 코드 사용 처리
- **관리자**: 서비스·혜택 승인/반려, 신고 처리, 삭제 요청 확인, 광고(스폰서) 표시 관리
- 제외: 결제, 공개 리뷰, 앱스토어 연동 등 → [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md)

## 빠른 시작 (Demo Mode — Supabase 불필요)
```bash
npm install
cp .env.example .env.local   # 값이 없어도 데모 모드로 실행됩니다
npm run dev                  # http://localhost:3000
```
데모 모드는 **인메모리 저장소**를 사용하며 서버를 재시작하면 초기화됩니다. 모든 기업·서비스·쿠폰은 `[데모]`/`(데모)` 로 표시되는 **가상 데이터**이며 실제가 아닙니다. 화면 상단에 항상 데모 배너가 표시됩니다.

데모 계정 (로그인 화면에도 표시됨, 비밀번호 `demo-password-1234`):

| 역할 | 이메일 |
|---|---|
| 고객 | customer@demo.useloop.test |
| 기업 | company@demo.useloop.test |
| 관리자 | admin@demo.useloop.test |

## 환경변수
| 이름 | 설명 |
|---|---|
| `DEMO_MODE` | `true` 이면 강제로 데모 모드. 프로덕션에서는 `false` |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 프로젝트 값. **둘 다 있고 DEMO_MODE≠true 일 때 프로덕션 모드** |
| `SESSION_SECRET` | 데모 모드 세션 쿠키 서명용 |
| `FEATURE_FEEDBACK_THANKS` | 피드백 감사 혜택. **법률 검토 전까지 `false`** |
| `FEATURE_SPONSORED_LABEL` | 광고 라벨/분리 노출 |

service-role 키는 사용하지 않습니다(앱은 anon key + 사용자 JWT 로만 DB에 접근하므로 RLS 가 항상 적용됨). `.env*` 파일은 `.gitignore` 대상입니다.

## 프로덕션 모드 (Supabase)
1. Supabase 프로젝트 생성 → Authentication 에서 이메일 가입 활성화(필요 시 이메일 확인 정책 설정)
2. SQL Editor 에서 [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) 실행 (또는 `supabase db push`)
3. `.env.local` 에 URL/anon key 입력, `DEMO_MODE=false`
4. 관리자 지정: 가입 후 SQL 로 `update profiles set role='admin' where email='...'` (앱에서 admin 가입 불가)
5. `npm run build && npm start`

> ⚠️ **Supabase 프로덕션 경로는 실제 Supabase 인스턴스에 대해 아직 실행·검증되지 않았습니다.** (마이그레이션 SQL, RLS, RPC, Supabase 저장소 어댑터는 코드 리뷰 수준) 공개 전 반드시 실제 프로젝트로 통합 테스트를 하세요.

## 스크립트
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (도메인/권한/쿠폰 테스트 40건)
npm run build
```

## 배포 (Vercel)
Vercel 에 저장소를 연결하고 환경변수(`NEXT_PUBLIC_SUPABASE_*`, `DEMO_MODE=false`, `FEATURE_*`)를 설정합니다. 데모 모드는 서버리스에서 인스턴스마다 메모리가 분리되므로 **데모 배포에는 부적합**합니다(로컬/단일 인스턴스용). Rate limit 도 프로세스 메모리 기반이라 프로덕션에서는 Redis 등으로 교체해야 합니다.

## 문서
[ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) · [LEGAL_REVIEW.md](LEGAL_REVIEW.md) · [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md)

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
