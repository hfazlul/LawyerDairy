import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const t = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', '.env'), 'utf8')
const out = []
for (const line of t.split(/\r?\n/)) {
  const m = line.match(/^\s*(#)?\s*([A-Z][A-Z0-9_]*)\s*=(.*)$/)
  if (!m) continue
  const val = m[3].trim().replace(/^["']|["']$/g, '')
  out.push({ name: m[2], commented: m[1] === '#', empty: !val })
}
console.log(JSON.stringify({ total: out.length, commented: out.filter(x => x.commented).map(x => x.name), empty_active: out.filter(x => !x.commented && x.empty).map(x => x.name), set_active: out.filter(x => !x.commented && !x.empty).map(x => x.name) }, null, 2))
