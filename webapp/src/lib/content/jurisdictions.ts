import type { JurisdictionCode } from '../jurisdiction'
import { limitationPackFor } from './limitation'

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
    practiceBookLinks: [],
    bareActSeed: [
      { title: 'CPC 1908', url: 'https://bdlaws.minlaw.gov.bd/act-86.html' },
      { title: 'CrPC 1898', url: 'https://bdlaws.minlaw.gov.bd/act-75.html' },
      { title: 'Limitation Act 1908', url: 'https://bdlaws.minlaw.gov.bd/act-98.html' },
    ],
    bdOnlyFeatureIds: ['khotiyan', 'warish'],
  },
}

export function contentFor(_code: JurisdictionCode): JurisdictionContent {
  return JURISDICTION_CONTENT['BD']
}

/** Limitation pack for BD. */
export function limitationContent(_code: JurisdictionCode) {
  return limitationPackFor('BD')
}
