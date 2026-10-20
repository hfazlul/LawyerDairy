import { cookies } from 'next/headers'
import { getCms } from '@/lib/cms'
import { CareerTrackPreview } from '@/ui/career-preview'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'বার কাউন্সিল প্রস্তুতি | MAMLAQ', description: 'বার কাউন্সিলের বিষয়ভিত্তিক পড়া, MCQ অনুশীলন, লিখিতের পড়ার খাতা ও ভাইভা প্রস্তুতির পরিচিতি।' }

export default async function BarCouncilPage() {
  const [cms, jar] = await Promise.all([getCms(), cookies()])
  return <CareerTrackPreview track="bar" cms={cms} authed={Boolean(jar.get('ldb_access')?.value)} />
}
