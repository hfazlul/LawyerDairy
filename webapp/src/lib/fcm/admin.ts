import { fcmConfigured, parseServiceAccountJson } from './config'

export { fcmConfigured, parseServiceAccountJson }

type AdminNs = typeof import('firebase-admin')

let appReady = false

export async function getFirebaseMessaging(): Promise<
  import('firebase-admin/messaging').Messaging | null
> {
  if (!fcmConfigured()) return null
  try {
    const admin: AdminNs = await import('firebase-admin')
    if (!appReady) {
      if (admin.apps.length === 0) {
        const json = parseServiceAccountJson()
        const path = (process.env.GOOGLE_APPLICATION_CREDENTIALS || '').trim()
        if (json) {
          admin.initializeApp({
            credential: admin.credential.cert(json as import('firebase-admin').ServiceAccount),
          })
        } else if (path) {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
          })
        } else {
          return null
        }
      }
      appReady = true
    }
    return admin.messaging()
  } catch {
    return null
  }
}
