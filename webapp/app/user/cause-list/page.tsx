import Link from 'next/link'
import { hasWebDiaryView } from '@/lib/entitlement-gates'
import { requireWebUser, personalWorkspace, planOfUser, planExpiresOfUser } from '@/lib/web-session'
import { withWorkspaceTx } from '@/lib/rls'
import { UserShell } from '@/ui/app-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function UserCauseListPage() {
  const user = await requireWebUser('/user/cause-list')
  const ws = personalWorkspace(user)
  const plan = planOfUser(user)
  const open = hasWebDiaryView(plan, planExpiresOfUser(user), user.createdAt, user.webTrialEndsAt)
  const rows = open && ws
    ? await withWorkspaceTx(ws.id, (tx) =>
        tx.causeListEntry.findMany({
          where: { workspaceId: ws.id },
          orderBy: { updatedAt: 'desc' },
          take: 80,
        }),
      )
    : []

  return (
    <UserShell title="কজ লিস্ট" userLabel={user.name}>
      <section className="mb-7"><span className="eyebrow font-bengali normal-case tracking-normal">আদালতের প্রস্তুতি</span><h2 className="mt-3 font-bengali text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">কজ লিস্ট</h2><p className="mt-2 font-bengali text-sm text-muted-foreground">মোবাইল অ্যাপ থেকে সিঙ্ক করা তারিখ ও মামলার তালিকা।</p></section>
      {!open ? (
        <Card className="border-dashed border-brass bg-amber-50/50">
          <CardContent className="space-y-3 p-6 font-bengali">
            <p>৭ দিনের ট্রায়াল শেষ। কজ লিস্ট দেখতে প্যাকেজ নিন।</p>
            <Button asChild>
              <Link href="/package">ওয়েবসাইটে পে করুন</Link>
            </Button>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <div className="premium-panel grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-navy text-brass-soft"><CalendarDays className="h-7 w-7" /></span><h3 className="mt-5 font-bengali text-xl font-bold text-navy">কজ লিস্ট খালি</h3><p className="mt-2 font-bengali text-sm text-muted-foreground">মোবাইল অ্যাপে এন্ট্রি যোগ করলে এখানে দেখা যাবে।</p></div></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <li key={r.id}>
              <Card className="h-full transition duration-200 hover:-translate-y-1 hover:border-brass/30 hover:shadow-xl">
                <CardContent className="p-5 font-bengali">
                  <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-brass/10 text-navy"><CalendarDays className="h-5 w-5" /></span><div><strong className="block text-navy">{r.caseNoRaw || r.partyName || 'কজ লিস্ট এন্ট্রি'}</strong><p className="mt-1 text-xs text-muted-foreground">{r.courtNameFree || r.purpose || 'আদালতের তথ্য নেই'}</p></div></div>
                  {r.date ? <p className="mt-4 rounded-xl bg-secondary/70 px-3 py-2 text-sm font-semibold text-navy">তারিখ: {r.date.toISOString().slice(0, 10)}</p> : null}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </UserShell>
  )
}
