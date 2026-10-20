import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Check, ChevronDown, Download, Mic, PenLine } from 'lucide-react'
import { SiteFooter, SiteHeader } from '@/ui/site-chrome'

type PublicCms = {
  playStoreUrl: string
  footerBlurb?: string
  contactEmail?: string
  contactPhone?: string
  contactWhatsapp?: string
}

export function AppDownload({ url, children = 'Android অ্যাপ ডাউনলোড' }: { url: string; children?: React.ReactNode }) {
  return <a href={url || '/contact'} className="marketing-button" {...(url ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Download size={18} aria-hidden="true" />{children}</a>
}

export function CareerPublicFrame({ authed, cms, children }: { authed: boolean; cms: PublicCms; children: React.ReactNode }) {
  return <div className="marketing-shell min-h-screen bg-[#f7f3ea] font-bengali text-navy">
    <SiteHeader authed={authed} />
    <main>{children}</main>
    <SiteFooter blurb={cms.footerBlurb} email={cms.contactEmail} phone={cms.contactPhone} whatsapp={cms.contactWhatsapp} />
  </div>
}

export function StudyLoop() {
  return <section className="grid gap-8 border-t border-[#dcd5c7] py-12 md:grid-cols-[.85fr_1.15fr] md:gap-16 md:py-20" aria-labelledby="study-loop-title">
    <div>
      <p className="marketing-eyebrow">পড়ার একটি ছোট অভ্যাস</p>
      <h2 id="study-loop-title" className="mt-3 text-2xl font-semibold leading-snug md:text-3xl">পড়া শেষ।<br />কিন্তু মনে আছে কতটুকু?</h2>
      <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">আজকের বই থেকে একটি ছোট বিষয় নিন। নিচের ধাপগুলো অনুসরণ করে নিজের বোঝাপড়া যাচাই করুন।</p>
      <p className="mt-4 text-xs leading-6 text-slate-500">এটি পড়ার পদ্ধতির নমুনা। এখানে কোনো আইনি উত্তর মূল্যায়ন বা অগ্রগতি সংরক্ষণ করা হয় না।</p>
    </div>
    <div className="border-y border-[#dcd5c7]">
      <div className="flex gap-4 border-b border-[#dcd5c7] py-5"><span className="pt-1 font-sans text-xs text-[#8d6b32]">01</span><div><h3 className="font-semibold">পড়ুন ও একটি প্রশ্ন তৈরি করুন</h3><p className="mt-2 text-sm leading-7 text-slate-600">মূল আইন বা নিজের বই থেকে বিষয়টি পড়ুন। কী জানতে চেয়েছেন, একটি বাক্যে লিখুন।</p></div></div>
      <div className="flex gap-4 border-b border-[#dcd5c7] py-5"><span className="pt-1 font-sans text-xs text-[#8d6b32]">02</span><div><h3 className="font-semibold">বই বন্ধ করে বলুন</h3><p className="mt-2 text-sm leading-7 text-slate-600">মূল কথাটি নিজের ভাষায় বলুন। কোন অংশ মনে করতে পারছেন না, সেটিও চিহ্নিত করুন।</p></div></div>
      <details className="group py-5">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-4 font-semibold [&::-webkit-details-marker]:hidden"><span className="font-sans text-xs font-normal text-[#8d6b32]">03</span><span className="flex-1">এবার মিলিয়ে দেখি</span><ChevronDown size={18} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
        <div className="ml-8 space-y-3 pb-2 pt-3 text-sm leading-7 text-slate-600"><p>উৎসটি আবার খুলুন। নিজের বলা কথার সঙ্গে মিলিয়ে দেখুন:</p>{['মূল কথাটি ঠিকভাবে বলতে পেরেছেন?', 'কোনো শর্ত, ব্যতিক্রম বা গুরুত্বপূর্ণ শব্দ বাদ পড়েছে?', 'পরেরবার কোন অংশটি আবার পড়বেন?'].map(item => <div key={item} className="flex items-start gap-2"><Check size={16} className="mt-1 shrink-0 text-[#8d6b32]" aria-hidden="true" /><span>{item}</span></div>)}</div>
      </details>
    </div>
  </section>
}

const subjectGroups = {
  bar: ['দেওয়ানি কার্যবিধি', 'সুনির্দিষ্ট প্রতিকার', 'ফৌজদারি কার্যবিধি', 'দণ্ডবিধি', 'সাক্ষ্য', 'তামাদি', 'পেশাগত নীতি'],
  bjs: ['যৌথ দেওয়ানি আইনের পাঠ', 'যৌথ ফৌজদারি আইনের পাঠ', 'সাক্ষ্য ও অন্যান্য আইন বিষয়', 'বাংলা ও ইংরেজি — নিজের বই', 'সাধারণ বিষয় — নিজের বই'],
}

export function CareerTrackPreview({ track, cms, authed }: { track: 'bar' | 'bjs'; cms: PublicCms; authed: boolean }) {
  const bar = track === 'bar'
  const title = bar ? 'বার কাউন্সিল' : 'বাংলাদেশ জুডিশিয়াল সার্ভিস'
  return <CareerPublicFrame authed={authed} cms={cms}>
    <section className="bg-navy text-white">
      <div className="marketing-container py-9 md:py-16">
        <Link href="/career" className="inline-flex min-h-11 items-center gap-2 text-sm text-brass-soft no-underline">ক্যারিয়ার <ArrowRight size={14} aria-hidden="true" /> {bar ? 'বার কাউন্সিল' : 'বিজেএস'}</Link>
        <div className="mt-5 grid gap-8 md:grid-cols-[1.2fr_.8fr] md:gap-16">
          <div><p className="text-xs font-medium tracking-wide text-brass-soft">{title}</p><h1 className="mt-4 max-w-2xl text-[30px] font-semibold leading-[1.45] sm:text-4xl md:text-5xl">{bar ? <>আইনজীবী হওয়ার পথে,<br />প্রস্তুতি হোক বুঝে পড়ে।</> : <>বিচারক হওয়ার লক্ষ্য।<br />প্রস্তুতির পরিধি বুঝে শুরু।</>}</h1><p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 md:text-base md:leading-8">{bar ? 'পরীক্ষার পথ চিনুন। একটি বিষয় পড়ুন, অনুশীলন করুন, ভুলের জায়গায় আবার ফিরুন। MAMLAQ অ্যাপে প্রস্তুতির এই কাজগুলো একসঙ্গে রাখুন।' : 'আইনের সঙ্গে সাধারণ বিষয়ও প্রস্তুতির অংশ। MAMLAQ-এর যৌথ আইন পাঠ ব্যবহার করুন, আর বাকি পড়া নিজের বই ও অফিসিয়াল সিলেবাস ধরে সাজান।'}</p><div className="mt-7 flex flex-wrap gap-3"><AppDownload url={cms.playStoreUrl} /><a href="#preparation" className="inline-flex min-h-12 items-center gap-2 px-3 text-sm text-white no-underline">প্রস্তুতির পথ দেখুন <ArrowDown size={16} aria-hidden="true" /></a></div></div>
          <aside className="self-end border-l border-brass/50 pl-5 md:pb-3 md:pl-7"><p className="text-xs text-brass-soft">শুরু করার আগে</p><h2 className="mt-3 text-xl font-medium leading-relaxed">পরিচিতি থেকে নিজের<br />পড়ার পরিকল্পনা।</h2><p className="mt-3 text-sm leading-7 text-slate-300">চলতি বিজ্ঞপ্তি, যোগ্যতা, আবেদনের নিয়ম ও সিলেবাস অফিসিয়াল উৎসে মিলিয়ে নিন।</p><a href={bar ? 'https://www.barcouncil.gov.bd/' : 'https://bjsc.gov.bd/'} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm text-brass-soft underline underline-offset-4">{bar ? 'বাংলাদেশ বার কাউন্সিল' : 'বাংলাদেশ জুডিশিয়াল সার্ভিস কমিশন'}<ArrowUpRight size={15} className="shrink-0" aria-hidden="true" /></a></aside>
        </div>
      </div>
    </section>
    <div className="marketing-container">
      <section id="preparation" className="scroll-mt-24 py-12 md:py-16">
        <p className="marketing-eyebrow">অ্যাপে প্রস্তুতির জায়গাগুলো</p><h2 className="mt-3 text-2xl font-semibold md:text-3xl">একটি লক্ষ্য, আলাদা কাজের জায়গা।</h2>
        <div className="mt-8 grid gap-x-10 md:grid-cols-2">{[
          { icon: BookOpen, title: 'ধারণা ও পাঠ', text: 'বিষয় বেছে বিদ্যমান পাঠ পড়ুন। মূল পয়েন্ট নিজের ভাষায় মনে করে তারপর অনুশীলনে যান।' },
          { icon: Check, title: 'MCQ ও নিজের পরীক্ষা', text: 'অনুশীলনে উত্তর ও ব্যাখ্যা দেখুন। মডেল সেট ও ব্যক্তিগত সময়বদ্ধ মকে নিজেকে যাচাই করুন।' },
          { icon: PenLine, title: 'লিখিতের পড়ার সঙ্গী', text: 'নিজের বই, বেয়ার অ্যাক্ট ও রেফারেন্স থেকে পড়ুন। অ্যাপের পড়ার খাতায় অধ্যায়, সময় ও মনে রাখার নোট লিখুন।' },
          { icon: Mic, title: 'ভাইভার প্রস্তুতি', text: 'উত্তর দেখার আগে মুখে বলুন। বিদ্যমান প্রশ্ন ও মূল পয়েন্ট মিলিয়ে নিজের উত্তর আবার সাজান।' },
        ].map(({ icon: Icon, title: label, text }, i) => <article key={label} className="flex gap-4 border-t border-[#dcd5c7] py-6"><Icon size={21} className="mt-1 shrink-0 text-[#8d6b32]" aria-hidden="true" /><div><span className="font-sans text-[11px] text-slate-500">0{i + 1}</span><h3 className="mt-1 text-lg font-semibold">{label}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{text}</p></div></article>)}</div>
      </section>
      <section className="grid gap-7 border-t border-[#dcd5c7] py-10 md:grid-cols-[.8fr_1.2fr] md:gap-16">
        <div><p className="marketing-eyebrow">পাঠের পরিধি</p><h2 className="mt-3 text-2xl font-semibold">{bar ? 'বিষয় ধরে এগোন।' : 'যৌথ আইন পাঠ দিয়ে শুরু।'}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{bar ? 'এগুলো অ্যাপের বিষয়ভিত্তিক পড়ার মানচিত্র। প্রতিটি বিষয়ের সব পাঠ বা প্রশ্ন সমানভাবে উপলব্ধ নয়। বর্তমান পরিধি অফিসিয়াল সিলেবাসে মিলিয়ে নিন।' : 'বর্তমান topic library মূলত বার কাউন্সিলের সঙ্গে মিল থাকা আইন বিষয়গুলো ব্যবহার করে। এটি সম্পূর্ণ বিজেএস কোর্স বা পূর্ণ সিলেবাস কভারেজ নয়।'}</p></div>
        <ul className="grid content-start gap-x-6 sm:grid-cols-2">{subjectGroups[track].map((subject) => <li key={subject} className="flex items-start gap-3 border-b border-[#dcd5c7] py-3 text-sm leading-7"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />{subject}</li>)}</ul>
      </section>
      <StudyLoop />
      <section className="border-t border-[#dcd5c7] py-10 md:py-14"><div className="grid gap-7 md:grid-cols-2"><div><h2 className="text-xl font-semibold">লিখিতের বই আপনার সঙ্গেই থাকুক।</h2><p className="mt-3 text-sm leading-7 text-slate-600">MAMLAQ-এ লিখিত lesson course নেই। পড়ার খাতা নিজের পড়া মনে রাখতে সাহায্য করে; লগ করা সময় পরীক্ষার দক্ষতার নম্বর নয়। এই খাতা বর্তমানে ডিভাইসে সংরক্ষিত থাকে।</p></div><div><h2 className="text-xl font-semibold">নিজের পরীক্ষা, নিজের গতিতে।</h2><p className="mt-3 text-sm leading-7 text-slate-600">ব্যক্তিগত সময়বদ্ধ মক ব্যবহার করতে পারবেন। নির্ধারিত live event বা যৌথ ranking এখন যুক্ত নেই। ছোট মককে পূর্ণ অফিসিয়াল পরীক্ষার বিকল্প ভাববেন না।</p></div></div></section>
      <section className="mb-12 flex flex-col items-start justify-between gap-6 rounded-2xl bg-navy px-6 py-8 text-white md:flex-row md:items-center md:px-9"><div><p className="text-xs text-brass-soft">আপনার পরের ছোট পদক্ষেপ</p><h2 className="mt-2 text-xl font-semibold md:text-2xl">অ্যাপ খুলে একটি বিষয় বেছে নিন।</h2><p className="mt-2 text-sm text-slate-300">পাঠ ও ফিচারের প্রাপ্যতা প্যাকেজভেদে আলাদা হতে পারে।</p></div><div className="flex shrink-0 flex-wrap items-center gap-4"><AppDownload url={cms.playStoreUrl} /><Link href="/package" className="inline-flex min-h-11 items-center text-sm text-brass-soft underline underline-offset-4">প্যাকেজ দেখুন</Link></div></section>
    </div>
  </CareerPublicFrame>
}
