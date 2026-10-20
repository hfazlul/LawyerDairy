import { PrismaClient, Plan, Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { ingestMasterData } from '../src/lib/master/ingest'
import { ensureChangelogTriggers } from '../src/lib/sync/changelog'
import { extraTeamSeats, monthlySmsCredits } from '../src/lib/permissions'
import { ingestBarCouncilContent } from '../src/lib/master/career-ingest'
import { ingestHighCourtContent } from '../src/lib/master/hc-ingest'
import { ingestBjsContent } from '../src/lib/master/bjs-ingest'
import { PACKAGE_DEFS } from '../src/lib/plans'
import { CMS_DEFAULTS } from '../src/lib/cms'

const prisma = new PrismaClient()

async function main() {
  for (const p of PACKAGE_DEFS) {
    await prisma.subscriptionPackage.upsert({
      where: { code: p.code },
      create: {
        code: p.code,
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        priceBdt: p.priceBdt,
        yearlyBdt: p.yearlyBdt,
        featuresJson: p.featuresJson as Prisma.InputJsonValue,
        smsMonthly: p.smsMonthly,
        smsYearly: p.smsYearly,
        teamSeats: p.teamSeats,
        autoHearingSms: p.autoHearingSms,
        careerFull: p.careerFull,
        adsOff: p.adsOff,
        sortOrder: p.sortOrder,
        active: p.active,
      },
      update: {
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        priceBdt: p.priceBdt,
        yearlyBdt: p.yearlyBdt,
        featuresJson: p.featuresJson as Prisma.InputJsonValue,
        smsMonthly: p.smsMonthly,
        smsYearly: p.smsYearly,
        teamSeats: p.teamSeats,
        autoHearingSms: p.autoHearingSms,
        careerFull: p.careerFull,
        adsOff: p.adsOff,
        sortOrder: p.sortOrder,
        active: p.active,
      },
    })
  }

  await prisma.appConfig.upsert({
    where: { id: 'current' },
    create: {
      id: 'current',
      configVersion: 2,
      minAppVersion: '1.0.0',
      killSwitches: [],
      limits: { catalog: 'v2-4tier' },
    },
    update: { configVersion: 2 },
  })

  await prisma.cmsSettings.upsert({
    where: { id: 'current' },
    create: { id: 'current', ...CMS_DEFAULTS },
    update: {},
  })

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lawyerdiarybd.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const adminPassword = process.env.SEED_ADMIN_PASSWORD
    if (!adminPassword) {
      console.warn('SEED_ADMIN_PASSWORD missing — skip admin user (use /hfazlul/signup bootstrap)')
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12)
      const admin = await prisma.user.create({
        data: {
          username: 'admin',
          name: 'Admin',
          email: adminEmail,
          phone: process.env.SEED_ADMIN_PHONE || '+8801700000000',
          passwordHash,
          appRole: 'ADMIN',
          uiLanguage: 'bn',
          webTrialEndsAt: new Date(Date.now() + 7 * 86400000),
        },
      })
      await prisma.adminUser.create({ data: { userId: admin.id, bootstrap: true } })
      await prisma.workspace.create({
        data: {
          name: 'আমার ডায়েরি',
          kind: 'PERSONAL',
          ownerUserId: admin.id,
          plan: Plan.ADVANCE,
          planExpiresAt: new Date(Date.now() + 365 * 86400000),
          memberLimit: extraTeamSeats(Plan.ADVANCE),
          smsCredits: monthlySmsCredits(Plan.ADVANCE),
          members: {
            create: {
              userId: admin.id,
              role: 'OWNER',
              scopeMode: 'ALL',
              status: 'ACTIVE',
              joinedAt: new Date(),
            },
          },
        },
      })
      console.log(`Seeded ADMIN ${adminEmail} / username=admin`)
    }
  }

  try {
    const counts = await ingestMasterData()
    console.log('Master data ingested', counts)
  } catch (err) {
    console.warn('Master ingest skipped/failed:', err)
  }

  try {
    const bar = await ingestBarCouncilContent()
    console.log('Bar Council content ingested', bar)
  } catch (err) {
    console.warn('Career ingest skipped/failed:', err)
  }

  try {
    const hc = await ingestHighCourtContent()
    console.log('High Court / AD content ingested', hc)
  } catch (err) {
    console.warn('HC ingest skipped/failed:', err)
  }

  try {
    const bjs = await ingestBjsContent()
    console.log('BJS content ingested', bjs)
  } catch (err) {
    console.warn('BJS ingest skipped/failed:', err)
  }

  try {
    await ensureChangelogTriggers()
    console.log('ChangeLog triggers installed')
  } catch (err) {
    console.warn('Trigger install skipped (needs Postgres):', err)
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
