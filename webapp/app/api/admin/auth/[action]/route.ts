import { NextRequest } from 'next/server'
import { POST_login, POST_logout, POST_signup } from '@/api/admin/admin-auth'

type Ctx = { params: Promise<{ action: string }> }

export async function POST(req: NextRequest, ctx: Ctx) {
  const { action } = await ctx.params
  if (action === 'login') return POST_login(req)
  if (action === 'logout') return POST_logout(req)
  if (action === 'signup') return POST_signup(req)
  return Response.json({ message: 'Unknown' }, { status: 404 })
}
