-- One successful password OTP handoff per user, channel, and Asia/Dhaka day.
-- Safe to re-run. Does not drop columns.

CREATE TABLE IF NOT EXISTS "PasswordOtpDailySend" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "dhakaDay" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PasswordOtpDailySend_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordOtpDailySend_userId_channel_dhakaDay_key"
  ON "PasswordOtpDailySend"("userId", "channel", "dhakaDay");

CREATE INDEX IF NOT EXISTS "PasswordOtpDailySend_userId_dhakaDay_idx"
  ON "PasswordOtpDailySend"("userId", "dhakaDay");

DO $$ BEGIN
  ALTER TABLE "PasswordOtpDailySend"
    ADD CONSTRAINT "PasswordOtpDailySend_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
