import assert from 'node:assert/strict'
import test from 'node:test'
import { ocrConfigured, extractDocumentText } from './ocr'
import { caseAiConfigured, askCaseAssistant } from './ai'
import { wabaConfigured, sendWabaTemplate } from './waba'
import { smsGatewayConfigured, sendOtp } from '../sms-otp'

test('vendor adapters refuse to invent output without keys', async () => {
  delete process.env.OCR_API_URL
  delete process.env.OCR_API_KEY
  delete process.env.CASE_AI_API_URL
  delete process.env.CASE_AI_API_KEY
  delete process.env.WABA_TOKEN
  delete process.env.WABA_PHONE_NUMBER_ID

  assert.equal(ocrConfigured(), false)
  assert.equal(caseAiConfigured(), false)
  assert.equal(wabaConfigured(), false)

  const ocr = await extractDocumentText({ imageBase64: 'aaaa' })
  assert.equal(ocr.ok, false)
  if (!ocr.ok) assert.equal(ocr.error, 'ocr_unconfigured')

  const ai = await askCaseAssistant({ prompt: 'what is res judicata?' })
  assert.equal(ai.ok, false)
  if (!ai.ok) assert.equal(ai.error, 'ai_unconfigured')

  const wa = await sendWabaTemplate({ to: '01700000000', template: 'hearing_d0' })
  assert.equal(wa.ok, false)
  if (!wa.ok) assert.equal(wa.error, 'waba_unconfigured')
})

test('SMS gateway does not silent-send when unconfigured (even in development)', async () => {
  const prev = process.env.NODE_ENV
  process.env.NODE_ENV = 'development'
  delete process.env.SMS_API_URL
  delete process.env.SMS_API_KEY
  assert.equal(smsGatewayConfigured(), false)
  await assert.rejects(() => sendOtp('01700000000', 'test'), /sms_gateway_unconfigured/)
  process.env.NODE_ENV = prev
})
