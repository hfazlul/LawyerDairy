import { prisma } from '@/lib/prisma'
import { getFirebaseMessaging } from './admin'
import { isUnregisteredFcmError } from './logic'
import { isHighPriorityKind, stringifyFcmData, type FcmDataPayload } from './payload'

export type SendResult = 'sent' | 'invalid' | 'unconfigured' | 'failed'

export async function sendFcmToToken(input: {
  token: string
  title: string
  body: string
  data: FcmDataPayload
}): Promise<SendResult> {
  const messaging = await getFirebaseMessaging()
  if (!messaging) return 'unconfigured'
  const high = isHighPriorityKind(input.data.kind)
  try {
    await messaging.send({
      token: input.token,
      notification: { title: input.title, body: input.body },
      data: stringifyFcmData(input.data),
      android: {
        priority: high ? 'high' : 'normal',
        notification: {
          channelId: high ? 'fcm_high' : 'sync',
          title: input.title,
          body: input.body,
        },
      },
    })
    return 'sent'
  } catch (err) {
    if (isUnregisteredFcmError(err)) {
      await clearStoredPushToken(input.token)
      return 'invalid'
    }
    return 'failed'
  }
}

export async function clearStoredPushToken(token: string): Promise<void> {
  await prisma.device.updateMany({
    where: { pushToken: token },
    data: { pushToken: null },
  })
}
