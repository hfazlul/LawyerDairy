-- Professional profile phone/court and admin-editable share link.
-- Safe to re-run. Does not drop columns.

ALTER TABLE "LawyerProfile" ADD COLUMN IF NOT EXISTS "publicPhone" TEXT;
ALTER TABLE "LawyerProfile" ADD COLUMN IF NOT EXISTS "practiceCourtName" TEXT;
ALTER TABLE "CmsSettings" ADD COLUMN IF NOT EXISTS "shareUrl" TEXT NOT NULL DEFAULT '';
