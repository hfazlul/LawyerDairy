-- Optional defense-in-depth. Do NOT apply until the API sets
-- `SET LOCAL app.workspace_id = '<uuid>'` on every transaction (PgBouncer
-- transaction pooling). Middleware already filters workspaceId in application
-- code. Run: npx tsx scripts/apply-rls.ts  (requires ENABLE_PG_RLS=1)

ALTER TABLE "Case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Client" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hearing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeeEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_ws ON "Case";
CREATE POLICY case_ws ON "Case"
  USING ("workspaceId" = current_setting('app.workspace_id', true));

DROP POLICY IF EXISTS client_ws ON "Client";
CREATE POLICY client_ws ON "Client"
  USING ("workspaceId" = current_setting('app.workspace_id', true));

DROP POLICY IF EXISTS hearing_ws ON "Hearing";
CREATE POLICY hearing_ws ON "Hearing"
  USING ("workspaceId" = current_setting('app.workspace_id', true));

DROP POLICY IF EXISTS fee_ws ON "FeeEntry";
CREATE POLICY fee_ws ON "FeeEntry"
  USING ("workspaceId" = current_setting('app.workspace_id', true));

DROP POLICY IF EXISTS task_ws ON "Task";
CREATE POLICY task_ws ON "Task"
  USING ("workspaceId" = current_setting('app.workspace_id', true));

DROP POLICY IF EXISTS document_ws ON "Document";
CREATE POLICY document_ws ON "Document"
  USING ("workspaceId" = current_setting('app.workspace_id', true));
