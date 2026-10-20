import { cookies } from 'next/headers'
import { getCms } from '@/lib/cms'
import { CareerTrackPreview } from '@/ui/career-preview'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'বিজেএস প্রস্তুতির পথ | MAMLAQ', description: 'বিজেএস প্রস্তুতির পরিচিতি, যৌথ আইন পাঠের পরিধি ও নিজের বই থেকে পড়ার সহায়ক পদ্ধতি।' }

export default async function BjsPage() {
  const [cms, jar] = await Promise.all([getCms(), cookies()])
  return <CareerTrackPreview track="bjs" cms={cms} authed={Boolean(jar.get('ldb_access')?.value)} />
}
