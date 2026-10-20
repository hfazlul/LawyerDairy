import assert from 'node:assert/strict'
import test from 'node:test'
import { juniorPresetKeys, JUNIOR_PRESET_ALLOW, JUNIOR_PRESET_DENY, resolvePermissions } from './permissions'

test('junior preset allows diary spine and denies fees/team/sms', () => {
  const keys = juniorPresetKeys()
  assert.equal(keys.some((k) => k.permissionKey === 'cases.edit' && k.effect === 'ALLOW'), true)
  assert.equal(keys.some((k) => k.permissionKey === 'fees.view' && k.effect === 'DENY'), true)
  assert.equal(keys.some((k) => k.permissionKey === 'communication.send' && k.effect === 'DENY'), true)
  const resolved = resolvePermissions('STAFF', keys)
  assert.equal(resolved.has('cases.create'), true)
  assert.equal(resolved.has('clients.edit'), true)
  assert.equal(resolved.has('fees.view'), false)
  assert.equal(resolved.has('team.manage'), false)
  assert.equal(JUNIOR_PRESET_ALLOW.length > 8, true)
  assert.equal(JUNIOR_PRESET_DENY.includes('cases.delete'), true)
})
