import Link from 'next/link'
import { AuthShell } from '@/ui/auth-shell'
import { SignupForm } from './signup-form'

type Props = { searchParams?: Promise<{ error?: string }> }

export default async function UserSignupPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  const error = params.error || ''
  return (
    <AuthShell
      title="আপনার ডায়েরি খুলুন"
      description="নাম, মোবাইল ও পাসওয়ার্ড দিয়ে অ্যাকাউন্ট তৈরি করুন। ইমেইল চাইলে ফোনের পাশের তীর খুলুন।"
      eyebrow="৭ দিনের ট্রায়াল"
      footer={(
        <p className="font-bengali text-sm text-muted-foreground">
          আগে থেকেই অ্যাকাউন্ট আছে?{' '}
          <Link href="/user/login" className="font-bold text-navy no-underline hover:text-brass">লগইন করুন</Link>
        </p>
      )}
    >
      <SignupForm error={error} />
    </AuthShell>
  )
}
