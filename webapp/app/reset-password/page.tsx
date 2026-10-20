'use client'

import { useSearchParams } from 'next/navigation'
import { FormEvent, useState, Suspense } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/ui/site-chrome'
import { kPasswordHintBn, passwordIssues } from '@/lib/identity'
import { plainAuthNotice } from '@/lib/auth/signup-failure'
import { showAuthToast } from '@/ui/auth-toast'

function ResetInner() {
  const params = useSearchParams()
  const token = params.get('token') || ''
  const [msg, setMsg] = useState('')

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const password = String(fd.get('password') || '')
    const confirmPassword = String(fd.get('confirmPassword') || '')
    const pwErr = passwordIssues(password)
    if (pwErr) {
      showAuthToast(pwErr)
      return
    }
    if (password !== confirmPassword) {
      showAuthToast('পাসওয়ার্ড মিলেনি')
      return
    }
    const res = await fetch('/api/mobile/v1/auth/password/reset/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        resetToken: token,
        password,
        confirmPassword,
      }),
    })
    if (res.ok) {
      setMsg('পাসওয়ার্ড বদলেছে — আবার লগইন করুন')
      showAuthToast('পাসওয়ার্ড বদলেছে — আবার লগইন করুন')
      return
    }
    const data = await res.json().catch(() => ({}))
    const fallback = 'রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।'
    const raw = typeof data.messageBn === 'string' && data.messageBn.trim()
      ? data.messageBn
      : typeof data.message === 'string'
        ? data.message
        : ''
    const message = raw.trim() ? plainAuthNotice(raw, fallback) : 'লিংক অবৈধ বা মেয়াদোত্তীর্ণ'
    setMsg(message)
    showAuthToast(message)
  }

  return (
    <main className="page" style={{ maxWidth: 420 }}>
      <h1 className="hero-title">নতুন পাসওয়ার্ড</h1>
      <form className="card" onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
        <div className="field">
          <label className="label">নতুন পাসওয়ার্ড</label>
          <input className="input" type="password" name="password" required minLength={6} />
          <p className="muted">{kPasswordHintBn}</p>
        </div>
        <div className="field">
          <label className="label">নিশ্চিত করুন</label>
          <input className="input" type="password" name="confirmPassword" required minLength={6} />
        </div>
        <button className="btn" type="submit">সেভ</button>
        {msg ? <p className="muted">{msg}</p> : null}
      </form>
      <p className="muted" style={{ marginTop: '1rem' }}><Link href="/user/login">Login</Link></p>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<p className="page muted">Loading…</p>}>
        <ResetInner />
      </Suspense>
    </>
  )
}
