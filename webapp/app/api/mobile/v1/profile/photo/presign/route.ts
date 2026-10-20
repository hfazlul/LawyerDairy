import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth-middleware'
import { newId } from '@/lib/crypto-tokens'
import {
  allowedImageType,
  blobStoreConfigured,
  presignPutObject,
} from '@/lib/storage/presign'

const schema = z.object({
  contentType: z.string().min(3).max(80),
})

export async function POST(req: NextRequest) {
  const user = await requireAuth(req)
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  if (!blobStoreConfigured()) {
    return NextResponse.json(
      {
        error: 'storage_unconfigured',
        messageBn: 'ছবি আপলোড সার্ভারে স্টোরেজ কনফিগ নেই (R2_* env)।',
      },
      { status: 503 },
    )
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
  }
  if (!allowedImageType(body.contentType)) {
    return NextResponse.json({ error: 'unsupported_type' }, { status: 415 })
  }

  const ext = body.contentType.split('/')[1] === 'jpeg' ? 'jpg' : body.contentType.split('/')[1]
  const objectKey = `profiles/${user.id}/${newId()}.${ext}`
  const signed = presignPutObject({ objectKey, contentType: body.contentType })
  return NextResponse.json({
    ...signed,
    hintBn: 'PUT করে ছবি পাঠান, তারপর প্রোফাইলে photoUrl সেট করুন।',
  })
}
