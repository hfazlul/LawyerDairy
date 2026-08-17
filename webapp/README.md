# Lawyer Diary BD — Webapp

Next.js 15 App Router + Prisma + Postgres.

## Auth model

| Client | Method | Notes |
|--------|--------|-------|
| Mobile | Phone OTP → JWT | `/api/mobile/v1/auth/otp/*` |
| Web | Email + password → httpOnly cookies | `/api/auth/login\|signup` |

Same `User` / `Chamber` tables. `appRole`: `USER` | `ADMIN`. Entitlement = `Chamber.plan` + `subscriptionEndsAt`.

`Chamber.jurisdiction` (`BD`\|`PK`\|`IN`) is the **law pack**; `User.uiLanguage` (`bn`\|`en`\|`ur`) is orthogonal.

## Tiers & gates

| Plan | Cause-list API | Web case manage | Team seats |
|------|----------------|-----------------|------------|
| FREE | no | no | 1 |
| STARTER / PRO | yes | no | 1 |
| PRO_ADVANCE / CHAMBER | yes | yes | 2–3 |

Documents/scan: phone only → `/dashboard/documents` placeholder.

## Payments

| Jurisdiction | Web | Mobile |
|--------------|-----|--------|
| BD | SSLCommerz checkout scaffold | Status only (no buy CTA) |
| IN / PK | No web checkout | Play Billing stub |

## Run (local)

```bash
cd webapp
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Seed admin: `admin@lawyerdiarybd.com` / `ChangeMeAdmin!234`

Routes: `/` landing · `/packages` · `/signup` · `/login` · `/dashboard` · `/admin`

## Email

Brevo primary + Resend fallback; dry-run without keys. See `docs/EMAIL_SETUP.md`.
