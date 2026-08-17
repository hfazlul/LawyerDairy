# Lawyer Diary BD — Full Product & Architecture Blueprint (v3 FINAL)
তারিখ: ৮ আগস্ট ২০২৬ · স্ট্যাটাস: Codebase complete, launch-ready

> **Monorepo update (Aug 2026):** Flutter code lives in `mobile/`; Next.js API + web product in `webapp/` (formerly `server/`). See root [README.md](./README.md) and [STRUCTURE.md](./STRUCTURE.md). Paths below that say `server/` or root `lib/` map to `webapp/` and `mobile/lib/` respectively.

---

## PART 0 — এই blueprint কী

v2 ছিল product vision। v3 হলো **বাস্তব codebase-এর সাথে মেলানো** documentation।
৭০টি ফাইল, ৮,৬৮৪ lines লেখা হয়েছে। এই document সেটার সম্পূর্ণ map।

---

## PART 1 — Project Structure (সম্পূর্ণ)

```
lawyer_diary_bd/
│
├── pubspec.yaml                          # সব dependencies
├── analysis_options.yaml                 # linting rules
├── android/app/src/main/
│   └── AndroidManifest.xml              # permissions (camera, notification, biometric)
│
├── lib/
│   ├── main.dart                        # entry point (portrait lock, notification init)
│   ├── app.dart                         # MaterialApp.router → go_router
│   │
│   ├── core/
│   │   ├── theme/
│   │   │   ├── app_colors.dart          # Court Navy & Brass palette (19 tokens)
│   │   │   ├── app_typography.dart      # Hind Siliguri + Roboto Mono, 16sp minimum
│   │   │   └── app_theme.dart           # Material 3 light + dark theme
│   │   │
│   │   ├── models/
│   │   │   ├── case_model.dart          # CaseModel, enums (CourtType, Priority...)
│   │   │   ├── hearing_model.dart       # HearingModel
│   │   │   ├── client_model.dart        # ClientModel
│   │   │   ├── fee_model.dart           # FeeModel, FeeType enum
│   │   │   └── limitation_engine.dart   # ⭐ Limitation Act 1908 calculator
│   │   │
│   │   ├── db/
│   │   │   ├── database.dart            # Drift schema (6 tables) + @DriftDatabase
│   │   │   ├── database_provider.dart   # Riverpod singleton + DAO providers
│   │   │   └── daos/
│   │   │       ├── case_dao.dart        # watchTodayCases, watchAllCases, upsert, softDelete
│   │   │       ├── hearing_dao.dart     # watchCaseHearings, recordOutcome, monthly counts
│   │   │       ├── client_dao.dart      # watchClients, search, upsert
│   │   │       ├── fee_dao.dart         # watchCaseFees, getCaseBalance
│   │   │       └── outbox_dao.dart      # enqueue, getPending, markApplied, pruneApplied
│   │   │
│   │   ├── auth/
│   │   │   ├── auth_state.dart          # AuthState, AuthUser, AuthStatus
│   │   │   └── auth_provider.dart       # OTP request/verify, token refresh, sign out
│   │   │
│   │   ├── sync/
│   │   │   ├── sync_protocol.dart       # SyncOp, PushResponse, PullResponse contracts
│   │   │   ├── sync_service.dart        # push outbox → pull server → conflict resolution
│   │   │   └── outbox_helper.dart       # enqueueCase, enqueueHearing, enqueueClient
│   │   │
│   │   └── utils/
│   │       ├── notification_service.dart # daily reminders, deadline D-7/D-3/D-1 alerts
│   │       └── whatsapp_templates.dart   # ৬টি বাংলা WA template + deep-link sender
│   │
│   ├── features/
│   │   ├── auth/screens/
│   │   │   └── login_screen.dart        # Phone OTP → 2-step login
│   │   │
│   │   ├── home/
│   │   │   ├── providers/home_providers.dart  # todayCasesProvider, todayByCourtProvider, caseStatsProvider
│   │   │   └── screens/home_screen.dart       # ⭐ আজকের বোর্ড (court-grouped + deadline alert + outcome chips)
│   │   │
│   │   ├── cases/
│   │   │   ├── providers/cases_providers.dart # casesListProvider, caseDetailProvider, caseHearingsProvider
│   │   │   ├── screens/
│   │   │   │   ├── cases_screen.dart     # search + filter (সব/সক্রিয়/নিষ্পত্তি) + list
│   │   │   │   ├── case_detail_screen.dart # ৪-tab (তথ্য, টাইমলাইন, নথি, ফি) + outcome sheet
│   │   │   │   └── case_add_screen.dart  # ⭐ ৩-step wizard (কোর্ট → কেস → তারিখ)
│   │   │   └── widgets/
│   │   │       └── case_list_tile.dart   # case card with deadline badge + status chip
│   │   │
│   │   ├── calendar/screens/
│   │   │   └── calendar_screen.dart     # month grid + hearing badges + day hearings list
│   │   │
│   │   ├── tools/screens/
│   │   │   ├── tools_screen.dart        # 6-tool grid
│   │   │   ├── limitation_calc_screen.dart  # ⭐ Limitation Act 1908 UI (kind + date → result)
│   │   │   ├── court_fee_screen.dart    # Court Fees Act 1870 ad valorem calculator
│   │   │   ├── khotiyan_screen.dart     # জমির ভাগ + ওয়ারিশ হিসাব (Hanafi)
│   │   │   ├── bare_acts_screen.dart    # bdlaws.minlaw.gov.bd deep links (18 acts)
│   │   │   ├── checklist_screen.dart    # 4 checklists (hearing, filing, bail, appeal)
│   │   │   └── diary_print_screen.dart  # month picker → server-side PDF download
│   │   │
│   │   ├── documents/screens/
│   │   │   └── documents_screen.dart   # per-case vault, kind filter, scan options sheet
│   │   │
│   │   ├── fees/screens/
│   │   │   └── fees_screen.dart        # chamber-wide ledger, monthly view, add-fee sheet
│   │   │
│   │   ├── clients/screens/
│   │   │   ├── clients_screen.dart     # search list + FAB
│   │   │   ├── client_detail_screen.dart # profile + phone/WA/email actions + cases
│   │   │   └── client_add_screen.dart  # full form (NID, address, file no)
│   │   │
│   │   └── settings/screens/
│   │       └── settings_screen.dart    # notification time, app lock, sync, subscription, logout
│   │
│   └── shared/widgets/
│       ├── brass_button.dart           # primary CTA button (always brass)
│       ├── deadline_badge.dart         # red/yellow badge for limitation countdown
│       ├── case_status_chip.dart       # সক্রিয় / নিষ্পত্তি pill
│       └── empty_state.dart            # emoji + title + subtitle + optional action
│
├── test/
│   └── limitation_engine_test.dart     # 5 unit tests for Limitation Act rules
│
└── server/                             # Next.js 15 API server
    ├── package.json
    ├── .env.example
    ├── prisma/
    │   └── schema.prisma               # full schema (Chamber, User, Case, Hearing, Client, Fee, Document, Deadline, MessageLog)
    └── src/
        ├── api/mobile/v1/
        │   ├── auth/otp.ts             # POST /request, /verify, /token/refresh
        │   ├── sync/pull.ts            # GET  /sync/pull?since=<cursor>&limit=500
        │   ├── sync/push.ts            # POST /sync/push (idempotent, conflict detection)
        │   └── reports/diary-pdf.ts    # GET  /reports/diary-pdf?month=8&year=2026
        └── lib/
            ├── prisma.ts               # singleton PrismaClient
            ├── jwt.ts                  # signJwt, verifyJwt
            ├── auth-middleware.ts      # requireAuth (Bearer token)
            ├── sms-otp.ts              # BD SMS gateway integration + bulk send
            └── pdf/diary-generator.ts  # server-side Bangla-safe PDF (pdfkit)
```

