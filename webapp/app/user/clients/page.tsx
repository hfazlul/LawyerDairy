import Link from 'next/link'
import { hasWebDiaryView } from '@/lib/entitlement-gates'
import { requireWebUser, personalWorkspace, planOfUser, planExpiresOfUser } from '@/lib/web-session'
import { withWorkspaceTx } from '@/lib/rls'
import { UserShell } from '@/ui/app-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, ContactRound, Mail, Phone } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function UserClientsPage() {
  const user = await requireWebUser('/user/clients')
  const ws = personalWorkspace(user)
  const plan = planOfUser(user)
  const open = hasWebDiaryView(plan, planExpiresOfUser(user), user.createdAt, user.webTrialEndsAt)
  const clients = open && ws
    ? await withWorkspaceTx(ws.id, (tx) =>
        tx.client.findMany({
          where: { workspaceId: ws.id, deletedAt: null },
          orderBy: { updatedAt: 'desc' },
          take: 300,
          include: {
            _count: { select: { parties: true, tasks: true } },
          },
        }),
      )
    : []

  return (
    <UserShell title="মক্কেল" userLabel={user.name}>
      <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="eyebrow font-bengali normal-case tracking-normal">মোবাইল অ্যাপের সাথে সিঙ্ক</span>
          <h2 className="mt-3 font-bengali text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">মক্কেল ডিরেক্টরি</h2>
          <p className="mt-2 max-w-2xl font-bengali text-sm leading-6 text-muted-foreground">
            যোগাযোগ ও সংশ্লিষ্ট মামলার সারসংক্ষেপ। নতুন মক্কেল যোগ বা সম্পাদনা মোবাইল অ্যাপ থেকে করুন।
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-white/75 px-4 py-3 text-sm shadow-soft">
          <strong className="text-xl text-navy">{clients.length}</strong>
          <span className="ml-2 font-bengali text-muted-foreground">মক্কেল</span>
        </div>
      </section>

      {!open ? (
        <Card className="border-dashed border-brass/50 bg-amber-50/70">
          <CardContent className="space-y-3 p-6 font-bengali">
            <p>৭ দিনের ট্রায়াল শেষ। মক্কেল তালিকা দেখতে প্যাকেজ নিন।</p>
            <Button asChild><Link href="/package">প্যাকেজ দেখুন</Link></Button>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <div className="premium-panel grid min-h-72 place-items-center p-8 text-center">
          <div>
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-navy text-brass-soft shadow-lg"><ContactRound className="h-7 w-7" /></span>
            <h3 className="mt-5 font-bengali text-xl font-bold text-navy">এখনও কোনো মক্কেল নেই</h3>
            <p className="mt-2 font-bengali text-sm text-muted-foreground">মোবাইল অ্যাপে মক্কেল যোগ করলে এখানে দেখা যাবে।</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="group transition duration-200 hover:-translate-y-1 hover:border-brass/30 hover:shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-navy to-navy-soft text-lg font-extrabold text-brass-soft shadow-sm">
                    {client.name.trim().slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bengali text-base font-bold text-navy">{client.name}</h3>
                    <p className="mt-1 font-bengali text-xs text-muted-foreground">{client.fileNo ? `ফাইল: ${client.fileNo}` : 'সিঙ্ক করা মক্কেল'}</p>
                  </div>
                </div>
                <div className="mt-5 space-y-2.5 border-t border-border/70 pt-4 text-sm">
                  {client.phone ? <p className="flex items-center gap-2 text-foreground"><Phone className="h-4 w-4 text-brass" /><span>{client.phone}</span></p> : null}
                  {client.email ? <p className="flex items-center gap-2 truncate text-muted-foreground"><Mail className="h-4 w-4 shrink-0 text-brass" /><span className="truncate">{client.email}</span></p> : null}
                  <p className="flex items-center gap-2 font-bengali text-muted-foreground"><Briefcase className="h-4 w-4 text-brass" /><span>{client._count.parties} মামলা সংযোগ · {client._count.tasks} কাজ</span></p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </UserShell>
  )
}
