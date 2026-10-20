import { NextRequest, NextResponse } from 'next/server'

/** Auto WhatsApp Cloud send removed. Manual wa.me on the phone still works. */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error: 'whatsapp_auto_removed',
      messageBn: 'অটো হোয়াটসঅ্যাপ বন্ধ। শুধু SIM এসএমএস (sms.net.bd / 24bulksmsbd)। ম্যানুয়াল wa.me চালু।',
    },
    { status: 410 },
  )
}
