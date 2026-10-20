import { GET_usernameAvailable } from '@/api/mobile/v1/auth/password'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  return GET_usernameAvailable(req)
}
