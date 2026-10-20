import Link from 'next/link'
import { extraTeamSeats } from '@/lib/permissions'
import { hasWebDiaryView } from '@/lib/entitlement-gates'
import { prisma } from '@/lib/prisma'
import { modeFromKeys } from '@/lib/team/chamber-access'
import { requireWebUser, personalWorkspace, planOfUser } from '@/lib/web-session'
import { UserShell } from '@/ui/app-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChamberGrantForm } from './chamber-grant-form'

export const dynamic = 'force-dynamic'

export default async function UserTeamPage() {
  const user = await requireWebUser('/user/team')
  const ws = personalWorkspace(user)
  const plan = planOfUser(user)
  const open = hasWebDiaryView(plan, ws?.planExpiresAt, user.createdAt, user.webTrialEndsAt)
  const members = open && ws
    ? await prisma.workspaceMember.findMany({
        where: { workspaceId: ws.id, status: 'ACTIVE', deletedAt: null },
        include: { user: { select: { name: true, phone: true, username: true } }, permissions: true },
      })
    : []

  return (
    <UserShell title="টিম / চেম্বার" userLabel={user.name}>
      {!open ? (
        <Card className="border-dashed border-brass bg-amber-50/50">
          <CardContent className="space-y-3 p-6 font-bengali">
            <p>৭ দিনের ট্রায়াল শেষ। টিম দেখতে প্যাকেজ নিন।</p>
            <Button asChild>
              <Link href="/package">ওয়েবসাইটে পে করুন</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 font-bengali text-muted-foreground">
            মোবাইল ও ওয়েব একই অনুমতি। সিট (মালিক ছাড়া): {extraTeamSeats(plan)}
          </p>
          <div className="space-y-3">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="p-4 font-bengali">
                  <strong>{m.user.name}</strong> · {m.role}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {m.user.phone} · অনুমতি {m.permissions.filter((p) => p.effect === 'ALLOW').length}
                  </p>
                  {m.role !== 'OWNER' ? (
                    <ChamberGrantForm
                      memberId={m.id}
                      clients={modeFromKeys(m.permissions, 'clients.view', 'clients.edit')}
                      cases={modeFromKeys(m.permissions, 'cases.view', 'cases.edit')}
                      causeList={modeFromKeys(m.permissions, 'cause_list.view', 'cause_list.update')}
                    />
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </UserShell>
  )
}
