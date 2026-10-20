import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

export type WorkspaceTx = Prisma.TransactionClient

/**
 * Tagged-template SQL — parameterized workspace id, is_local = true (SET LOCAL).
 * Call on every tx that reads/writes Case, Client, Hearing, FeeEntry, Task, Document
 * (see prisma/rls.sql). Policies stay off until ENABLE_PG_RLS=1.
 *
 * Wired: sync push/pull, SMS send/credits, data export, reports (summary /
 * practice-pdf / diary-pdf), tasks, web cases/clients, dashboard cases/clients.
 */
export async function setWorkspaceLocal(
  tx: Pick<WorkspaceTx, '$executeRaw'>,
  workspaceId: string,
): Promise<void> {
  if (!workspaceId) throw new Error('workspace_id_required')
  await tx.$executeRaw`SELECT set_config('app.workspace_id', ${workspaceId}, true)`
}

/**
 * Interactive transaction so SET LOCAL survives PgBouncer transaction pooling.
 * RLS policies in prisma/rls.sql stay **off** until ENABLE_PG_RLS=1.
 * Calling this now is a no-op for row visibility when policies are not applied.
 */
export async function withWorkspaceTx<T>(
  workspaceId: string,
  fn: (tx: WorkspaceTx) => Promise<T>,
  client: { $transaction: typeof prisma.$transaction } = prisma,
): Promise<T> {
  return client.$transaction(async (tx) => {
    await setWorkspaceLocal(tx, workspaceId)
    return fn(tx)
  })
}

/** True when owner has applied rls.sql. Queries without SET LOCAL would see zero rows. */
export function rlsPoliciesEnabled(): boolean {
  return process.env.ENABLE_PG_RLS === '1'
}
