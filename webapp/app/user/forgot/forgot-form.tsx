'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kPhoneExample, kPhoneNotRegisteredMessage, kSignupPhoneError, signupPhoneIssue } from '@/lib/identity'
import { cn } from '@/lib/utils'

const invalidClass = 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20'
const sentCopy = 'যদি এই অ্যাকাউন্টে ইমেইল থাকে, একটি লিংক পাঠানো হয়েছে।'

function phoneBorder(message: string) {
  return message === kSignupPhoneError || message === kPhoneNotRegisteredMessage
}

export function ForgotForm({ error = '', sent = false }: { error?: string; sent?: boolean }) {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(sent)
  const [message, setMessage] = useState(sent ? '' : error)
  const [invalid, setInvalid] = useState(phoneBorder(error))

  useEffect(() => {
    if (sent) {
      setDone(true)
      setMessage('')
      setInvalid(false)
      return
    }
    if (!error) return
    setMessage(error)
    setInvalid(phoneBorder(error))
  }, [error, sent])

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const phoneErr = signupPhoneIssue(phone)
    if (phoneErr) {
      setDone(false)
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
        const text = typeof data.message === 'string' ? data.message : kSignupPhoneError
        setMessage(text)
        setInvalid(phoneBorder(text))
        setBusy(false)
        return
      }
      setMessage('')
      setInvalid(false)
      setDone(true)
    } catch {
      setMessage('রিসেট লিংক পাঠানো যায়নি। আবার চেষ্টা করুন।')
      setInvalid(false)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 font-bengali text-sm leading-6 text-emerald-800">
        {sentCopy}
      </p>
    )
  }

  return (
    <form className="space-y-5" action="/api/web/v1/password/reset/request" method="post" noValidate onSubmit={onSubmit}>
      {message ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm text-destructive">
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
          aria-invalid={invalid || undefined}
          className={cn(invalid && invalidClass)}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))
            setInvalid(false)
          }}
        />
      </div>
      <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy}>
        {busy ? 'অপেক্ষা করুন' : 'রিসেট লিংক পাঠান'}
      </Button>
    </form>
  )
}
