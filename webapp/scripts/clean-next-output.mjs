import { rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const webapp = dirname(dirname(fileURLToPath(import.meta.url)))
rmSync(join(webapp, '.next'), { recursive: true, force: true })
