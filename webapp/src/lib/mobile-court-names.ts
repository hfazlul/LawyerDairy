/**
 * Names for court ids the phone sends from its bundled list
 * (mobile/lib/core/courts/court_catalog.dart). The server Court table
 * does not have these ids, and the phone omits the label when an id is set.
 */

const ORD: Record<number, string> = {
  1: '১ম', 2: '২য়', 3: '৩য়', 4: '৪র্থ', 5: '৫ম', 6: '৬ষ্ঠ', 7: '৭ম', 8: '৮ম', 9: '৯ম',
  10: '১০ম', 11: '১১তম', 12: '১২তম', 13: '১৩তম', 14: '১৪তম', 15: '১৫তম', 16: '১৬তম',
  17: '১৭তম', 18: '১৮তম', 19: '১৯তম', 20: '২০তম', 21: '২১তম', 22: '২২তম', 23: '২৩তম',
  24: '২৪তম', 25: '২৫তম', 26: '২৬তম', 27: '২৭তম', 28: '২৮তম', 29: '২৯তম', 30: '৩০তম',
  31: '৩১তম', 32: '৩২তম', 33: '৩৩তম', 34: '৩৪তম', 35: '৩৫তম', 36: '৩৬তম', 37: '৩৭তম',
}

function bnOrd(n: number): string {
  return ORD[n] ?? String(n)
}

function bnDigit(n: number): string {
  const d = '০১২৩৪৫৬৭৮৯'
  if (n === 0) return '০'
  const parts: number[] = []
  let x = Math.abs(n)
  while (x > 0) {
    parts.push(x % 10)
    x = Math.floor(x / 10)
  }
  return parts.reverse().map((p) => d[p]).join('')
}

function range(typeId: string, family: string, prefix: string, from: number, to: number, suffix = ' আদালত', sep = ' ') {
  const out: Array<[string, string]> = []
  for (let i = from; i <= to; i++) {
    out.push([`${typeId}:${family}:${i}`, `${prefix}${sep}${bnOrd(i)}${suffix}`])
  }
  return out
}

function hyphenRange(typeId: string, family: string, prefix: string, from: number, to: number) {
  const out: Array<[string, string]> = []
  for (let i = from; i <= to; i++) {
    out.push([`${typeId}:${family}:${i}`, `${prefix}-${bnDigit(i)}`])
  }
  return out
}

