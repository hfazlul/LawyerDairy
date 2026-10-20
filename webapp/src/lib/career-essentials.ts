/** IDs that ship in the APK (20%). Must stay aligned with mobile CareerEssentials. */
export const BAR_ESSENTIAL_IDS = [
  'BC-SECTION-START-HERE-001',
  'BC-START-001', 'BC-START-002', 'BC-START-003', 'BC-START-004',
  'BC-START-005', 'BC-START-006', 'BC-START-007', 'BC-START-008',
  'BC-CPC-RESJUDICATA-001', 'LREF-CPC-S10', 'LREF-CPC-S11',
  'BC-MCQ-CPC-RESJUD-001', 'BC-MCQ-CPC-RESJUD-002', 'BC-MCQ-CPC-RESJUD-003',
  'BC-MCQ-CPC-RESJUD-004', 'BC-MCQ-CPC-RESJUD-005', 'BC-MCQ-CPC-RESJUD-006',
  'BC-WQ-CPC-RESJUD-001', 'BC-VIVA-CPC-RESJUD-001', 'BC-TEST-CPC-CH-RESJUD-001',
  'BC-CRPC-BAIL-001', 'LREF-CRPC-S496', 'LREF-CRPC-S497', 'LREF-CRPC-S498',
  'BC-MCQ-CRPC-BAIL-001', 'BC-MCQ-CRPC-BAIL-002', 'BC-MCQ-CRPC-BAIL-003',
  'BC-MCQ-CRPC-BAIL-004', 'BC-MCQ-CRPC-BAIL-005', 'BC-MCQ-CRPC-BAIL-006',
  'BC-WQ-CRPC-BAIL-001', 'BC-VIVA-CRPC-BAIL-001', 'BC-TEST-CRPC-CH-BAIL-001',
  'BC-ETH-BARCOUNCIL-001', 'LREF-ORDER1972-ART6', 'LREF-ORDER1972-ART6A-COMPOSITION',
  'BC-MCQ-ETH-BC-001', 'BC-MCQ-ETH-BC-002', 'BC-MCQ-ETH-BC-003', 'BC-MCQ-ETH-BC-004',
]

export const HC_ESSENTIAL_IDS = [
  'LSN-START-001', 'LSN-ELIG-HCD-001', 'LSN-ELIG-HCD-002', 'LSN-SYLL-001',
  'LSN-PROFKNOW-CONST-001', 'LSN-PROFKNOW-CPC-001', 'LSN-PROFKNOW-CRPC-001',
  'LSN-PROFKNOW-EVIDENCE-001', 'LSN-PROFKNOW-PENAL-001', 'LSN-HCPRAC-001',
  'LSN-WRITPREP-001', 'LSN-VIVA-001',
  'DRAFT-001', 'DRAFT-002', 'DRAFT-003', 'DRAFT-004', 'DRAFT-005',
  'CASE-8THAMEND-001',
  'HC-DRAFT-SYL-2026', 'HC-DRAFT-CIVIL-APPEAL', 'HC-DRAFT-CIVIL-REV115',
  'HC-DRAFT-CRIM-APPEAL', 'HC-DRAFT-561A', 'HC-DRAFT-491',
  'HC-DRAFT-WRIT-MANDAMUS', 'HC-DRAFT-WRIT-CERTIORARI', 'HC-DRAFT-WRIT-HABEAS',
  'HC-DRAFT-WRIT-PROHIBITION', 'HC-DRAFT-WRIT-QUOWARRANTO',
  'HC-WQ-DRAFT-CIVIL-APPEAL', 'HC-WQ-DRAFT-115', 'HC-WQ-DRAFT-561A', 'HC-WQ-DRAFT-WRIT',
]

export function isEssentialItem(packId: string, itemId: string): boolean {
  if (packId.includes('bjs')) {
    return (
      itemId.startsWith('BJS-START-') ||
      itemId.startsWith('BJS-LINK-') ||
      itemId.startsWith('BJS-MINOR-') ||
      itemId.startsWith('BJS-MCQ-BN-') ||
      itemId.startsWith('BJS-MCQ-EN-') ||
      itemId.startsWith('BJS-MCQ-MATH-') ||
      itemId.startsWith('BJS-MCQ-GK-') ||
      itemId.startsWith('BJS-WQ-PRACTICE-') ||
      itemId.startsWith('BJS-VIVA-') ||
      itemId === 'BJS-PREV-HONEST'
    )
  }
  if (packId.includes('high')) {
    return HC_ESSENTIAL_IDS.includes(itemId) || itemId.startsWith('HC-DRAFT-') || itemId.startsWith('HC-WQ-DRAFT-') || itemId.startsWith('HC-WQ-US-') || itemId.startsWith('HC-WQ-WEB-')
  }
  return BAR_ESSENTIAL_IDS.includes(itemId) || itemId.startsWith('BC-MCQ-US-2017-') || itemId.startsWith('BC-PRAC-')
}
