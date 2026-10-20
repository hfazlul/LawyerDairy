import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { uniqueCourtUid } from '@/lib/court-uid'
import { foldBangla } from '@/lib/bn-text'
import { loadCanonicalMaster } from '@/lib/master/pack-paths'

type JsonRec = Record<string, unknown>

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function strOrNull(v: unknown): string | null {
  return typeof v === 'string' && v.length ? v : null
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' ? v : fallback
}

function bool(v: unknown, fallback = true): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function arr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x)) : []
}

export function loadMasterJson(): JsonRec {
  return loadCanonicalMaster()
}

export async function ingestMasterData() {
  const data = loadMasterJson()
  const packVersion = str((data.metadata as JsonRec | undefined)?.dataset_version, '1.2.0')
  const collections = data as Record<string, unknown>

  const courtLevels = (collections.court_levels as JsonRec[]) ?? []
  for (const row of courtLevels) {
    await prisma.courtLevel.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        description: strOrNull(row.description),
        active: bool(row.active),
        sortOrder: num(row.sort_order),
        verificationStatus: strOrNull(row.verification_status),
        sourceIds: arr(row.source_ids),
        packVersion,
      },
      update: {
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        description: strOrNull(row.description),
        active: bool(row.active),
        sortOrder: num(row.sort_order),
        packVersion,
      },
    })
  }

  const divisions = (collections.divisions as JsonRec[]) ?? []
  for (const row of divisions) {
    await prisma.division.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        officialName: strOrNull(row.official_name),
        active: bool(row.active),
        sortOrder: num(row.sort_order),
        sourceIds: arr(row.source_ids),
        packVersion,
      },
      update: {
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        packVersion,
      },
    })
  }

  const districts = (collections.districts as JsonRec[]) ?? []
  for (const row of districts) {
    await prisma.district.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        divisionId: str(row.division_id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        officialName: strOrNull(row.official_name),
        districtType: strOrNull(row.district_type),
        notes: strOrNull(row.notes),
        active: bool(row.active),
        sourceIds: arr(row.source_ids),
        packVersion,
      },
      update: {
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        packVersion,
      },
    })
  }

  const metros = (collections.metropolitan_areas as JsonRec[]) ?? []
  for (const row of metros) {
    await prisma.metropolitanArea.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        districtId: str(row.district_id),
        divisionId: str(row.division_id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        legalBasis: strOrNull(row.legal_basis),
        civilJurisdictionNote: strOrNull(row.civil_jurisdiction_note),
        officialUrl: strOrNull(row.official_url),
        active: bool(row.active),
        verificationStatus: strOrNull(row.verification_status),
        sourceIds: arr(row.source_ids),
        packVersion,
      },
      update: {
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        civilJurisdictionNote: strOrNull(row.civil_jurisdiction_note),
        packVersion,
      },
    })
  }

  const courtTypes = (collections.court_types as JsonRec[]) ?? []
  for (const row of courtTypes) {
    const levelId = str(row.court_level_id)
    const showInMetro = levelId === 'metropolitan' || bool(row.also_applicable_metropolitan, false)
    await prisma.courtType.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        courtLevelId: levelId,
        category: strOrNull(row.category),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        description: strOrNull(row.description),
        applicableLocation: strOrNull(row.applicable_location),
        alsoApplicableMetropolitan: bool(row.also_applicable_metropolitan, false),
        showInMetro,
        active: bool(row.active),
        verificationStatus: strOrNull(row.verification_status),
        sourceIds: arr(row.source_ids),
        packVersion,
      },
      update: {
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        showInMetro,
        verificationStatus: strOrNull(row.verification_status),
        packVersion,
      },
    })
  }

  const courts = (collections.courts as JsonRec[]) ?? []
  const seenUid = new Set<string>()
  for (const row of courts) {
    const uid = uniqueCourtUid(
      {
        court_type_id: str(row.court_type_id),
        metropolitan_id: strOrNull(row.metropolitan_id),
        district_id: strOrNull(row.district_id),
        division_id: strOrNull(row.division_id),
        official_name: strOrNull(row.official_name),
        court_name_en: strOrNull(row.court_name_en),
      },
      seenUid,
    )
    if (!uid) continue
    seenUid.add(uid)
    await prisma.court.upsert({
      where: { id: uid },
      create: {
        id: uid,
        sourceRowId: str(row.court_id),
        courtTypeId: str(row.court_type_id),
        courtLevelId: str(row.court_level_id),
        divisionId: strOrNull(row.division_id),
        districtId: strOrNull(row.district_id),
        metropolitanId: strOrNull(row.metropolitan_id),
        isMetroSeated: Boolean(row.metropolitan_id),
        nameBn: str(row.court_name_bn),
        nameEn: str(row.court_name_en),
        officialName: strOrNull(row.official_name),
        courtCode: strOrNull(row.court_code),
        courtCategory: strOrNull(row.court_category),
        sourceUrl: strOrNull(row.source_url),
        sourceName: strOrNull(row.source_name),
        active: bool(row.active),
        verificationStatus: strOrNull(row.verification_status),
        lastVerified: strOrNull(row.last_verified),
        packVersion,
      },
      update: {
        sourceRowId: str(row.court_id),
        nameBn: str(row.court_name_bn),
        nameEn: str(row.court_name_en),
        officialName: strOrNull(row.official_name),
        verificationStatus: strOrNull(row.verification_status),
        packVersion,
      },
    })
  }

  const acts = (collections.acts as JsonRec[]) ?? (collections.acts_laws as JsonRec[]) ?? []
  for (const row of acts) {
    const id = str(row.act_id || row.id)
    await prisma.act.upsert({
      where: { id },
      create: {
        id,
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en || row.name),
        shortName: strOrNull(row.short_name),
        actNumberYear: strOrNull(row.act_number_year),
        subjectCategory: strOrNull(row.subject_category),
        status: strOrNull(row.status),
        sourceUrl: strOrNull(row.source_url),
        officialSource: strOrNull(row.official_source),
        notes: strOrNull(row.notes),
        verificationStatus: strOrNull(row.verification_status),
        sourceIds: arr(row.source_ids),
        packVersion,
        effectiveDate: strOrNull(row.effective_date) ??
          strOrNull(row.commencement_date) ??
          strOrNull(row.date_of_commencement),
      },
      update: {
        nameEn: str(row.name_en || row.name),
        shortName: strOrNull(row.short_name),
        packVersion,
        effectiveDate: strOrNull(row.effective_date) ??
          strOrNull(row.commencement_date) ??
          strOrNull(row.date_of_commencement),
      },
    })
  }

  const caseTypes = (collections.case_types as JsonRec[]) ?? []
  for (const row of caseTypes) {
    await prisma.caseType.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        parentCaseTypeId: null,
        isCategory: bool(row.is_category, false),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        shortName: strOrNull(row.short_name),
        description: strOrNull(row.description),
        confidence: strOrNull(row.confidence),
        active: bool(row.active),
        sortOrder: num(row.sort_order),
        packVersion,
      },
      update: {
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        shortName: strOrNull(row.short_name),
        packVersion,
      },
    })
  }
  for (const row of caseTypes) {
    const parent = strOrNull(row.parent_case_type_id)
    if (parent) {
      await prisma.caseType.update({
        where: { id: str(row.id) },
        data: { parentCaseTypeId: parent },
      }).catch(() => undefined)
    }
    await prisma.caseTypeCourtType.deleteMany({ where: { caseTypeId: str(row.id) } })
    for (const ct of arr(row.applicable_court_types)) {
      await prisma.caseTypeCourtType.create({
        data: { caseTypeId: str(row.id), courtTypeId: ct },
      }).catch(() => undefined)
    }
    await prisma.caseTypeCourtLevel.deleteMany({ where: { caseTypeId: str(row.id) } })
    for (const lv of arr(row.applicable_court_level || row.applicable_court_levels)) {
      await prisma.caseTypeCourtLevel.create({
        data: { caseTypeId: str(row.id), courtLevelId: lv },
      }).catch(() => undefined)
    }
    await prisma.caseTypeAct.deleteMany({ where: { caseTypeId: str(row.id) } })
    for (const actId of arr(row.applicable_acts)) {
      await prisma.caseTypeAct.create({
        data: { caseTypeId: str(row.id), actId },
      }).catch(() => undefined)
    }
  }

  const sections = (collections.sections as JsonRec[]) ?? []
  for (const row of sections) {
    const id = str(row.id || row.section_id)
    await prisma.section.upsert({
      where: { id },
      create: {
        id,
        actId: str(row.act_id),
        sectionNumber: str(row.section_number),
        titleBn: strOrNull(row.title_bn),
        titleEn: strOrNull(row.title_en),
        descriptionShort: strOrNull(row.description_short),
        keywordsBn: Array.isArray(row.keywords_bn) ? (row.keywords_bn as string[]).join(',') : strOrNull(row.keywords_bn),
        keywordsEn: Array.isArray(row.keywords_en) ? (row.keywords_en as string[]).join(',') : strOrNull(row.keywords_en),
        commonlyUsed: bool(row.commonly_used, false),
        packVersion,
      },
      update: {
        titleBn: strOrNull(row.title_bn),
        titleEn: strOrNull(row.title_en),
        packVersion,
      },
    })
  }

  const popular = (collections.popular_legal_sections as JsonRec[]) ?? []
  for (const row of popular) {
    const id = str(row.id)
    await prisma.popularSection.upsert({
      where: { id },
      create: {
        id,
        actId: str(row.act_id),
        sectionId: str(row.section_id),
        popularityRank: num(row.popularity_rank),
        category: strOrNull(row.category),
        reasonForPriority: strOrNull(row.reason_for_priority),
        sourceType: strOrNull(row.source_type),
        packVersion,
      },
      update: { popularityRank: num(row.popularity_rank), packVersion },
    })
  }

  const roles = (collections.party_roles as JsonRec[]) ?? []
  for (const row of roles) {
    await prisma.partyRole.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        category: strOrNull(row.category),
        isOpposingRoleOf: strOrNull(row.is_opposing_role_of),
        notes: strOrNull(row.notes),
        active: bool(row.active),
        sortOrder: num(row.sort_order),
        packVersion,
      },
      update: { nameBn: str(row.name_bn), nameEn: str(row.name_en), packVersion },
    })
  }

  const sides = (collections.representation_sides as JsonRec[]) ?? []
  for (const row of sides) {
    await prisma.representationSide.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        isDefault: bool(row.is_default, false),
        sortOrder: num(row.sort_order),
      },
      update: { nameBn: str(row.name_bn), nameEn: str(row.name_en) },
    })
  }

  const entities = (collections.party_entity_types as JsonRec[]) ?? []
  for (const row of entities) {
    await prisma.partyEntityType.upsert({
      where: { id: str(row.id) },
      create: {
        id: str(row.id),
        nameBn: str(row.name_bn),
        nameEn: str(row.name_en),
        sortOrder: num(row.sort_order),
      },
      update: { nameBn: str(row.name_bn), nameEn: str(row.name_en) },
    })
  }

  const sources = (collections.sources as JsonRec[]) ?? []
  for (const row of sources) {
    const id = str(row.source_id || row.id)
    if (!id) continue
    await prisma.dataSource.upsert({
      where: { id },
      create: {
        id,
        name: str(row.name || row.title),
        url: strOrNull(row.url),
        sourceType: strOrNull(row.source_type),
        retrievedAt: strOrNull(row.retrieved_at),
        confidence: strOrNull(row.confidence),
        notes: strOrNull(row.notes),
        packVersion,
      },
      update: { name: str(row.name || row.title), packVersion },
    })
  }

  const aliases = (collections.search_metadata as JsonRec[]) ?? []
  await prisma.searchAlias.deleteMany({ where: { packVersion } })
  for (const row of aliases) {
    const term = str(row.term || row.query || row.id)
    const aliasList = arr(row.aliases || row.alias)
    if (!term) continue
    for (const alias of aliasList.length ? aliasList : [str(row.alias)]) {
      if (!alias) continue
      await prisma.searchAlias.create({
        data: {
          term: foldBangla(term),
          alias: foldBangla(alias),
          entityType: strOrNull(row.entity_type),
          packVersion,
        },
      }).catch(() => undefined)
    }
  }

  const counts = {
    court_levels: courtLevels.length,
    divisions: divisions.length,
    districts: districts.length,
    metropolitan_areas: metros.length,
    court_types: courtTypes.length,
    courts: seenUid.size,
    case_types: caseTypes.length,
    acts: acts.length,
    sections: sections.length,
    party_roles: roles.length,
    sources: sources.length,
  }

  const checksum = createHash('sha256').update(JSON.stringify(counts)).digest('hex')
  await prisma.masterDataVersion.updateMany({ data: { isCurrent: false } })
  await prisma.masterDataVersion.upsert({
    where: { datasetVersion: packVersion },
    create: {
      datasetVersion: packVersion,
      schemaVersion: str((data.metadata as JsonRec)?.schema_version, '1.0'),
      generatedAt: new Date(str((data.metadata as JsonRec)?.generated_at, '2026-08-23')),
      publishedAt: new Date(),
      recordCounts: counts,
      checksum,
      changelog: (data.metadata as JsonRec)?.changelog ?? [],
      isCurrent: true,
    },
    update: {
      recordCounts: counts,
      checksum,
      isCurrent: true,
      publishedAt: new Date(),
    },
  })

  return counts
}
