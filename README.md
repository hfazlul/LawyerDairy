# Lawyer Diary

Offline-first advocate diary — **Flutter** (`mobile/`) + **Next.js / Prisma / Postgres** (`webapp/`).

Docs: [`docs/BLUEPRINT_v3_FINAL.md`](docs/BLUEPRINT_v3_FINAL.md) · [`docs/STRUCTURE.md`](docs/STRUCTURE.md)

## Jurisdiction × language (orthogonal)

| Law pack | Content | UI languages |
|----------|---------|--------------|
| **BD** | Bangladesh laws (Limitation 1908, খতিয়ান, bdlaws) | bn / en / ur |
| **IN** | West Bengal / Tripura belt (Limitation 1963 **scaffold**) | bn / en / ur |
| **PK** | Pakistan pack (**scaffold**) | bn / en / ur |

BD + English → **BD content**. IN + Bangla → **IN content**. Soft device suggest on first open; **user must confirm** (no silent switch). UK skipped.

## Payments × guide video matrix

| Jurisdiction | Mobile | Web checkout | Ads (FREE) | Guide video key | Guide may mention web pay? |
|--------------|--------|--------------|------------|-----------------|----------------------------|
| **BD** | Active/Inactive only — **no buy CTA** | SSLCommerz scaffold | Native + rewarded interstitial | `guide_bd` | Yes (soft) |
| **IN** | Play Billing stub | Hidden / note only | Same | `guide_in` | **No** |
| **PK** | Play Billing stub | Hidden / note only | Same | `guide_pk` | **No** |

## Tiers

`FREE` | `STARTER` | `PRO` | `PRO_ADVANCE` (+ legacy `CHAMBER`)

| Surface | STARTER / PRO | PRO_ADVANCE |
|---------|---------------|-------------|
| Web | Cause-list + stats/payment visuals + team 1 | Case manage + cause-list + team 2–3 |
| Web documents | Placeholder: “Available only on phone app” | Same |
| Mobile | Ads off when Active; advanced features gated | Same |

## Local testing

### Webapp

```bash
cd webapp
npm install
cp .env.example .env
# Set DATABASE_URL to a local Postgres instance
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
# sanity: npm run build
```

- Landing: http://localhost:3000  
- Auth: `/signup`, `/login`  
- Dashboard: `/dashboard` (country flag + jurisdiction picker)  
- Packages: `/packages` (BD checkout; IN/PK note)  
- Admin: `/admin`  
- Limitation pack JSON: `/api/web/v1/content/limitation?j=BD` (also `IN` / `PK`)  
- Seed admin: `admin@lawyerdiarybd.com` / `ChangeMeAdmin!234`

### Mobile

```bash
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
# optional: flutter analyze
```

API base (dev): `http://<lan-ip>:3000/api/mobile/v1/`  
Entitlement: `GET /api/mobile/v1/entitlement` (includes jurisdiction + `paymentRail`).

## Production TODOs

- Real SSLCommerz session + webhooks (BD)
- Real Play Billing product IDs + purchase verification (IN/PK)
- AdMob production unit IDs
- Firebase Remote Config for `guide_bd` / `guide_in` / `guide_pk`
- Full Limitation Act 1963 / PK tables (scaffold only today)
- `flutterfire configure`, Drift `build_runner` codegen
- Wire home screen off mocks onto Drift DAOs where still stubbed

##cd d:\VIVI\1\LawyerDairy\webapp
##npm run dev