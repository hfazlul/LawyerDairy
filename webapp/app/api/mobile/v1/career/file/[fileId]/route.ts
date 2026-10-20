import { NextRequest, NextResponse } from 'next/server'
import { readCareerFileBytes } from '@/lib/career-fs'
import { clientIp, rateLimit } from '@/lib/rate-limit'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ fileId: string }> },
) {
  const ip = clientIp(req.headers)
  const rl = rateLimit(`career-file:${ip}`, 40, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { message: 'Too many requests — একটু পরে চেষ্টা করুন' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    )
  }

  const { fileId } = await ctx.params
  const hit = readCareerFileBytes(fileId)
  if (!hit) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  const inm = req.headers.get('if-none-match')
  const etag = `"${hit.hash}"`
  if (inm && inm.replace(/W\//, '') === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } })
  }

  return new NextResponse(new Uint8Array(hit.bytes), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'X-Career-Hash': hit.hash,
      'X-Career-File': hit.file,
    },
  })
}
