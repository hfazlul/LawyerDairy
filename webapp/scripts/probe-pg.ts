import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

function loadDotEnv() {
  const p = resolve(process.cwd(), '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (!process.env[k]) process.env[k] = v
  }
}

async function main() {
  loadDotEnv()
  const url = process.env.DATABASE_URL ?? ''
  if (!url) {
    console.log('PG_FAIL no DATABASE_URL')
    process.exit(2)
  }
  const prisma = new PrismaClient()
  try {
    await prisma.$queryRaw`SELECT 1 AS ok`
    const ws = await prisma.workspace.count()
    console.log(`PG_OK workspaces=${ws}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.log(`PG_FAIL ${msg.replace(/\s+/g, ' ').slice(0, 300)}`)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
