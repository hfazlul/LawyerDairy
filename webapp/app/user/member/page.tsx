import Link from 'next/link'
import { requireWebUser, planOfUser, personalWorkspace } from '@/lib/web-session'
import { isPremiumActive } from '@/lib/entitlement-gates'
import { extraTeamSeats, monthlySmsCredits } from '@/lib/permissions'
import { UserShell } from '@/ui/app-nav'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type Props = { searchParams?: Promise<{ pay?: string }> }

export default async function MemberTypePage({ searchParams }: Props) {
  const user = await requireWebUser('/user/member')
  const params = (await searchParams) || {}
  const ws = personalWorkspace(user)
  const plan = planOfUser(user)
  const active = isPremiumActive(plan, ws?.planExpiresAt)
  return (
    <UserShell title="সদস্যপদ" userLabel={user.name}>
      {params.pay === '1' ? <p className="mb-3 font-bengali text-[var(--ok)]">পেমেন্ট যাচাই হয়েছে — প্যাকেজ সক্রিয়।</p> : null}
      {params.pay === '0' ? (
        <p className="mb-3 font-bengali text-muted-foreground">
          পেমেন্ট সম্পূর্ণ হয়নি। সাপোর্ট বা অ্যাডমিন অ্যাক্টিভেট ব্যবহার করুন।
        </p>
      ) : null}
      <Card className="max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-bengali">বর্তমান প্যাকেজ</CardTitle>
          <Badge variant={active ? 'brass' : 'secondary'}>{active ? plan : 'FREE'}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 font-bengali text-sm">
          {ws?.planExpiresAt ? (
            <p className="text-muted-foreground">শেষ: {ws.planExpiresAt.toISOString().slice(0, 10)}</p>
          ) : null}
          <p className="text-muted-foreground">
            টিম সিট (মালিক ছাড়া): {extraTeamSeats(plan)} · এসএমএস/মাস: {monthlySmsCredits(plan)}
          </p>
          {!active ? (
            <Button asChild className="mt-2">
              <Link href="/package">ওয়েবসাইটে পে করুন</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </UserShell>
  )
}
