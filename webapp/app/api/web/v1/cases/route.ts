import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, planOf, planExpires } from '@/lib/auth-middleware'
import { hasWebDiaryView } from '@/lib/entitlement-gates'
import { withWorkspaceTx } from '@/lib/rls'

export async function GET(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user?.activeMembership) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  if (!hasWebDiaryView(planOf(user), planExpires(user), user.createdAt, user.webTrialEndsAt)) {
    return NextResponse.json(
      { message: '৭ দিনের ট্রায়াল শেষ। সেভড কেস দেখতে প্যাকেজ নিন।', code: 'UPGRADE_REQUIRED' },
      { status: 403 },
    )
  }

  const wsId = user.activeMembership.workspaceId
  const cases = await withWorkspaceTx(wsId, (tx) =>
    tx.case.findMany({
      where: { workspaceId: wsId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      include: { parties: { where: { deletedAt: null }, take: 4 } },
    }),
  )
  return NextResponse.json({ cases })
}

export async function POST() {
  return NextResponse.json(
    { message: 'কেস যোগ করতে মোবাইল অ্যাপ ব্যবহার করুন.', code: 'MOBILE_ONLY' },
    { status: 405 },
  )
}
