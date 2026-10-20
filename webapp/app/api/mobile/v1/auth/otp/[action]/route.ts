import { NextRequest, NextResponse } from 'next/server'

/** OTP login was removed (locked §3.1). Use username/password. */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: 'otp_removed', messageBn: 'OTP লগইন নেই — ইউজারনেম ও পাসওয়ার্ড ব্যবহার করুন' },
    { status: 410 },
  )
}
