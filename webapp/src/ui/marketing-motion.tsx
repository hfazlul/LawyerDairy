'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, BookOpen, CalendarDays, Check, CheckCheck, ChevronRight, GraduationCap, Pause, Play, Smartphone, Users } from 'lucide-react'
import { trackGa4Event } from '@/lib/ga4'

export function MotionSurface({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const revealed = useRef(new WeakSet<Element>())
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!root.current || !('IntersectionObserver' in window)) return
    const animations = new Set<Animation>()
    let observer: IntersectionObserver | undefined
    const stop = () => {
      observer?.disconnect()
      animations.forEach(animation => animation.cancel())
      animations.clear()
    }
    const observe = () => {
      stop()
      if (media.matches || paused) return
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          if (!revealed.current.has(entry.target) && typeof entry.target.animate === 'function') {
            revealed.current.add(entry.target)
            const animation = entry.target.animate([{ opacity: .25, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.2,.7,.2,1)' })
            animations.add(animation)
            animation.onfinish = () => animations.delete(animation)
          }
          observer?.unobserve(entry.target)
        })
      }, { threshold: .12 })
      root.current?.querySelectorAll('[data-reveal]').forEach(el => observer?.observe(el))
    }
    observe()
    media.addEventListener('change', observe)
    return () => { stop(); media.removeEventListener('change', observe) }
  }, [paused])
  return <div ref={root} className="motion-surface" data-motion-paused={paused}>
    {children}
    <button className="motion-toggle" onClick={() => setPaused(!paused)} aria-pressed={paused} aria-label={paused ? 'অ্যানিমেশন চালু করুন' : 'অ্যানিমেশন থামান'} title={paused ? 'অ্যানিমেশন চালু করুন' : 'অ্যানিমেশন থামান'}>{paused ? <Play size={14} /> : <Pause size={14} />}<span>Motion {paused ? 'off' : 'on'}</span></button>
  </div>
}

