export type FcmRouteName =
  | 'diary'
  | 'case'
  | 'premium'
  | 'appointments'
  | 'inbox'
  | 'team'
  | 'causeList'

export type FcmKind =
  | 'hearing.today'
  | 'hearing.tomorrow'
  | 'premium.d4'
  | 'premium.d3'
  | 'lead.incoming'
  | 'appointment.incoming'
  | 'team.join.request'

export type FcmDataPayload = {
  v: '1'
  kind: string
  routeName: FcmRouteName
  caseId?: string
  appointmentId?: string
  workspaceId?: string
  anchor?: string
  dedupeKey: string
}

export const HEARING_TODAY_TITLE = 'আজকের শুনানি'
export const HEARING_TOMORROW_TITLE = 'আগামীকালের শুনানি'
export const PREMIUM_NEAR_TITLE = 'সাবস্ক্রিপশন শেষের কাছাকাছি'

export function hearingTodayBody(n: number): string {
  return `${n}টি মামলার শুনানি আজ`
}

export function hearingTomorrowBody(n: number): string {
  return `${n}টি মামলা আগামীকাল`
}

export function premiumNearBody(endsYmd: string): string {
  const [y, m, d] = endsYmd.split('-')
  return `আপনার সাবস্ক্রিপশনের শেষ তারিখ ${Number(d)}/${Number(m)}/${y}। সুবিধা দেখতে সাবস্ক্রিপশন পাতা খুলুন।`
}

export function stringifyFcmData(data: FcmDataPayload): Record<string, string> {
  const out: Record<string, string> = {
    v: '1',
    kind: data.kind,
    routeName: data.routeName,
    dedupeKey: data.dedupeKey,
  }
  if (data.caseId) out.caseId = data.caseId
  if (data.appointmentId) out.appointmentId = data.appointmentId
  if (data.workspaceId) out.workspaceId = data.workspaceId
  if (data.anchor) out.anchor = data.anchor
  return out
}

export function isHighPriorityKind(kind: string): boolean {
  return (
    kind.startsWith('hearing.') ||
    kind.startsWith('premium.') ||
    kind === 'lead.incoming' ||
    kind.startsWith('appointment')
  )
}

export function hearingDigestPayload(input: {
  offset: 0 | 1
  count: number
  caseId?: string
  userId: string
  ymd: string
}): { title: string; body: string; data: FcmDataPayload } {
  const isToday = input.offset === 0
  const kind = isToday ? 'hearing.today' : 'hearing.tomorrow'
  const single = input.count === 1 && input.caseId
  return {
    title: isToday ? HEARING_TODAY_TITLE : HEARING_TOMORROW_TITLE,
    body: isToday ? hearingTodayBody(input.count) : hearingTomorrowBody(input.count),
    data: {
      v: '1',
      kind,
      routeName: single ? 'case' : 'diary',
      caseId: single ? input.caseId : undefined,
      anchor: isToday ? 'today' : 'tomorrow',
      dedupeKey: `${kind}|${input.userId}|${input.ymd}`,
    },
  }
}

export function premiumPayload(input: {
  offset: 3 | 4
  endsYmd: string
  userId: string
}): { title: string; body: string; data: FcmDataPayload } {
  const kind = input.offset === 4 ? 'premium.d4' : 'premium.d3'
  return {
    title: PREMIUM_NEAR_TITLE,
    body: premiumNearBody(input.endsYmd),
    data: {
      v: '1',
      kind,
      routeName: 'premium',
      dedupeKey: `${kind}|${input.userId}|${input.endsYmd}`,
    },
  }
}

export const LEAD_INCOMING_TITLE = 'নতুন অ্যাপয়েন্টমেন্ট'

export function leadIncomingPayload(input: {
  userId: string
  appointmentId: string
}): { title: string; body: string; data: FcmDataPayload } {
  return {
    title: LEAD_INCOMING_TITLE,
    body: 'একজন ক্লায়েন্ট আপনার সঙ্গে যোগাযোগ করতে চেয়েছেন।',
    data: {
      v: '1',
      kind: 'lead.incoming',
      routeName: 'appointments',
      appointmentId: input.appointmentId,
      dedupeKey: `lead.incoming|${input.userId}|${input.appointmentId}`,
    },
  }
}
