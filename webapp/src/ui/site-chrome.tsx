'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRight, Calculator, GraduationCap, Home, LogIn, Menu, Phone, Users, X } from 'lucide-react'
import { TrackBeacon } from '@/ui/track-beacon'
import { DownloadLink } from '@/ui/marketing-motion'

const links = [
  { href: '/diary', label: 'লইয়ার ডায়েরি' },
  { href: '/career', label: 'লিগ্যাল ক্যারিয়ার' },
  { href: '/find-lawyer', label: 'আইনজীবী খুঁজুন' },
  { href: '/tools', label: 'আইনি টুলস' },
  { href: '/package', label: 'প্যাকেজ' },
]

export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`mamlaq-brand ${light ? 'brand-light' : ''}`} aria-label="MAMLAQ হোম"><Image src="/brand/mamlaq-icon.png" alt="" width={44} height={44} sizes="44px" /><span><b lang="en">MAMLAQ</b><small>আইনজীবীর ডায়েরি</small></span></Link>
}

export function SiteHeader({ authed = false }: { authed?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    if (!open) return
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open])
  return <header className="mamlaq-header">
    <TrackBeacon />
    <div className="marketing-container header-inner"><Brand /><nav aria-label="প্রধান নেভিগেশন" className="desktop-nav">{links.map(l => <Link key={l.href} href={l.href} aria-current={pathname.startsWith(l.href) ? 'page' : undefined}>{l.label}</Link>)}</nav><Link className="header-account" href={authed ? '/user' : '/user/login'}>{authed ? 'আমার অ্যাকাউন্ট' : 'লগইন'}<ArrowRight size={15} /></Link><button className="mobile-menu-button" aria-expanded={open} aria-controls="public-mobile-menu" aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <Menu size={22} />}</button></div>
    {open && <nav className="mobile-menu marketing-container" id="public-mobile-menu" aria-label="মোবাইল নেভিগেশন">{links.map(l => <Link href={l.href} key={l.href} onClick={() => setOpen(false)}>{l.label}<ArrowRight size={15} /></Link>)}<Link href="/contact">যোগাযোগ<Phone size={15} /></Link></nav>}
  </header>
}

export function MobileTabBar({ authed = false }: { authed?: boolean }) {
  const path = usePathname()
  const tabs = [{ href: '/', label: 'হোম', icon: Home }, { href: '/career', label: 'ক্যারিয়ার', icon: GraduationCap }, { href: '/tools', label: 'টুলস', icon: Calculator }, { href: '/find-lawyer', label: 'আইনজীবী', icon: Users }, { href: authed ? '/user' : '/user/login', label: authed ? 'অ্যাকাউন্ট' : 'লগইন', icon: LogIn }]
  return <nav className="legacy-mobile-tabs" aria-label="দ্রুত নেভিগেশন">{tabs.map(({ href, label, icon: Icon }) => <Link href={href} key={href} aria-current={path === href ? 'page' : undefined}><Icon size={19} /><span>{label}</span></Link>)}</nav>
}

export function StorePair({ playStoreUrl }: { playStoreUrl: string }) {
  return <div className="store-pair"><DownloadLink url={playStoreUrl} /><span>Android-এর জন্য · iOS এখনও উপলব্ধ নয়</span></div>
}

export function SiteFooter(props: { blurb?: string; email?: string; phone?: string; whatsapp?: string }) {
  return <footer className="mamlaq-footer"><div className="marketing-container footer-grid"><div><Brand light /><p>{props.blurb && !props.blurb.includes('Legal Management') ? props.blurb : 'প্রথম প্রস্তুতি থেকে প্রতিদিনের পেশায়। ডায়েরি, শেখা ও সংযোগ—আপনার সঙ্গেই MAMLAQ।'}</p><span className="footer-location">বাংলাদেশের আইন অঙ্গনের জন্য</span></div><div><h2>আপনার MAMLAQ</h2>{links.slice(0, 4).map(l => <Link href={l.href} key={l.href}>{l.label}</Link>)}</div><div><h2>সঙ্গে থাকুন</h2><Link href="/package">প্যাকেজ ও সুবিধা</Link><Link href="/user">আমার অ্যাকাউন্ট</Link><Link href="/contact">যোগাযোগ ও সহায়তা</Link>{props.email && <a href={`mailto:${props.email}`}>{props.email}</a>}{props.phone && <a href={`tel:${props.phone.replace(/[^+\d]/g, '')}`}>{props.phone}</a>}{props.whatsapp && <span>WhatsApp: {props.whatsapp}</span>}</div></div><div className="marketing-container footer-bottom"><span>© {new Date().getFullYear()} MAMLAQ</span><span>পেশায় শৃঙ্খলা। প্রস্তুতিতে আত্মবিশ্বাস।</span></div></footer>
}

export function PublicChrome({ authed, children, footer }: { authed?: boolean; children: React.ReactNode; footer?: React.ReactNode }) {
  return <div className="min-h-screen pb-20 md:pb-0"><SiteHeader authed={authed} />{children}{footer}<MobileTabBar authed={authed} /></div>
}

