import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminCount } from '@/lib/admin-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kEmailExample, kPhoneExample } from '@/lib/identity'
import { AdminGate } from '@/ui/admin-gate'

export const dynamic = 'force-dynamic'

type Props = { searchParams?: Promise<{ invite?: string }> }

export default async function AdminSignupPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  const invite = params.invite || ''
  const n = await adminCount().catch(() => 0)
  if (n > 0 && !invite) redirect('/hfazlul/login')
  const raw = (await headers()).get('x-admin-notice')
  const notice = raw ? safeDecode(raw) : ''
  return (
    <AdminGate title="অ্যাডমিন অ্যাকাউন্ট" description="কনসোলের প্রবেশাধিকার তৈরি করুন।">
      <form className="space-y-4" action="/api/admin/auth/signup" method="post">
        {invite ? <input type="hidden" name="invite" value={invite} /> : null}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="font-bengali">নাম</Label>
          <Input id="name" name="name" required minLength={2} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username" className="font-bengali">ইউজারনেম</Label>
          <Input id="username" name="username" required minLength={4} autoComplete="username" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="font-bengali">মোবাইল</Label>
          <Input id="phone" name="phone" required inputMode="numeric" maxLength={11} placeholder={kPhoneExample} autoComplete="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-bengali">ইমেইল</Label>
          <Input id="email" name="email" type="email" required placeholder={kEmailExample} autoComplete="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-bengali">পাসওয়ার্ড</Label>
          <Input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" />
          <p className="font-bengali text-xs leading-5 text-[#12263f]">কমপক্ষে ১০ অক্ষরের পাসওয়ার্ড ব্যবহার করুন</p>
        </div>
        {notice ? <p className="font-bengali text-sm leading-6 text-[#8a3b32]">{notice}</p> : null}
        <Button type="submit" size="lg" variant="navy" className="w-full font-bengali">তৈরি করুন</Button>
      </form>
    </AdminGate>
  )
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
