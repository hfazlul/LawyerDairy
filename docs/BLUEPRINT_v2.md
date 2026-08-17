# Lawyer Diary BD — Full Blueprint

**তারিখ:** ৫ আগস্ট ২০২৬  
**উদ্দেশ্য:** একক founder-facing blueprint — BD বাজার গবেষণা + বর্তমান webapp (`lawyer-app-git`) এর বাস্তব codebase + mobile-first Lawyer Daily Diary পণ্যের রোডম্যাপ।  
**সতর্কতা:** এই ডকুমেন্ট “যা আছে” এবং “যা পরিকল্পিত” আলাদা করে বলে। Official cause list প্রতিযোগী হিসেবে নয় — **personal lawyer diary OS** হিসেবে দাঁড়ানোই লক্ষ্য।

---

## Source of truth (codebase)

| এলাকা | মূল path |
|--------|----------|
| Prisma schema / models | `prisma/schema.prisma` |
| Case CRUD server actions | `src/actions/admin/case-actions.ts` |
| Cause list queries | `src/actions/admin/cause-list-actions.ts` |
| Dashboard stats | `src/actions/admin/dashboard-stats.ts` |
| Case validation | `src/lib/validations/case.ts` |
| Cause list date / status rules | `src/lib/cause-list-filters.ts` |
| Case helpers / revalidate paths | `src/lib/case-helpers.ts` |
| Auth session / roles | `src/lib/session.ts`, `src/types/auth.ts`, `src/lib/auth.config.ts` |
| Middleware (route guards) | `src/middleware.tsx` |
| Admin dashboard page | `src/app/(admin)/musaAdv/(protected)/dashboard/page.tsx` |
| Lawyer overview | `src/app/(admin)/musaAdv/(protected)/lawyer/page.tsx` |
| Court list pages | `.../lawyer/judge-court|high-court|supreme-court/page.tsx` |
| Cause list page | `.../lawyer/cause-list/page.tsx` |
| Employee cause list (read-only) | `src/app/(admin)/musaAdv/emp/page.tsx` |
| Case UI | `src/components/dashboard/case-table.tsx`, `case-form-modal.tsx` |
| Cause list UI | `src/components/dashboard/cause-list-tabs.tsx` |
| Overview tabs | `src/components/dashboard/lawyer-overview-tabs.tsx` |
| PDF / WhatsApp share | `src/lib/cause-list-report-pdf.ts`, `src/lib/cause-list-pdf.ts` |
| Case DELETE API | `src/app/api/cases/[id]/route.ts` |
| Nav / constants | `src/components/dashboard/sidebar.tsx`, `src/lib/constants.ts`, `src/lib/dashboard-nav.ts` |
| BD court week (Sun–Thu) | `src/lib/week-range.ts` |

**যা নেই (কোডে পাওয়া যায়নি):** official judiciary scraper, Judge model, Hearing entity (আলাদা), mobile app, multi-tenant lawyer accounts, SMS gateway, offline sync।

---

## 1. Executive summary

বাংলাদেশে আইনজীবীদের দৈনন্দিন কাজের সবচেয়ে বড় ব্যথা: **আজকের শুনানি কী, ক্লায়েন্টকে কী বলব, নথি কোথায়, পরের তারিখ কী** — এগুলো ছড়িয়ে থাকে খাতা, WhatsApp, PDF cause list, এবং মনে। Official apps (myCourt/a2i, SC Cause List, causelist.judiciary.gov.bd) cause list দেখায়; সেগুলো **ব্যক্তিগত diary / chamber workflow** নয়।

বর্তমান webapp (`lawyer-app`) ইতিমধ্যে একটি **single-chamber case register + personal cause list + CMS website**। এতে Case CRUD, hearing dates, status lifecycle, today/next-day cause list, PDF + WhatsApp share, admin analytics — সব আছে। কিন্তু এটি desktop-admin কেন্দ্রিক; multi-lawyer SaaS বা morning-briefing diary নয়।

**Verdict:** পণ্যটি **standable as personal Lawyer Diary OS** — official cause list competitor হিসেবে নয়। Webapp-এর case/cause-list লজিক Flutter mobile-এ reuse করে (Next.js backend রেখে) দ্রুত MVP তোলা যায়।

