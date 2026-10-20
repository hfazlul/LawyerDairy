import type { ReactNode } from 'react'
import './globals.css'
import './marketing.css'
import { Ga4 } from '@/ui/ga4'

export const metadata = {
  title: 'MAMLAQ — আইনজীবীর ডায়েরি',
  description: 'বাংলাদেশের আইনজীবীদের জন্য মামলা ডায়েরি ও আইনি টুলস — MAMLAQ Lawyer Diary।',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Noto+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Ga4 />
        <div className="min-h-screen">{children}</div>
      </body>
    </html>
  )
}
