import fs from 'node:fs'

const APP_NAME = 'shelfaware'

type Messaging = import('firebase-admin/messaging').Messaging

export function shelfServiceAccount(): Record<string, unknown> | null {
  const raw = (process.env.SHELFAWARE_FIREBASE_SERVICE_ACCOUNT_JSON || '').trim()
  if (!raw) return null
  try {
    const text = raw.startsWith('{') ? raw : fs.readFileSync(raw, 'utf8')
    return JSON.parse(text) as Record<string, unknown>
  } catch {
    return null
  }
}

export function shelfFcmConfigured(): boolean {
  return shelfServiceAccount() !== null
}

export async function shelfMessaging(): Promise<Messaging | null> {
  const json = shelfServiceAccount()
  if (!json) return null
  const admin = await import('firebase-admin')
  const existing = admin.apps.find((app) => app?.name === APP_NAME)
  if (!existing) {
    admin.initializeApp(
      { credential: admin.credential.cert(json as import('firebase-admin').ServiceAccount) },
      APP_NAME,
    )
  }
  return admin.messaging(admin.app(APP_NAME))
}

export async function sendShelfPush(input: {
  token: string
  title: string
  body: string
  itemKey: string
}): Promise<'sent' | 'invalid' | 'unconfigured' | 'failed'> {
  const messaging = await shelfMessaging()
  if (!messaging) return 'unconfigured'
  try {
    await messaging.send({
      token: input.token,
      notification: { title: input.title, body: input.body },
      data: {
        type: 'expiry_reminder',
        title: input.title,
        body: input.body,
        itemKey: input.itemKey,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'expiry_today_v3',
          title: input.title,
          body: input.body,
        },
      },
    })
    return 'sent'
  } catch (err) {
    const code = (err as { code?: string })?.code || ''
    if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
      return 'invalid'
    }
    return 'failed'
  }
}