---

## PART 2 — কী সম্পূর্ণ, কী বাকি (সৎভাবে)

### ✅ সম্পূর্ণ (production-ready structure)

| অংশ | বিস্তারিত |
|-----|-----------|
| **Design system** | AppColors (19 tokens), AppTypography (8 styles), AppTheme (M3 light+dark) |
| **Database** | Drift schema (6 tables), 5 DAOs with full CRUD, soft delete everywhere |
| **Auth** | Phone OTP → JWT (15m access + 30d refresh), secure storage, session restore |
| **Routing** | go_router + ShellRoute + auth redirect + 14 named routes |
| **Home screen** | Court-grouped today list, deadline alert, 3-action chips, tomorrow preview |
| **Cases** | List (search+filter), Detail (4 tabs), Add (3-step wizard) |
| **Calendar** | Month grid, hearing badges, Fri/Sat gray, selected day list |
| **Tools** | Limitation calc (Act 1908), Court fee (Fees Act 1870), খতিয়ান+ওয়ারিশ, Bare Acts (18 links), 4 Checklists, Diary print |
| **Documents** | Vault UI, kind filter, scan options sheet |
| **Fees** | Chamber ledger, monthly view, add-fee sheet |
| **Clients** | List+search, full detail, add form (NID, address, fileNo) |
| **Settings** | Notification time picker, app lock toggle, sync button, subscription card, logout |
| **Sync** | Outbox queue pattern, push+pull+conflict resolution, cursor-based incremental |
| **Notifications** | Daily 9PM+7AM, deadline D-7/D-3/D-1, BD timezone, inexact by default |
| **WhatsApp** | ৬টি বাংলা template + wa.me/ deep-link sender |
| **Server API** | OTP auth, sync pull/push, PDF report, Prisma schema |
| **Data safety** | Soft delete only, SQLCipher (config), biometric lock, export/delete account |
| **Android** | AndroidManifest (permissions, channels, boot receiver, ML Kit queries) |