---

## 2. Market research & competitor verdict

### Market verdict
- **দাঁড়ানো যায়:** ব্যক্তিগত / chamber-level daily diary (শুনানি, নোট, ক্লায়েন্ট আপডেট, নথি)।
- **দাঁড়ানো যায় না (core হিসেবে):** সরকারি cause list-এর বিকল্প বা “official scraper” পণ্য।

### প্রতিযোগী / বিকল্প (সংক্ষেপ)

| ধরন | উদাহরণ | সম্পর্ক |
|------|--------|---------|
| Official | myCourt / a2i, SC Cause List, causelist.judiciary.gov.bd | Complement — scrape করে প্রতিযোগিতা নয় |
| Local diary apps | BD Court Diary, Ukil Diary | সরাসরি প্রতিযোগী — UX + habit loop দিয়ে জিততে হবে |
| Practice / case mgmt | CaseDex, LegalFlow | বেশি feature-heavy; diary habit কম |

### Unique angles (পরিকল্পিত পণ্য)
1. **Morning briefing** — আজকের শুনানি + quick actions  
2. **WhatsApp templates** — ক্লায়েন্ট আপডেট এক ট্যাপে  
3. **PDF multi-page scanner** — কাগজ → কেস ফাইল  
4. **Semi-auto case add** — cause list / নোট থেকে দ্রুত এন্ট্রি  
5. **Offline Bangla** — নেট ছাড়াও আজকের তালিকা  
6. Official apps-এর **complement**, replacement নয়  

---

## 3. Product positioning

> **এক বাক্য:** বাংলাদেশি আইনজীবীর প্রতিদিনের আদালত-দিন — সকালের ব্রিফিং থেকে ক্লায়েন্ট WhatsApp পর্যন্ত — একটা ব্যক্তিগত diary OS।

| হ্যাঁ | না |
|-------|-----|
| Personal / chamber case diary | Official judiciary portal |
| Hearing-centric daily habit | Full ERP / accounting (MVP-তে) |
| Bangla-first mobile | Desktop CMS website clone |
| Reuse existing case schema | Scrape-as-core |

**Brand tone:** বিশ্বাসযোগ্য, আদালত-ঘনিষ্ঠ, navy / parchment / brass — purple glass AI aesthetic নয়।

---

## 4. Existing webapp — what is already built

### 4.1 Architecture / stack

| Layer | বাস্তব |
|-------|--------|
| Framework | Next.js **15.0.3** (App Router), React 18 |
| Auth | NextAuth v5 (`next-auth@5.0.0-beta.25`), JWT session ~30 days |
| DB | PostgreSQL + Prisma 5 (`prisma/schema.prisma`) |
| UI | Tailwind, Radix, shadcn-style components, Recharts |
| Mutations | Server Actions + CSRF (`requireAdminMutation`) |
| Deploy shape | Admin base path configurable (`NEXT_PUBLIC_ADMIN_PATH_PREFIX` → `/musaAdv` বা `/saifulAdv`) |
| Roles | `AdminAccountRole`: `ADMIN` \| `EMPLOYEE` — **আলাদা “lawyer” role নেই**; admin = chamber owner |

**দুই পৃষ্ঠা এক অ্যাপে:**
1. **Public CMS site** — home, services, appointment, about, contact  
2. **Protected admin / lawyer tools** — dashboard, cases, cause list, backup  

Employee portal (`.../emp`) শুধু **cause list read-only** দেখে।

### 4.2 Data models (cases, cause list, etc.)

#### Case-related (আছে)

```prisma
enum CourtType { JUDGE_COURT | HIGH_COURT | SUPREME_COURT }
enum OnBehalf  { COMPLAINANT | ACCUSED }

model Case {
  id, serial?, clientName, caseNo
  court: CourtType
  courtType: String      // free-text (e.g. bench/court name)
  caseType: String
  onBehalf: OnBehalf
  contactNo, email?, caseFileLink?
  previousDate?, nextDate?
  steps?                 // HTML rich text
  status                 // "active" | "completed" | "deactive" (+ legacy "failed")
  history CaseHistory[]
}

model CaseHistory {
  caseId, date, action, status
}
```

