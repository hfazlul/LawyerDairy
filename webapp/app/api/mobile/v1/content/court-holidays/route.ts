import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const year = req.nextUrl.searchParams.get('year') ?? String(new Date().getFullYear())
  return NextResponse.json({
    year,
    holidays: [],
    noteBn: 'গেজেট ছুটির তালিকা এখনো ingest হয়নি — LimitationEngine শুধু শুক্র/শনি এগোয়।',
  })
}