export function DownloadLink({ url, className = 'marketing-button', children, source = 'website' }: { url: string; className?: string; children?: ReactNode; source?: string }) {
  const href = /^https:\/\//i.test(url) ? url : '/contact'
  return <a href={href} className={className} {...(href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} onClick={() => trackGa4Event('app_download_click', { source })}><Smartphone size={18} aria-hidden="true" />{children || 'Android অ্যাপ ডাউনলোড'}<ArrowRight size={17} aria-hidden="true" /></a>
}

const modes = [
  { id: 'diary', label: 'আমার চেম্বার', icon: CalendarDays },
  { id: 'career', label: 'আমার প্রস্তুতি', icon: GraduationCap },
  { id: 'team', label: 'আমার টিম', icon: Users },
] as const

export function ProductShowcase() {
  const [mode, setMode] = useState<(typeof modes)[number]['id']>('diary')
  const [done, setDone] = useState(false)
  const [revealed, setRevealed] = useState(false)
  return <div className="product-showcase">
    <div className="showcase-orbit orbit-one" aria-hidden="true" /><div className="showcase-orbit orbit-two" aria-hidden="true" />
    <div className="showcase-tabs" aria-label="অ্যাপের নমুনা বেছে নিন">{modes.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setMode(id)} aria-pressed={mode === id}><Icon size={15} aria-hidden="true" />{label}</button>)}</div>
    <div className="showcase-scene">
      <div className="floating-note note-left"><CheckCheck size={18} /><div><b>সব গুছিয়ে রাখুন</b><span>তারিখ · নোট · প্রস্তুতি</span></div></div>
      <div className="demo-phone">
        <div className="phone-speaker" aria-hidden="true" />
        <div className="phone-status" aria-hidden="true"><span>9:41</span><span>••• ▰</span></div>
        <div className="phone-brand"><Image src="/brand/mamlaq-icon.png" width={32} height={32} alt="" /><div><b>MAMLAQ</b><small>আইনজীবীর ডায়েরি</small></div><span className="sample-badge">নমুনা</span></div>
        <div className="demo-screen" key={mode}>
          {mode === 'diary' ? <>
            <p className="demo-eyebrow">একটি গোছানো দিনের শুরু</p><h3>আজকের কাজ</h3>
            <div className="demo-date"><CalendarDays size={16} /><span>আপনার পরবর্তী শুনানি</span><span className="demo-dot" /></div>
            <div className="demo-stats"><div><b>০৩</b><span>শুনানি</span></div><div><b>০২</b><span>কাজ বাকি</span></div><div><b>০১</b><span>নতুন নোট</span></div></div>
            <div className="demo-case"><span className="case-line" /><div><small>দেওয়ানি মামলা · নমুনা</small><b>নথি ও প্রস্তুতি</b><span>পরবর্তী তারিখ, মক্কেল ও নোট</span></div><ChevronRight size={16} /></div>
            <button className={'demo-task ' + (done ? 'is-done' : '')} onClick={() => setDone(!done)} aria-pressed={done}><span className="demo-check">{done && <Check size={13} />}</span><span>{done ? 'প্রস্তুতির কাজ সম্পন্ন' : 'নথি প্রস্তুত হয়েছে'}</span><small>ট্যাপ করুন</small></button>
            <div className="demo-note"><BookOpen size={16} /><p>ছোট নোটও হারাবে না।<br /><span>মামলার পাশে গুছিয়ে রাখুন।</span></p></div>
          </> : mode === 'career' ? <>
            <p className="demo-eyebrow">ছোট পাঠ। নিয়মিত অগ্রগতি।</p><h3>আজ একটু এগিয়ে যাই</h3>
            <div className="demo-lesson"><span><BookOpen size={18} /> পড়ার অভ্যাস</span><h4>পড়েছি, মনে আছে তো?</h4><p>বই বন্ধ করে বিষয়টির মূল কথা নিজের ভাষায় বলুন।</p></div>
            <button className="demo-reveal" onClick={() => setRevealed(!revealed)} aria-expanded={revealed}>{revealed ? 'আবার নিজে মনে করি' : 'নিজেকে যাচাই করি'}<ArrowRight size={15} /></button>
            <div className="demo-recall" aria-live="polite">{revealed ? 'মূল ধারণা, শর্ত ও ব্যতিক্রম—তিনটি বিষয় উৎসের সঙ্গে মিলিয়ে দেখুন।' : 'পাঠ → মনে করা → অনুশীলন → রিভিশন'}</div>
            <div className="demo-progress"><span>আপনার পড়ার পথ</span><div><i /></div><small>এটি একটি interactive নমুনা</small></div>
          </> : <>
            <p className="demo-eyebrow">সিনিয়র থেকে জুনিয়র</p><h3>কাজে থাকুক সমন্বয়</h3>
            <div className="demo-team"><span>স</span><span>জ</span><span>জ</span><div><b>আপনার চেম্বার</b><small>একসঙ্গে, নিজের দায়িত্বে</small></div></div>
            {['পরবর্তী শুনানির প্রস্তুতি', 'নথি ও প্রয়োজনীয় নোট', 'আজকের কাজের তালিকা'].map((s, i) => <div className="demo-team-row" key={s}><span>০{i + 1}</span><p>{s}</p><Check size={15} /></div>)}
            <div className="demo-note"><Users size={16} /><p>দায়িত্ব পরিষ্কার থাকুক।<br /><span>টিম সুবিধা প্যাকেজ অনুযায়ী।</span></p></div>
          </>}
        </div>
        <div className="demo-bottom"><span><CalendarDays size={17} /> ডায়েরি</span><span><BookOpen size={17} /> টুলস</span><span><GraduationCap size={17} /> ক্যারিয়ার</span></div>
      </div>
      <div className="floating-note note-right"><div className="mini-ring"><GraduationCap size={17} /></div><div><b>শেখা থেকে পেশায়</b><span>আপনার সঙ্গেই MAMLAQ</span></div></div>
    </div>
    <p className="showcase-caption"><span /> নিজে ট্যাপ করে দেখুন · নমুনার তথ্য সংরক্ষিত হয় না</p>
  </div>
}

