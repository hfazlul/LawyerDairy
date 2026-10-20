/** Eligibility for a Find Lawyer star rating. Never invent scores. */

export type ReviewDecision =
  | { ok: true }
  | { ok: false; error: 'already_reviewed' | 'self' | 'no_contact' | 'stars' | 'not_owner' }

export function canSubmitLawyerReview(args: {
  requesterUserId: string
  lawyerUserId: string
  phoneRevealedAt: Date | null
  existingReview: boolean
  stars: number
  requestBelongsToUser: boolean
}): ReviewDecision {
  if (!args.requestBelongsToUser) return { ok: false, error: 'not_owner' }
  if (args.existingReview) return { ok: false, error: 'already_reviewed' }
  if (args.requesterUserId === args.lawyerUserId) return { ok: false, error: 'self' }
  if (!args.phoneRevealedAt) return { ok: false, error: 'no_contact' }
  if (!Number.isInteger(args.stars) || args.stars < 1 || args.stars > 5) {
    return { ok: false, error: 'stars' }
  }
  return { ok: true }
}

export function publicRatingPayload(avg: number | null | undefined, count: number) {
  if (count <= 0 || avg == null || !Number.isFinite(avg)) {
    return { ratingAvg: null as number | null, ratingCount: 0 }
  }
  return { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count }
}
