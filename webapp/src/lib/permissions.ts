import type { MemberRole, Plan } from '@prisma/client'

/** Permission keys — UI hide is UX only; API is the real boundary. */
export const PERMISSION_KEYS = [
  'cases.view',
  'cases.create',
  'cases.edit',
  'cases.delete',
  'clients.view',
  'clients.create',
  'clients.edit',
  'hearings.edit',
  'fees.view',
  'fees.edit',
  'documents.view',
  'documents.edit',
  'cause_list.view',
  'cause_list.update',
  'calendar.view',
  'tasks.edit',
  'team.view',
  'team.invite',
  'team.manage',
  'audit.view',
  'reports.view',
  'communication.send',
  'tasks.view',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

/** Junior preset: Home + Client + Case R/W. Profile, not a schema drop. */
export const JUNIOR_PRESET_ALLOW: PermissionKey[] = [
  'cause_list.view',
  'cause_list.update',
  'hearings.edit',
  'calendar.view',
  'clients.view',
  'clients.create',
  'clients.edit',
  'cases.view',
  'cases.create',
  'cases.edit',
  'documents.view',
  'team.view',
]

export const JUNIOR_PRESET_DENY: PermissionKey[] = [
  'fees.view',
  'fees.edit',
  'reports.view',
  'documents.edit',
  'team.invite',
  'team.manage',
  'audit.view',
  'communication.send',
  'cases.delete',
  'tasks.edit',
]

export type PermissionOverride = { permissionKey: string; effect: 'ALLOW' | 'DENY' }

export function juniorPresetKeys(): PermissionOverride[] {
  return [
    ...JUNIOR_PRESET_ALLOW.map((permissionKey) => ({ permissionKey, effect: 'ALLOW' as const })),
    ...JUNIOR_PRESET_DENY.map((permissionKey) => ({ permissionKey, effect: 'DENY' as const })),
  ]
}

const ROLE_BASE: Record<MemberRole, PermissionKey[]> = {
  OWNER: [...PERMISSION_KEYS],
  ADMIN: [...PERMISSION_KEYS],
  LAWYER: [
    'cases.view', 'cases.create', 'cases.edit',
    'clients.view', 'clients.create', 'clients.edit',
    'hearings.edit',
    'fees.view',
    'documents.view', 'documents.edit',
    'cause_list.view', 'cause_list.update',
    'calendar.view', 'tasks.edit', 'tasks.view',
    'communication.send',
    'reports.view',
  ],
  STAFF: [
    'cases.view',
    'clients.view',
    'hearings.edit',
    'cause_list.view', 'cause_list.update',
    'calendar.view', 'tasks.edit', 'tasks.view',
    'documents.view',
    'communication.send',
  ],
  VIEWER: [
    'cases.view',
    'clients.view',
    'cause_list.view',
    'calendar.view',
  ],
}

export function resolvePermissions(
  role: MemberRole,
  overrides: PermissionOverride[] = [],
): Set<string> {
  const set = new Set<string>(ROLE_BASE[role] ?? [])
  for (const o of overrides) {
    if (o.effect === 'DENY') set.delete(o.permissionKey)
    else set.add(o.permissionKey)
  }
  return set
}

export function hasPermission(perms: Set<string>, key: PermissionKey): boolean {
  return perms.has(key)
}

/**
 * Extra team members besides owner (catalog allotment).
 * Free **trial** allotment is 1; after trial use [extraTeamSeatsAllowed].
 * Starter: 2 · Pro: 5 · Pro_advance/Advance: 7.
 */
export function extraTeamSeats(plan: Plan): number {
  if (plan === 'ADVANCE' || plan === 'PRO_ADVANCE' || plan === 'CHAMBER') return 7
  if (plan === 'PRO') return 5
  if (plan === 'STARTER') return 2
  return 1
}

/** Free: 1 seat only while 7-day trial is active; 0 after. Paid: catalog seats. */
export function extraTeamSeatsAllowed(
  plan: Plan,
  opts: { paid: boolean; trialActive: boolean },
): number {
  if (opts.paid) return extraTeamSeats(plan)
  return opts.trialActive ? 1 : 0
}

/** Total members including owner. */
export function maxTeamTotal(plan: Plan): number {
  return extraTeamSeats(plan) + 1
}

export function monthlySmsCredits(plan: Plan): number {
  if (plan === 'ADVANCE') return 400
  if (plan === 'PRO_ADVANCE' || plan === 'CHAMBER') return 280
  if (plan === 'PRO') return 150
  return 0
}

export function yearlySmsCredits(plan: Plan): number {
  if (plan === 'ADVANCE') return 4800
  if (plan === 'PRO_ADVANCE' || plan === 'CHAMBER') return 3360
  if (plan === 'PRO') return 1800
  return 0
}

export function storageQuotaBytes(plan: Plan): number {
  if (plan === 'ADVANCE' || plan === 'PRO_ADVANCE' || plan === 'CHAMBER') return 20 * 1024 * 1024 * 1024
  if (plan === 'PRO') return 5 * 1024 * 1024 * 1024
  if (plan === 'STARTER') return 2 * 1024 * 1024 * 1024
  return 200 * 1024 * 1024
}

export function planHasAutoHearingSms(plan: Plan): boolean {
  return plan === 'PRO' || plan === 'PRO_ADVANCE' || plan === 'ADVANCE' || plan === 'CHAMBER'
}

export function planAdsOff(plan: Plan): boolean {
  return plan !== 'FREE'
}

export function planCareerFull(plan: Plan): boolean {
  return plan !== 'FREE'
}
