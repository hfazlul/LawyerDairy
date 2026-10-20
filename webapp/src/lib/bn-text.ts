/** Bengali search normalisation (doc 06 §5.3). NFC does not recompose nukta pairs. */

const NUKTA_FOLDS: Array<[string, string]> = [
  ['\u09A1\u09BC', '\u09DC'], // ড + ় → ড়
  ['\u09A2\u09BC', '\u09DD'], // ঢ + ় → ঢ়
  ['\u09AF\u09BC', '\u09DF'], // য + ় → য়
]

const BN_DIGITS = '০১২৩৪৫৬৭৮৯'

export function foldBangla(input: string): string {
  let s = input.normalize('NFC')
  for (const [from, to] of NUKTA_FOLDS) {
    s = s.split(from).join(to)
  }
  s = s.replace(/[\u200C\u200D]/g, '')
  let out = ''
  for (const ch of s) {
    const di = BN_DIGITS.indexOf(ch)
    if (di >= 0) {
      out += String(di)
    } else {
      out += ch
    }
  }
  return out.toLowerCase()
}

export function searchTokens(...parts: Array<string | null | undefined>): string {
  return foldBangla(parts.filter(Boolean).join(' '))
}
