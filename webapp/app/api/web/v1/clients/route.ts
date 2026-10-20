import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { withWorkspaceTx } from '@/lib/rls'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!user.activeMembership.permissions.has('clients.view')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }
  const wsId = user.activeMembership.workspaceId
  const clients = await withWorkspaceTx(wsId, (tx) =>
    tx.client.findMany({
      where: { workspaceId: wsId, deletedAt: null },
      orderBy: { name: 'asc' },
      take: 300,
    }),
  )
  return NextResponse.json({ clients })
}

export async function POST() {
  return NextResponse.json(
    { message: 'মক্কেল যোগ করতে মোবাইল অ্যাপ ব্যবহার করুন.', code: 'MOBILE_ONLY' },
    { status: 405 },
  )
}
