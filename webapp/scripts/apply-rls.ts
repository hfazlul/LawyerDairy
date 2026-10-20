import { readFileSync } from 'fs'
import path from 'path'
import { prisma } from '../src/lib/prisma'

/**
 * Applies workspace RLS policies. Off by default — ENABLE_PG_RLS=1 required.
 * App queries must SET LOCAL app.workspace_id or they will see zero rows.
 */
async function main() {
  if (process.env.ENABLE_PG_RLS !== '1') {
    console.log('Skipped: set ENABLE_PG_RLS=1 to apply prisma/rls.sql')
    return
  }
  const sql = readFileSync(path.join(process.cwd(), 'prisma', 'rls.sql'), 'utf8')
  const parts = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))
  for (const stmt of parts) {
    await prisma.$executeRawUnsafe(stmt)
  }
  console.log('RLS policies applied')
}

main().finally(() => prisma.$disconnect())
