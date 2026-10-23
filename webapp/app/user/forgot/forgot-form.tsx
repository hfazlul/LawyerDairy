'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kEmailExample, kPasswordHintBn, kPhoneExample, passwordIssues, signupPhoneIssue } from '@/lib/identity'
import { plainAuthNotice } from '@/lib/auth/signup-failure'
import { cn } from '@/lib/utils'

const invalidClass = 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20'
const kForgotServerMessage = 'কোড পাঠানো যায়নি। আবার চেষ্টা করুন।'
const kOtpExpiredMessage = 'কোডের মেয়াদ শেষ। আবার চেষ্টা করুন।'
const OTP_SECONDS = 5 * 60

function PhoneOtpHint() {
  return (
    <p className="font-bengali text-sm leading-6 text-navy">
      মোবাইলে ওটিপি না এলে পেছনে গিয়ে ইমেইল বেছে নিন। ইমেইল বাটনে চাপ দিয়ে ইমেইল দিয়ে ওটিপি নিন।
    </p>
  )
}

function shownForgotError(raw: string): string {
  if (!raw.trim()) return ''
  return plainAuthNotice(raw, kForgotServerMessage)
}

function bnDigits(value: string): string {
  const digits = '০১২৩৪৫৬৭৮৯'
  return value.replace(/\d/g, (ch) => digits[Number(ch)] || ch)
}

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return bnDigits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
}

function emailOk(value: string): boolean {
  const text = value.trim()
  return text.includes('@') && text.includes('.') && !text.includes(' ')
}

type Channel = 'email' | 'phone'
type Step = 'choose' | 'form' | 'code'

export function ForgotForm({ error = '', sent = false }: { error?: string; sent?: boolean }) {
  const router = useRouter()
  const [channel, setChannel] = useState<Channel | null>(null)
  const [step, setStep] = useState<Step>(sent ? 'code' : 'choose')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(sent ? '' : shownForgotError(error))
  const [invalidPhone, setInvalidPhone] = useState(false)
  const [left, setLeft] = useState(sent ? OTP_SECONDS : 0)

  useEffect(() => {
    if (sent) {
      setStep('code')
      setMessage('')
      setInvalidPhone(false)
      setLeft(OTP_SECONDS)
      return
    }
    if (!error) return
    setMessage(shownForgotError(error))
  }, [error, sent])

  useEffect(() => {
    if (step !== 'code' || left <= 0) return
    const id = window.setInterval(() => {
      setLeft((n) => (n <= 1 ? 0 : n - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [step, left > 0])

  useEffect(() => {
    if (step === 'code' && left === 0) setMessage(kOtpExpiredMessage)
  }, [step, left])

  function choose(next: Channel) {
    setChannel(next)
    setStep('form')
    setMessage('')
    setInvalidPhone(false)
  }

  function backToChoice() {
    setStep('choose')
    setMessage('')
    setInvalidPhone(false)
    setLeft(0)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 'choose' || !channel) return
    if (step === 'form') {
      if (channel === 'phone') {
        const phoneErr = signupPhoneIssue(phone)
        if (phoneErr) {
          setMessage(phoneErr)
          setInvalidPhone(true)
          return
        }
        if (!emailOk(email)) {
          setMessage('ইমেইল ও ফোন নম্বর দিন।')
          setInvalidPhone(false)
          return
        }
      } else if (!emailOk(email)) {
        setMessage('সঠিক ইমেইল দিন।')
        return
      }
      setBusy(true)
      try {
        const res = await fetch('/api/web/v1/password/reset/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(channel === 'email' ? { channel, email } : { channel, email, phone }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const raw = typeof data.messageBn === 'string' && data.messageBn.trim()
            ? data.messageBn
            : typeof data.message === 'string'
              ? data.message
              : ''
          setMessage(raw.trim() ? shownForgotError(raw) : kForgotServerMessage)
          setInvalidPhone(channel === 'phone')
          setBusy(false)
          return
        }
        const seconds = typeof data.expiresInSec === 'number' && data.expiresInSec > 0
          ? data.expiresInSec
          : OTP_SECONDS
        setMessage('')
        setInvalidPhone(false)
        setLeft(seconds)
        setStep('code')
      } catch {
        setMessage(kForgotServerMessage)
        setInvalidPhone(false)
      } finally {
        setBusy(false)
      }
      return
    }

    if (left <= 0) {
      setMessage(kOtpExpiredMessage)
      return
    }
    const pwErr = passwordIssues(password)
    if (pwErr) {
      setMessage(pwErr)
      return
    }
    if (password !== confirm) {
      setMessage('পাসওয়ার্ড মিলেনি')
      return
    }
    setBusy(true)
    let redirected = false
    try {
      const res = await fetch('/api/mobile/v1/auth/password/otp/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          ...(channel === 'email' ? { email } : { phone, email }),
          otp,
          newPassword: password,
          confirmPassword: confirm,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const raw = typeof data.messageBn === 'string' && data.messageBn.trim()
          ? data.messageBn
          : typeof data.message === 'string'
            ? data.message
            : ''
        setMessage(raw.trim() ? shownForgotError(raw) : kOtpExpiredMessage)
        return
      }
      redirected = true
      router.replace('/user/login')
    } catch {
      setMessage(kForgotServerMessage)
    } finally {
      if (!redirected) setBusy(false)
    }
  }

  return (
    <form className="space-y-5" action="/api/web/v1/password/reset/request" method="post" noValidate onSubmit={onSubmit}>
      {message ? (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm text-destructive"
        >
          {message}
        </p>
      ) : null}
      {step === 'choose' ? (
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" size="lg" variant="navy" className="font-bengali" onClick={() => choose('email')}>
            ইমেইল
          </Button>
          <Button type="button" size="lg" variant="outline" className="font-bengali" onClick={() => choose('phone')}>
            ফোন
          </Button>
        </div>
      ) : null}
      {step !== 'choose' ? (
        <button type="button" onClick={backToChoice} className="font-bengali text-sm font-bold text-navy">
          পেছনে
        </button>
      ) : null}
      {step === 'form' && channel === 'email' ? (
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-bengali">ইমেইল</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={kEmailExample}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      ) : null}
      {step === 'form' && channel === 'phone' ? (
        <>
          {channel === 'phone' ? <PhoneOtpHint /> : null}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="font-bengali">ইমেইল</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={kEmailExample}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="identifier" className="font-bengali">ফোন নম্বর</Label>
            <Input
              id="identifier"
              name="phone"
              required
              inputMode="numeric"
              maxLength={11}
              autoComplete="tel"
              placeholder={kPhoneExample}
              value={phone}
              aria-invalid={invalidPhone || undefined}
              className={cn(invalidPhone && invalidClass)}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                setInvalidPhone(false)
              }}
            />
          </div>
        </>
      ) : null}
      {step === 'code' ? (
        <>
          {channel === 'phone' ? <PhoneOtpHint /> : null}
          <p className="font-bengali text-sm text-navy" data-otp-clock={left}>
            {left > 0 ? `বাকি সময় ${clock(left)}` : kOtpExpiredMessage}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="font-bengali">৬ সংখ্যার কোড</Label>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-bengali">নতুন পাসওয়ার্ড</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="font-bengali text-xs text-muted-foreground">{kPasswordHintBn}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="font-bengali">নিশ্চিত করুন</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </>
      ) : null}
      {step !== 'choose' ? (
        <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy || (step === 'code' && left <= 0)}>
          {busy ? 'অপেক্ষা করুন' : step === 'code' ? 'পাসওয়ার্ড বদলান' : 'OTP পাঠান'}
        </Button>
      ) : null}
    </form>
  )
}
