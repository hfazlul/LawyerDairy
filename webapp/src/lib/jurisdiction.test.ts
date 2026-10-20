import assert from 'node:assert/strict'
import test from 'node:test'
import { youtubeEmbedSrc, guideVideoEmbedUrl } from './jurisdiction'

test('youtubeEmbedSrc converts watch/short/embed; rejects empty and non-youtube', () => {
  assert.equal(
    youtubeEmbedSrc('https://www.youtube.com/watch?v=abcdefghijk'),
    'https://www.youtube.com/embed/abcdefghijk',
  )
  assert.equal(youtubeEmbedSrc('https://youtu.be/abcdefghijk'), 'https://www.youtube.com/embed/abcdefghijk')
  assert.equal(
    youtubeEmbedSrc('https://www.youtube.com/embed/abcdefghijk'),
    'https://www.youtube.com/embed/abcdefghijk',
  )
  assert.equal(youtubeEmbedSrc(''), '')
  assert.equal(youtubeEmbedSrc('https://example.com/watch?v=abcdefghijk'), '')
  assert.equal(youtubeEmbedSrc('not a url'), '')
})

test('guideVideoEmbedUrl is empty without env (no rickroll)', () => {
  delete process.env.NEXT_PUBLIC_GUIDE_BD_EMBED
  delete process.env.GUIDE_BD_URL
  assert.equal(guideVideoEmbedUrl('BD'), '')
})