export function AudienceExplorer() {
  const [active, setActive] = useState(0)
  const audiences = [
    { label: 'আইনজীবী', kicker: 'আপনার সময়, আপনার চেম্বার', title: 'মামলার খুঁটিনাটি গুছিয়ে, মন দিন মূল কাজে।', body: 'মামলা, মক্কেল, পরবর্তী তারিখ ও প্রয়োজনীয় নোট এক জায়গায়। মোবাইলে কাজ করুন, ওয়েব থেকে synced তথ্য ও অ্যাকাউন্ট দেখুন।', points: ['মামলা ও মক্কেলের গোছানো তথ্য', 'শুনানির তারিখ ও প্রয়োজনীয় নোট', 'চেম্বার টিম ও প্যাকেজের সুবিধা'], href: '/diary', cta: 'ডায়েরি ঘুরে দেখুন', icon: CalendarDays },
    { label: 'জুনিয়র আইনজীবী', kicker: 'পেশার শুরু থেকেই প্রস্তুত', title: 'প্রতিদিনের কাজেই তৈরি হোক নিজের দক্ষতা।', body: 'চেম্বারের কাজের তালিকা, আইনি ক্যালকুলেটর, খসড়া ও পড়ার প্রয়োজনীয় উপকরণ হাতের কাছে রাখুন।', points: ['টিমের কাজে দায়িত্বের সমন্বয়', 'কোর্ট ফি, তামাদিসহ দরকারি হিসাব', 'মোবাইল অ্যাপে খসড়া ও রেফারেন্স'], href: '/diary#junior', cta: 'নিজের কাজের জায়গা দেখুন', icon: Users },
    { label: 'আইন শিক্ষার্থী', kicker: 'আপনার আগামীর প্রস্তুতি', title: 'শুধু উত্তর নয়, বিষয়টি বুঝে এগিয়ে যান।', body: 'বার কাউন্সিল ও বিজেএসের প্রস্তুতির পথ চিনুন। পাঠ, MCQ, রিভিশন ও ভাইভা অনুশীলনের মধ্যে নিজের পরের কাজটি খুঁজে নিন।', points: ['বার ও বিজেএসের আলাদা পথের পরিচিতি', 'পাঠ থেকে অনুশীলন, তারপর রিভিশন', 'লিখিতের জন্য বই পড়ার খাতা'], href: '/career', cta: 'প্রস্তুতির পথ দেখুন', icon: GraduationCap },
  ]
  const current = audiences[active]
  const Icon = current.icon
  return <section className="audience-section marketing-container" data-reveal id="for-you">
    <div className="section-intro"><p className="marketing-eyebrow">আপনার জন্য তৈরি</p><h2>পথ আলাদা।<br />সঙ্গী একই।</h2><p>আপনি আজ যেখানে আছেন,<br />সেখান থেকেই শুরু করুন।</p></div>
    <div className="audience-workspace"><div className="audience-tabs" aria-label="আপনার কাজের ধরন">{audiences.map((a, i) => <button key={a.label} aria-pressed={active === i} onClick={() => setActive(i)}>{a.label}</button>)}</div><div className="audience-content" key={active}><div className="audience-icon"><Icon size={32} /></div><p className="marketing-eyebrow">{current.kicker}</p><h3>{current.title}</h3><p>{current.body}</p><ul>{current.points.map(p => <li key={p}><Check size={16} />{p}</li>)}</ul><Link href={current.href} className="text-link">{current.cta}<ArrowRight size={18} /></Link></div></div>
  </section>
}
