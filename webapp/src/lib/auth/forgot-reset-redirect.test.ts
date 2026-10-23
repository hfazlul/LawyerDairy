import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const form = readFileSync(join(root, 'app/user/forgot/forgot-form.tsx'), 'utf8')
const page = readFileSync(join(root, 'app/user/forgot/page.tsx'), 'utf8')

test('successful password change replaces the forgot page with login', () => {
  assert.match(page, /href="\/user\/login"/)
  const start = form.indexOf("'/api/mobile/v1/auth/password/otp/complete'")
  assert.ok(start > 0)
  const slice = form.slice(start, form.indexOf('} catch {', start))
  assert.match(
    slice,
    /if \(!res\.ok\) \{[\s\S]*?\breturn\s*\}\s*redirected = true\s*router\.replace\('\/user\/login'\)/,
  )
  assert.equal(form.includes('setDone'), false)
  assert.equal(form.includes('পাসওয়ার্ড বদলেছে'), false)
})
