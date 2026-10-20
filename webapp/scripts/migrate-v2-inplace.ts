/**
 * In-place v1 Chamber schema → v2 Workspace schema.
 * Does not drop the database. Old sessions are invalidated.
 */
import { createHash } from 'crypto'
import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function hasTable(name: string) {
  const rows = await p.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema='public' AND table_name=$1
     ) AS exists`,
    name,
  )
  return rows[0]?.exists === true
}

async function hasCol(table: string, col: string) {
  const rows = await p.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema='public' AND table_name=$1 AND column_name=$2
     ) AS exists`,
    table,
    col,
  )
  return rows[0]?.exists === true
}

async function exec(sql: string) {
  await p.$executeRawUnsafe(sql)
}

async function ensureEnum(name: string, values: string[]) {
  await exec(`
    DO $$ BEGIN
      CREATE TYPE "${name}" AS ENUM (${values.map((v) => `'${v}'`).join(', ')});
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}

async function main() {
  await ensureEnum('WorkspaceKind', ['PERSONAL', 'CHAMBER'])
  await ensureEnum('MemberRole', ['OWNER', 'ADMIN', 'LAWYER', 'STAFF', 'VIEWER'])
  await ensureEnum('MemberStatus', ['INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED'])
  await ensureEnum('ScopeMode', ['ALL', 'ASSIGNED_ONLY'])
  await ensureEnum('PermissionEffect', ['ALLOW', 'DENY'])
  await ensureEnum('InviteStatus', ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'])

  if (!(await hasTable('Workspace'))) {
    await exec(`
      CREATE TABLE "Workspace" (
        "id" TEXT PRIMARY KEY,
        "name" TEXT NOT NULL,
        "kind" "WorkspaceKind" NOT NULL DEFAULT 'PERSONAL',
        "ownerUserId" TEXT NOT NULL,
        "plan" "Plan" NOT NULL DEFAULT 'FREE',
        "planExpiresAt" TIMESTAMP,
        "memberLimit" INTEGER NOT NULL DEFAULT 2,
        "smsCredits" INTEGER NOT NULL DEFAULT 20,
        "smsGrantYm" TEXT,
        "storageBytes" BIGINT NOT NULL DEFAULT 0,
        "logoUrl" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP
      );
    `)
  }

  if (await hasTable('Chamber')) {
    await exec(`
      INSERT INTO "Workspace" ("id","name","kind","ownerUserId","plan","planExpiresAt","smsCredits","createdAt","updatedAt")
      SELECT c."id", c."name", 'PERSONAL',
             COALESCE(
               (SELECT u."id" FROM "User" u WHERE u."chamberId" = c."id" LIMIT 1),
               (SELECT u."id" FROM "User" u LIMIT 1)
             ),
             c."plan", c."subscriptionEndsAt", c."smsCredits", c."createdAt", NOW()
      FROM "Chamber" c
      WHERE (SELECT u."id" FROM "User" u LIMIT 1) IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = c."id");
    `)
  }

  if (!(await hasTable('WorkspaceMember'))) {
    await exec(`
      CREATE TABLE "WorkspaceMember" (
        "id" TEXT PRIMARY KEY,
        "workspaceId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "role" "MemberRole" NOT NULL DEFAULT 'OWNER',
        "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
        "scopeMode" "ScopeMode" NOT NULL DEFAULT 'ALL',
        "permissionsVersion" INTEGER NOT NULL DEFAULT 0,
        "version" INTEGER NOT NULL DEFAULT 0,
        "invitedByUserId" TEXT,
        "joinedAt" TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP,
        UNIQUE ("workspaceId", "userId")
      );
    `)
  }

  if (await hasCol('User', 'chamberId')) {
    await exec(`
      INSERT INTO "WorkspaceMember" ("id","workspaceId","userId","role","status","scopeMode","joinedAt","updatedAt")
      SELECT md5(u."id" || u."chamberId"), u."chamberId", u."id", 'OWNER', 'ACTIVE', 'ALL', NOW(), NOW()
      FROM "User" u
      WHERE u."chamberId" IS NOT NULL
        AND EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = u."chamberId")
        AND NOT EXISTS (
          SELECT 1 FROM "WorkspaceMember" m
          WHERE m."workspaceId" = u."chamberId" AND m."userId" = u."id"
        );
    `)
  }

  await exec(`
    INSERT INTO "WorkspaceMember" ("id","workspaceId","userId","role","status","scopeMode","joinedAt","updatedAt")
    SELECT md5(w."ownerUserId" || w."id" || 'owner'), w."id", w."ownerUserId", 'OWNER', 'ACTIVE', 'ALL', NOW(), NOW()
    FROM "Workspace" w
    WHERE NOT EXISTS (
      SELECT 1 FROM "WorkspaceMember" m
      WHERE m."workspaceId" = w."id" AND m."userId" = w."ownerUserId"
    );
  `)

  if (!(await hasCol('User', 'username'))) {
    await exec(`ALTER TABLE "User" ADD COLUMN "username" TEXT`)
  }
  await exec(`
    UPDATE "User"
    SET "username" = CASE
      WHEN "email" = 'admin@lawyerdiarybd.com' THEN 'admin'
      ELSE 'u' || regexp_replace("phone", '[^0-9]', '', 'g')
    END
    WHERE "username" IS NULL OR "username" = '';
  `)
  await exec(`
    UPDATE "User" u
    SET "username" = u."username" || '_' || substr(replace(u."id", '-', ''), 1, 6)
    FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY "username" ORDER BY id) AS rn
      FROM "User"
    ) d
    WHERE u.id = d.id AND d.rn > 1;
  `)
  await exec(`UPDATE "User" SET "passwordHash" = '!' WHERE "passwordHash" IS NULL`)
  if (!(await hasCol('User', 'updatedAt'))) {
    await exec(`ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()`)
  }
  if (!(await hasCol('User', 'phoneVerified'))) {
    await exec(`ALTER TABLE "User" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false`)
  }
  if (!(await hasCol('User', 'deletedAt'))) {
    await exec(`ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP`)
  }
  if (!(await hasCol('User', 'avatarUrl'))) {
    await exec(`ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT`)
  }
  if (!(await hasCol('User', 'lastLoginAt'))) {
    await exec(`ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP`)
  }

  await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`)
  await exec(`ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL`)
  await exec(`ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL`)

  if (await hasCol('Session', 'refreshToken') && !(await hasCol('Session', 'refreshTokenHash'))) {
    await exec(`ALTER TABLE "Session" ADD COLUMN "refreshTokenHash" TEXT`)
    const sessions = await p.$queryRawUnsafe<{ id: string; refreshToken: string }[]>(
      `SELECT id, "refreshToken" FROM "Session"`,
    )
    for (const s of sessions) {
      const hash = createHash('sha256').update(s.refreshToken).digest('hex')
      await p.$executeRawUnsafe(
        `UPDATE "Session" SET "refreshTokenHash" = $1 WHERE id = $2`,
        hash,
        s.id,
      )
    }
    await exec(`ALTER TABLE "Session" ALTER COLUMN "refreshTokenHash" SET NOT NULL`)
    await exec(`CREATE UNIQUE INDEX IF NOT EXISTS "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash")`)
    await exec(`ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP`)
    await exec(`UPDATE "Session" SET "revokedAt" = NOW() WHERE "revokedAt" IS NULL`)
  }
  if (!(await hasCol('Session', 'deviceId'))) {
    await exec(`ALTER TABLE "Session" ADD COLUMN "deviceId" TEXT`)
  }
  if (!(await hasCol('Session', 'userAgent'))) {
    await exec(`ALTER TABLE "Session" ADD COLUMN "userAgent" TEXT`)
  }
  if (!(await hasCol('Session', 'ipAddress'))) {
    await exec(`ALTER TABLE "Session" ADD COLUMN "ipAddress" TEXT`)
  }
  if (!(await hasCol('Session', 'lastUsedAt'))) {
    await exec(`ALTER TABLE "Session" ADD COLUMN "lastUsedAt" TIMESTAMP`)
  }

  if (await hasCol('Subscription', 'chamberId') && !(await hasCol('Subscription', 'workspaceId'))) {
    await exec(`ALTER TABLE "Subscription" ADD COLUMN "workspaceId" TEXT`)
    await exec(`UPDATE "Subscription" SET "workspaceId" = "chamberId"`)
    await exec(`DELETE FROM "Subscription" WHERE "workspaceId" IS NULL
      OR NOT EXISTS (SELECT 1 FROM "Workspace" w WHERE w."id" = "Subscription"."workspaceId")`)
    await exec(`ALTER TABLE "Subscription" ALTER COLUMN "workspaceId" SET NOT NULL`)
  }

  if (await hasCol('SubscriptionPackage', 'featuresJson')) {
    const featType = await p.$queryRaw<{ udt_name: string }[]>`
      SELECT udt_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name='SubscriptionPackage' AND column_name='featuresJson'
    `
    if (featType[0]?.udt_name !== 'jsonb' && featType[0]?.udt_name !== 'json') {
      await exec(`
        ALTER TABLE "SubscriptionPackage"
        ALTER COLUMN "featuresJson" TYPE JSONB
        USING (
          CASE
            WHEN "featuresJson" IS NULL OR btrim("featuresJson") = '' THEN '[]'::jsonb
            WHEN left(btrim("featuresJson"), 1) IN ('{','[') THEN "featuresJson"::jsonb
            ELSE to_jsonb("featuresJson")
          END
        )
      `)
    }
  }

  for (const table of ['Case', 'Client', 'Hearing', 'FeeEntry', 'Document', 'CauseListEntry']) {
    if (!(await hasTable(table))) continue
    if (await hasCol(table, 'chamberId') && !(await hasCol(table, 'workspaceId'))) {
      await exec(`ALTER TABLE "${table}" ADD COLUMN "workspaceId" TEXT`)
      await exec(`UPDATE "${table}" SET "workspaceId" = "chamberId"`)
    }
  }

  if (await hasTable('Case') && !(await hasCol('Case', 'caseNoNormalized'))) {
    await exec(`ALTER TABLE "Case" ADD COLUMN "caseNoNormalized" TEXT NOT NULL DEFAULT ''`)
    await exec(`UPDATE "Case" SET "caseNoNormalized" = lower(regexp_replace("caseNo", '\\s+', '', 'g'))`)
  }
  if (await hasTable('Case') && !(await hasCol('Case', 'createdByUserId'))) {
    await exec(`ALTER TABLE "Case" ADD COLUMN "createdByUserId" TEXT`)
    await exec(`
      UPDATE "Case" c SET "createdByUserId" = (
        SELECT u."id" FROM "User" u WHERE u."chamberId" = c."workspaceId" LIMIT 1
      )
    `)
    await exec(`UPDATE "Case" SET "createdByUserId" = (SELECT "id" FROM "User" LIMIT 1) WHERE "createdByUserId" IS NULL`)
    await exec(`ALTER TABLE "Case" ALTER COLUMN "createdByUserId" SET NOT NULL`)
  }
  if (await hasTable('Case') && !(await hasCol('Case', 'courtLevelId'))) {
    await exec(`ALTER TABLE "Case" ADD COLUMN "courtLevelId" TEXT NOT NULL DEFAULT 'district'`)
  }
  if (await hasTable('Case') && !(await hasCol('Case', 'courtTypeId'))) {
    await exec(`ALTER TABLE "Case" ADD COLUMN "courtTypeId" TEXT NOT NULL DEFAULT 'ct_district_sessions_judge'`)
  }
  if (await hasTable('Case') && !(await hasCol('Case', 'searchTokens'))) {
    await exec(`ALTER TABLE "Case" ADD COLUMN "searchTokens" TEXT NOT NULL DEFAULT ''`)
  }
  if (await hasTable('Case') && !(await hasCol('Case', 'version'))) {
    await exec(`ALTER TABLE "Case" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0`)
  }

  if (await hasTable('Client') && !(await hasCol('Client', 'updatedAt'))) {
    await exec(`ALTER TABLE "Client" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()`)
  }
  if (await hasTable('FeeEntry') && !(await hasCol('FeeEntry', 'title'))) {
    await exec(`ALTER TABLE "FeeEntry" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'fee'`)
    if (await hasCol('FeeEntry', 'type')) {
      await exec(`UPDATE "FeeEntry" SET "title" = COALESCE("type"::text, 'fee')`)
    }
  }
  if (await hasTable('FeeEntry') && !(await hasCol('FeeEntry', 'amountPaisa'))) {
    await exec(`ALTER TABLE "FeeEntry" ADD COLUMN "amountPaisa" BIGINT NOT NULL DEFAULT 0`)
    if (await hasCol('FeeEntry', 'amount')) {
      await exec(`UPDATE "FeeEntry" SET "amountPaisa" = ROUND(("amount"::numeric) * 100)`)
    }
  }
  if (await hasTable('FeeEntry') && !(await hasCol('FeeEntry', 'kind'))) {
    await exec(`ALTER TABLE "FeeEntry" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'fee'`)
  }
  if (await hasTable('FeeEntry') && !(await hasCol('FeeEntry', 'updatedAt'))) {
    await exec(`ALTER TABLE "FeeEntry" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()`)
  }
  if (await hasTable('Document') && !(await hasCol('Document', 'updatedAt'))) {
    await exec(`ALTER TABLE "Document" ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()`)
  }

  if (!(await hasTable('CourtLevel'))) {
    await exec(`
      CREATE TABLE "CourtLevel" (
        "id" TEXT PRIMARY KEY,
        "nameBn" TEXT NOT NULL,
        "nameEn" TEXT NOT NULL,
        "description" TEXT,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "verificationStatus" TEXT,
        "sourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "lastVerified" TEXT,
        "packVersion" TEXT
      )
    `)
  }
  await exec(`
    INSERT INTO "CourtLevel" ("id","nameBn","nameEn","sortOrder")
    VALUES ('district','জেলা','District',0)
    ON CONFLICT ("id") DO NOTHING
  `)
  if (!(await hasTable('CourtType'))) {
    await exec(`
      CREATE TABLE "CourtType" (
        "id" TEXT PRIMARY KEY,
        "courtLevelId" TEXT NOT NULL,
        "category" TEXT,
        "nameBn" TEXT NOT NULL,
        "nameEn" TEXT NOT NULL,
        "description" TEXT,
        "applicableLocation" TEXT,
        "alsoApplicableMetropolitan" BOOLEAN NOT NULL DEFAULT false,
        "showInMetro" BOOLEAN NOT NULL DEFAULT false,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "verificationStatus" TEXT,
        "sourceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        "lastVerified" TEXT,
        "packVersion" TEXT
      )
    `)
  }
  await exec(`
    INSERT INTO "CourtType" ("id","courtLevelId","nameBn","nameEn","sortOrder")
    VALUES ('ct_district_sessions_judge','district','জেলা ও দায়রা জজ আদালত','District and Sessions Judge Court',0)
    ON CONFLICT ("id") DO NOTHING
  `)

  console.log('v2 in-place backfill complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => p.$disconnect())
