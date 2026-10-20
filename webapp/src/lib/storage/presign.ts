import { createHmac, createHash, type BinaryLike } from 'crypto'

export function blobStoreConfigured(): boolean {
  return Boolean(
    env('R2_ACCESS_KEY_ID') &&
      env('R2_SECRET_ACCESS_KEY') &&
      env('R2_BUCKET_NAME') &&
      (env('R2_ACCOUNT_ID') || env('R2_ENDPOINT')),
  )
}

function env(name: string): string {
  return (process.env[name] || '').trim()
}

function sha256Hex(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex')
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key as BinaryLike).update(data, 'utf8').digest()
}

function amzDate(d: Date): { amz: string; ymd: string } {
  const iso = d.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const amz = iso.slice(0, 15) + 'Z'
  return { amz, ymd: amz.slice(0, 8) }
}

export type PresignResult = {
  uploadUrl: string
  method: 'PUT'
  headers: Record<string, string>
  publicUrl: string
  objectKey: string
  expiresInSec: number
}

/** AWS SigV4 query presign for Cloudflare R2 / S3-compatible PUT. */
export function presignPutObject(input: {
  objectKey: string
  contentType: string
  expiresInSec?: number
  now?: Date
}): PresignResult {
  const accessKey = env('R2_ACCESS_KEY_ID')
  const secretKey = env('R2_SECRET_ACCESS_KEY')
  const bucket = env('R2_BUCKET_NAME')
  const accountId = env('R2_ACCOUNT_ID')
  const endpoint =
    env('R2_ENDPOINT') ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '')
  const region = env('R2_REGION') || 'auto'
  const expiresInSec = input.expiresInSec ?? 600
  const now = input.now ?? new Date()
  const { amz, ymd } = amzDate(now)
  const host = new URL(endpoint).host
  const encodedKey = input.objectKey
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/')
  const canonicalUri = `/${bucket}/${encodedKey}`
  const credential = `${accessKey}/${ymd}/${region}/s3/aws4_request`
  const signedHeaders = 'content-type;host'
  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amz,
    'X-Amz-Expires': String(expiresInSec),
    'X-Amz-SignedHeaders': signedHeaders,
  }
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join('&')
  const canonicalHeaders = `content-type:${input.contentType}\nhost:${host}\n`
  const payloadHash = 'UNSIGNED-PAYLOAD'
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amz,
    `${ymd}/${region}/s3/aws4_request`,
    sha256Hex(canonicalRequest),
  ].join('\n')
  const kDate = hmac(`AWS4${secretKey}`, ymd)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, 's3')
  const kSigning = hmac(kService, 'aws4_request')
  const signature = createHmac('sha256', kSigning as BinaryLike).update(stringToSign, 'utf8').digest('hex')
  const uploadUrl = `${endpoint.replace(/\/$/, '')}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
  const publicBase = env('R2_PUBLIC_URL').replace(/\/$/, '')
  const publicUrl = publicBase ? `${publicBase}/${input.objectKey}` : uploadUrl.split('?')[0]
  return {
    uploadUrl,
    method: 'PUT',
    headers: { 'Content-Type': input.contentType },
    publicUrl,
    objectKey: input.objectKey,
    expiresInSec,
  }
}

export function allowedImageType(contentType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(contentType.toLowerCase())
}

export function allowedDocType(contentType: string): boolean {
  return [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(contentType.toLowerCase())
}
