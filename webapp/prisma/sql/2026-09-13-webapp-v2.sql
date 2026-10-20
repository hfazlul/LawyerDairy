-- Webapp v2 additive schema (13 Sep 2026). Apply when Postgres is up:
--   psql lawyer_db -f prisma/sql/2026-09-13-webapp-v2.sql
-- Prefer: npx prisma db push (after prisma generate).
-- Do not treat this file as applied if probe-pg fails (PG_FAIL).

ALTER TYPE "Plan" ADD VALUE IF NOT EXISTS 'ADVANCE';

DO $$ BEGIN
  CREATE TYPE "BillingPeriod" AS ENUM ('MONTH', 'YEAR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "installFingerprint" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "webTrialEndsAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX IF NOT EXISTS "User_installFingerprint_idx" ON "User"("installFingerprint");
CREATE INDEX IF NOT EXISTS "User_lastSeenAt_idx" ON "User"("lastSeenAt");

ALTER TABLE "SubscriptionPackage" ADD COLUMN IF NOT EXISTS "smsMonthly" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionPackage" ADD COLUMN IF NOT EXISTS "smsYearly" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionPackage" ADD COLUMN IF NOT EXISTS "teamSeats" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SubscriptionPackage" ADD COLUMN IF NOT EXISTS "autoHearingSms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SubscriptionPackage" ADD COLUMN IF NOT EXISTS "careerFull" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SubscriptionPackage" ADD COLUMN IF NOT EXISTS "adsOff" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingPeriod" "BillingPeriod" NOT NULL DEFAULT 'MONTH';
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "amountBdt" INTEGER;

ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "essential" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ContentItem" ADD COLUMN IF NOT EXISTS "etag" TEXT;

CREATE TABLE IF NOT EXISTS "CmsSettings" (
  "id" TEXT NOT NULL,
  "playStoreUrl" TEXT NOT NULL DEFAULT 'https://play.google.com/store/apps/details?id=com.mamlaq.app',
  "homeVideoUrl" TEXT NOT NULL DEFAULT '',
  "homeVideoTitle" TEXT NOT NULL DEFAULT 'MAMLAQ গাইড',
  "homeBlogHtml" TEXT NOT NULL DEFAULT '',
  "contactIntro" TEXT NOT NULL DEFAULT '',
  "contactEmail" TEXT NOT NULL DEFAULT '',
  "contactPhone" TEXT NOT NULL DEFAULT '',
  "contactWhatsapp" TEXT NOT NULL DEFAULT '',
  "contactTelegram" TEXT NOT NULL DEFAULT '',
  "footerBlurb" TEXT NOT NULL DEFAULT '',
  "reminderD4Template" TEXT NOT NULL DEFAULT 'আপনার MAMLAQ প্যাকেজ ৪ দিন পর শেষ হবে। নবায়ন করুন: {url}',
  "reminderD3Template" TEXT NOT NULL DEFAULT 'আপনার MAMLAQ প্যাকেজ ৩ দিন পর শেষ হবে। নবায়ন করুন: {url}',
  "supportWhatsapp" TEXT NOT NULL DEFAULT '',
  "smsRatePaisa" INTEGER NOT NULL DEFAULT 40,
  "waRatePaisa" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CmsSettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AdminUser" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "bootstrap" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_userId_key" ON "AdminUser"("userId");

CREATE TABLE IF NOT EXISTS "AdminInvite" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "email" TEXT,
  "usedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminInvite_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AdminInvite_tokenHash_key" ON "AdminInvite"("tokenHash");

CREATE TABLE IF NOT EXISTS "ReferralAttribution" (
  "id" TEXT NOT NULL,
  "referrerId" TEXT NOT NULL,
  "referredUserId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "installFingerprint" TEXT,
  "qualifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralAttribution_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralAttribution_referredUserId_key" ON "ReferralAttribution"("referredUserId");

CREATE TABLE IF NOT EXISTS "ReferralReward" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "qualifiedN" INTEGER NOT NULL,
  "monthsGranted" INTEGER NOT NULL,
  "packageCode" TEXT NOT NULL DEFAULT 'STARTER',
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentClaim" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "name" TEXT,
  "packageCode" TEXT NOT NULL,
  "months" INTEGER NOT NULL DEFAULT 1,
  "note" TEXT,
  "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AnalyticsEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'web',
  "name" TEXT NOT NULL,
  "path" TEXT,
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SmsUsage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT,
  "provider" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'sms',
  "kind" TEXT NOT NULL,
  "qty" INTEGER NOT NULL DEFAULT 1,
  "costPaisa" INTEGER NOT NULL DEFAULT 0,
  "toMasked" TEXT,
  "vendorRef" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SmsUsage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UsageMonth" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "ym" TEXT NOT NULL,
  "clientsCreated" INTEGER NOT NULL DEFAULT 0,
  "casesCreated" INTEGER NOT NULL DEFAULT 0,
  "hearingsCreated" INTEGER NOT NULL DEFAULT 0,
  "findLawyerReceived" INTEGER NOT NULL DEFAULT 0,
  "findLawyerContacted" INTEGER NOT NULL DEFAULT 0,
  "smsSent" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "UsageMonth_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "UsageMonth_workspaceId_ym_key" ON "UsageMonth"("workspaceId", "ym");
