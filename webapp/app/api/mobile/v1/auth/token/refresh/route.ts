// Thin App Router entry — POST /api/mobile/v1/auth/token/refresh
import { POST_refresh } from '@/api/mobile/v1/auth/otp'

export async function POST(req: Request) {
  return POST_refresh(req as any)
}
