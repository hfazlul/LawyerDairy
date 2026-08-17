import type { JurisdictionCode } from '../jurisdiction'
import { limitationPackFor } from './limitation'

/**
 * Jurisdiction content scaffold — not a full library.
 * Limitation Act 1963 (IN) / PK tables = structure only for now.
 * See `limitation.ts` for rule-row placeholders.
 */

export interface ResourceLink {
  title: string
  url: string
}

export interface JurisdictionContent {
  code: JurisdictionCode
  limitationLabel: string
  limitationActNote: string
  resourcePortal: ResourceLink
  practiceBookLinks: ResourceLink[]
  bareActSeed: ResourceLink[]
  /** Feature ids hidden unless jurisdiction matches */
  bdOnlyFeatureIds: string[]
}

export const JURISDICTION_CONTENT: Record<JurisdictionCode, JurisdictionContent> = {
  BD: {
    code: 'BD',
    limitationLabel: 'Limitation Act 1908',
    limitationActNote: 'Full calculator shipped for BD.',
    resourcePortal: {
      title: 'bdlaws.minlaw.gov.bd',
      url: 'https://bdlaws.minlaw.gov.bd',
    },
    practiceBookLinks: [
      {
        title: 'Junior / practice pack (stub)',
        url: 'https://lawyerdiarybd.com/practice', // TODO
      },
    ],
    bareActSeed: [
      { title: 'CPC 1908', url: 'https://bdlaws.minlaw.gov.bd/act-86.html' },
      { title: 'CrPC 1898', url: 'https://bdlaws.minlaw.gov.bd/act-75.html' },
      { title: 'Limitation Act 1908', url: 'https://bdlaws.minlaw.gov.bd/act-98.html' },
    ],
    bdOnlyFeatureIds: ['khotiyan', 'warish'],
  },
  IN: {
    code: 'IN',
    limitationLabel: 'Limitation Act 1963',
    limitationActNote:
      'Scaffold only — West Bengal / Tripura belt pack. Full tables TODO.',
    resourcePortal: {
      title: 'India Code',
      url: 'https://www.indiacode.nic.in/',
    },
    practiceBookLinks: [
      {
        title: 'Practice pack (IN stub)',
        url: 'https://lawyerdiarybd.com/practice-in', // TODO
      },
    ],
    bareActSeed: [
      { title: 'Limitation Act 1963 (placeholder)', url: 'https://www.indiacode.nic.in/' },
      { title: 'CPC 1908 (India Code)', url: 'https://www.indiacode.nic.in/' },
    ],
    bdOnlyFeatureIds: [],
  },
  PK: {
    code: 'PK',
    limitationLabel: 'Limitation Act (PK)',
    limitationActNote: 'Scaffold only — PK limitation tables TODO.',
    resourcePortal: {
      title: 'Pakistan Code (placeholder)',
      url: 'https://pakistancode.gov.pk/',
    },
    practiceBookLinks: [
      {
        title: 'Practice pack (PK stub)',
        url: 'https://lawyerdiarybd.com/practice-pk', // TODO
      },
    ],
    bareActSeed: [
      { title: 'PK laws portal (placeholder)', url: 'https://pakistancode.gov.pk/' },
    ],
    bdOnlyFeatureIds: [],
  },
}

export function contentFor(code: JurisdictionCode): JurisdictionContent {
  return JURISDICTION_CONTENT[code]
}

/** Convenience: limitation pack (BD full / IN+PK scaffold). */
export function limitationContent(code: JurisdictionCode) {
  return limitationPackFor(code)
}
