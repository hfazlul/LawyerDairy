import { createHash, randomBytes } from 'crypto'

export function newId(): string {
  return crypto.randomUUID()
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function randomOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex')
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}
