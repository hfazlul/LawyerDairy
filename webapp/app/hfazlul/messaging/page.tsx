import { requireAdminPage } from '@/lib/admin-session'
import { prisma } from '@/lib/prisma'
import { getCms } from '@/lib/cms'
import { AdminShell } from '@/ui/app-nav'

export const dynamic = 'force-dynamic'

export default async function MessagingAdminPage() {
  await requireAdminPage('/hfazlul/messaging')
  const cms = await getCms()
  const smsCount = await prisma.smsUsage.count({ where: { channel: 'sms' } })
  const users = await prisma.user.count({ where: { deletedAt: null, appRole: 'USER' } })
  const smsCost = (smsCount * cms.smsRatePaisa) / 100
  return (
    <AdminShell title="Messaging">
        <p className="muted">WhatsApp auto unused. Cost = SIM SMS qty × rate only.</p>
        <div className="admin-grid">
          <div className="stat"><span className="muted">SIM SMS qty</span><strong>{smsCount}</strong></div>
          <div className="stat"><span className="muted">SMS cost ৳</span><strong>{smsCost.toFixed(2)}</strong></div>
          <div className="stat"><span className="muted">Users</span><strong>{users}</strong></div>
        </div>
        <form className="card" action="/api/admin/bulk-message" method="post" style={{ marginTop: '1rem' }}>
          <p>ফ্রি ইউজার আপসেল — top N (কী না থাকলে skip)</p>
          <select className="input" name="limit" defaultValue="100">
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
          <input className="input" name="message" placeholder="মেসেজ" style={{ marginTop: '0.5rem' }} />
          <button className="btn" type="submit" style={{ marginTop: '0.5rem' }}>Bulk SMS</button>
        </form>
      </AdminShell>
  )
}
