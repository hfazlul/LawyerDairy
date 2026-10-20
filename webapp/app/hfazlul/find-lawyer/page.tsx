import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { AdminShell } from '@/ui/app-nav'
import { VerifyQueue } from '@/ui/verify-queue'

export const dynamic = 'force-dynamic'

export default async function HfazlulFindLawyerPage() {
  await requireAdminPage('/hfazlul/find-lawyer')
  const pending = await prisma.lawyerVerification.findMany({
    where: { status: 'PENDING' },
    orderBy: { submittedAt: 'asc' },
    take: 200,
    include: {
      lawyerProfile: {
        select: {
          displayName: true,
          publicSlug: true,
          user: { select: { phone: true, username: true } },
        },
      },
    },
  })
  return (
    <AdminShell title="Find Lawyer verify">
        <div className="card" style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <VerifyQueue
            initial={pending.map((p) => ({
              id: p.id,
              barRegNo: p.barRegNo,
              districtBarName: p.districtBarName,
              submittedAt: p.submittedAt.toISOString(),
              lawyerProfile: p.lawyerProfile,
            }))}
          />
        </div>
      </AdminShell>
  )
}
