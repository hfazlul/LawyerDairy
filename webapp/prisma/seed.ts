import { PrismaClient, Plan, JurisdictionCode } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const packages: Array<{
  code: string
  nameBn: string
  nameEn: string
  priceBdt: number
  yearlyBdt: number | null
  featuresJson: string
  sortOrder: number
}> = [
  {
    code: 'FREE',
    nameBn: 'ফ্রি',
    nameEn: 'Free',
    priceBdt: 0,
    yearlyBdt: 0,
    featuresJson: JSON.stringify(['home_board', 'cases_basic', 'calendar', 'ads']),
    sortOrder: 0,
  },
  {
    code: 'STARTER',
    nameBn: 'স্টার্টার',
    nameEn: 'Starter',
    priceBdt: 99,
    yearlyBdt: 999,
    featuresJson: JSON.stringify([
      'cause_list',
      'stats_visuals',
      'payment_visuals',
      'team_1',
    ]),
    sortOrder: 1,
  },
  {
    code: 'PRO',
    nameBn: 'প্রো',
    nameEn: 'Pro',
    priceBdt: 199,
    yearlyBdt: 1799,
    featuresJson: JSON.stringify([
      'cause_list',
      'stats_visuals',
      'payment_visuals',
      'team_1',
      'doc_scanner',
      'doc_vault_cloud',
    ]),
    sortOrder: 2,
  },
  {
    code: 'PRO_ADVANCE',
    nameBn: 'প্রো অ্যাডভান্স',
    nameEn: 'Pro Advance',
    priceBdt: 349,
    yearlyBdt: 3490,
    featuresJson: JSON.stringify([
      'cause_list',
      'web_case_mgmt',
      'team_2_3',
      'unlimited_cases',
    ]),
    sortOrder: 3,
  },
  {
    code: 'CHAMBER',
    nameBn: 'চেম্বার',
    nameEn: 'Chamber',
    priceBdt: 699,
    yearlyBdt: null,
    featuresJson: JSON.stringify(['chamber_roles', 'cause_list', 'web_case_mgmt', 'team_2_3']),
    sortOrder: 4,
  },
]

async function main() {
  for (const p of packages) {
    await prisma.subscriptionPackage.upsert({
      where: { code: p.code },
      create: p,
      update: {
        nameBn: p.nameBn,
        nameEn: p.nameEn,
        priceBdt: p.priceBdt,
        yearlyBdt: p.yearlyBdt,
        featuresJson: p.featuresJson,
        sortOrder: p.sortOrder,
        active: true,
      },
    })
  }

  // Sample chambers per jurisdiction (for local testing of content/payment rails)
  for (const [code, name] of [
    ['BD', 'Sample BD Chamber'],
    ['PK', 'Sample PK Chamber'],
    ['IN', 'Sample IN Chamber'],
  ] as const) {
    const existing = await prisma.chamber.findFirst({
      where: { name, jurisdiction: code as JurisdictionCode },
    })
    if (!existing) {
      await prisma.chamber.create({
        data: {
          name,
          plan: Plan.FREE,
          jurisdiction: code as JurisdictionCode,
          jurisdictionConfirmed: true,
        },
      })
      console.log(`Seeded sample chamber: ${name}`)
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@lawyerdiarybd.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const chamber = await prisma.chamber.create({
      data: {
        name: 'Owner Chamber',
        plan: Plan.CHAMBER,
        jurisdiction: JurisdictionCode.BD,
        jurisdictionConfirmed: true,
        subscriptionEndsAt: new Date(Date.now() + 365 * 86400000),
      },
    })
    const passwordHash = await bcrypt.hash(
      process.env.SEED_ADMIN_PASSWORD || 'ChangeMeAdmin!234',
      12,
    )
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        phone: process.env.SEED_ADMIN_PHONE || '+8801700000000',
        passwordHash,
        appRole: 'ADMIN',
        role: 'OWNER',
        uiLanguage: 'bn',
        chamberId: chamber.id,
      },
    })
    console.log(`Seeded ADMIN ${adminEmail}`)
  }

  console.log('Seed complete: packages + jurisdictions (+ admin if missing)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
