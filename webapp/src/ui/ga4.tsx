import Script from 'next/script'
import { gaMeasurementIdFromEnv } from '@/lib/ga4'

/** Loads gtag only when a real Measurement ID is set. ID is never shown in admin UI. */
export function Ga4() {
  const id = gaMeasurementIdFromEnv()
  if (!id) return null
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true,send_page_view:true});`}
      </Script>
    </>
  )
}
