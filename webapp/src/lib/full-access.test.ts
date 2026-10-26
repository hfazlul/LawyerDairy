import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { COMING_SOON_BN, accountBilling, isFullAccessAccount } from './full-access'

test('full access is fazlul_3601 or +8801858173601, not the web admin phone', () => {
  assert.equal(isFullAccessAccount({ username: 'fazlul_3601' }), true)
  assert.equal(isFullAccessAccount({ username: 'FAZLUL_3601' }), true)
  assert.equal(isFullAccessAccount({ phone: '01858173601' }), true)
  assert.equal(isFullAccessAccount({ phone: '+8801858173601' }), true)
  assert.equal(isFullAccessAccount({ phone: '8801858173601' }), true)
  assert.equal(isFullAccessAccount({ username: 'Fazlul', phone: '01711111111' }), false)
  assert.equal(isFullAccessAccount({ phone: '01531390692' }), false)
  assert.equal(isFullAccessAccount({ phone: '+8801531390692' }), false)
  assert.equal(COMING_SOON_BN, 'এই ফিচারটি খুব শীঘ্রই আসবে ইনশাআল্লাহ')
  const open = accountBilling({ username: 'fazlul_3601' }, 'FREE', new Date('2020-01-01'))
  assert.equal(open.plan, 'PRO')
  assert.equal(open.endsAt, null)
  const admin = accountBilling({ phone: '+8801531390692', username: 'hfazlul' }, 'FREE', new Date('2020-01-01'))
  assert.equal(admin.plan, 'FREE')
  assert.ok(admin.endsAt instanceof Date)
})

test('hearing route refuses everyone else before any SMS send', () => {
  const route = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      '../../app/api/mobile/v1/communication/sms/hearings/route.ts',
    ),
    'utf8',
  )
  const gate = route.indexOf('if (!isFullAccessAccount(user))')
  const send = route.indexOf('await sendSmsHybrid')
  assert.ok(gate >= 0)
  assert.ok(send > gate)
  assert.match(route, /error:\s*'coming_soon'/)
  assert.match(route, /COMING_SOON_BN/)
})

test('hearing settings stay hidden from every other account', () => {
  const route = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../../app/api/mobile/v1/workspaces/me/messaging/route.ts'),
    'utf8',
  )
  const gate = route.indexOf('if (!isFullAccessAccount(user))')
  const update = route.indexOf('prisma.workspace.update')
  assert.ok(gate >= 0)
  assert.ok(update > gate)
  assert.match(route, /smsTimesPerDay/)
  assert.match(route, /smsAutoEnabled/)
  assert.match(route, /COMING_SOON_BN/)
  assert.equal(route.split('if (!isFullAccessAccount(user))').length, 3)
})
