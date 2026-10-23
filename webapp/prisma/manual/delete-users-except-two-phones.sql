-- Idempotent. Deletes every user except the two kept phones.
-- Kept: 01531390692 (web admin, any username including hfazlul)
-- Kept: 01858173601 (sub-admin, any username including fazlul_3601)
-- Every other account is removed, including fazlul_9818.
-- Does not drop the database. Does not print hashes or the database URL.
-- Safe to run again: a second run deletes zero users.

BEGIN;

DROP TABLE IF EXISTS drop_user;
CREATE TEMP TABLE drop_user ON COMMIT DROP AS
SELECT id
FROM "User"
WHERE right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10)
      NOT IN ('1531390692', '1858173601');

DROP TABLE IF EXISTS drop_ws;
CREATE TEMP TABLE drop_ws ON COMMIT DROP AS
SELECT id
FROM "Workspace"
WHERE "ownerUserId" IN (SELECT id FROM drop_user);

DELETE FROM "Payment" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "FeeEntry" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Hearing" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Note" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Task" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Document" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "CauseListEntry" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "CommunicationMessage" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "TimelineEvent" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "CaseParty" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "CaseSection" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "AuditLog" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "ChangeLog" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "DeviceSyncState" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Subscription" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "SyncOpLog" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Case" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Client" WHERE "workspaceId" IN (SELECT id FROM drop_ws);
DELETE FROM "Workspace" WHERE id IN (SELECT id FROM drop_ws);

DELETE FROM "WorkspaceMember" WHERE "userId" IN (SELECT id FROM drop_user);
DELETE FROM "JoinRequest" WHERE "requesterUserId" IN (SELECT id FROM drop_user);
DELETE FROM "LawyerReview" WHERE "requesterUserId" IN (SELECT id FROM drop_user);
DELETE FROM "ConsultationRequest"
WHERE "lawyerProfileId" IN (
  SELECT id FROM "LawyerProfile" WHERE "userId" IN (SELECT id FROM drop_user)
);
DELETE FROM "ReferralAttribution"
WHERE "referrerId" IN (SELECT id FROM drop_user)
   OR "referredUserId" IN (SELECT id FROM drop_user);
DELETE FROM "AdminInvite" WHERE "createdById" IN (SELECT id FROM drop_user);
DELETE FROM "FcmDispatch" WHERE "userId" IN (SELECT id FROM drop_user);

DELETE FROM "User" WHERE id IN (SELECT id FROM drop_user);

COMMIT;
