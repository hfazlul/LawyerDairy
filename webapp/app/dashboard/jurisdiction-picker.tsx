'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OPTIONS = [
  { code: 'BD', label: '🇧🇩 Bangladesh' },
  { code: 'IN', label: '🇮🇳 India (WB/Tripura)' },
  { code: 'PK', label: '🇵🇰 Pakistan' },
] as const

const LANGS = [
  { code: 'bn', label: 'বাংলা' },
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
] as const

/** User must confirm jurisdiction — never silent switch. */
export function JurisdictionPicker({
  current,
  uiLanguage,
  confirmed,
}: {
  current: string
  uiLanguage: string
  confirmed: boolean
}) {
  const router = useRouter()
  const [j, setJ] = useState(current)
  const [lang, setLang] = useState(uiLanguage)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function save(confirm: boolean) {
    setLoading(true)
    setMsg('')
    const res = await fetch('/api/web/v1/profile/jurisdiction', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jurisdiction: j,
        uiLanguage: lang,
        confirmJurisdiction: confirm,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setMsg(data.message || 'Update failed')
      return
    }
    setMsg('Saved')
    router.refresh()
  }

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <div className="field">
        <label className="label">Jurisdiction (law pack)</label>
        <select className="input" value={j} onChange={(e) => setJ(e.target.value)}>
          {OPTIONS.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label className="label">UI language</label>
        <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
          {LANGS.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn" type="button" disabled={loading} onClick={() => save(true)}>
          {confirmed ? 'Update & confirm' : 'Confirm selection'}
        </button>
      </div>
      {msg && <p className="muted" style={{ marginTop: '0.5rem' }}>{msg}</p>}
    </div>
  )
}
