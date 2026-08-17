import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export function signJwt(payload: object, expiresIn: string) {
  return jwt.sign(payload, SECRET, { expiresIn } as any)
}

export function verifyJwt(token: string): jwt.JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as jwt.JwtPayload
  } catch {
    return null
  }
}
