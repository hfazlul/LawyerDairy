import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminCount } from '@/lib/admin-session'
import { AdminGate } from '@/ui/admin-gate'
import { AdminSignupForm } from './admin-signup-form'

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
      <AdminSignupForm invite={invite} notice={notice} />
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
