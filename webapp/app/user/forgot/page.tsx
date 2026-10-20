import Link from 'next/link'
import { AuthShell } from '@/ui/auth-shell'
import { ForgotForm } from './forgot-form'

type Props = { searchParams?: Promise<{ sent?: string; error?: string }> }

export default async function UserForgotPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  return (
    <AuthShell
      title="পাসওয়ার্ড পুনরুদ্ধার"
      description="অ্যাকাউন্টের ফোন নম্বর দিন। সংযুক্ত ইমেইলে নিরাপদ রিসেট লিংক পাঠানো হবে।"
      footer={<Link href="/user/login" className="font-bengali text-sm font-bold text-navy no-underline hover:text-brass">লগইনে ফিরে যান</Link>}
    >
      <ForgotForm error={params.error || ''} sent={Boolean(params.sent)} />
    </AuthShell>
  )
}
