-- Hearing SMS settings on Workspace. Additive. Safe to re-run. Does not drop columns.
-- smsTimesPerDay defaults to once a day. smsAutoEnabled stays null until the lawyer saves the switch.
-- Run before the new webapp serves traffic.
ALTER TABLE "Workspace"
  ADD COLUMN IF NOT EXISTS "smsTimesPerDay" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "smsAutoEnabled" BOOLEAN;
