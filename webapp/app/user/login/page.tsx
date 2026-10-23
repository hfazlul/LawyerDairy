import Link from 'next/link'
import { AuthShell } from '@/ui/auth-shell'
import { LoginForm } from './login-form'

type Props = { searchParams?: Promise<{ error?: string; next?: string }> }

export default async function UserLoginPage({ searchParams }: Props) {
  const params = (await searchParams) || {}
  const error = params.error || ''
  const next = params.next && params.next.startsWith('/') && !params.next.startsWith('//')
    ? params.next
    : '/user'

  return (
    <AuthShell
      title="আবার স্বাগতম"
      description="নাম ও পাসওয়ার্ড দিয়ে আপনার ডায়েরিতে প্রবেশ করুন।"
      footer={(
        <p className="font-bengali text-sm text-muted-foreground">
          নতুন ব্যবহারকারী?{' '}
          <Link href="/user/signup" className="font-bold text-navy no-underline hover:text-brass">অ্যাকাউন্ট খুলুন</Link>
          <span className="mx-2 text-border">•</span>
          <Link href="/user/forgot" className="font-bold text-navy no-underline hover:text-brass">পাসওয়ার্ড ভুলে গেছেন?</Link>
        </p>
      )}
    >
            <LoginForm error={error} next={next} />
    </AuthShell>
  )
}