**Validation** (`src/lib/validations/case.ts` → `caseSchema`): উপরের ফিল্ডগুলো Zod দিয়ে enforce।

#### Auth / ops (আছে)
- `Admin` — name, email, phone, password, secretKey?, role  
- `Archive`, `AuditLog` — soft-delete archive + audit  
- CMS models — `SiteSetting`, `HeroSlide`, `ServicePage`, messages, ইত্যাদি  

#### নেই (schema-এ)
- `Judge`, `Hearing`, `CauseListEntry`, `Court` master table  
- Multi-tenant `Lawyer` / `Chamber` / `Client` user  
- Document blob storage model (শুধু `caseFileLink` URL)  
- Notification / SMS / push tokens  

**Cause list = আলাদা টেবিল নয়।** এটি `Case.nextDate` / `previousDate` + status দিয়ে derived view।

### 4.3 Dashboard logic

**Page:** `src/app/(admin)/musaAdv/(protected)/dashboard/page.tsx`  
**Stats:** `getDashboardStats()` in `src/actions/admin/dashboard-stats.ts`

প্রবাহ:
1. প্রথমে `autoCompleteStaleActiveCases()` চালায় — `nextDate` অতীতে চলে গেলে active → `completed`।  
2. Metrics:
   - `totalCases`, `solvedCases` (`completed`), `deactiveCases` (`deactive`/`failed`)
   - `pendingCases` = running active (`isRunningActiveCase` — আজ/ভবিষ্যৎ `nextDate`)
   - `runningCasesThisWeek` = Sun–Thu week range (`getSunThuWeekRange`)
   - Monthly / yearly created counts (raw SQL), court distribution (`groupBy court`)
3. UI: `AnalyticsCards` + `Charts` + `DashboardMessages` (appointment/contact inbox)

এটি **analytics dashboard**, morning briefing নয়।

### 4.4 Case add / management logic

**UI entry points**
- Overview: `LawyerOverviewTabs` → `CaseTable` (All / by court / Completed / Deactivated)  
- Per-court pages: Judge / High / Supreme — active only, `lockCourt`  
- Modal: `CaseFormModal` — create + edit  

**Server actions** (`case-actions.ts`)

| Function | কাজ |
|----------|-----|
| `createCase` | serial = max+1; history: created + optional next hearing + steps |
| `updateCase` | partial update; date/steps পরিবর্তনে history |
| `toggleCaseStatus` | active / completed / deactive |
| `reopenCase` | deactive/completed → active; **nextDate + steps বাধ্যতামূলক** |
| `deleteCase` / `DELETE /api/cases/[id]` | archive-এ যায় (`deleteCaseRecord`) |
| `getCaseHistory` | history panel; optional phone filter |
| `autoCompleteStaleActiveCases` | past `nextDate` → completed |

**Client rules** (`case-table.tsx`)
- Next hearing **অতীত তারিখ হতে পারে না** (create/edit UI)  
- Search: client, contact, case no  
- Status reopen dialog  
- CSRF-protected mutations (admin only)

**Status semantics** (`cause-list-filters.ts`)
- `active` + upcoming/today hearing → “running”  
- `active` + past hearing → stale → auto-complete  
- `deactive` / `failed` → cause list-এ **previousDate** দিয়ে ম্যাচ  
- Overview “Completed” tab = `completed` **অথবা** stale active  

### 4.5 Cause list logic

**এটি scraper নয় — chamber-এর নিজস্ব কেস থেকে hearing calendar।**

**Queries** (`cause-list-actions.ts`)
- `getScheduledCases` — `nextDate` আছে, অথবা deactive/failed + `previousDate`  
- `getTodayCases` / `getNextDayCases` — active + date window  
- `getCauseListReportData` — selected IDs + history (PDF-এর জন্য)

**UI** (`CauseListTabs`)
- Quick filters: **Today** / **Next day** / **Custom multi-date calendar**  
- Date match: `caseMatchesCauseListDate`  
- Export: multi-page PDF (`buildCauseListReportPdf`) → Print / open  
- **WhatsApp Share** — Web Share API বা download + manual attach (`shareCauseListPdf`)  
- Calendar-এ hearing count badges  

