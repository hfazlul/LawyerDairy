'use client'

import { FormEvent, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kEmailExample, kPhoneExample } from '@/lib/identity'
import { plainAuthNotice } from '@/lib/auth/signup-failure'

const kAdminSaveFailed = 'অ্যাডমিন অ্যাকাউন্ট তৈরি হয়নি। আবার চেষ্টা করুন।'

function shownAdminError(raw: string): string {
  if (!raw.trim()) return ''
  return plainAuthNotice(raw, kAdminSaveFailed)
}

export function AdminSignupForm({ invite, notice }: { invite: string; notice: string }) {
  const [message, setMessage] = useState(shownAdminError(notice))
  const [busy, setBusy] = useState(false)
  const sending = useRef(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (sending.current) return
    const fd = new FormData(e.currentTarget)
    sending.current = true
    setBusy(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/auth/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: String(fd.get('name') || ''),
          username: String(fd.get('username') || ''),
          phone: String(fd.get('phone') || ''),
          email: String(fd.get('email') || ''),
          password: String(fd.get('password') || ''),
          invite: invite || String(fd.get('invite') || ''),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data.ok !== true) {
        setMessage(typeof data.message === 'string' && data.message.trim() ? shownAdminError(data.message) : kAdminSaveFailed)
        sending.current = false
        setBusy(false)
        return
      }
      window.location.assign('/hfazlul')
    } catch {
      setMessage(kAdminSaveFailed)
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4" action="/api/admin/auth/signup" method="post" noValidate onSubmit={onSubmit}>
      {invite ? <input type="hidden" name="invite" value={invite} /> : null}
      {message ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-bengali text-sm leading-6 text-[#8a3b32]">
          {message}
        </p>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="font-bengali">নাম</Label>
        <Input id="name" name="name" required minLength={2} autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="username" className="font-bengali">ইউজারনেম</Label>
        <Input id="username" name="username" required minLength={4} autoComplete="username" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="font-bengali">মোবাইল</Label>
        <Input id="phone" name="phone" required inputMode="numeric" maxLength={11} placeholder={kPhoneExample} autoComplete="tel" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="font-bengali">ইমেইল</Label>
        <Input id="email" name="email" type="email" required placeholder={kEmailExample} autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-bengali">পাসওয়ার্ড</Label>
        <Input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" />
        <p className="font-bengali text-xs leading-5 text-[#12263f]">কমপক্ষে ১০ অক্ষরের পাসওয়ার্ড ব্যবহার করুন</p>
      </div>
      <Button type="submit" size="lg" variant="navy" className="w-full font-bengali" disabled={busy}>
        {busy ? 'অপেক্ষা করুন' : 'তৈরি করুন'}
      </Button>
    </form>
  )
}
