// SMS OTP — BD masking SMS gateway
// Pricing: ~৳0.28–0.48 per SMS (non-masking), ৳0.50–0.80 (masking)
// Recommended: SSL Wireless, Banglalink BL SMS, or BulkSMS BD

const SMS_API_URL = process.env.SMS_API_URL!
const SMS_API_KEY = process.env.SMS_API_KEY!
const SMS_SENDER  = process.env.SMS_SENDER_ID ?? 'LawyerDiary'

export async function sendOtp(phone: string, message: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    // In dev: just log, don't send real SMS
    console.log(`[SMS-OTP] To: ${phone} | Message: ${message}`)
    return
  }

  const response = await fetch(SMS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SMS_API_KEY}`,
    },
    body: JSON.stringify({
      to:      phone,
      message,
      sender:  SMS_SENDER,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`SMS send failed: ${err}`)
  }
}

// Bulk SMS for hearing reminders
export async function sendBulkSms(
  recipients: { phone: string; message: string }[]
): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0
  // Send in batches of 50
  for (let i = 0; i < recipients.length; i += 50) {
    const batch = recipients.slice(i, i + 50)
    await Promise.allSettled(
      batch.map(async (r) => {
        try {
          await sendOtp(r.phone, r.message)
          sent++
        } catch {
          failed++
        }
      })
    )
    if (i + 50 < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // rate limit
    }
  }
  return { sent, failed }
}
