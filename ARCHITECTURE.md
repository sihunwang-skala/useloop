# Architecture

Modular Monolith. 마이크로서비스·큐·에이전트 없음.

```
src/app/            Next.js App Router 페이지, Server Actions(actions.ts), Route Handlers(/go/[id], /api/health)
src/components/     UI (forms.tsx = 클라이언트 폼 상태 처리)
src/lib/services/   ★ 비즈니스 로직 + 권한 검사 + zod 검증 + rate limit (Ctx = {store, user})
src/lib/store/      Store 인터페이스 / MemoryStore(데모) / SupabaseStore(프로덕션)
src/lib/auth/       세션 (데모: HMAC 서명 쿠키, 프로덕션: Supabase Auth)
supabase/migrations 스키마 + RLS + RPC
```

## 요청 흐름
페이지/Server Action → `getCtx()`(저장소+현재 사용자) → `services/*` 가 역할·소유권 검사와 입력 검증 → `Store`.
권한은 **두 겹**입니다: (1) services 계층 (2) 프로덕션에서는 Supabase RLS. 서비스 계층은 `Store` 구현과 무관하게 테스트됩니다.

## 기술 선택과 Trade-off
| 선택 | 이유 | Trade-off |
|---|---|---|
| Next.js(App Router) + TS | 풀스택 단일 배포, Vercel 호환 | Server Actions 는 아직 규약이 빠르게 변함 |
| Tailwind v4 | 디자인 토큰 일관성, 빠른 반복 | 클래스 장황함 |
| Supabase(Postgres+Auth+RLS) | 인증·RLS·RPC 를 한 곳에서 | 벤더 종속, 로컬에서 실제 검증하려면 Supabase CLI 필요 |
| Store 인터페이스 + 인메모리 데모 | 계정/외부 서비스 없이 전체 플로우 실행·테스트 | 두 구현(Memory/Supabase)을 동기화해야 함 |
| 쿠폰 발급을 DB RPC(`claim_benefit`) | 행 잠금으로 수량 차감·중복 방지를 원자적으로 | 로직이 SQL 에 일부 중복 (메모리 구현은 동기 구간으로 동일 보장) |
| zod | 서버 측 검증 단일 소스 | — |

## 정책이 코드에 반영된 위치
- 보상과 평가 분리: 혜택 발급 경로는 피드백 내용·감정을 읽지 않음. `kind='thanks'` 는 "피드백 존재 여부"만 확인하며 플래그 뒤에 비활성
- 비공개 피드백: 기업에게는 익명 식별자만 제공, 공개 리뷰 기능 없음
- 승인 게이트: 서비스·혜택은 `pending` 으로 시작, 수정 시 재검토, `issuer_authority_confirmed` 필수
- 광고 분리: `sponsored` 는 관리자만 설정, 탐색 화면에서 "광고" 영역으로 분리, 추천에서 제외
- 'Verified' 표기 없음. 서비스는 "사용자 직접 등록"

## 알려진 한계
- 인메모리 데모 저장소는 단일 프로세스 전용
- Rate limit 은 프로세스 메모리 (프로덕션: Redis 필요)
- 비로그인 요청 보호가 `x-forwarded-for` 에 의존
- 비밀번호 재설정/이메일 인증 UI 없음 (Supabase 기본 기능 연결 필요)
