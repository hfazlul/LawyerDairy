import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { careerItemTitle, flattenCareerItem } from './career-flatten'
import { flattenMcqPayload } from './mcq'

describe('career flatten', () => {
  it('reads bn title from language_versions', () => {
    const title = careerItemTitle(
      { language_versions: { bn: { title: 'রেস জুডিকাটা' }, en: { title: 'Res Judicata' } } },
      'bn',
    )
    assert.equal(title, 'রেস জুডিকাটা')
  })

  it('does not put model answers or MCQ explanations in list bodyText', () => {
    const flat = flattenCareerItem(
      {
        id: 'BC-WQ-1',
        itemType: 'WRITTEN_QUESTION',
        payload: {
          language_versions: {
            bn: {
              question: 'রেস জুডিকাটা লিখুন',
              model_answer: 'গোপন নমুনা',
              explanation: 'গোপন ব্যাখ্যা',
              answer_outline: ['পক্ষ'],
            },
          },
        },
      },
      'bn',
    )
    assert.equal(flat.bodyText.includes('গোপন নমুনা'), false)
    assert.equal(flat.bodyText.includes('গোপন ব্যাখ্যা'), false)
    assert.deepEqual(flat.answerOutline, [])
    assert.equal(flat.answersHidden, true)
    assert.equal(flat.bodyText.includes('রেস জুডিকাটা'), true)
  })
})

describe('mcq flatten reveal-safe list', () => {
  const payload = {
    correct_answer: 'B',
    language_versions: {
      bn: {
        question: 'ধারা ১১ কি?',
        options: { A: 'সীমা', B: 'রেস জুডিকাটা' },
        explanation: 'CPC s.11',
      },
    },
  }

  it('hides key and explanation unless includeAnswers', () => {
    const hidden = flattenMcqPayload(payload, 'bn', { includeAnswers: false })
    assert.equal(hidden.correctKey, '')
    assert.equal(hidden.explanation, '')
    assert.equal(hidden.answersHidden, true)
    assert.equal(hidden.stem, 'ধারা ১১ কি?')
    const shown = flattenMcqPayload(payload, 'bn', { includeAnswers: true })
    assert.equal(shown.correctKey, 'B')
    assert.equal(shown.explanation, 'CPC s.11')
    assert.equal(shown.noneOfPrinted, false)
  })

  it('surfaces NONE key and flag only on reveal', () => {
    const payload = {
      correct_answer: 'NONE',
      flags: ['answer_none_of_printed'],
      flag_note: 'ছাপানো অপশনে সঠিক নেই',
      language_versions: {
        bn: {
          question: 'ধারা কোনটি?',
          options: { A: '৬(২)', B: '৮(২)' },
          explanation: 'ধারা ৯; ছাপানো অপশনে নেই।',
        },
      },
    }
    const hidden = flattenMcqPayload(payload, 'bn', { includeAnswers: false })
    assert.equal(hidden.correctKey, '')
    assert.equal(hidden.noneOfPrinted, false)
    assert.equal(hidden.explanation, '')
    const shown = flattenMcqPayload(payload, 'bn', { includeAnswers: true })
    assert.equal(shown.correctKey, 'NONE')
    assert.equal(shown.noneOfPrinted, true)
    assert.equal(shown.explanation.includes('ধারা ৯'), true)
  })
})
