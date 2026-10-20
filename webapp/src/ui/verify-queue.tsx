'use client'

import { useState } from 'react'

type Row = {
  id: string
  barRegNo: string
  districtBarName: string | null
  submittedAt: string
  lawyerProfile: {
    displayName: string
    publicSlug: string
    user: { phone: string; username: string }
  }
}

export function VerifyQueue({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState(initial)
  const [msg, setMsg] = useState('')

  async function act(id: string, action: 'verify' | 'reject') {
    setMsg('')
    const reason =
      action === 'reject' ? window.prompt('Reject reason (optional)') ?? '' : undefined
    const res = await fetch('/api/admin/find-lawyer/verifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId: id, action, reason }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMsg(data.message || 'Failed')
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
    setMsg(action === 'verify' ? 'যাচাইকৃত' : 'প্রত্যাখ্যান')
  }

  return (
    <div>
      {msg && <p className="muted">{msg}</p>}
      {rows.length === 0 ? (
        <p className="muted">কোনো পেন্ডিং যাচাই নেই।</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Bar reg</th>
              <th>District bar</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  {r.lawyerProfile.displayName}
                  <div className="muted">@{r.lawyerProfile.user.username}</div>
                </td>
                <td>{r.barRegNo}</td>
                <td>{r.districtBarName || '—'}</td>
                <td>{r.submittedAt.slice(0, 10)}</td>
                <td>
                  <button className="btn" type="button" onClick={() => act(r.id, 'verify')}>
                    Verify
                  </button>{' '}
                  <button className="btn ghost" type="button" onClick={() => act(r.id, 'reject')}>
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