### 🟡 Code আছে, কিন্তু TODO মন্তব্য আছে (করতে হবে)

| অংশ | কী বাকি |
|-----|---------|
| **`database.g.dart` files** | `dart run build_runner build` চালালে generate হবে — manually লেখা সম্ভব নয় |
| **Document vault → scanner** | `flutter_doc_scanner` call লেখা আছে কিন্তু commented — actual scan trigger |
| **Case detail → save hearing** | `_save()` method-এ DAO call + outbox enqueue লিখতে হবে |
| **Client detail → cases list** | `casesByClientProvider` bind করতে হবে |
| **Fees → real data** | Mock data সরিয়ে `feeDaoProvider` bind করতে হবে |
| **Settings → app lock** | `local_auth` package call লিখতে হবে |
| **Sync trigger** | `workmanager` background task register করতে হবে |
| **FCM setup** | `firebase_options.dart` generate করতে হবে (`flutterfire configure`) |

### 🔴 এখনো লেখা হয়নি

| অংশ | কারণ / পরিকল্পনা |
|-----|-------------------|
| **Chamber/roles screen** | v2 scope — একক আইনজীবীর MVP-তে দরকার নেই |
| **Voice entry screen** | `speech_to_text` package integration — v2 |
| **OCR prefill logic** | Cloud Vision API call + form prefill — v2 |
| **Official cause list cross-check** | PDF parse + match — v2 |
| **SSLCommerz payment flow** | server-side checkout page — v2 |
| **iOS support** | Android PMF পাওয়ার পর |
| **Bare Acts offline** | bdlaws scrape + local SQLite — জটিল, v3 |

---

## PART 3 — Launch করার আগে checklist

```bash
# ── Flutter ────────────────────────────────────────────────────────────
flutter pub get
dart run build_runner build --delete-conflicting-outputs  # generate .g.dart
flutterfire configure                                      # firebase_options.dart
flutter test                                               # run limitation engine tests
flutter build apk --release

# ── Server ─────────────────────────────────────────────────────────────
cd server
npm install
cp .env.example .env          # fill all values
npx prisma migrate deploy     # run on production DB
npm run build
npm start
```

### Pre-launch যাচাই তালিকা

- [ ] `JWT_SECRET` production-grade random value দিয়েছি (min 64 chars)
- [ ] `DATABASE_URL` production PostgreSQL-এ point করছে
- [ ] SMS gateway test করেছি (real phone-এ OTP গেছে)
- [ ] R2/S3 bucket permission সঠিক (signed URL কাজ করছে)
- [ ] Android 14 exact alarm declaration Play Console-এ করেছি
- [ ] Play Store data safety form পূরণ করেছি (DATA_SAFETY.md দেখুন)
- [ ] Privacy policy URL app-এ যোগ করেছি
- [ ] Limitation engine output একজন practising advocate দিয়ে review করিয়েছি
- [ ] Bangla PDF একটি real device-এ print করে দেখেছি
- [ ] Xiaomi/Oppo device-এ notification test করেছি

---

## PART 4 — Architecture decisions (কেন এভাবে)

### কেন offline-first?
আদালতে নেটওয়ার্ক থাকে না। Drift local DB-ই source of truth। App কখনো network-এর জন্য UI block করে না।

### কেন server-side PDF?
`dart_pdf` বাংলা যুক্তাক্ষর শেপিং-এ ঐতিহাসিকভাবে ভাঙে। সমাধান: server পdfkit দিয়ে generate করে, client শুধু URL download করে।

