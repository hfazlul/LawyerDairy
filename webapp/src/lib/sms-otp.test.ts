import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSmsRequest, formatSmsPhone, smsGatewayConfigured, sendSms, sendOtp } from './sms-otp'

test('formats BD phones for aggregator styles', () => {
  assert.equal(formatSmsPhone('+8801712345678', 'local01'), '01712345678')
  assert.equal(formatSmsPhone('01712345678', 'e164'), '8801712345678')
  assert.equal(formatSmsPhone('8801712345678', 'digits'), '1712345678')
})

test('bearer_json request keeps Authorization and JSON body', () => {
  process.env.SMS_API_URL = 'https://sms.example/send'
  process.env.SMS_API_KEY = 'secret'
  process.env.SMS_VENDOR_STYLE = 'bearer_json'
  process.env.SMS_KEY_IN = 'header_bearer'
  process.env.SMS_SENDER_ID = 'LawyerDiary'
  const req = buildSmsRequest({ phone: '01712345678', message: 'hi' })
  assert.equal(req.method, 'POST')
  assert.equal(req.headers.Authorization, 'Bearer secret')
  assert.match(req.body || '', /"to":"01712345678"/)
})

test('form_post uses urlencoded number/message fields', () => {
  process.env.SMS_API_URL = 'https://sms.example/send'
  process.env.SMS_API_KEY = 'k'
  process.env.SMS_VENDOR_STYLE = 'form_post'
  process.env.SMS_KEY_IN = 'body'
  delete process.env.SMS_TO_FIELD
  delete process.env.SMS_MESSAGE_FIELD
  const req = buildSmsRequest({ phone: '01712345678', message: 'নমস্কার' })
  assert.equal(req.headers['Content-Type'], 'application/x-www-form-urlencoded')
  assert.match(req.body || '', /number=01712345678/)
})

test('unconfigured sendSms skips; sendOtp still throws', async () => {
  delete process.env.SMS_API_URL
  delete process.env.SMS_API_KEY
  assert.equal(smsGatewayConfigured(), false)
  const skip = await sendSms('01700000000', 'x')
  assert.equal(skip.ok, false)
  if (!skip.ok) assert.equal(skip.skipped, 'sms_unconfigured')
  await assert.rejects(() => sendOtp('01700000000', 'x'), /sms_gateway_unconfigured/)
})
