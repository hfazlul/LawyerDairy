import { prisma } from '@/lib/prisma'
import type { ChangeOp, Prisma } from '@prisma/client'

type Tx = Prisma.TransactionClient | typeof prisma

export async function recordChange(
  tx: Tx,
  opts: {
    workspaceId: string
    entity: string
    entityId: string
    op: ChangeOp
    version: number
    actorUserId?: string | null
    actorDeviceId?: string | null
    scopeHint?: Record<string, unknown> | null
  },
) {
  await tx.changeLog.create({
    data: {
      workspaceId: opts.workspaceId,
      entity: opts.entity,
      entityId: opts.entityId,
      op: opts.op,
      version: opts.version,
      actorUserId: opts.actorUserId ?? undefined,
      actorDeviceId: opts.actorDeviceId ?? undefined,
      scopeHint: (opts.scopeHint ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
}

const CHANGELOG_TABLES = [
  ['Case', 'case'],
  ['Client', 'client'],
  ['Hearing', 'hearing'],
  ['Document', 'document'],
  ['FeeEntry', 'fee'],
  ['Payment', 'payment'],
  ['Task', 'task'],
  ['Note', 'note'],
  ['CauseListEntry', 'cause_list'],
  ['CaseParty', 'case_party'],
  ['CaseSection', 'case_section'],
] as const

/**
 * Rows written before the trigger existed never show up on a second phone.
 * Insert one changelog row per entity that has none yet.
 */
export async function backfillMissingChangelog() {
  for (const [table, entity] of CHANGELOG_TABLES) {
    try {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "ChangeLog" ("workspaceId", entity, "entityId", op, version, "actorUserId", "actorDeviceId")
        SELECT t."workspaceId", '${entity}', t.id,
          CASE WHEN t."deletedAt" IS NOT NULL THEN 'DELETE'::"ChangeOp" ELSE 'UPSERT'::"ChangeOp" END,
          COALESCE(t.version, 0),
          t."updatedByUserId",
          t."deviceId"
        FROM "${table}" t
        WHERE NOT EXISTS (
          SELECT 1 FROM "ChangeLog" cl
          WHERE cl."workspaceId" = t."workspaceId"
            AND cl.entity = '${entity}'
            AND cl."entityId" = t.id
        )
      `)
    } catch (err) {
      const line = err instanceof Error ? err.message.split('\n')[0] : 'error'
      console.error(`changelog backfill skipped for ${table}: ${line}`)
    }
  }
}

let triggersReady: Promise<void> | null = null

async function ensureTriggers(): Promise<void> {
  if (!triggersReady) {
    triggersReady = ensureChangelogTriggers().catch((err) => {
      triggersReady = null
      const line = err instanceof Error ? err.message.split('\n')[0] : 'error'
      console.error(`changelog triggers: ${line}`)
    })
  }
  await triggersReady
}

/**
 * Install triggers once per process, then backfill on every sync.
 * A one-time backfill misses rows written while the trigger was down.
 */
export async function ensureSyncChangelog(): Promise<void> {
  await ensureTriggers()
  await backfillMissingChangelog()
}

export async function ensureChangelogTriggers() {
  await prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION lawyerdiary_changelog() RETURNS trigger AS $$
    DECLARE
      op_val text;
      ver int;
    BEGIN
      IF TG_OP = 'DELETE' THEN
        RETURN OLD;
      END IF;
      ver := COALESCE(NEW.version, 0);
      IF NEW."deletedAt" IS NOT NULL THEN
        op_val := 'DELETE';
      ELSE
        op_val := 'UPSERT';
      END IF;
      INSERT INTO "ChangeLog"
        ("workspaceId", entity, "entityId", op, version, "actorUserId", "actorDeviceId", "committedAt")
      VALUES
        (NEW."workspaceId", TG_ARGV[0], NEW.id, op_val::"ChangeOp", ver, NEW."updatedByUserId", NEW."deviceId", NOW());
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `)

  const tables = [
    ['Case', 'case'],
    ['Client', 'client'],
    ['Hearing', 'hearing'],
    ['Document', 'document'],
    ['FeeEntry', 'fee'],
    ['Payment', 'payment'],
    ['Task', 'task'],
    ['Note', 'note'],
    ['CauseListEntry', 'cause_list'],
    ['CaseParty', 'case_party'],
    ['CaseSection', 'case_section'],
  ] as const

  for (const [table, entity] of tables) {
    const trig = `trg_${table.toLowerCase()}_changelog`
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS ${trig} ON "${table}"`)
    const sql = `
      CREATE TRIGGER ${trig}
      AFTER INSERT OR UPDATE ON "${table}"
      FOR EACH ROW EXECUTE FUNCTION lawyerdiary_changelog('${entity}');
    `
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch {
      await prisma.$executeRawUnsafe(sql.replace('EXECUTE FUNCTION', 'EXECUTE PROCEDURE'))
    }
  }
}
