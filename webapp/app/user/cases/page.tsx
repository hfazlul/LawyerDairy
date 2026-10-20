import Link from 'next/link'
import { hasWebDiaryView } from '@/lib/entitlement-gates'
import { requireWebUser, personalWorkspace, planOfUser } from '@/lib/web-session'
import { withWorkspaceTx } from '@/lib/rls'
import { UserShell } from '@/ui/app-nav'
import { PrintButton } from '@/ui/print-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, CalendarDays } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function UserCasesPage() {
  const user = await requireWebUser('/user/cases')
  const ws = personalWorkspace(user)
  const plan = planOfUser(user)
  const open = hasWebDiaryView(plan, ws?.planExpiresAt, user.createdAt, user.webTrialEndsAt)
  const cases = open && ws
    ? await withWorkspaceTx(ws.id, (tx) =>
        tx.case.findMany({
          where: { workspaceId: ws.id, deletedAt: null },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        }),
      )
    : []

  return (
    <UserShell title="মামলা (সেভড)" userLabel={user.name}>
      <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><span className="eyebrow font-bengali normal-case tracking-normal">মোবাইল অ্যাপের সাথে সিঙ্ক</span><h2 className="mt-3 font-bengali text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">সেভড মামলা</h2><p className="mt-2 font-bengali text-sm text-muted-foreground">পরবর্তী তারিখ ও আদালতের তথ্য এক নজরে। কেস যোগ বা সম্পাদনা মোবাইল অ্যাপে করুন।</p></div>
        <div className="rounded-2xl border border-border/70 bg-white/75 px-4 py-3 text-sm shadow-soft"><strong className="text-xl text-navy">{cases.length}</strong><span className="ml-2 font-bengali text-muted-foreground">মামলা</span></div>
      </section>
      {!open ? (
        <Card className="border-dashed border-brass bg-amber-50/50">
          <CardContent className="space-y-3 p-6 font-bengali">
            <p>৭ দিনের ট্রায়াল শেষ। সেভড কেস দেখতে প্যাকেজ নিন।</p>
            <Button asChild>
              <Link href="/package">ওয়েবসাইটে পে করুন</Link>
            </Button>
          </CardContent>
        </Card>
      ) : cases.length === 0 ? (
        <div className="premium-panel grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-navy text-brass-soft"><Briefcase className="h-7 w-7" /></span><h3 className="mt-5 font-bengali text-xl font-bold text-navy">সিঙ্ক করা মামলা নেই</h3><p className="mt-2 font-bengali text-sm text-muted-foreground">মোবাইল অ্যাপে মামলা যোগ করলে এখানে দেখা যাবে।</p></div></div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cases.map((c) => (
            <li key={c.id}>
              <Card className="h-full transition duration-200 hover:-translate-y-1 hover:border-brass/30 hover:shadow-xl">
                <CardContent className="p-5 font-bengali">
                  <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy text-brass-soft"><Briefcase className="h-5 w-5" /></span>{c.status ? <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase text-navy">{c.status}</span> : null}</div>
                  <strong className="mt-4 block text-base text-navy">{c.caseNo}</strong>
                  <p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{c.courtNameFree || c.courtUid || 'আদালতের তথ্য নেই'}</p>
                  {c.nextDate ? (
                    <p className="mt-4 flex items-center gap-2 rounded-xl bg-brass/10 px-3 py-2 text-sm font-semibold text-navy"><CalendarDays className="h-4 w-4 text-brass" />পরবর্তী তারিখ: {c.nextDate.toISOString().slice(0, 10)}</p>
                  ) : null}
                  <div className="mt-4"><PrintButton /></div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </UserShell>
  )
}
