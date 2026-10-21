'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  kEmailExample,
  kPhoneExample,
  kSignupEmailError,
  kSignupNameError,
  kSignupPasswordError,
  kSignupPasswordHelper,
  kSignupPhoneError,
  kSignupReferralError,
  signupEmailIssue,
  signupNameIssue,
  signupPasswordIssue,
  signupPhoneIssue,
  signupReferralIssue,
} from '@/lib/identity'
import { plainAuthNotice } from '@/lib/auth/signup-failure'
import { cn } from '@/lib/utils'

const invalidClass = 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20'
const kSignupSaveFailed = 'অ্যাকাউন্ট তৈরি হয়নি। আবার চেষ্টা করুন।'

function shownSignupError(raw: string): string {
  if (!raw.trim()) return ''
  return plainAuthNotice(raw, kSignupSaveFailed)
}

type FieldFlags = { name: boolean; phone: boolean; email: boolean; password: boolean; referral: boolean }

const clearFlags: FieldFlags = { name: false, phone: false, email: false, password: false, referral: false }

function bordersForSignup(message: string): FieldFlags {
  if (!message) return clearFlags
  if (message === kSignupNameError || message.includes('এই নামে')) return { ...clearFlags, name: true }
  if (message === kSignupPhoneError || message.includes('মোবাইল')) return { ...clearFlags, phone: true }
  if (message === kSignupEmailError || message.includes('ইমেইল')) return { ...clearFlags, email: true }
  if (message === kSignupReferralError || message.includes('রেফারেল')) return { ...clearFlags, referral: true }
  if (message === kSignupPasswordError || message.includes('পাসওয়ার্ড')) return { ...clearFlags, password: true }
  return clearFlags
}

