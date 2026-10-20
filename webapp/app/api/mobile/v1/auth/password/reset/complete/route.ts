import { POST_passwordResetComplete } from '@/api/mobile/v1/auth/password'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  return POST_passwordResetComplete(req)
}
