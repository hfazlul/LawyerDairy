'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  kEmailExample,
  kPhoneExample,
  kSignupEmailError,
  kSignupNameError,
  kSignupPasswordError,
  kSignupPhoneError,
  signupEmailIssue,
  signupNameIssue,
  signupPasswordIssue,
  signupPhoneIssue,
} from '@/lib/identity'
import { cn } from '@/lib/utils'

const invalidClass = 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20'

type FieldFlags = { name: boolean; phone: boolean; email: boolean; password: boolean }

const clearFlags: FieldFlags = { name: false, phone: false, email: false, password: false }

function bordersForSignup(message: string): FieldFlags {
  if (!message) return clearFlags
  if (message === kSignupNameError || message.includes('এই নামে')) return { ...clearFlags, name: true }
  if (message === kSignupPhoneError || message.includes('মোবাইল')) return { ...clearFlags, phone: true }
  if (message === kSignupEmailError || message.includes('ইমেইল')) return { ...clearFlags, email: true }
  if (message === kSignupPasswordError || message.includes('পাসওয়ার্ড')) return { ...clearFlags, password: true }
  return clearFlags
}

export function SignupForm({ error }: { error: string }) {
  const initialBorders = bordersForSignup(error)
  const [emailOpen, setEmailOpen] = useState(initialBorders.email)
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(error)
  const [invalid, setInvalid] = useState<FieldFlags>(initialBorders)
  const sending = useRef(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const leaked = ['password', 'phone', 'name', 'email', 'acceptedTerms', 'next', 'uiLanguage']
    if (leaked.some((key) => url.searchParams.has(key))) {
      window.history.replaceState(null, '', url.pathname)
    }
  }, [])

  useEffect(() => {
    if (!error) return
    const borders = bordersForSignup(error)
    setMessage(error)
    setInvalid(borders)
    if (borders.email) setEmailOpen(true)
  }, [error])

  function clearField(field: keyof FieldFlags) {
    setInvalid((current) => ({ ...current, [field]: false }))
  }

  function showIssue(text: string) {
    const borders = bordersForSignup(text)
    setMessage(text)
    setInvalid(borders)
    if (borders.email) setEmailOpen(true)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get('name') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const terms = fd.get('acceptedTerms')
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
    const mailErr = signupEmailIssue(emailOpen ? email : '')
    if (mailErr) {
      showIssue(mailErr)
      return
    }
    const pwErr = signupPasswordIssue(password)
    if (pwErr) {
      showIssue(pwErr)
      return
    }
    if (!terms) {
      setMessage('শর্তাবলী মেনে নিন')
      setInvalid(clearFlags)
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
          email: emailOpen ? email : '',
          password,
          uiLanguage: fd.get('uiLanguage') || 'bn',
          acceptedTerms: true,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showIssue(typeof data.message === 'string' ? data.message : 'সেভ হয়নি। তথ্য ঠিক করে আবার চেষ্টা করুন।')
        sending.current = false
        setBusy(false)
        return
      }
      window.location.assign('/user')
    } catch {
      setMessage('সেভ হয়নি। আবার চেষ্টা করুন।')
      setInvalid(clearFlags)
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <form className="space-y-5" method="post" action="/api/auth/signup" noValidate onSubmit={onSubmit}>
      <input type="hidden" name="next" value="/user" />
      {message ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="font-bengali">নাম</Label>
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
        <p className="font-bengali text-xs leading-5 text-navy">{kSignupNameError}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="font-bengali">মোবাইল</Label>
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
            className={cn(invalid.phone && invalidClass)}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
              clearField('phone')
            }}
          />
          <button
            type="button"
            aria-expanded={emailOpen}
            aria-controls="signup-email-panel"
            onClick={() => setEmailOpen((open) => !open)}
            className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border text-navy transition ${
              emailOpen ? 'border-navy bg-navy text-white' : 'border-input bg-white'
            }`}
          >
            <span className="sr-only">ইমেইল (ঐচ্ছিক)</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d={emailOpen ? 'M6 14l6-6 6 6' : 'M6 10l6 6 6-6'} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
      <div id="signup-email-panel" hidden={!emailOpen} className="space-y-1.5">
        <Label htmlFor="email" className="font-bengali">ইমেইল (ঐচ্ছিক)</Label>
        <Input
          id="email"
          type="text"
          name="email"
          autoComplete="email"
          placeholder={kEmailExample}
          disabled={!emailOpen}
          aria-invalid={invalid.email || undefined}
          className={cn(invalid.email && invalidClass)}
          onChange={() => clearField('email')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-bengali">পাসওয়ার্ড</Label>
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
            className={cn('pr-16', invalid.password && invalidClass)}
            onChange={(e) => {
              setPassword(e.target.value.replace(/\D/g, '').slice(0, 10))
              clearField('password')
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2 font-bengali text-xs font-bold text-navy"
          >
            {showPassword ? 'লুকান' : 'দেখুন'}
          </button>
        </div>
        <p className="font-bengali text-xs leading-5 text-navy">{kSignupPasswordError}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="uiLanguage" className="font-bengali">ভাষা</Label>
        <select id="uiLanguage" name="uiLanguage" defaultValue="bn" className="flex h-12 w-full rounded-xl border border-input bg-white/90 px-4 text-sm shadow-sm outline-none focus:border-brass focus:ring-4 focus:ring-brass/10">
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
      </div>
      <label className="flex items-start gap-3 rounded-xl bg-secondary/60 p-3 font-bengali text-sm leading-6 text-navy">
        <input type="checkbox" name="acceptedTerms" required className="mt-1 h-4 w-4 accent-[var(--brass)]" />
        শর্তাবলী ও গোপনীয়তা নীতি মেনে নিচ্ছি
      </label>
      <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy}>
        {busy ? 'অপেক্ষা করুন' : 'অ্যাকাউন্ট তৈরি করুন'}
      </Button>
    </form>
  )
}
