export type ChamberAccessMode = 'read' | 'write'

export type ChamberGrant = {
  clients: ChamberAccessMode
  cases: ChamberAccessMode
  causeList: ChamberAccessMode
}

export type PermissionRow = { permissionKey: string; effect: 'ALLOW' | 'DENY' }

const DENY_OUTSIDE = [
  'fees.view',
  'fees.edit',
  'reports.view',
  'documents.edit',
  'team.invite',
  'team.manage',
  'audit.view',
  'communication.send',
  'tasks.edit',
  'hearings.edit',
  'cases.delete',
] as const

/** Senior grants only clients, cases, and cause list. Read is view-only. Write can edit. */
export function chamberAccessKeys(grant: ChamberGrant): PermissionRow[] {
  const rows: PermissionRow[] = []
  const put = (permissionKey: string, allow: boolean) => {
    rows.push({ permissionKey, effect: allow ? 'ALLOW' : 'DENY' })
  }
  put('clients.view', true)
  put('clients.create', grant.clients === 'write')
  put('clients.edit', grant.clients === 'write')
  put('cases.view', true)
  put('cases.create', grant.cases === 'write')
  put('cases.edit', grant.cases === 'write')
  put('cause_list.view', true)
  put('cause_list.update', grant.causeList === 'write')
  for (const key of DENY_OUTSIDE) put(key, false)
  return rows
}

export function modeFromKeys(
  keys: { permissionKey: string; effect: string }[],
  viewKey: string,
  writeKey: string,
): ChamberAccessMode {
  const effect = (k: string) => keys.find((row) => row.permissionKey === k)?.effect
  if (effect(writeKey) === 'DENY') return 'read'
  if (effect(writeKey) === 'ALLOW') return 'write'
  return 'read'
}
