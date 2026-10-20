'use client'

import { useState } from 'react'
import Link from 'next/link'

export function LawyerContact({ profileId, loginHref, authed }: { profileId: string; loginHref: string; authed: boolean }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [phone, setPhone] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)
  const [upgrade, setUpgrade] = useState(false)

  async function submit(form: React.FormEvent<HTMLFormElement>) {
    form.preventDefault()
    if (pending || completed) return
    const fields = new FormData(form.currentTarget)
    setPending(true)
    setMessage('')
    setUpgrade(false)
    try {
      const response = await fetch('/api/mobile/v1/find-lawyer/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ lawyerProfileId: profileId, legalIssue: String(fields.get('legalIssue') || '').trim(), preferredContactTime: fields.get('preferredContactTime') }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) {
        setUnauthorized(response.status === 401)
        setUpgrade(response.status === 402)
        setMessage(result.messageBn || (response.status === 401 ? 'যোগাযোগের অনুরোধ পাঠাতে আবার লগইন করুন।' : 'অনুরোধ পাঠানো যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।'))
        return
      }
      setPhone(typeof result.lawyerPhone === 'string' ? result.lawyerPhone : null)
      setMessage(result.messageBn || 'আপনার যোগাযোগের অনুরোধ পাঠানো হয়েছে।')
      setCompleted(true)
    } catch {
      setMessage('সংযোগে সমস্যা হয়েছে। অনুরোধের অবস্থা নিশ্চিত করা যায়নি। আবার পাঠানোর আগে একটু অপেক্ষা করুন।')
    } finally {
      setPending(false)
    }
  }

  if (!authed) return <div className="space-y-4">
    <p className="text-sm leading-7 text-slate-600">প্রোফাইল সবার জন্য উন্মুক্ত। যোগাযোগের অনুরোধ পাঠাতে আপনার MAMLAQ অ্যাকাউন্টে লগইন করুন।</p>
    <Link className="marketing-button w-full" href={loginHref}>যোগাযোগ করতে লগইন করুন</Link>
  </div>

  return <form onSubmit={submit} className="space-y-4">
    {!completed && <>
      <label className="block text-sm font-semibold text-[#12263f]" htmlFor="legal-issue">আপনার প্রয়োজন <span className="font-normal text-slate-500">(ঐচ্ছিক)</span>
        <textarea id="legal-issue" name="legalIssue" maxLength={300} rows={3} placeholder="সংক্ষেপে লিখুন; সংবেদনশীল নথি বা তথ্য দেবেন না।" className="mt-2 block w-full resize-y rounded-xl border border-[#ded8cb] bg-white p-3 text-sm font-normal leading-6 focus:outline-none focus:ring-2 focus:ring-[#c6a15b]" />
      </label>
      <label className="block text-sm font-semibold text-[#12263f]" htmlFor="contact-time">সুবিধাজনক সময়
        <select id="contact-time" name="preferredContactTime" className="mt-2 min-h-12 w-full rounded-xl border border-[#ded8cb] bg-white px-3 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#c6a15b]">
          <option value="ANYTIME">যেকোনো সময়</option><option value="MORNING">সকাল</option><option value="AFTERNOON">বিকেল</option><option value="EVENING">সন্ধ্যা</option>
        </select>
      </label>
      <label className="flex min-h-12 items-start gap-3 text-xs leading-6 text-slate-600"><input required type="checkbox" className="mt-1.5 h-4 w-4 shrink-0 accent-[#12263f]" /><span>অনুরোধের সঙ্গে আমার অ্যাকাউন্টের নাম, ফোন, ইমেইল ও দেওয়া তথ্য এই আইনজীবীর কাছে যাবে—এতে সম্মত আছি।</span></label>
      <button disabled={pending || unauthorized} type="submit" className="marketing-button w-full disabled:cursor-wait disabled:opacity-60">{pending ? 'পাঠানো হচ্ছে…' : 'যোগাযোগের অনুরোধ পাঠান'}</button>
    </>}
    {message && <p role="status" aria-live="polite" className={`rounded-xl border p-3 text-sm leading-7 ${completed ? 'border-[#c6a15b]/40 bg-[#f7f3ea] text-[#12263f]' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>{message}</p>}
    {phone && <a className="marketing-button w-full" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>কল করুন: <bdi>{phone}</bdi></a>}
    {unauthorized && <Link className="marketing-button-secondary w-full" href={loginHref}>আবার লগইন করুন</Link>}
    {upgrade && <Link className="marketing-button-secondary w-full" href="/package">প্যাকেজ দেখুন</Link>}
    <p className="text-xs leading-6 text-slate-500">অ্যাকাউন্ট ও আইনজীবীর প্রযোজ্য যোগাযোগসীমা অনুযায়ী অনুরোধ পাঠানো হবে। সময় বা পরামর্শের ফি সরাসরি আলোচনা করুন।</p>
  </form>
}
