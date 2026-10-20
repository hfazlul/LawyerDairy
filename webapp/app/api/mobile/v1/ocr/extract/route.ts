import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import { extractDocumentText } from '@/lib/vendors/ocr'

const schema = z.object({
  imageBase64: z.string().min(8),
  mimeType: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }
  const result = await extractDocumentText(body)
  if (!result.ok) {
    return NextResponse.json(result, { status: result.error === 'ocr_unconfigured' ? 503 : 502 })
  }
  return NextResponse.json(result)
}
