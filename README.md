**English** · [한국어](README.ko.md)

# UseLoop (CrossFeedback MVP)

An MVP of a platform where customers leave **private feedback** on the services they use, **freely discover** other startups' services, and see the trial perks companies offer. The default UI language is Korean.

> Status: test MVP. Not yet legally reviewed; all legal notices are **samples** → [LEGAL_REVIEW.md](LEGAL_REVIEW.md)

## Features
- **Customers**: sign up / log in, browse services (no login needed), write private feedback, see company replies and progress, claim perks / my perks (code and status), report, set interest categories, request deletion
- **Companies**: register / edit services (admin approval), view / reply to / update status of received feedback, basic stats, register coupons and free trials with quantity and pause, mark customer codes as used
- **Admins**: approve / reject services and perks, handle reports, review deletion requests, manage ad (sponsored) display
- Out of scope: payments, public reviews, app store integration, etc. → [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md)

## Quick start (Demo Mode — no Supabase needed)
```bash
npm install
cp .env.example .env.local   # runs in demo mode even with empty values
npm run dev                  # http://localhost:3000
```
Demo mode uses an **in-memory store** and resets when the server restarts. All companies, services and coupons are **fictional data** marked `[Demo]` / `(Demo)`. A demo banner is always shown at the top of the screen.

Demo accounts (also shown on the login screen, password `demo-password-1234`):

| Role | Email |
|---|---|
| Customer | customer@demo.useloop.test |
| Company | company@demo.useloop.test |
| Admin | admin@demo.useloop.test |

## Environment variables
| Name | Description |
|---|---|
| `DEMO_MODE` | `true` forces demo mode. Use `false` in production |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project values. **Production mode requires both and DEMO_MODE≠true** |
| `SESSION_SECRET` | Signs the demo-mode session cookie |
| `FEATURE_FEEDBACK_THANKS` | Thank-you perk for feedback. **Keep `false` until legal review** |
| `FEATURE_SPONSORED_LABEL` | Ad label / separated display |

The service-role key is not used (the app reaches the DB only with the anon key and the user's JWT, so RLS always applies). `.env*` files are git-ignored.

## Production mode (Supabase)
1. Create a Supabase project → enable email sign-up under Authentication (set an email confirmation policy if needed)
2. Run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) in the SQL Editor (or `supabase db push`)
3. Put the URL / anon key in `.env.local` and set `DEMO_MODE=false`
4. Assign an admin: after sign-up, run `update profiles set role='admin' where email='...'` in SQL (admin sign-up is not possible in the app)
5. `npm run build && npm start`

> ⚠️ **The Supabase production path has not yet been run or verified against a real Supabase instance.** (The migration SQL, RLS, RPCs and the Supabase store adapter are at code-review level only.) Run integration tests against a real project before going public.

## Scripts
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm test            # vitest (40 domain / permission / coupon tests)
npm run build
```

## Deployment (Vercel)
Connect the repository to Vercel and set the environment variables (`NEXT_PUBLIC_SUPABASE_*`, `DEMO_MODE=false`, `FEATURE_*`). Demo mode keeps memory separate per serverless instance, so it is **not suitable for a demo deployment** (local / single instance only). The rate limit is also in-process memory, so replace it with something like Redis in production.

## Documents
[ARCHITECTURE.md](ARCHITECTURE.md) · [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) · [LEGAL_REVIEW.md](LEGAL_REVIEW.md) · [FUTURE_ROADMAP.md](FUTURE_ROADMAP.md)

## Copyright & Usage

Copyright © 2026 Sihun Wang. All Rights Reserved.

This project is publicly available for viewing and portfolio demonstration purposes.

All rights to the original source code, documentation, designs, and project-specific assets are reserved by the author.

No permission is granted to reproduce, modify, redistribute, or commercially use the original materials without prior written authorization, except as permitted by applicable law or GitHub's Terms of Service.

Third-party libraries, dependencies, and other externally sourced materials remain subject to their respective licenses and ownership rights.

For licensing, collaboration, or commercial inquiries, please contact the repository owner.