**Access**
- Admin: full cause list + case edit (যদি `readOnlyCases` false)  
- Employee (`emp/page.tsx`): same list, `readOnlyCases`  

**PDF content** — hearing date groups, case fields, steps (HTML stripped), history timeline।

### 4.6 Gaps vs mobile diary product

| Mobile diary চাহিদা | Webapp আজ |
|---------------------|-----------|
| Morning briefing push / home screen | নেই (শুধু analytics) |
| Offline Bangla day list | নেই |
| WhatsApp **text templates** | PDF share আছে; template message নেই |
| Multi-page document scanner | নেই (`caseFileLink` URL only) |
| Semi-auto case add from photo/OCR | নেই (ম্যানুয়াল form) |
| Multi-lawyer / multi-device sync | Single Admin + Employee; no mobile API surface |
| Personal notes / todos per hearing | `steps` + `CaseHistory` আংশিক; dedicated note UX নেই |
| Official cause list import | নেই (এবং core হিসেবে করা উচিত নয়) |
| SMS reminders | নেই |
| Judge / courtroom master data | নেই (`courtType` free text) |
| Public REST for Flutter | প্রাথমিকভাবে Server Actions; `DELETE /api/cases/[id]` ছাড়া case API সীমিত |

---

## 5. Target product: Lawyer Daily Diary (mobile-first)

**নাম কাজের:** Lawyer Diary BD  
**Primary user:** ব্যক্তিগত advocate / ছোট chamber  
**Secondary:** junior / clerk (webapp-এর Employee-এর মতো read-mostly)

**Core job-to-be-done**
> সকালে খুলেই দেখব আজ কী আছে → কোর্টে নোট রাখব → ক্লায়েন্টকে এক ট্যাপে জানাব → পরের তারিখ সেট করব।

Webapp থেকে **reuse:** `Case` / `CaseHistory` semantics, court enums, cause-list date rules, PDF report concepts, role split (owner vs staff)。

নতুন করে **build:** Flutter client, morning loop, offline, scanner, templates, lightweight mobile API।

---

## 6. Feature blueprint (MVP / Phase 2 / Phase 3)

### MVP (০–৯০ দিন) — Daily Diary v1
- Auth (phone/email) — map to existing `Admin` / later multi-user  
- Case list + add/edit (same fields as `caseSchema`)  
- Today / Tomorrow / custom day cause list (port `CauseListTabs` logic)  
- Status: active / completed / deactive + reopen rules  
- Case history timeline  
- Morning home: আজকের শুনানি count + list  
- Bangla UI strings  
- PDF export of day list (reuse report structure)  
- Basic WhatsApp share (file or prefilled text)  
- Offline cache of today’s list  

### Phase 2
- WhatsApp message templates (hearing adjourned / next date / fee reminder)  
- Document scanner (multi-page PDF → attach / Drive link)  
- Semi-auto case add (OCR assist — user confirms)  
- Push / local reminders (hearing morning)  
- Staff seat (Employee-equivalent read-only)  
- Chamber week view (Sun–Thu — already in `week-range.ts`)  

### Phase 3
- Chamber plan: multiple lawyers, shared cause list  
- SMS add-on  
- Client mini-view (opt-in link)  
- Analytics (reuse dashboard metrics)  
- Optional **manual** paste/import from official PDF (not live scrape)  

---

## 7. Daily habit loop

```
রাত/সকাল  →  Morning Briefing (আজকের কেস)
     ↓
কোর্ট     →  Open case → Steps/note → Next date
     ↓
বিকেল    →  WhatsApp template → ক্লায়েন্ট
     ↓
সন্ধ্যা   →  Tomorrow peek + incomplete follow-ups
```

Webapp ইতিমধ্যে loop-এর **data spine** দেয় (`nextDate`, `steps`, history, cause list PDF)। Mobile-এর কাজ: loop-টাকে **habit** বানানো।

---

## 8. Monetization

| Tier | মূল্য (indicative) | কী থাকে |
|------|-------------------|---------|
| Free | ৳০ | Limited cases, today list, basic add |
| Pro | ৳১৪৯–২৪৯ / মাস | Unlimited cases, PDF, templates, offline, scanner |
| Chamber | ৳৪৯৯–৯৯৯ / মাস | Multi-user, shared list, staff seats |
| SMS add-on | আলাদা | Reminder SMS |

