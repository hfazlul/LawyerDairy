import Link from 'next/link'
import { requireWebUser, planOfUser, planExpiresOfUser, personalWorkspace } from '@/lib/web-session'
import { isPremiumActive, webTrialActive } from '@/lib/entitlement-gates'
import { withWorkspaceTx } from '@/lib/rls'
import { UserShell } from '@/ui/app-nav'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard,
  User,
  Package,
  Users,
  CalendarDays,
  Briefcase,
  Calculator,
  ChevronRight,
  ContactRound,
} from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function UserHome() {
  const user = await requireWebUser('/user')
  const ws = personalWorkspace(user)
  const plan = planOfUser(user)
  const active = isPremiumActive(plan, planExpiresOfUser(user))
  const trial = webTrialActive(user.createdAt, user.webTrialEndsAt)

  const summary = ws
    ? await withWorkspaceTx(ws.id, async (tx) => {
        const [clients, cases, causeList, openTasks, upcoming] = await Promise.all([
          tx.client.count({ where: { workspaceId: ws.id, deletedAt: null } }),
          tx.case.count({ where: { workspaceId: ws.id, deletedAt: null, status: { not: 'closed' } } }),
          tx.causeListEntry.count({ where: { workspaceId: ws.id, date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
          tx.task.count({ where: { workspaceId: ws.id, deletedAt: null, status: { not: 'done' } } }),
          tx.case.findMany({
            where: { workspaceId: ws.id, deletedAt: null, nextDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
            orderBy: { nextDate: 'asc' },
            take: 4,
            select: { id: true, caseNo: true, courtNameFree: true, courtUid: true, nextDate: true, stage: true },
          }),
        ])
        return { clients, cases, causeList, openTasks, upcoming }
      })
    : { clients: 0, cases: 0, causeList: 0, openTasks: 0, upcoming: [] }

  const items = [
    { href: '/user/clients', title: 'মক্কেল', note: 'যোগাযোগ ও মামলা সংযোগ', icon: ContactRound },
    { href: '/user/cases', title: 'মামলা', note: 'সেভড কেস ও পরবর্তী তারিখ', icon: Briefcase },
    { href: '/user/cause-list', title: 'কজ লিস্ট', note: active || trial ? 'আজ ও আগামী দিনের তালিকা' : 'ট্রায়াল শেষ', icon: CalendarDays },
    { href: '/user/team', title: 'টিম / চেম্বার', note: active || trial ? 'সদস্য ও অনুমতি' : 'আপগ্রেড প্রয়োজন', icon: Users },
    { href: '/user/profile', title: 'প্রোফাইল', note: 'সবসময় খোলা', icon: User },
    { href: '/user/member', title: 'সদস্যপদ', note: active ? plan : 'FREE', icon: Package },
    { href: '/tools', title: 'ক্যালকুলেটর', note: 'কোর্ট ফি · তামাদি · কাবিন · স্ট্যাম্প', icon: Calculator },
  ]

  const stats = [
    { label: 'মক্কেল', value: summary.clients, icon: ContactRound, href: '/user/clients' },
    { label: 'চলমান মামলা', value: summary.cases, icon: Briefcase, href: '/user/cases' },
    { label: 'আসন্ন কজ লিস্ট', value: summary.causeList, icon: CalendarDays, href: '/user/cause-list' },
    { label: 'খোলা কাজ', value: summary.openTasks, icon: LayoutDashboard, href: '/user' },
  ]

  return (
    <UserShell title="ড্যাশবোর্ড" userLabel={user.name}>
      <section className="premium-grid relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-deep via-navy to-navy-soft px-5 py-7 text-white shadow-card sm:px-8 sm:py-9">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-brass/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-bengali text-sm font-semibold text-brass-soft">শুভেচ্ছা,</p>
            <h2 className="mt-1 font-bengali text-3xl font-extrabold tracking-tight sm:text-4xl">{user.name}</h2>
            <p className="mt-3 font-bengali text-sm text-white/60">@{user.username} · আপনার আইনচর্চার আজকের সারসংক্ষেপ</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="brass" className="border-white/10 px-3 py-1.5">{active ? plan : 'FREE'}</Badge>
            {trial && !active ? <Badge variant="success" className="px-3 py-1.5">ট্রায়াল চলছে</Badge> : null}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-3 grid grid-cols-2 gap-3 px-2 sm:-mt-5 sm:grid-cols-4 sm:gap-4 sm:px-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href} className="rounded-2xl border border-white/80 bg-white/95 p-4 text-inherit no-underline shadow-card transition hover:-translate-y-1 hover:border-brass/30 sm:p-5">
              <div className="flex items-center justify-between gap-2"><Icon className="h-5 w-5 text-brass" /><ChevronRight className="h-4 w-4 text-slate-300" /></div>
              <strong className="mt-3 block text-2xl text-navy sm:text-3xl">{stat.value}</strong>
              <span className="font-bengali text-xs text-muted-foreground sm:text-sm">{stat.label}</span>
            </Link>
          )
        })}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-bengali text-xl font-extrabold text-navy">দ্রুত প্রবেশ</h2><p className="mt-1 font-bengali text-sm text-muted-foreground">ওয়েব ও মোবাইলের সিঙ্ক করা workspace</p></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((it) => {
              const Icon = it.icon
              return (
                <Link key={it.href + it.title} href={it.href} className="group no-underline">
                  <Card className="h-full transition duration-200 hover:-translate-y-1 hover:border-brass/35 hover:shadow-xl">
                    <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-soft text-brass-soft shadow-sm"><Icon className="h-5 w-5" /></div>
                      <div className="min-w-0 flex-1"><CardTitle className="font-bengali text-base">{it.title}</CardTitle><CardDescription className="mt-1 truncate font-bengali text-xs">{it.note}</CardDescription></div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-brass" />
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        <section>
          <div className="mb-4"><h2 className="font-bengali text-xl font-extrabold text-navy">আসন্ন তারিখ</h2><p className="mt-1 font-bengali text-sm text-muted-foreground">মোবাইল ডায়েরি থেকে সিঙ্ক করা</p></div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {summary.upcoming.length === 0 ? (
                <div className="grid min-h-64 place-items-center p-8 text-center"><div><CalendarDays className="mx-auto h-8 w-8 text-brass" /><p className="mt-3 font-bengali font-bold text-navy">আসন্ন তারিখ নেই</p><p className="mt-1 font-bengali text-sm text-muted-foreground">মোবাইল অ্যাপে পরবর্তী তারিখ যোগ করুন।</p></div></div>
              ) : summary.upcoming.map((item, index) => (
                <div key={item.id} className={`flex items-center gap-4 p-4 ${index ? 'border-t border-border/70' : ''}`}>
                  <div className="w-14 shrink-0 rounded-xl bg-brass/10 px-2 py-2 text-center"><strong className="block text-lg text-navy">{item.nextDate?.getDate()}</strong><span className="text-[10px] uppercase text-muted-foreground">{item.nextDate?.toLocaleString('en', { month: 'short' })}</span></div>
                  <div className="min-w-0 flex-1"><strong className="block truncate font-bengali text-sm text-navy">{item.caseNo}</strong><p className="mt-1 truncate font-bengali text-xs text-muted-foreground">{item.courtNameFree || item.courtUid || item.stage || 'আদালত'}</p></div>
                  <ChevronRight className="h-4 w-4 text-slate-300" />
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </UserShell>
  )
}
