export function ocrConfigured(): boolean {
  const url = (process.env.OCR_API_URL || '').trim()
  const key = (process.env.OCR_API_KEY || '').trim()
  return Boolean(url && key)
}

export type OcrResult =
  | { ok: true; text: string; vendor: string }
  | { ok: false; error: 'ocr_unconfigured' | 'ocr_failed'; message: string }

/** Cloud OCR. Returns no invented text when keys are missing. */
export async function extractDocumentText(input: {
  imageBase64: string
  mimeType?: string
}): Promise<OcrResult> {
  if (!ocrConfigured()) {
    return {
      ok: false,
      error: 'ocr_unconfigured',
      message: 'OCR vendor keys are not set (OCR_API_URL / OCR_API_KEY).',
    }
  }
  if (!input.imageBase64) {
    return { ok: false, error: 'ocr_failed', message: 'image required' }
  }
  try {
    const res = await fetch(process.env.OCR_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OCR_API_KEY}`,
      },
      body: JSON.stringify({
        imageBase64: input.imageBase64,
        mimeType: input.mimeType ?? 'image/jpeg',
      }),
    })
    if (!res.ok) {
      return { ok: false, error: 'ocr_failed', message: `vendor ${res.status}` }
    }
    const json = (await res.json()) as { text?: string }
    return { ok: true, text: json.text ?? '', vendor: 'ocr' }
  } catch (e) {
    return { ok: false, error: 'ocr_failed', message: String(e) }
  }
}
