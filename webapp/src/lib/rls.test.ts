import assert from 'node:assert/strict'
import test from 'node:test'
import { setWorkspaceLocal, withWorkspaceTx } from './rls'

test('setWorkspaceLocal issues set_config(..., true) with the workspace id', async () => {
  const calls: { sql: string; values: unknown[] }[] = []
  const tx = {
    $executeRaw: (strings: TemplateStringsArray, ...values: unknown[]) => {
      calls.push({ sql: strings.join('?'), values })
      return Promise.resolve(0)
    },
  }
  await setWorkspaceLocal(tx, 'ws-abc')
  assert.equal(calls.length, 1)
  assert.match(calls[0].sql, /set_config\('app\.workspace_id'/)
  assert.deepEqual(calls[0].values, ['ws-abc'])
  assert.match(calls[0].sql, /true\)/)
})

test('setWorkspaceLocal rejects empty workspace id', async () => {
  await assert.rejects(() => setWorkspaceLocal({ $executeRaw: async () => 0 }, ''))
})

test('withWorkspaceTx SET LOCAL then runs the callback on the same tx', async () => {
  const order: string[] = []
  const fakeTx = {
    $executeRaw: async () => {
      order.push('set')
      return 0
    },
  }
  const client = {
    $transaction: async (fn: (tx: typeof fakeTx) => Promise<string>) => fn(fakeTx),
  }
  const out = await withWorkspaceTx(
    'ws-1',
    async () => {
      order.push('fn')
      return 'ok'
    },
    client as never,
  )
  assert.equal(out, 'ok')
  assert.deepEqual(order, ['set', 'fn'])
})

test('workspace Case/Client/Hearing/Fee/Task/Document routes import withWorkspaceTx', async () => {
  const { readFileSync } = await import('node:fs')
  const { join } = await import('node:path')
  const root = join(__dirname, '..', '..')
  const files = [
    'src/api/mobile/v1/sync/push.ts',
    'src/api/mobile/v1/sync/pull.ts',
    'src/api/mobile/v1/reports/diary-pdf.ts',
    'app/api/mobile/v1/data/export/route.ts',
    'app/api/mobile/v1/reports/summary/route.ts',
    'app/api/mobile/v1/reports/practice-pdf/route.ts',
    'app/api/mobile/v1/tasks/route.ts',
    'app/api/web/v1/cases/route.ts',
    'app/api/web/v1/clients/route.ts',
    'app/user/cases/page.tsx',
    'app/user/cause-list/page.tsx',
  ]
  for (const f of files) {
    const src = readFileSync(join(root, f), 'utf8')
    assert.match(src, /withWorkspaceTx/, f)
  }
})