Web CMS + public site আলাদা value (বর্তমান product) — diary subscription-এর সাথে bundle করা যায় পরে।

---

## 9. Tech recommendation (Flutter + reuse Next.js backend)

| সিদ্ধান্ত | কারণ |
|-----------|------|
| **Flutter** mobile | Offline, camera/scanner, Bangla fonts, one codebase Android+iOS |
| **Keep Next.js + Prisma** | Case/cause-list লজিক proven; CMSও এখানে |
| নতুন **Route Handlers / API** | Flutter-এর জন্য JSON API (`/api/mobile/...`) — Server Actions শুধু web |
| Shared domain rules | `cause-list-filters`, status lifecycle, week-range — TypeScript package বা duplicated carefully in Dart |
| Auth | JWT/session bridge; Employee vs Admin permissions আগের মতো |
| Storage | PostgreSQL একই; files → object storage / Drive links initially |

**করো না:** আলাদা scrapy microservice “official cause list sync” কে MVP core বানিও না।

---

## 10. Premium UI direction

- **Palette:** navy, parchment, brass/gold accent (site theme fields `themeNavy` / `themeGold` ইতিমধ্যে CMS-এ আছে)  
- **Avoid:** purple glassmorphism, generic SaaS purple-indigo, fake “Legal AI” glow  
- Typography: readable Bangla + clear case numbers  
- Home = briefing composition, dashboard clutter নয়  
- Motion: subtle day-change / list reveal — noise নয়  

---

## 11. 90-day roadmap

| দিন | ফোকাস |
|-----|--------|
| ১–১৪ | Mobile API design; auth; port Case CRUD read/write |
| ১৫–৩৫ | Flutter shells: Today / Cases / Add Case / History |
| ৩৬–৫০ | Cause list parity (today/next/custom) + PDF |
| ৫১–৬৫ | Offline cache + Bangla copy + morning home |
| ৬৬–৮০ | WhatsApp text share + polish + TestFlight/Play internal |
| ৮১–৯০ | 10–20 lawyer pilot; pricing experiment; bugfix |

Parallel (web): API stability, don't rewrite CMS।

---

## 12. Mapping: existing web features → mobile diary features

| Web (আছে) | Mobile diary |
|-----------|--------------|
| `Case` + `CaseFormModal` | Add/Edit Case screen |
| `LawyerOverviewTabs` / court pages | Cases tab + court filters |
| `CauseListTabs` today/next/custom | Home + Cause List |
| `CaseHistory` / history panel | Timeline on case detail |
| `autoCompleteStaleActiveCases` | Same server job / sync rule |
| `buildCauseListReportPdf` + WhatsApp share | Export & share |
| `getDashboardStats` | Phase 2/3 Insights (not MVP home) |
| Employee read-only cause list | Staff mode |
| Public CMS site | Out of diary MVP scope (keep web) |
| Backup / archive system | Admin-only web; mobile soft-delete later |

---

## 13. What NOT to build / risks

### Build করো না (এখন)
- Official judiciary **scraping as core** (legal + brittle + trust risk)  
- Pirated law books / bare act dumps  
- “Fake legal AI” that invents orders or advice  
- Full accounting / HR / chamber ERP in v1  
- Replacing myCourt for users — position as **complement**  

### ঝুঁকি
| Risk | Mitigation |
|------|------------|
| Scraper dependency | Manual entry + optional PDF paste only |
| Single-tenant schema | Add `chamberId` before multi-lawyer launch |
| Server Actions ≠ mobile | Explicit REST/JSON layer |
| Data loss fear | Keep archive + backup on web; mobile confirm deletes |
| Habit failure | Obsess over morning briefing UX, not feature count |

---

## Closing note for the founder

আজকের webapp ইতিমধ্যে **chamber case register + personal cause list engine**। নতুন পণ্যের কাজ নতুন database আবিষ্কার করা নয় — **সেই engine-কে প্রতিদিনের মোবাইল অভ্যাসে** নিয়ে যাওয়া। Official cause list-এর সাথে লড়াই নয়; আইনজীবীর সকাল–বিকেলের ব্যক্তিগত OS হিসেবে জয়।
