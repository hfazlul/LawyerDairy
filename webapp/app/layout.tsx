import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: 'Lawyer Diary BD',
  description: 'বাংলাদেশি আইনজীবীর ডিজিটাল ডায়েরি — web subscriptions & admin',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <body>
        <div className="shell">{children}</div>
      </body>
    </html>
  )
}