const NAMES = new Map<string, string>([
  ['dj:dj', 'জেলা ও দায়রা জজ আদালত'],
  ...range('dj', 'adj', 'অতিরিক্ত জেলা ও দায়রা জজ', 1, 20),
  ['dj:insolvency', 'অতিরিক্ত জেলা ও দায়রা জজ দেউলিয়া আদালত'],
  ['dj:21', 'অতিরিক্ত জেলা ও দায়রা জজ ২১তম আদালত'],
  ...hyphenRange('dj', 'addl_sessions', 'অতিরিক্ত দায়রা আদালত', 1, 9),
  ...range('dj', 'jdj', 'যুগ্ম জেলা ও দায়রা জজ', 1, 5),
  ['dj:jdj_addl', 'যুগ্ম জেলা ও দায়রা জজ অতিরিক্ত আদালত'],
  ...hyphenRange('dj', 'joint_sessions', 'যুগ্ম দায়রা আদালত', 1, 8),
  ['dj:arb', 'আরবিট্রেশন আদালত'],
  ['dj:lst', 'ল্যান্ড সার্ভে ট্রাইব্যুনাল'],
  ...range('dj', 'artha', 'অর্থঋণ', 1, 7),
  ['dj:scj', 'সিনিয়র সিভিল জজ আদালত'],
  ...range('dj', 'scj_n', 'সিনিয়র সিভিল জজ', 1, 4),
  ['dj:cj', 'সিভিল জজ আদালত'],
  ['dj:cj_addl', 'অতিরিক্ত সিভিল জজ আদালত'],
  ...range('dj', 'cj_n', 'সিভিল জজ', 1, 5),
  ['dj:dsj', 'বিভাগীয় বিশেষ জজ আদালত'],
  ['dj:env', 'পরিবেশ আদালত'],
  ['dj:env_ap', 'পরিবেশ আপীল আদালত'],
  ...hyphenRange('dj', 'family', 'পারিবারিক আদালত', 1, 14),
  ['cjm:cjm', 'চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত'],
  ['cjm:acjm', 'অতিরিক্ত চীফ জুডিসিয়াল ম্যাজিস্ট্রেট আদালত'],
  ...range('cjm', 'sjm', 'সিনিয়র জুডিসিয়াল ম্যাজিস্ট্রেট', 1, 4),
  ...range('cjm', 'jm', 'জুডিসিয়াল ম্যাজিস্ট্রেট', 1, 5),
  ['cjm:cr', 'আমলী আদালত'],
  ['cjm:st', 'দ্রুত বিচার আদালত'],
  ['cjm:pfa', 'বিশুদ্ধ খাদ্য আদালত'],
  ...hyphenRange('tribunal', 'stt', 'দ্রুত বিচার ট্রাইব্যুনাল', 1, 4),
  ['tribunal:psa', 'জননিরাপত্তা বিঘ্নকারী অপরাধ দমন ট্রাইব্যুনাল'],
  ...hyphenRange('tribunal', 'cos', 'কোর্ট অফ সেটেলমেন্ট', 1, 2),
  ...range('tribunal', 'sj', 'বিশেষ জজ', 1, 10),
  ['tribunal:cyber', 'সাইবার ট্রাইব্যুনাল'],
  ['tribunal:terror', 'সন্ত্রাস বিরোধী বিশেষ ট্রাইব্যুনাল'],
  ['tribunal:traffick', 'মানব পাচার অপরাধ দমন ট্রাইব্যুনাল'],
  ...range('tribunal', 'labour', 'শ্রম আদালত', 1, 3),
  ['tribunal:admin_ap', 'প্রশাসনিক আপীল ট্রাইব্যুনাল'],
  ...range('tribunal', 'admin', 'প্রশাসনিক ট্রাইব্যুনাল', 1, 3),
  ...range('tribunal', 'nosa', 'নারী ও শিশু নির্যাতন দমন ট্রাইব্যুনাল', 1, 9),
  ['tribunal:labour_ap', 'শ্রম আপীল ট্রাইব্যুনাল'],
  ['tribunal:child_v', 'শিশু সহিংসতা দমন ট্রাইব্যুনাল'],
  ...range('tribunal', 'fam_ap', 'পারিবারিক আপীল আদালত', 1, 5),
  ['tribunal:lst_ap', 'ল্যান্ড সার্ভে আপীল ট্রাইব্যুনাল'],
  ['tribunal:enforced', 'গুম প্রতিরোধ ও প্রতিকার ট্রাইব্যুনাল'],
  ['tribunal:commercial', 'বাণিজ্যিক আদালত'],
  ['mdsj:mdj', 'মহানগর দায়রা জজ আদালত'],
  ...range('mdsj', 'amdj', 'অতিরিক্ত মহানগর দায়রা জজ', 1, 16),
  ['mdsj:amdj17', 'অতিরিক্ত মহানগর দায়রা আদালত–১৭'],
  ['mdsj:amdj18', 'অতিরিক্ত মহানগর দায়রা আদালত–১৮'],
  ['mdsj:amdj19', 'অতিরিক্ত মহানগর দায়রা আদালত–১৯'],
  ['mdsj:amdj20', 'অতিরিক্ত মহানগর দায়রা আদালত–২০'],
  ...range('mdsj', 'jmdj', 'যুগ্ম মহানগর দায়রা জজ', 1, 7),
  ['cmm:cmm', 'চীফ মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত'],
  ...range('cmm', 'acmm', 'অতিরিক্ত চীফ মেট্রোপলিটন ম্যাজিস্ট্রেট', 1, 4),
  ...range('cmm', 'mm', 'মেট্রোপলিটন ম্যাজিস্ট্রেট', 1, 37),
  ['cmm:smm', 'স্পেশাল মেট্রোপলিটন ম্যাজিস্ট্রেট আদালত'],
  ['cmm:smm_nosa', 'স্পেশাল এমএম (নারী ও শিশু)'],
  ['cmm:smm_cyber', 'স্পেশাল এমএম (সাইবার)'],
  ['cmm:smm_st', 'স্পেশাল এমএম (দ্রুত বিচার)'],
  ['cmm:cr', 'আমলী আদালত'],
  ['cmm:marine', 'মেরিন আদালত'],
  ['metro_special:child', 'শিশু সহিংসতা দমন ট্রাইব্যুনাল'],
  ['metro_special:com1', 'বাণিজ্যিক আদালত-১'],
  ['metro_special:com2', 'বাণিজ্যিক আদালত-২'],
  ['metro_special:com3', 'বাণিজ্যিক আদালত-৩'],
  ['hcd:hcd', 'হাইকোর্ট বিভাগ'],
  ['ad:ad', 'আপিল বিভাগ'],
])

export function mobileCatalogCourtName(id: string | null | undefined): string | null {
  if (!id) return null
  return NAMES.get(id) ?? null
}
