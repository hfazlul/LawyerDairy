-- Additive only. Safe to run when DATABASE_URL is a real DB. Does not wipe.
ALTER TABLE "Act" ADD COLUMN IF NOT EXISTS "effectiveDate" TEXT;

CREATE TABLE IF NOT EXISTS "LawyerReview" (
  "id" TEXT NOT NULL,
  "lawyerProfileId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "stars" INTEGER NOT NULL,
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LawyerReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LawyerReview_requestId_key" ON "LawyerReview"("requestId");
CREATE INDEX IF NOT EXISTS "LawyerReview_lawyerProfileId_createdAt_idx" ON "LawyerReview"("lawyerProfileId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "LawyerReview"
    ADD CONSTRAINT "LawyerReview_lawyerProfileId_fkey"
    FOREIGN KEY ("lawyerProfileId") REFERENCES "LawyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LawyerReview"
    ADD CONSTRAINT "LawyerReview_requesterUserId_fkey"
    FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "LawyerReview"
    ADD CONSTRAINT "LawyerReview_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "ConsultationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
