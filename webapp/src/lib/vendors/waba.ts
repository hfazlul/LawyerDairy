export function wabaConfigured(): boolean {
  const token = (process.env.WABA_TOKEN || '').trim()
  const phoneId = (process.env.WABA_PHONE_NUMBER_ID || '').trim()
  return Boolean(token && phoneId)
}

export type WabaResult =
  | { ok: true; messageId: string }
  | { ok: false; error: 'waba_unconfigured' | 'waba_failed'; message: string }

/** WhatsApp Cloud API. Mode A (wa.me) does not use this. Credits are SMS-only. */
export async function sendWabaTemplate(input: {
  to: string
  template: string
  language?: string
}): Promise<WabaResult> {
  if (!wabaConfigured()) {
    return {
      ok: false,
      error: 'waba_unconfigured',
      message: 'WABA_TOKEN / WABA_PHONE_NUMBER_ID are not set.',
    }
  }
  const url = `https://graph.facebook.com/v21.0/${process.env.WABA_PHONE_NUMBER_ID}/messages`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.WABA_TOKEN}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: input.to.replace(/\D/g, ''),
        type: 'template',
        template: {
          name: input.template,
          language: { code: input.language ?? 'bn' },
        },
      }),
    })
    if (!res.ok) {
      return { ok: false, error: 'waba_failed', message: `vendor ${res.status}` }
    }
    const json = (await res.json()) as { messages?: { id?: string }[] }
    return { ok: true, messageId: json.messages?.[0]?.id ?? '' }
  } catch (e) {
    return { ok: false, error: 'waba_failed', message: String(e) }
  }
}
