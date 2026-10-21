'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kPasswordHintBn, kPhoneExample, kPhoneNotRegisteredMessage, kSignupPhoneError, passwordIssues, signupPhoneIssue } from '@/lib/identity'
import { plainAuthNotice } from '@/lib/auth/signup-failure'
import { cn } from '@/lib/utils'

const invalidClass = 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20'
const kForgotServerMessage = 'এসএমএস পাঠানো যায়নি। আবার চেষ্টা করুন।'
const kOtpExpiredMessage = 'কোডের মেয়াদ শেষ। আবার চেষ্টা করুন।'
const kResetDoneMessage = 'পাসওয়ার্ড বদলেছে — আবার লগইন করুন'
const OTP_SECONDS = 10 * 60

function shownForgotError(raw: string): string {
  if (!raw.trim()) return ''
  return plainAuthNotice(raw, kForgotServerMessage)
}

function phoneBorder(message: string) {
  return message === kSignupPhoneError || message === kPhoneNotRegisteredMessage
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

export function ForgotForm({ error = '', sent = false }: { error?: string; sent?: boolean }) {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'phone' | 'otp'>(sent ? 'otp' : 'phone')
  const [message, setMessage] = useState(sent ? '' : shownForgotError(error))
  const [invalid, setInvalid] = useState(phoneBorder(shownForgotError(error)))
  const [left, setLeft] = useState(sent ? OTP_SECONDS : 0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (sent) {
      setStep('otp')
      setMessage('')
      setInvalid(false)
      setLeft(OTP_SECONDS)
      return
    }
    if (!error) return
    const text = shownForgotError(error)
    setMessage(text)
    setInvalid(phoneBorder(text))
  }, [error, sent])

  useEffect(() => {
    if (step !== 'otp' || left <= 0) return
    const id = window.setInterval(() => {
      setLeft((n) => (n <= 1 ? 0 : n - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [step, left > 0])

  useEffect(() => {
    if (step === 'otp' && left === 0 && !done) setMessage(kOtpExpiredMessage)
  }, [step, left, done])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (step === 'phone') {
      const phoneErr = signupPhoneIssue(phone)
      if (phoneErr) {
        setMessage(phoneErr)
        setInvalid(true)
        return
      }
      setBusy(true)
      try {
        const res = await fetch('/api/web/v1/password/reset/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ identifier: phone }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          const raw = typeof data.messageBn === 'string' && data.messageBn.trim()
            ? data.messageBn
            : typeof data.message === 'string'
              ? data.message
              : ''
          const text = raw.trim() ? shownForgotError(raw) : kForgotServerMessage
          setMessage(text)
          setInvalid(phoneBorder(text))
          setBusy(false)
          return
        }
        const seconds = typeof data.expiresInSec === 'number' && data.expiresInSec > 0
          ? data.expiresInSec
          : OTP_SECONDS
        setMessage('')
        setInvalid(false)
        setLeft(seconds)
        setStep('otp')
      } catch {
        setMessage(kForgotServerMessage)
        setInvalid(false)
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
    try {
      const res = await fetch('/api/mobile/v1/auth/password/otp/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          phone,
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
      setDone(true)
      setMessage(kResetDoneMessage)
    } catch {
      setMessage(kForgotServerMessage)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-5" action="/api/web/v1/password/reset/request" method="post" noValidate onSubmit={onSubmit}>
      {message ? (
        <p
          role={done ? 'status' : 'alert'}
          className={
            done
              ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-bengali text-sm text-emerald-800'
              : 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm text-destructive'
          }
        >
          {message}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="identifier" className="font-bengali">ফোন নম্বর</Label>
        <Input
          id="identifier"
          name="identifier"
          required
          inputMode="numeric"
          maxLength={11}
          autoComplete="tel"
          placeholder={kPhoneExample}
          value={phone}
          readOnly={step === 'otp'}
          aria-invalid={invalid || undefined}
          className={cn(invalid && invalidClass)}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
            setInvalid(false)
          }}
        />
      </div>
      {step === 'otp' ? (
        <>
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
      <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy || (step === 'otp' && left <= 0)}>
        {busy ? 'অপেক্ষা করুন' : step === 'otp' ? 'পাসওয়ার্ড বদলান' : 'OTP পাঠান'}
      </Button>
    </form>
  )
}
