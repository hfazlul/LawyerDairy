import { requireAdminPage } from '@/lib/admin-session'
import { getCms } from '@/lib/cms'
import { AdminShell } from '@/ui/app-nav'

export const dynamic = 'force-dynamic'

export default async function AdminCmsPage() {
  await requireAdminPage('/hfazlul/cms')
  const cms = await getCms()
  return (
    <AdminShell title="CMS">
        <form className="card" action="/api/admin/cms" method="post" style={{ marginTop: '1rem' }}>
          {(
            [
              ['playStoreUrl', 'Play Store URL', cms.playStoreUrl],
              ['shareUrl', 'App share link (empty = app does not share)', cms.shareUrl],
              ['homeVideoUrl', 'Home video URL', cms.homeVideoUrl],
              ['homeVideoTitle', 'Video title', cms.homeVideoTitle],
              ['contactEmail', 'Contact email', cms.contactEmail],
              ['contactPhone', 'Contact phone', cms.contactPhone],
              ['contactWhatsapp', 'WhatsApp', cms.contactWhatsapp],
              ['contactTelegram', 'Telegram', cms.contactTelegram],
              ['supportWhatsapp', 'Support WhatsApp (pay help)', cms.supportWhatsapp],
              ['footerBlurb', 'Footer', cms.footerBlurb],
            ] as const
          ).map(([name, label, val]) => (
            <div className="field" key={name}>
              <label className="label" htmlFor={name}>{label}</label>
              <input id={name} className="input" name={name} defaultValue={val} />
            </div>
          ))}
          <div className="field">
            <label className="label" htmlFor="homeBlogHtml">Home blog HTML</label>
            <textarea id="homeBlogHtml" className="input" name="homeBlogHtml" rows={6} defaultValue={cms.homeBlogHtml} />
          </div>
          <div className="field">
            <label className="label" htmlFor="contactIntro">Contact intro</label>
            <textarea id="contactIntro" className="input" name="contactIntro" rows={3} defaultValue={cms.contactIntro} />
          </div>
          <div className="field">
            <label className="label" htmlFor="reminderD4Template">Reminder D-4</label>
            <textarea id="reminderD4Template" className="input" name="reminderD4Template" rows={2} defaultValue={cms.reminderD4Template} />
          </div>
          <div className="field">
            <label className="label" htmlFor="reminderD3Template">Reminder D-3</label>
            <textarea id="reminderD3Template" className="input" name="reminderD3Template" rows={2} defaultValue={cms.reminderD3Template} />
          </div>
          <div className="field">
            <label className="label" htmlFor="smsRatePaisa">SMS rate (paisa)</label>
            <input id="smsRatePaisa" className="input" name="smsRatePaisa" type="number" defaultValue={cms.smsRatePaisa} />
          </div>
          <div className="field">
            <label className="label" htmlFor="waRatePaisa">WhatsApp rate (paisa)</label>
            <input id="waRatePaisa" className="input" name="waRatePaisa" type="number" defaultValue={cms.waRatePaisa} />
          </div>
          <button className="btn" type="submit">সেভ</button>
        </form>
      </AdminShell>
  )
}
