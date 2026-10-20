import { requireAdminPage } from '@/lib/admin-session'
import { PACKAGE_DEFS } from '@/lib/plans'
import { AdminShell } from '@/ui/app-nav'

export const dynamic = 'force-dynamic'

export default async function ActivatePage() {
  await requireAdminPage('/hfazlul/activate')
  const paid = PACKAGE_DEFS.filter((p) => p.priceBdt > 0 && p.active)
  return (
    <AdminShell title="Manual activate">
        <p className="muted">ইউজার অফলাইন/ওয়েব পে দাবি করলে এখানে প্যাকেজ চালু করুন। অ্যাপে মার্চেন্ট নম্বর দেখাবেন না।</p>
        <form className="card" action="/api/admin/activate" method="post" style={{ marginTop: '1rem' }}>
          <div className="field">
            <label className="label">ফোন বা ইমেইল</label>
            <input className="input" name="identifier" required />
          </div>
          <div className="field">
            <label className="label">প্যাকেজ</label>
            <select className="input" name="packageCode" defaultValue="STARTER">
              {paid.map((p) => (
                <option key={p.code} value={p.code}>{p.nameEn}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">মাস</label>
            <input className="input" name="months" type="number" defaultValue={1} min={1} max={24} />
          </div>
          <div className="field">
            <label className="label">নোট</label>
            <input className="input" name="note" />
          </div>
          <button className="btn" type="submit">Activate</button>
        </form>
      </AdminShell>
  )
}
