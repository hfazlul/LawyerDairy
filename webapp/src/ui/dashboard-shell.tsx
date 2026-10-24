'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  LayoutDashboard,
  User,
  Users,
  Briefcase,
  CalendarDays,
  Calculator,
  Package,
  Settings,
  FileText,
  BarChart3,
  UserSearch,
  Share2,
  MessageSquare,
  GraduationCap,
  Menu,
  LogOut,
  Globe,
  ContactRound,
  type LucideIcon,
} from '@/components/icons'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { TrackBeacon } from '@/ui/track-beacon'

export type NavItem = {
  href: string
  label: string
  labelBn?: string
  icon: LucideIcon
}

const USER_NAV: NavItem[] = [
  { href: '/user', label: 'Dashboard', labelBn: 'ড্যাশবোর্ড', icon: LayoutDashboard },
  { href: '/user/clients', label: 'Clients', labelBn: 'মক্কেল', icon: ContactRound },
  { href: '/user/cases', label: 'Cases', labelBn: 'মামলা', icon: Briefcase },
  { href: '/user/cause-list', label: 'Cause list', labelBn: 'কজ লিস্ট', icon: CalendarDays },
  { href: '/user/team', label: 'Team', labelBn: 'টিম / চেম্বার', icon: Users },
  { href: '/user/member', label: 'Membership', labelBn: 'সদস্যপদ', icon: Package },
  { href: '/user/profile', label: 'Profile', labelBn: 'প্রোফাইল', icon: User },
  { href: '/tools', label: 'Calculators', labelBn: 'ক্যালকুলেটর', icon: Calculator },
  { href: '/package', label: 'Packages', labelBn: 'প্যাকেজ', icon: Package },
]

const ADMIN_NAV: NavItem[] = [
  { href: '/hfazlul', label: 'Overview', labelBn: 'ওভারভিউ', icon: LayoutDashboard },
  { href: '/hfazlul/cms', label: 'CMS', labelBn: 'সিএমএস', icon: FileText },
  { href: '/hfazlul/packages', label: 'Packages', labelBn: 'প্যাকেজ', icon: Package },
  { href: '/hfazlul/activate', label: 'Activate', labelBn: 'অ্যাক্টিভেট', icon: Settings },
  { href: '/hfazlul/users', label: 'Users', labelBn: 'ইউজার', icon: Users },
  { href: '/hfazlul/analytics', label: 'Analytics', labelBn: 'অ্যানালিটিক্স', icon: BarChart3 },
  { href: '/hfazlul/find-lawyer', label: 'Find Lawyer', labelBn: 'আইনজীবী খুঁজুন', icon: UserSearch },
  { href: '/hfazlul/referrals', label: 'Referrals', labelBn: 'রেফারেল', icon: Share2 },
  { href: '/hfazlul/messaging', label: 'Messaging', labelBn: 'মেসেজিং', icon: MessageSquare },
  { href: '/hfazlul/career', label: 'Career', labelBn: 'ক্যারিয়ার', icon: GraduationCap },
]

