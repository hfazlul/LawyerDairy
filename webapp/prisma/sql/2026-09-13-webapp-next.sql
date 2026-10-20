-- Additive schema for 13 Sep 2026 webapp punch-list.
-- Safe to run when `npx prisma db push` cannot reach Postgres.
-- Does not drop columns. Review before production.

-- Join-code / chamber share
DO $$ BEGIN
  CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "joinCode" TEXT;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "autoMessaging" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "smsD1" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "smsD2" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "smsD3" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "Workspace_joinCode_idx" ON "Workspace"("joinCode");

CREATE TABLE IF NOT EXISTS "JoinRequest" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "requesterName" TEXT NOT NULL,
  "requesterPhone" TEXT,
  "code" TEXT,
  "firestoreRequestId" TEXT,
  "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
  "decidedByUserId" TEXT,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JoinRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "JoinRequest_firestoreRequestId_key" ON "JoinRequest"("firestoreRequestId");
CREATE INDEX IF NOT EXISTS "JoinRequest_workspaceId_status_idx" ON "JoinRequest"("workspaceId", "status");
CREATE INDEX IF NOT EXISTS "JoinRequest_requesterUserId_status_idx" ON "JoinRequest"("requesterUserId", "status");

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "JoinRequest" ADD CONSTRAINT "JoinRequest_requesterUserId_fkey"
    FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Forgot-password OTP (hashed, never plaintext)
CREATE TABLE IF NOT EXISTS "PasswordOtpChallenge" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordOtpChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PasswordOtpChallenge_phone_createdAt_idx" ON "PasswordOtpChallenge"("phone", "createdAt");
CREATE INDEX IF NOT EXISTS "PasswordOtpChallenge_userId_createdAt_idx" ON "PasswordOtpChallenge"("userId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "PasswordOtpChallenge" ADD CONSTRAINT "PasswordOtpChallenge_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Find Lawyer
ALTER TABLE "LawyerProfile" ADD COLUMN IF NOT EXISTS "profilePublishedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "LawyerProfile_isListed_verifiedAt_profilePublishedAt_idx"
  ON "LawyerProfile"("isListed", "verifiedAt", "profilePublishedAt");

ALTER TABLE "ConsultationRequest" ADD COLUMN IF NOT EXISTS "lawyerNote" TEXT;
ALTER TABLE "ConsultationRequest" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);
ALTER TABLE "ConsultationRequest" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "ConsultationRequest_deletedAt_idx" ON "ConsultationRequest"("deletedAt");

-- Public config JSON
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "guideCard" JSONB;
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "guideVideos" JSONB;
