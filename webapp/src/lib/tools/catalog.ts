export const TOOLS_CATALOG = [
  { href: '/tools/court-fee', emoji: '🧾', bn: 'কোর্ট ফি', en: 'Court fee', group: 'court' },
  { href: '/tools/limitation', emoji: '⏳', bn: 'তামাদি', en: 'Limitation', group: 'court' },
  { href: '/tools/kabin', emoji: '💒', bn: 'কাবিন / নিকাহ ফি', en: 'Kabin / nikah fee', group: 'court' },
  { href: '/tools/ana-gonda', emoji: '🪙', bn: 'আনা-গন্ডা', en: 'Ana-gonda', group: 'land' },
  { href: '/tools/khatian', emoji: '📒', bn: 'খতিয়ান হিস্যা', en: 'Khatian share', group: 'land' },
  { href: '/tools/faraiz', emoji: '📜', bn: 'ফরায়েজ', en: 'Faraiz', group: 'land' },
  { href: '/tools/stamp', emoji: '📄', bn: 'স্ট্যাম্প ও নিবন্ধন', en: 'Stamp & registration', group: 'land' },
  { href: '/tools/mouza', emoji: '🗺', bn: 'মৌজা রেট', en: 'Mouza rate', group: 'land' },
  { href: '/tools/tax', emoji: '🧮', bn: 'আয়কর', en: 'Income tax', group: 'tax' },
] as const

export const TOOL_GROUPS: { id: string; bn: string; en: string }[] = [
  { id: 'court', bn: 'আদালত', en: 'Court' },
  { id: 'land', bn: 'জমি', en: 'Land' },
  { id: 'tax', bn: 'কর', en: 'Tax' },
]