function NavLinks(props: {
  items: NavItem[]
  onNavigate?: () => void
  compact?: boolean
}) {
  const pathname = usePathname()
  return (
    <nav className={cn('flex flex-col gap-1', props.compact ? 'p-2' : 'p-3')}>
      {props.items.map((item) => {
        const active =
          item.href === '/user' || item.href === '/hfazlul'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`)
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={props.onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              props.compact
                ? active
                  ? 'bg-brass/15 text-navy'
                  : 'text-navy/75 hover:bg-secondary hover:text-navy'
                : active
                  ? 'bg-brass/20 text-brass-soft'
                  : 'text-white/80 hover:bg-white/10 hover:text-white',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="font-bengali">{item.labelBn || item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBrand(props: { title: string; subtitle: string }) {
  return (
    <div className="border-b border-white/10 px-5 py-6">
      <Link href="/" className="flex items-center gap-3 text-white no-underline">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-lg font-black text-brass-soft">M</span>
        <span>
          <div className="text-xs font-semibold uppercase tracking-[.18em] text-brass-soft">MAMLAQ</div>
          <div className="mt-1 text-sm font-bold leading-tight">{props.title}</div>
          <div className="mt-0.5 text-[10px] text-white/45">{props.subtitle}</div>
        </span>
      </Link>
    </div>
  )
}

function ShellHeader(props: {
  title: string
  userLabel?: string
  mobileNav: ReactNode
  logout: ReactNode
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/70 bg-white/80 px-4 shadow-sm backdrop-blur-xl md:px-8">
      <div className="lg:hidden">{props.mobileNav}</div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-bengali text-base font-bold text-navy md:text-lg">{props.title}</h1>
      </div>
      <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
        <Globe className="h-4 w-4" />
        <span className="font-bengali">বাংলা</span>
      </div>
      {props.userLabel ? (
        <div className="hidden max-w-[160px] truncate rounded-full bg-secondary px-3 py-1 text-xs font-medium text-navy md:block">
          {props.userLabel}
        </div>
      ) : null}
      {props.logout}
    </header>
  )
}

function UserMobileDock() {
  const pathname = usePathname()
  const items = [
    { href: '/user', label: 'হোম', icon: LayoutDashboard },
    { href: '/user/clients', label: 'মক্কেল', icon: ContactRound },
    { href: '/user/cases', label: 'মামলা', icon: Briefcase },
    { href: '/user/cause-list', label: 'কজ লিস্ট', icon: CalendarDays },
    { href: '/tools', label: 'টুলস', icon: Calculator },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(14,27,44,.08)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 px-1 py-1">
        {items.map((item) => {
          const Icon = item.icon
          const active = item.href === '/user' ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link key={item.href} href={item.href} className={cn('flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold no-underline transition', active ? 'bg-brass/10 text-brass' : 'text-muted-foreground')}>
              <Icon className="h-5 w-5" />
              <span className="font-bengali">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function DashboardShell(props: {
  variant: 'user' | 'admin'
  title: string
  userLabel?: string
  beacon?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const items = props.variant === 'user' ? USER_NAV : ADMIN_NAV
  const brandTitle = props.variant === 'user' ? 'ইউজার প্যানেল' : 'অ্যাডমিন প্যানেল'
  const brandSub = props.variant === 'user' ? 'Lawyer Diary' : 'MAMLAQ Control'

  const logout =
    props.variant === 'user' ? (
      <form action="/api/auth/logout" method="post">
        <Button type="submit" variant="outline" size="sm" className="gap-1.5">
          <LogOut className="h-3.5 w-3.5" />
          <span className="font-bengali hidden sm:inline">লগআউট</span>
        </Button>
      </form>
    ) : (
      <form action="/api/admin/auth/logout" method="post">
        <Button type="submit" variant="outline" size="sm" className="gap-1.5">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </form>
    )

  const mobileNav = (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Menu">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader>
          <SheetTitle className="font-bengali">{brandTitle}</SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NavLinks items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <div className="flex min-h-screen bg-[#f7f3ea]">
      <TrackBeacon name={props.beacon} />
      <aside className="premium-grid sticky top-0 hidden h-screen w-[272px] shrink-0 flex-col bg-gradient-to-b from-navy-deep via-navy to-navy-soft text-white shadow-2xl lg:flex">
        <SidebarBrand title={brandTitle} subtitle={brandSub} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NavLinks items={items} />
        </div>
        <div className="border-t border-white/10 p-3 text-xs text-white/45">MAMLAQ Legal Management</div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ShellHeader
          title={props.title}
          userLabel={props.userLabel}
          mobileNav={mobileNav}
          logout={logout}
        />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:px-8 md:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">{props.children}</div>
        </main>
      </div>
      {props.variant === 'user' ? <UserMobileDock /> : null}
    </div>
  )
}

/** @deprecated Use UserShell — kept as thin alias for gradual migration */
export function UserNav() {
  return null
}

/** @deprecated Use AdminShell */
export function AdminNav() {
  return null
}

export function UserShell(props: {
  title: string
  userLabel?: string
  children: ReactNode
}) {
  return (
    <DashboardShell variant="user" title={props.title} userLabel={props.userLabel} beacon="user_dashboard">
      {props.children}
    </DashboardShell>
  )
}

export function AdminShell(props: {
  title: string
  userLabel?: string
  children: ReactNode
}) {
  return (
    <DashboardShell variant="admin" title={props.title} userLabel={props.userLabel} beacon="admin_view">
      {props.children}
    </DashboardShell>
  )
}

export { Separator }
