export function caseAiConfigured(): boolean {
  const url = (process.env.CASE_AI_API_URL || '').trim()
  const key = (process.env.CASE_AI_API_KEY || '').trim()
  return Boolean(url && key)
}

export type CaseAiResult =
  | { ok: true; reply: string }
  | { ok: false; error: 'ai_unconfigured' | 'ai_failed'; message: string }

/** Case-aware assistant. Does not invent legal advice when unconfigured. */
export async function askCaseAssistant(input: {
  prompt: string
  caseId?: string
}): Promise<CaseAiResult> {
  if (!caseAiConfigured()) {
    return {
      ok: false,
      error: 'ai_unconfigured',
      message: 'Case-aware AI keys are not set (CASE_AI_API_URL / CASE_AI_API_KEY).',
    }
  }
  const prompt = input.prompt.trim()
  if (!prompt) {
    return { ok: false, error: 'ai_failed', message: 'prompt required' }
  }
  try {
    const res = await fetch(process.env.CASE_AI_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CASE_AI_API_KEY}`,
      },
      body: JSON.stringify({ prompt, caseId: input.caseId }),
    })
    if (!res.ok) {
      return { ok: false, error: 'ai_failed', message: `vendor ${res.status}` }
    }
    const json = (await res.json()) as { reply?: string; text?: string }
    return { ok: true, reply: json.reply ?? json.text ?? '' }
  } catch (e) {
    return { ok: false, error: 'ai_failed', message: String(e) }
  }
}
