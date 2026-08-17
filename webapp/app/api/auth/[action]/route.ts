import { POST_login, POST_logout, POST_signup } from '@/api/auth/web-auth'
import { NextRequest } from 'next/server'

type Ctx = { params: Promise<{ action: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params
  if (action === 'signup') return POST_signup(req)
  if (action === 'login') return POST_login(req)
  if (action === 'logout') return POST_logout(req)
  return Response.json({ message: 'Unknown action' }, { status: 404 })
}