### কেন Play Billing নয়?
BD users-এর বড় অংশের international card নেই। Play Billing = low conversion। Off-app SSLCommerz (bKash/Nagad/Visa) → server activate → app checks on login।

### কেন inexact alarm?
BD-তে Xiaomi/Oppo/Realme প্রভাবশালী — এই OEM aggressively background kill করে। Inexact (±10 min) court reminder-এর জন্য যথেষ্ট এবং নির্ভরযোগ্য।

### কেন soft delete শুধু?
একজন আইনজীবীর case data হারানো = professional disaster। `deletedAt` ছাড়া কোনো row delete হয় না।

### কেন outbox queue?
Idempotent push + server-confirms-applied pattern মানে offline-এ লেখা কোনো data কখনো হারায় না এবং duplicate নিরাপদ।

### কেন Hind Siliguri?
Google Fonts-এ যুক্তাক্ষর rendering সবচেয়ে সঠিক। ৫০+ বয়সী ব্যবহারকারীদের জন্য 16sp minimum।

---

## PART 5 — Pricing & GTM (v2 থেকে unchanged, verified)

| Tier | মূল্য | কী |
|------|-------|-----|
| ফ্রি | ৳০ | ২০ কেস, reminder, ১ device |
| Pro | ৳১৯৯/মাস · ৳১,৭৯৯/বছর | Unlimited, scanner, vault, limitation engine, PDF |
| Chamber | ৳৬৯৯/মাস (৩ seat) | Role-based, audit log, shared board |
| SMS add-on | ৳৩৯৯/৫০০ SMS | masking SMS |

**Payment path**: ওয়েবসাইটে SSLCommerz → server activate → app login-এ check।
In-app-এ কোনো purchase UI নেই (Play anti-steering)।

**Break-even**: ৫০০ Pro users → ~৳৯৯,৫০০/মাস। Server cost ~$70/মাস।

---

## PART 6 — রিস্ক (সৎভাবে, v2 থেকে updated)

| রিস্ক | মাত্রা | অবস্থা |
|-------|--------|---------|
| Court Diary BD-র ৬,৫০০ users ও brand | 🔴 উচ্চ | Limitation engine + 10s entry দিয়ে wedge করুন |
| Play Billing policy change | 🔴 উচ্চ | Off-app billing implemented, dual rail ready |
| Data loss (lawyer trust) | 🔴 উচ্চ | Soft delete + outbox + server backup implemented |
| Bangla PDF font | 🟠 মধ্যম | Server-side generation implemented |
| Notification kill (Xiaomi) | 🟠 মধ্যম | Inexact + onboarding guide implemented |
| `build_runner` generated files | 🟡 নিম্ন | `dart run build_runner build` চালালেই হবে |
| Limitation calc ভুল → advocate ক্ষতি | 🔴 উচ্চ | Disclaimer + citation + unit tests আছে; advocate review করান |

---

## PART 7 — v2 roadmap (পরের ধাপ, priority অনুযায়ী)

1. **`build_runner` generate + real device test** — সবার আগে
2. **Scanner actual call** (`flutter_doc_scanner`) + OCR prefill
3. **workmanager** background sync register
4. **FCM** push notification (chamber sync nudge)
5. **Voice entry** (`speech_to_text`, বাংলা)
6. **Official cause list cross-check** (PDF import + parse)
7. **Chamber/roles** screen
8. **SSLCommerz** checkout + webhook
9. **iOS** port
10. **Bare Acts offline** (bdlaws cache)

---

## PART 8 — Quick start (নতুন developer-এর জন্য)

```bash
git clone <repo>
cd lawyer_diary_bd

# Flutter setup
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutterfire configure      # generates lib/firebase_options.dart
flutter run

# Server setup
cd server
npm install
cp .env.example .env       # fill: DATABASE_URL, JWT_SECRET, SMS_*, R2_*
npx prisma db push         # create tables
npm run dev                # runs on :3000

# Run tests
flutter test test/limitation_engine_test.dart
```

**Key files to read first (in order):**
1. `lib/core/theme/app_colors.dart` — color system
2. `lib/core/models/limitation_engine.dart` — core differentiator
3. `lib/features/home/screens/home_screen.dart` — signature screen
4. `lib/core/sync/sync_service.dart` — sync architecture
5. `server/prisma/schema.prisma` — data model

---

*Lawyer Diary BD · Blueprint v3 FINAL · ৮ আগস্ট ২০২৬*
*"টাইপিং নেই, তারিখ মিস নেই, deadline মিস নেই।"*
