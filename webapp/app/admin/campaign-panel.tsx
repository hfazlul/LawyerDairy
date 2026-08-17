'use client'

import { FormEvent, useState } from 'react'

type Audience = 'all' | 'inactive' | 'expiring'
type Template = 'subscription' | 'coupons' | 'deals' | 'custom'

export function CampaignPanel() {
  const [template, setTemplate] = useState<Template>('subscription')
  const [subject, setSubject] = useState('Lawyer Diary BD — অফার / রিমাইন্ডার')
  const [bodyHtml, setBodyHtml] = useState(
    '<p>প্রিয় {{name}},</p><p>আপনার সাবস্ক্রিপশন / কুপন আপডেট দেখুন।</p>',
  )
  const [couponCode, setCouponCode] = useState('WELCOME20')
  const [dealTitle, setDealTitle] = useState('প্রো প্ল্যান অফার')
  const [audience, setAudience] = useState<Audience>('all')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult('')

    const payload: Record<string, string> = { audience, template }
    if (template === 'custom') {
      payload.subject = subject
      payload.bodyHtml = bodyHtml
    }
    if (template === 'coupons') payload.couponCode = couponCode
    if (template === 'deals') payload.dealTitle = dealTitle

    const res = await fetch('/api/admin/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setResult(data.message || 'Failed')
      return
    }
    const daily = data.daily
      ? ` · daily ${data.daily.sent}/${data.daily.limit}`
      : ''
    setResult(
      data.dryRun
        ? `Dry-run OK — ${data.sent}/${data.recipientCount} logged (set BREVO_API_KEY / RESEND_API_KEY to send for real).${daily}`
        : `Sent ${data.sent}/${data.recipientCount} · campaign ${data.campaignId}${daily}`,
    )
  }

  return (
    <form className="card" onSubmit={onSubmit} style={{ marginTop: '1rem' }}>
      <h2>Send campaign email</h2>
      <p className="muted">
        Brevo (primary) → Resend (fallback). No keys = dry-run log. From: deals@…
      </p>
      <div className="field">
        <label className="label">Template</label>
        <select
          className="input"
          value={template}
          onChange={(e) => setTemplate(e.target.value as Template)}
        >
          <option value="subscription">Subscription reminder</option>
          <option value="coupons">Coupons</option>
          <option value="deals">Deals / offers</option>
          <option value="custom">Custom HTML</option>
        </select>
      </div>
      <div className="field">
        <label className="label">Audience</label>
        <select
          className="input"
          value={audience}
          onChange={(e) => setAudience(e.target.value as Audience)}
        >
          <option value="all">All users with email</option>
          <option value="inactive">Inactive / FREE</option>
          <option value="expiring">Expiring in 7 days</option>
        </select>
      </div>
      {template === 'coupons' && (
        <div className="field">
          <label className="label">Coupon code</label>
          <input
            className="input"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            required
          />
        </div>
      )}
      {template === 'deals' && (
        <div className="field">
          <label className="label">Deal title</label>
          <input
            className="input"
            value={dealTitle}
            onChange={(e) => setDealTitle(e.target.value)}
            required
          />
        </div>
      )}
      {template === 'custom' && (
        <>
          <div className="field">
            <label className="label">Subject</label>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label className="label">HTML body</label>
            <textarea
              className="input"
              rows={5}
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              required
            />
          </div>
        </>
      )}
      <button className="btn secondary" type="submit" disabled={loading}>
        {loading ? 'Sending…' : 'Send campaign email'}
      </button>
      {result && (
        <p className="ok-msg" style={{ marginTop: '0.75rem' }}>
          {result}
        </p>
      )}
    </form>
  )
}
