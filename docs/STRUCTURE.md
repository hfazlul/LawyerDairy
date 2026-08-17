# Lawyer Diary BD — Monorepo structure

**Path:** `d:\VIVI\1\LawyerDairy`

Split (Aug 2026): Flutter → `mobile/`, Next.js API+web → `webapp/`. Docs under `docs/` + root `README.md`.

---

## Top-level tree

```
LawyerDairy/
├── README.md                    # testing guide + jurisdiction/payment matrix
├── docs/
│   ├── BLUEPRINT_v3_FINAL.md
│   ├── STRUCTURE.md             # this file
│   └── …
├── mobile/                      # Flutter Android app
│   └── lib/core/jurisdiction/   # law pack + UI language + content maps
└── webapp/                      # Next.js 15 + Prisma
    ├── src/lib/jurisdiction.ts
    ├── src/lib/entitlement-gates.ts
    ├── src/lib/content/jurisdictions.ts
    └── prisma/schema.prisma     # Plan + JurisdictionCode + UiLanguage
```

## Monetization alignment

| Surface | Rule |
|---------|------|
| Mobile BD | Active / Inactive only — no Buy CTA |
| Mobile IN/PK | Active / Inactive + Play Billing stub |
| Free users | AdMob native + rewarded interstitial |
| Premium Active | Ads off + gated features |
| Web BD | SSLCommerz packages |
| Web IN/PK | No web-pay steering |

## Still incomplete (honest)

| Item | Notes |
|------|--------|
| SSLCommerz session + webhook | Env present; session create TODO |
| Play Billing product IDs | Stub service only |
| Limitation 1963 / PK tables | `limitation.ts` + `limitation_packs.dart` scaffolds; fill articles |
| Real AdMob / RC guide URLs | Test IDs + env placeholders |
| Home Drift bind | Providers exist; screen still has mock fallback |
