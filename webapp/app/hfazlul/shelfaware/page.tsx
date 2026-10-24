import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { setShelfNote, setShelfSuspended } from '@/lib/shelfaware/admin-actions'
import { AdminShell } from '@/ui/app-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

function money(micros: bigint | null | undefined): string {
  return (Number(micros ?? 0n) / 1_000_000).toFixed(2)
}

function BeatTable(props: { rows: { id: string; lastRunAt: Date; detail: string }[] }) {
  return (
    <div className="card" style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
      <table className="table">
        <thead>
          <tr>
            <th>VPS beat</th>
            <th>Last run</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          {props.rows.map((beat) => (
            <tr key={beat.id}>
              <td>{beat.id}</td>
              <td>{beat.lastRunAt.toISOString()}</td>
              <td>{beat.detail || '—'}</td>
            </tr>
          ))}
          {props.rows.length === 0 ? (
            <tr>
              <td colSpan={3}>No worker beats yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

export default async function ShelfAwareAdminPage() {
  await requireAdminPage('/hfazlul/shelfaware')
  const since = new Date(Date.now() - 15 * 60 * 1000)
  const [devices, seen15, paid, free, suspended, earnings, beats, rows] = await Promise.all([
    prisma.shelfDevice.count(),
    prisma.shelfDevice.count({ where: { lastSeenAt: { gte: since } } }),
    prisma.shelfDevice.count({ where: { premium: true } }),
    prisma.shelfDevice.count({ where: { premium: false } }),
    prisma.shelfDevice.count({ where: { suspended: true } }),
    prisma.shelfLedgerEvent.groupBy({
      by: ['kind', 'currency'],
      where: { kind: { in: ['ad_impression', 'subscription'] } },
      _sum: { amountMicros: true },
      _count: { _all: true },
    }),
    prisma.shelfOpsBeat.findMany({
      where: { id: { in: ['push', 'agent', 'agent-day', 'health'] } },
      orderBy: { id: 'asc' },
    }),
    prisma.shelfDevice.findMany({
      orderBy: { lastSeenAt: 'desc' },
      take: 150,
    }),
  ])

  const stats: [string, number][] = [
    ['Devices', devices],
    ['Seen 15 min', seen15],
    ['Paid', paid],
    ['Free', free],
    ['Suspended', suspended],
  ]

  const pushBeats = beats.filter((beat) => beat.id === 'push')
  const agentBeats = beats.filter((beat) => beat.id === 'agent' || beat.id === 'agent-day')
  const healthBeats = beats.filter((beat) => beat.id === 'health')

  return (
    <AdminShell title="ShelfAware">
      <section id="devices" className="scroll-mt-24">
        <h2 className="font-bengali text-lg font-bold text-navy">ডিভাইস</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-navy">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto', marginTop: '1.25rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Currency</th>
              <th>Events</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {earnings.map((row) => (
              <tr key={`${row.kind}-${row.currency}`}>
                <td>{row.kind}</td>
                <td>{row.currency}</td>
                <td>{row._count._all}</td>
                <td>{money(row._sum.amountMicros)}</td>
              </tr>
            ))}
            {earnings.length === 0 ? (
              <tr>
                <td colSpan={4}>No ad or subscription ledger rows yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </section>

      <section id="push" className="mt-8 scroll-mt-24">
        <h2 className="font-bengali text-lg font-bold text-navy">পুশ বিট</h2>
        <BeatTable rows={pushBeats} />
      </section>

      <section id="agent" className="mt-8 scroll-mt-24">
        <h2 className="font-bengali text-lg font-bold text-navy">বারকোড এজেন্ট</h2>
        <BeatTable rows={agentBeats} />
      </section>

      <section id="health" className="mt-8 scroll-mt-24">
        <h2 className="font-bengali text-lg font-bold text-navy">মডেল হেলথ</h2>
        <BeatTable rows={healthBeats} />
      </section>

      <section id="device-list" className="mt-8 scroll-mt-24">
        <h2 className="mb-1 font-bengali text-lg font-bold text-navy">ডিভাইস তালিকা</h2>
      <div className="card" style={{ overflowX: 'auto', marginTop: '0.75rem' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Install</th>
              <th>Plan</th>
              <th>Seen</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((device) => (
              <tr key={device.id}>
                <td>
                  {device.installId}
                  <div className="muted">
                    {device.country || '—'} · {device.language || '—'} · {device.appVersion || '—'}
                  </div>
                </td>
                <td>{device.suspended ? 'suspended' : device.premium ? 'paid' : 'free'}</td>
                <td>{device.lastSeenAt.toISOString()}</td>
                <td>
                  <form action={setShelfNote} className="field">
                    <input type="hidden" name="id" value={device.id} />
                    <input className="input" name="panelNote" defaultValue={device.panelNote} maxLength={280} />
                    <button className="btn" type="submit">Save note</button>
                  </form>
                </td>
                <td>
                  <form action={setShelfSuspended}>
                    <input type="hidden" name="id" value={device.id} />
                    <input type="hidden" name="suspended" value={device.suspended ? '0' : '1'} />
                    <button className="btn" type="submit">{device.suspended ? 'Restore' : 'Suspend'}</button>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>No devices yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </section>
    </AdminShell>
  )
}
