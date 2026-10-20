import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, ShieldCheck, Star } from 'lucide-react'
import { getCms } from '@/lib/cms'
import { CareerPublicFrame } from '@/ui/career-preview'
import { LawyerContact } from '@/ui/lawyer-contact'
import { readProfileLabels, readPublicLawyer, safeProfilePhoto } from '@/lib/find-lawyer/public-directory'
import { practiceLabel } from '@/lib/find-lawyer/directory-rank'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'আইনজীবীর প্রোফাইল | MAMLAQ' }

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, cms, jar] = await Promise.all([params, getCms(), cookies()])
  const authed = Boolean(jar.get('ldb_access')?.value)
  const result = await readPublicLawyer(slug).then(profile => ({ profile, failed: false })).catch(() => ({ profile: null, failed: true }))
  if (result.failed) return <CareerPublicFrame cms={cms} authed={authed}><div className="marketing-container py-16"><h1 className="text-3xl">প্রোফাইল লোড করা যায়নি</h1><p className="mt-4 text-sm text-slate-600">সংযোগে সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।</p><Link href={'/find-lawyer/' + encodeURIComponent(slug)} className="text-link mt-5">আবার চেষ্টা করুন</Link><Link href="/find-lawyer" className="ml-6 text-link">তালিকায় ফিরুন</Link></div></CareerPublicFrame>
  const p = result.profile
  if (!p) notFound()
  const labels = await readProfileLabels(p).catch(() => ({ districts: [], courts: [] }))
  const photo = safeProfilePhoto(p.photoUrl)
  const back = '/find-lawyer/' + encodeURIComponent(slug)
  return <CareerPublicFrame cms={cms} authed={authed}><div className="marketing-container py-8 md:py-14"><Link href="/find-lawyer" className="text-link"><ArrowLeft size={16} />আইনজীবীদের তালিকা</Link><div className="mt-8 grid items-start gap-7 lg:grid-cols-[1.5fr_1fr]"><article className="rounded-2xl border border-[#ddd5c4] bg-white p-6 md:p-9"><div className="flex flex-wrap items-center gap-5">{photo ? <img src={photo} alt="" width={86} height={86} className="h-[86px] w-[86px] rounded-2xl object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-[#e8ede5] text-3xl text-[#365a49]">{p.displayName.charAt(0)}</div>}<div><h1 className="break-words text-2xl md:text-3xl">{p.displayName}</h1>{p.verificationStatus === 'VERIFIED' && p.verifiedAt && <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><ShieldCheck size={15} />প্রোফাইল যাচাইকৃত</p>}</div></div>{p.degrees.length > 0 && <p className="mt-6 text-sm text-slate-500">{p.degrees.join(' · ')}</p>}{practiceLabel(p.practiceAreaIds) && <p className="mt-5 text-[#967840]">{practiceLabel(p.practiceAreaIds)}</p>}{labels.districts.length > 0 && <p className="mt-5 flex gap-2 text-sm text-slate-600"><MapPin size={17} className="shrink-0" />{labels.districts.join(' · ')}</p>}{labels.courts.length > 0 && <p className="mt-3 text-sm text-slate-600">কর্মক্ষেত্র: {labels.courts.join(' · ')}</p>}{p.enrolmentYear && <p className="mt-3 text-sm text-slate-600">এনরোলমেন্টের বছর: {p.enrolmentYear.toLocaleString('bn-BD', { useGrouping: false })}</p>}<div className="mt-7 border-t border-[#e0dbce] pt-6"><h2 className="!text-lg">পরিচিতি</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm text-slate-600">{p.aboutBn || p.aboutEn || 'বিস্তারিত পরিচিতি এখনও যোগ করা হয়নি।'}</p></div>{p.ratingCount > 0 && p.ratingAvg != null && <p className="mt-7 flex items-center gap-2 border-t border-[#e0dbce] pt-5 text-sm"><Star size={17} className="text-[#a3864e]" />{Number(p.ratingAvg).toLocaleString('bn-BD', { maximumFractionDigits: 1 })} · {p.ratingCount.toLocaleString('bn-BD')}টি রিভিউ</p>}</article><aside className="rounded-2xl border border-[#d7c8a7] bg-[#fffdf6] p-6 md:p-8"><p className="marketing-eyebrow">পরের পদক্ষেপ</p><h2 className="mt-3 !text-2xl">যোগাযোগ করুন</h2><div className="mt-6"><LawyerContact profileId={p.id} authed={authed} loginHref={'/user/login?next=' + encodeURIComponent(back)} /></div></aside></div></div></CareerPublicFrame>
}
