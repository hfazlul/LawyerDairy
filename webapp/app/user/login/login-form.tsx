'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kLoginEmptyMessage, kLoginUnknownMessage, kLoginWrongPasswordMessage, kPasswordHintBn } from '@/lib/identity'
import { plainAuthNotice } from '@/lib/auth/signup-failure'
import { cn } from '@/lib/utils'

const invalidClass = 'border-red-600 focus-visible:border-red-600 focus-visible:ring-red-600/20'
const kLoginServerMessage = 'লগইন এখন সম্পন্ন হয়নি। আবার চেষ্টা করুন।'

function shownLoginError(raw: string): string {
  if (!raw.trim()) return ''
  return plainAuthNotice(raw, kLoginServerMessage)
}

type FieldFlags = { identifier: boolean; password: boolean }

function bordersForLogin(message: string): FieldFlags {
  if (message === kLoginWrongPasswordMessage) return { identifier: false, password: true }
  if (message === kLoginEmptyMessage || message === kLoginUnknownMessage) return { identifier: true, password: true }
  if (message.includes('একাধিক')) return { identifier: true, password: false }
  return { identifier: false, password: false }
}

export function LoginForm({ error, next }: { error: string; next: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(shownLoginError(error))
  const [invalid, setInvalid] = useState<FieldFlags>(() => bordersForLogin(shownLoginError(error)))

  useEffect(() => {
    if (!error) return
    const text = shownLoginError(error)
    setMessage(text)
    setInvalid(bordersForLogin(text))
  }, [error])

  function clearField(field: keyof FieldFlags) {
    setInvalid((current) => ({ ...current, [field]: false }))
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const identifier = String(fd.get('identifier') || '').trim()
    const password = String(fd.get('password') || '')
    if (!identifier || !password) {
      setMessage(kLoginEmptyMessage)
      setInvalid({ identifier: !identifier, password: !password })
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ identifier, password, next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const text = typeof data.message === 'string' && data.message.trim() ? shownLoginError(data.message) : kLoginUnknownMessage
        setMessage(text)
        setInvalid(bordersForLogin(text))
        setBusy(false)
        return
      }
      router.push(next)
      router.refresh()
    } catch {
      setMessage('লগইন হয়নি')
      setInvalid({ identifier: false, password: false })
      setBusy(false)
    }
  }

  return (
    <form className="space-y-5" method="post" action="/api/auth/login" noValidate onSubmit={onSubmit}>
      {message ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm text-destructive">
          {message}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="identifier" className="font-bengali">নাম বা মোবাইল</Label>
        <Input
          id="identifier"
          type="text"
          name="identifier"
          required
          autoComplete="username"
          placeholder="নাম অথবা 01XXXXXXXXX"
          aria-invalid={invalid.identifier || undefined}
          className={cn(invalid.identifier && invalidClass)}
          onChange={() => clearField('identifier')}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-bengali">পাসওয়ার্ড</Label>
        <Input
          id="password"
          type="password"
          name="password"
          required
          autoComplete="current-password"
          aria-invalid={invalid.password || undefined}
          className={cn(invalid.password && invalidClass)}
          onChange={() => clearField('password')}
        />
        <p className="font-bengali text-xs leading-5 text-navy">{kPasswordHintBn}</p>
      </div>
      <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy}>
        {busy ? 'অপেক্ষা করুন' : 'প্রবেশ করুন'}
      </Button>
    </form>
  )
}
