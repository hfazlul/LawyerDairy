'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Mode = 'read' | 'write'

export function ChamberGrantForm(props: {
  memberId: string
  clients: Mode
  cases: Mode
  causeList: Mode
}) {
  const router = useRouter()
  const [clients, setClients] = useState<Mode>(props.clients)
  const [cases, setCases] = useState<Mode>(props.cases)
  const [causeList, setCauseList] = useState<Mode>(props.causeList)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')

  async function save() {
    setBusy(true)
    setNote('')
    try {
      const res = await fetch(`/api/user/team/members/${props.memberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients, cases, causeList }),
      })
      setNote(res.ok ? 'সেভ হয়েছে।' : 'সেভ হয়নি।')
      if (res.ok) router.refresh()
    } catch {
      setNote('সেভ হয়নি।')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      <p>পড়া মানে শুধু দেখা। লেখা মানে সম্পাদনা।</p>
      <GrantRow label="মক্কেল" value={clients} onChange={setClients} />
      <GrantRow label="মামলা" value={cases} onChange={setCases} />
      <GrantRow label="কজলিস্ট" value={causeList} onChange={setCauseList} />
      <button
        type="button"
        className="rounded-md bg-slate-900 px-3 py-1.5 text-white disabled:opacity-50"
        disabled={busy}
        onClick={save}
      >
        অনুমতি সেভ
      </button>
      {note ? <p>{note}</p> : null}
    </div>
  )
}

function GrantRow(props: { label: string; value: Mode; onChange: (v: Mode) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span>{props.label}</span>
      <select
        className="rounded border px-2 py-1"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value as Mode)}
      >
        <option value="read">পড়া</option>
        <option value="write">লেখা</option>
      </select>
    </label>
  )
}
