/**
 * One unpaid invoice create. Never prints secrets. Never marks COMPLETED.
 * Load webapp/.env into process.env without logging values.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { appBaseUrl, checkoutRedirectIsLocalhost } from '../src/lib/app-url'
import { zinipayApiKeyFromEnv } from '../src/lib/env-aliases'
import { createZiniInvoice, zinipayConfigured } from '../src/lib/zinipay'

const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env')

function loadDotEnv() {
  const text = readFileSync(envPath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    if (process.env[m[1]] === undefined || process.env[m[1]] === '') {
      process.env[m[1]] = v
    }
  }
}

function redact(message: string, key: string): string {
  let out = message
  if (key && out.includes(key)) out = out.split(key).join('[redacted]')
  return out.slice(0, 240)
}

async function main() {
  const keyPresent = Boolean(zinipayApiKeyFromEnv())
  const configured = zinipayConfigured()
  const origin = appBaseUrl()
  const localhost = checkoutRedirectIsLocalhost(origin)

  const report: Record<string, unknown> = {
    zinipay_api_key: keyPresent ? 'SET' : 'EMPTY',
    configured,
    redirect_origin_localhost: localhost,
    public_app_url_name: 'PUBLIC_APP_URL',
    create_attempted: false,
    create_ok: false,
    has_payment_url: false,
    has_invoice_id: false,
    fulfilled: false,
    note: 'Create does not charge. Fulfillment requires /v1/payment/verify COMPLETED.',
  }

  if (!keyPresent) {
    report.message = 'ZINIPAY_API_KEY EMPTY — skipped create'
    console.log(JSON.stringify(report, null, 2))
    return
  }

  if (!configured) {
    const allow = process.env.ZINIPAY_ALLOW_SANDBOX === 'true'
    report.message = allow
      ? 'zinipayConfigured false'
      : 'zinipayConfigured false (sandbox_test_ prefix needs ZINIPAY_ALLOW_SANDBOX=true for probe only; not written to .env)'
    if (!allow) {
      process.env.ZINIPAY_ALLOW_SANDBOX = 'true'
      report.sandbox_allow_used_for_create_probe_only = zinipayConfigured()
    }
  }

  if (!zinipayConfigured()) {
    console.log(JSON.stringify(report, null, 2))
    return
  }

  report.create_attempted = true
  const created = await createZiniInvoice({
    cusName: 'Mamlaq create probe',
    cusEmail: 'probe@example.com',
    amountBdt: 1,
    metadata: { probe: 'unpaid-create-only' },
    redirectUrl: `${origin}/api/web/v1/checkout/zinipay/return`,
    cancelUrl: `${origin}/user/member?pay=cancel`,
    webhookUrl: `${origin}/api/web/v1/checkout/zinipay/webhook`,
  })

  report.create_ok = created.ok
  if (created.ok) {
    report.has_payment_url = Boolean(created.paymentUrl)
    report.has_invoice_id = Boolean(created.invoiceId)
    report.message = 'unpaid invoice created; not verified COMPLETED'
  } else {
    report.reason = created.reason
    report.message = redact(created.message, zinipayApiKeyFromEnv())
    if (localhost) {
      report.domain_hint =
        'Set PUBLIC_APP_URL, NEXT_PUBLIC_SITE_URL, and NEXT_PUBLIC_APP_URL to https://mamlaq.com. The brand website field is that homepage.'
    }
  }

  console.log(JSON.stringify(report, null, 2))
}

loadDotEnv()
main().catch((e) => {
  console.log(JSON.stringify({ create_ok: false, fulfilled: false, message: String(e).slice(0, 200) }))
  process.exit(1)
})
