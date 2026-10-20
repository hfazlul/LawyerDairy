import Link from 'next/link'
import { TOOLS_CATALOG, TOOL_GROUPS } from '@/lib/tools/catalog'
import { ArrowUpRight, Calculator, CalendarDays, FileText, Landmark, MapPin, Percent } from 'lucide-react'

const icons = [FileText, CalendarDays, FileText, Percent, Landmark, Landmark, FileText, MapPin, Calculator]

export default function ToolsHubPage() {
  return (
    <main className="page tools-page">
      <p className="marketing-eyebrow">MAMLAQ LEGAL TOOLS</p>
      <h1 className="hero-title !mb-4 !mt-4">দরকারি হিসাব,<br />আরও সহজভাবে।</h1>
      <p className="muted max-w-2xl text-sm leading-7">
        আদালত, জমি ও করের ৯টি ওয়েব ক্যালকুলেটর। কাজের ধরন বেছে তথ্য দিন, হিসাব দেখুন।
        ফল ব্যবহারের আগে প্রযোজ্য আইন, তফসিল ও আপনার তথ্য মিলিয়ে নিন।
      </p>
      {TOOL_GROUPS.map((g) => (
        <section key={g.id} style={{ marginTop: '1.5rem' }}>
          <h2>{g.bn} <span className="muted">/ {g.en}</span></h2>
          <div className="tools-grid">
            {TOOLS_CATALOG.filter((t) => t.group === g.id).map((t) => {
              const Icon = icons[TOOLS_CATALOG.indexOf(t)] || Calculator
              return (
              <Link key={t.href} className="tools-card" href={t.href}>
                <Icon size={23} className="mb-3 text-[#a08751]" aria-hidden="true" />
                <strong>{t.bn}</strong>
                <span className="muted flex items-center justify-between text-xs">{t.en}<ArrowUpRight size={15} /></span>
              </Link>
            )})}
          </div>
        </section>
      ))}
    </main>
  )
}
