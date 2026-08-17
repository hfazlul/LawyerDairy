import 'jurisdiction.dart';

class ResourceLink {
  final String title;
  final String url;
  const ResourceLink(this.title, this.url);
}

class JurisdictionContent {
  final JurisdictionCode code;
  final String limitationLabel;
  final String limitationActNote;
  final ResourceLink resourcePortal;
  final List<ResourceLink> practiceBookLinks;
  final List<ResourceLink> bareActSeed;
  final List<String> bdOnlyFeatureIds;

  const JurisdictionContent({
    required this.code,
    required this.limitationLabel,
    required this.limitationActNote,
    required this.resourcePortal,
    required this.practiceBookLinks,
    required this.bareActSeed,
    required this.bdOnlyFeatureIds,
  });
}

const Map<JurisdictionCode, JurisdictionContent> kJurisdictionContent = {
  JurisdictionCode.bd: JurisdictionContent(
    code: JurisdictionCode.bd,
    limitationLabel: 'Limitation Act 1908',
    limitationActNote: 'Full calculator shipped for BD.',
    resourcePortal: ResourceLink('bdlaws.minlaw.gov.bd', 'https://bdlaws.minlaw.gov.bd'),
    practiceBookLinks: [
      ResourceLink('Junior / practice pack (stub)', 'https://lawyerdiarybd.com/practice'),
    ],
    bareActSeed: [
      ResourceLink('CPC 1908', 'https://bdlaws.minlaw.gov.bd/act-86.html'),
      ResourceLink('CrPC 1898', 'https://bdlaws.minlaw.gov.bd/act-75.html'),
      ResourceLink('Limitation Act 1908', 'https://bdlaws.minlaw.gov.bd/act-98.html'),
    ],
    bdOnlyFeatureIds: ['khotiyan', 'warish'],
  ),
  JurisdictionCode.in_: JurisdictionContent(
    code: JurisdictionCode.in_,
    limitationLabel: 'Limitation Act 1963',
    limitationActNote: 'Scaffold only — WB/Tripura pack. Full tables TODO.',
    resourcePortal: ResourceLink('India Code', 'https://www.indiacode.nic.in/'),
    practiceBookLinks: [
      ResourceLink('Practice pack (IN stub)', 'https://lawyerdiarybd.com/practice-in'),
    ],
    bareActSeed: [
      ResourceLink('Limitation Act 1963 (placeholder)', 'https://www.indiacode.nic.in/'),
      ResourceLink('CPC 1908 (India Code)', 'https://www.indiacode.nic.in/'),
    ],
    bdOnlyFeatureIds: [],
  ),
  JurisdictionCode.pk: JurisdictionContent(
    code: JurisdictionCode.pk,
    limitationLabel: 'Limitation Act (PK)',
    limitationActNote: 'Scaffold only — PK limitation tables TODO.',
    resourcePortal: ResourceLink('Pakistan Code (placeholder)', 'https://pakistancode.gov.pk/'),
    practiceBookLinks: [
      ResourceLink('Practice pack (PK stub)', 'https://lawyerdiarybd.com/practice-pk'),
    ],
    bareActSeed: [
      ResourceLink('PK laws portal (placeholder)', 'https://pakistancode.gov.pk/'),
    ],
    bdOnlyFeatureIds: [],
  ),
};

JurisdictionContent contentFor(JurisdictionCode code) =>
    kJurisdictionContent[code]!;
