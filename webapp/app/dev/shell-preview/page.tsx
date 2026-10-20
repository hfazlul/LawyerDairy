import { UserShell, AdminShell } from '@/ui/app-nav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { notFound } from 'next/navigation'

/** Dev-only shell preview — no auth. Disabled in production. */
export default function ShellPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <div className="space-y-10 p-4">
      <UserShell title="ইউজার ড্যাশবোর্ড (প্রিভিউ)" userLabel="Demo User">
        <Card>
          <CardHeader>
            <CardTitle className="font-bengali">শেল প্রিভিউ</CardTitle>
          </CardHeader>
          <CardContent className="font-bengali text-sm text-muted-foreground">
            বাম সাইডবার · উপরের হেডার · মূল কন্টেন্ট। লগইন ছাড়া লেআউট যাচাই।
          </CardContent>
        </Card>
      </UserShell>
      <AdminShell title="Admin dashboard (preview)">
        <Card>
          <CardHeader>
            <CardTitle>Admin shell preview</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Left sidebar · top header · main content. Layout check without login.
          </CardContent>
        </Card>
      </AdminShell>
    </div>
  )
}