export function SignupForm({ error }: { error: string }) {
  const initialBorders = bordersForSignup(error)
  const [extrasOpen, setExtrasOpen] = useState(initialBorders.email || initialBorders.referral)
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [referral, setReferral] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(shownSignupError(error))
  const [invalid, setInvalid] = useState<FieldFlags>(initialBorders)
  const sending = useRef(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const leaked = ['password', 'phone', 'name', 'email', 'referralCode', 'acceptedTerms', 'next', 'uiLanguage']
    if (leaked.some((key) => url.searchParams.has(key))) {
      window.history.replaceState(null, '', url.pathname)
    }
  }, [])

  useEffect(() => {
    if (!error) return
    const text = shownSignupError(error)
    const borders = bordersForSignup(text)
    setMessage(text)
    setInvalid(borders)
    if (borders.email || borders.referral) setExtrasOpen(true)
  }, [error])

  function clearField(field: keyof FieldFlags) {
    setInvalid((current) => ({ ...current, [field]: false }))
  }

  function showIssue(text: string) {
    const borders = bordersForSignup(text)
    setMessage(text)
    setInvalid(borders)
    if (borders.email || borders.referral) setExtrasOpen(true)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const nameErr = signupNameIssue(name)
    if (nameErr) {
      showIssue(nameErr)
      return
    }
    const phoneErr = signupPhoneIssue(phone)
    if (phoneErr) {
      showIssue(phoneErr)
      return
    }
    const mailErr = signupEmailIssue(email)
    if (mailErr) {
      showIssue(mailErr)
      return
    }
    const referralErr = signupReferralIssue(referral)
    if (referralErr) {
      showIssue(referralErr)
      return
    }
    const pwErr = signupPasswordIssue(password)
    if (pwErr) {
      showIssue(pwErr)
      return
    }
    if (sending.current) return
    sending.current = true
    setBusy(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          referralCode: referral,
          password,
          uiLanguage: 'bn',
          acceptedTerms: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showIssue(typeof data.message === 'string' && data.message.trim() ? shownSignupError(data.message) : kSignupSaveFailed)
        sending.current = false
        setBusy(false)
        return
      }
      window.location.assign('/user')
    } catch {
      setMessage(kSignupSaveFailed)
      setInvalid(clearFlags)
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[520px]">
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" aria-label="Back" className="grid h-10 w-10 place-items-center rounded-xl text-[#12263f]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="ml-auto text-[13px] font-extrabold tracking-wide text-[#12263f]">MAMLAQ</span>
      </div>
      <h1 className="font-bengali text-3xl font-extrabold tracking-tight text-[#12263f]">অ্যাকাউন্ট খুলুন</h1>
      {message ? (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <form className="mt-4 space-y-3 rounded-[18px] border border-[#e7dfd0] bg-white p-4 shadow-[0_18px_40px_rgba(14,27,44,0.06)] sm:p-5" method="post" action="/api/auth/signup" noValidate onSubmit={onSubmit}>
        <input type="hidden" name="next" value="/user" />
        <input type="hidden" name="uiLanguage" value="bn" />
        {/* Signup API rejects a missing acceptedTerms flag. The public form has no checkbox. */}
        <input type="hidden" name="acceptedTerms" value="true" />
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            name="name"
            required
            autoComplete="name"
            aria-invalid={invalid.name || undefined}
            className={cn(invalid.name && invalidClass)}
            onChange={() => clearField('name')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile</Label>
          <div className="flex items-start gap-2">
            <Input
              id="phone"
              type="text"
              name="phone"
              required
              inputMode="numeric"
              maxLength={11}
              pattern="01[3-9][0-9]{8}"
              placeholder={kPhoneExample}
              autoComplete="tel"
              value={phone}
              aria-invalid={invalid.phone || undefined}
              className={cn('min-w-0 flex-1', invalid.phone && invalidClass)}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
                clearField('phone')
              }}
            />
            <button
              type="button"
              aria-expanded={extrasOpen}
              aria-controls="signup-extras-panel"
              aria-label={extrasOpen ? 'Hide email and referral' : 'Email and referral'}
              onClick={() => setExtrasOpen((open) => !open)}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-input bg-white text-[#12263f]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d={extrasOpen ? 'M6 14l6-6 6 6' : 'M6 10l6 6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        {extrasOpen ? (
          <div id="signup-extras-panel" className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="text"
                name="email"
                autoComplete="email"
                placeholder={kEmailExample}
                value={email}
                aria-invalid={invalid.email || undefined}
                className={cn(invalid.email && invalidClass)}
                onChange={(e) => {
                  setEmail(e.target.value)
                  clearField('email')
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="referralCode">Referral (Optional)</Label>
              <Input
                id="referralCode"
                type="text"
                name="referralCode"
                maxLength={32}
                autoCapitalize="characters"
                value={referral}
                aria-invalid={invalid.referral || undefined}
                className={cn(invalid.referral && invalidClass)}
                onChange={(e) => {
                  setReferral(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 32))
                  clearField('referral')
                }}
              />
            </div>
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              inputMode="numeric"
              maxLength={10}
              autoComplete="new-password"
              value={password}
              aria-invalid={invalid.password || undefined}
              aria-describedby="signup-password-help"
              className={cn('pr-16', invalid.password && invalidClass)}
              onChange={(e) => {
                setPassword(e.target.value.replace(/\D/g, '').slice(0, 10))
                clearField('password')
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((open) => !open)}
              className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 text-xs font-bold text-[#12263f]"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <p id="signup-password-help" className="text-xs leading-5 text-[#12263f]">{kSignupPasswordHelper}</p>
        </div>
        <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy}>
          {busy ? 'অপেক্ষা করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
        </Button>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <p className="min-w-0 flex-1 font-bengali text-sm leading-6 text-[#12263f]">আগেই অ্যাকাউন্ট আছে?</p>
          <Link
            href="/user/login"
            className="inline-flex h-10 items-center justify-center rounded-[11px] bg-gradient-to-r from-[#1B8A4A] to-[#3F3D8C] px-4 font-bengali text-sm font-bold text-white no-underline"
          >
            লগইন
          </Link>
        </div>
      </form>
    </div>
  )
}
