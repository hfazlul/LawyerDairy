import { requireWebUser } from '@/lib/web-session'
import { UserShell } from '@/ui/app-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function UserProfilePage() {
  const user = await requireWebUser('/user/profile')
  return (
    <UserShell title="প্রোফাইল" userLabel={user.name}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="font-bengali">অ্যাকাউন্ট তথ্য</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 font-bengali text-sm">
          <p><span className="text-muted-foreground">নাম:</span> <strong>{user.name}</strong></p>
          <p><span className="text-muted-foreground">ইউজারনেম:</span> <strong>{user.username}</strong></p>
          <p><span className="text-muted-foreground">ফোন:</span> <strong>{user.phone}</strong></p>
          <p><span className="text-muted-foreground">ইমেইল:</span> <strong>{user.email || '—'}</strong></p>
          <p className="text-muted-foreground">পাসওয়ার্ড পরিবর্তন: মোবাইল অ্যাপ বা ফরগট-পাসওয়ার্ড।</p>
        </CardContent>
      </Card>
    </UserShell>
  )
}
