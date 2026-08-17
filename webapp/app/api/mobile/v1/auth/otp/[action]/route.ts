// Thin App Router entry — /api/mobile/v1/auth/otp/[action]
// action: request | verify | refresh
// Logic lives in src/api/mobile/v1/auth/otp.ts

import { NextRequest, NextResponse } from 'next/server'
import {
  POST_request,
  POST_verify,
  POST_refresh,
} from '@/api/mobile/v1/auth/otp'

type Ctx = { params: Promise<{ action: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params
  switch (action) {
    case 'request':
      return POST_request(req)
    case 'verify':
      return POST_verify(req)
    case 'refresh':
    case 'token':
    case 'token-refresh':
      return POST_refresh(req)
    default:
      return NextResponse.json(
        { message: `Unknown OTP action: ${action}` },
        { status: 404 },
      )
  }
}
