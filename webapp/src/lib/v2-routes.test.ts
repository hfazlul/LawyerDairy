import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const app = join(__dirname, '..', '..', 'app')

function page(rel: string) {
  return join(app, rel, 'page.tsx')
}

test('v2 public/user/admin pages exist', () => {
  for (const rel of [
    '',
    'diary',
    'career',
    'career/bar-council',
    'career/bjs',
    'find-lawyer',
    'find-lawyer/[slug]',
    'package',
    'pricing',
    'contact',
    'user',
    'user/login',
    'user/signup',
    'user/forgot',
    'user/profile',
    'user/member',
    'user/team',
    'user/cause-list',
    'user/cases',
    'hfazlul',
    'hfazlul/login',
    'hfazlul/signup',
    'hfazlul/cms',
    'hfazlul/packages',
    'hfazlul/activate',
    'hfazlul/users',
    'hfazlul/analytics',
    'hfazlul/find-lawyer',
    'hfazlul/referrals',
    'hfazlul/messaging',
    'hfazlul/career',
    'tools',
    'tools/court-fee',
    'tools/limitation',
    'tools/ana-gonda',
    'tools/khatian',
    'tools/faraiz',
    'tools/kabin',
    'tools/stamp',
    'tools/mouza',
    'tools/tax',
  ]) {
    assert.equal(existsSync(page(rel)), true, rel || '/')
  }
})

test('old marketing/dashboard pages are gone', () => {
  for (const rel of [
    'login',
    'signup',
    'forgot-password',
    'dashboard',
    'dashboard/cases',
    'dashboard/clients',
    'dashboard/documents',
    'dashboard/team',
    'admin',
    'admin/find-lawyer',
    'packages',
    'checkout',
  ]) {
    assert.equal(existsSync(page(rel)), false, rel)
  }
})

test('career filesystem API routes and data dir exist', () => {
  const root = join(__dirname, '..', '..')
  const fileIdDir = join(root, 'app', 'api', 'mobile', 'v1', 'career', 'file')
  assert.equal(existsSync(join(root, 'app', 'api', 'mobile', 'v1', 'career', 'manifest', 'route.ts')), true)
  assert.equal(existsSync(fileIdDir), true)
  assert.equal(existsSync(join(root, 'data', 'career', 'manifest.json')), true)
})
