import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminCount } from '@/lib/admin-session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AdminGate } from '@/ui/admin-gate'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  if ((await adminCount().catch(() => 0)) === 0) redirect('/hfazlul/signup')
  const raw = (await headers()).get('x-admin-notice')
  const notice = raw ? safeDecode(raw) : ''
  return (
    <AdminGate title="অ্যাডমিন" description="কনসোলে প্রবেশ করতে তথ্য দিন।">
      <form className="space-y-5" action="/api/admin/auth/login" method="post">
        <div className="space-y-1.5">
          <Label htmlFor="identifier" className="font-bengali">ইউজারনেম বা ইমেইল</Label>
          <Input id="identifier" name="identifier" required autoComplete="username" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="font-bengali">পাসওয়ার্ড</Label>
          <Input id="password" type="password" name="password" required autoComplete="current-password" />
        </div>
        {notice ? <p className="font-bengali text-sm leading-6 text-[#8a3b32]">{notice}</p> : null}
        <Button type="submit" size="lg" variant="navy" className="w-full font-bengali">প্রবেশ</Button>
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
