import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'

export const dynamic = 'force-dynamic'

export default async function CareerAdminPage() {
  await requireAdminPage('/hfazlul/career')
  const packs = await prisma.contentPack.findMany({
    include: { _count: { select: { items: true } } },
  })
  return (
    <AdminShell title="Career">
        <p className="muted">লেসন JSON অন্য এজেন্ট। এখানে শুধু ইনজেস্ট ট্রিগার + স্ট্যাটাস।</p>
        <ul>
          {packs.map((p) => (
            <li key={p.id}>{p.id} · items {p._count.items} · checksum {p.checksum || '—'}</li>
          ))}
        </ul>
        <form action="/api/admin/career/ingest" method="post">
          <button className="btn" type="submit">Run ingest</button>
        </form>
      </AdminShell>
  )
}
