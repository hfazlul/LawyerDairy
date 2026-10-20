import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireWorkspace } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'
import {
  allowedDocType,
  blobStoreConfigured,
  presignPutObject,
} from '@/lib/storage/presign'

const schema = z.object({
  contentType: z.string().min(3).max(120),
  filename: z.string().max(120).optional(),
})

export async function POST(req: NextRequest) {
  const user = await requireWorkspace(req, 'documents.edit')
  if (!user?.activeMembership) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  if (!blobStoreConfigured()) {
    return NextResponse.json(
      { error: 'storage_unconfigured', uploadStatus: 'local_only' },
      { status: 503 },
    )
  }
  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }
  if (!allowedDocType(body.contentType)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })
  }
  const objectKey = `docs/${user.activeMembership.workspaceId}/${newId()}`
  const signed = presignPutObject({ objectKey, contentType: body.contentType })
  return NextResponse.json({ ...signed, uploadStatus: 'pending' })
}
