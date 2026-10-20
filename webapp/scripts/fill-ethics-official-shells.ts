/**
 * Fill remaining ethics shells from official bdlaws HTML only.
 * T-ETH-02: Constitution Art.102 (public interest + advocate) + Legal Aid Act 2000
 * (panel advocates). Canons body is not quoted — barcouncil.gov.bd Canons page
 * was Cloudflare-blocked; do not invent Canons text; no coaching scrape; no MCQ.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..', '..')
const FETCHED = '2026-09-14'

const evid = `126. No [Advocate] shall at any time be permitted, unless with his client's express consent, to disclose any communication made to him in the course and for the purpose of his employment as such Advocate by or on behalf of his client, or to state the contents or condition of any document with which he has become acquainted in the course and for the purpose of his professional employment, or to disclose any advice given by him to his client in the course and for the purpose of such employment:

Provided that nothing in this section shall protect from disclosure–

(1) any such communication made in furtherance of any illegal purpose:

(2) any fact observed by any [Advocate], in the course of his employment as such, showing that any crime of fraud has been committed since the commencement of his employment.

It is immaterial whether the attention of such [Advocate] was or was not directed to such fact by or on behalf of his client.

Explanation.– The obligation stated in this section continues after the employment has ceased.

127. The provisions of section 126 shall apply to interpreters and the clerks or servants of [Advocate].

128. If any party to a suit gives evidence therein at his own instance or otherwise, he shall not be deemed to have consented thereby to such disclosure as is mentioned in section 126; and, if any party to a suit or proceeding calls any such [Advocate] as a witness, he shall be deemed to have consented to such disclosure only if he questions such [Advocate] on matters which, but for such question, he would not be at liberty to disclose.

129. No one shall be compelled to disclose to the Court any confidential communication which has taken place between him and his legal professional adviser, unless he offers himself as a witness, in which case he may be compelled to disclose any such communications as may appear to the Court necessary to be known in order to explain any evidence which he has given, but no others.`

const canons = `10. Subject to the provisions of this Order and the rules made thereunder the functions of the Bar Council shall be-
(c) to lay down standard of professional conduct and etiquette for advocates;
(d) to entertain and determine cases of misconduct against advocates on its roll and to order punishment in such cases;

44. On the commencement of this Order,-
(g) the Canons of Professional Conduct and Etiquette framed by the Pakistan Bar Council shall be deemed to be the Canons framed by the Bar Council and in those Canons for the word “Pakistan”, wherever occurring, the word “Bangladesh” shall be substituted.`

const art111 =
  '111. The law declared by the Appellate Division shall be binding on the High Court Division and the law declared by either division of the Supreme Court shall be binding on all courts subordinate to it.'

const art102 =
  `102. (1) The High Court Division on the application of any person aggrieved, may give such directions or orders to any person or authority, including any person performing any function in connection with the affairs of the Republic, as may be appropriate for the enforcement of any of the fundamental rights conferred by Part III of this Constitution.

(4) Whereon an application made under clause (1) or sub-clause (a) of clause (2), an interim order is prayed for and such interim order is likely to have the effect of-

(a) prejudicing or interfering with any measure designed to implement any development programme, or any development work ; or

(b) being otherwise harmful to the public interest, the High Court Division shall not make an interim order unless the Attorney-General has heen given reasonable notice of the application and he (or an advocate authorised by him in that behalf) has been given an opportunity of being heard, and the High Court Division is satisfied that the interim order would not have the effect referred to in sub-clause (a) or sub-caluse (b).`

const legalAid = `আইনগত সহায়তা প্রদান আইন, ২০০০ (২০০০ সনের ৬ নং আইন)

আর্থিকভাবে অসচ্ছল, সহায়-সম্বলহীন এবং নানাবিধ আর্থ-সামাজিক কারণে বিচার প্রাপ্তিতে অসমর্থ বিচারপ্রার্থী জনগণকে আইনগত সহায়তা এবং অধিকতর জনমুখী বিচার ব্যবস্থা প্রতিষ্ঠায় বিচারপ্রার্থী জনগণকে স্বল্প সময়ে কম খরচে বিকল্প বিরোধ নিষ্পত্তি সেবা প্রদানকল্পে প্রণীত আইন।

২। (ঝ) “প্যানেল আইনজীবী” অর্থ ধারা ১৫ এর অধীন তালিকাভুক্ত আইনজীবী;

৭। (১) অধিদপ্তরের দায়িত্ব ও কার্যাবলি হইবে নিম্নরূপ, যথা:-
(ক) অসচ্ছল, সহায়-সম্বলহীন এবং নানাবিধ আর্থ-সামাজিক কারণে বিচার প্রাপ্তিতে অসমর্থ বিচারপ্রার্থী জনগণকে সরকারি খরচে আইনগত সহায়তা প্রদান ও সময় সময় আইনগত সহায়তা প্রার্থীর যোগ্যতা নির্ধারণ;
(থ) আইনের অধীন দায়িত্বপ্রাপ্ত চীফ লিগ্যাল এইড অফিসার, লিগ্যাল এইড অফিসার, প্যানেল আইনজীবী এবং স্পেশাল মেডিয়েটরগণের কার্যাবলি তত্ত্বাবধান;

১৫। (১) সুপ্রীমকোর্ট কমিটি এই আইনের আওতায় প্রদত্ত আইনগত সহায়তার অধীনে বাংলাদেশ সুপ্রীমকোর্টে দায়েরযোগ্য বা দায়েরকৃত মামলার পরামর্শ প্রদান ও মামলা পরিচালনার জন্য সুপ্রীমকোর্টের মামলা পরিচালনায় অন্যুন ৫ (পাঁচ) বত্সরের অভিজ্ঞতাসম্পন্ন আইনজীবীগণের মধ্য হইতে একটি তালিকা প্রণয়ন করিবে।

(৪) কোন বিচারপ্রার্থীর আবেদন বা দরখাস্ত বিবেচনাক্রমে যদি কোন ক্ষেত্রে, আইনগত সহায়তা প্রদানের সিদ্ধান্ত গৃহীত হয়, তাহা হইলে সুপ্রীম কোর্ট কমিটি বা, ক্ষেত্রমত, জেলা কমিটি, মহানগর কমিটি বা বিশেষ কমিটি কর্তৃক অনুমোদিত তালিকা হইতে সংশ্লিষ্ট চীফ লিগ্যাল এইড অফিসার বা, ক্ষেত্রমত, লিগ্যাল এইড অফিসার কোনো আইনজীবীকে এতদুদ্দেশ্যে নিযুক্ত করিবে:
তবে শর্ত থাকে যে, এইরূপ নিযুক্তির ক্ষেত্রে বিচারপ্রার্থীর পছন্দ, যতদূর সম্ভব, বিবেচনা করা হইবে।`

const publicInterest = `${art102}

---

${legalAid}`

type Topic = {
  topicId: string
  titleEn: string
  titleBn: string
  section: string
  url: string
  cited: string
  note: string
  quoted: string
}

const topics: Topic[] = [
  {
    topicId: 'T-ETH-02',
    titleEn: 'Lawyers and public interest',
    titleBn: 'আইনজীবী ও জনস্বার্থ',
    section: 'Constitution Art.102; Legal Aid Act 2000',
    url: 'https://bdlaws.minlaw.gov.bd/act-367/section-24659.html',
    cited: 'Constitution Art.102(4); Legal Aid Act 2000 ss.2, 7, 15',
    note: 'Official numbered text nearest to the syllabus heading “lawyers and public interest”. Constitution Art.102(4) uses “public interest” and “advocate authorised by” the Attorney-General (bdlaws English HTML, retrieved 2026-09-14, including the site’s own spellings). Legal Aid Act 2000 Bangla HTML (act-print-834) defines panel advocates and legal aid to insolvent litigants. This is not Bar Council Canons commentary. The Canons body is not in bdlaws; https://www.barcouncil.gov.bd/canons-of-professional-conduct-and-etiquette/ was Cloudflare-blocked this pass and was not quoted. No invented Canons, no MCQ.',
    quoted: publicInterest,
  },
  {
    topicId: 'T-ETH-03',
    titleEn: 'Confidentiality, transparency and accountability of a lawyer',
    titleBn: 'একজন আইনজীবীর গোপনীয়তা, স্বচ্ছতা ও জবাবদিহিতা',
    section: 'N/A',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-24.html',
    cited: 'Evidence Act ss.126–129',
    note: 'Official Evidence Act professional communications (ss.126–129). This is the nearest numbered official text on advocate-client confidentiality. It is not Bar Council Canons commentary on transparency/accountability, which is not in this HTML.',
    quoted: evid,
  },
  {
    topicId: 'T-ETH-05',
    titleEn: 'Canons of Professional Conduct and Etiquette',
    titleBn: 'পেশাগত আচরণবিধি ও শিষ্টাচারের নীতিমালা',
    section: 'Canons of Professional Conduct and Etiquette',
    url: 'https://bdlaws.minlaw.gov.bd/act-print-387.html',
    cited: 'Bar Council Order Art.10(c) and Art.44(g)',
    note: 'Official Order, 1972: Bar Council may lay down standards of professional conduct (Art.10(c)); Art.44(g) deems the Canons framed by the Pakistan Bar Council to be the Canons of the Bangladesh Bar Council (substituting “Bangladesh” for “Pakistan”). The Canons body itself is not in this bdlaws HTML. Not invented commentary.',
    quoted: canons,
  },
  {
    topicId: 'T-ETH-10',
    titleEn: 'Legal decisions and law reports',
    titleBn: 'আইনি সিদ্ধান্ত ও ল রিপোর্ট',
    section: 'N/A',
    url: 'https://bdlaws.minlaw.gov.bd/act-details-367.html',
    cited: 'Constitution Art.111',
    note: 'Official Constitution Art.111 on the binding nature of Supreme Court decisions. Law-report banks / DLR tables are not in this HTML and were not invented.',
    quoted: art111,
  },
]

function firstSentences(text: string, n = 2): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20)
    .slice(0, n)
}

function makeLesson(t: Topic) {
  const en = {
    title: t.titleEn,
    short_description: `Official extract for ${t.section} (${t.titleEn}). Retrieved ${FETCHED}. Not lawyer-verified.`,
    learning_objective: `Read the official wording cited as ${t.cited} and map it to "${t.titleEn}". This card quotes official text; it is not commentary and is not verified.`,
    explanation: `${t.note}\n\nOfficial English from ${t.url} (retrieved ${FETCHED}). Not lawyer-verified. Not a substitute for the full instrument.\n\nSyllabus: ${t.titleEn} (${t.section}).\n\n${t.quoted}`,
    key_concepts: [t.section, t.titleEn, t.cited, 'bdlaws.minlaw.gov.bd'],
    important_rules: firstSentences(t.quoted, 4),
    examples: [] as string[],
    exam_focus: `Before practice, open ${t.url} and read ${t.cited}. No invented MCQ keys here.`,
    common_traps: [
      'Treating this official extract as a verified commentary lesson.',
      'Assuming omitted rules, schedules, or Bangla authentic text are fully in this HTML extract.',
    ],
    key_takeaways: [`Official page: ${t.url}`, `Quoted: ${t.cited}`],
  }
  const bn = {
    title: t.titleBn,
    short_description: `অফিসিয়াল উদ্ধৃতি — ${t.section} (${t.titleBn})। সংগ্রহ ${FETCHED}। আইনজীবী যাচাই হয়নি।`,
    learning_objective: `অফিসিয়াল পাঠ ${t.cited} পড়ে সিলেবাস "${t.titleBn}"-এর সাথে মিলান। ভাষ্য নয়; যাচাইকৃত নয়।`,
    explanation: `${t.note}\n\nঅফিসিয়াল ইংরেজি পাঠ ${t.url} (সংগ্রহ ${FETCHED})। বাংলা পূর্ণ পাঠ একই অফিসিয়াল সূত্রে। এখানে বাংলা অনুবাদ উদ্ভাবন করা হয়নি।\n\nসিলেবাস: ${t.titleBn} (${t.section})।\n\n${t.quoted}`,
    key_concepts: [t.section, t.titleBn, t.cited, 'bdlaws.minlaw.gov.bd'],
    important_rules: firstSentences(t.quoted, 4),
    examples: [] as string[],
    exam_focus: `পরীক্ষার আগে ${t.url} খুলে ${t.cited} নোট করুন। নকল MCQ/উত্তর এখানে নেই।`,
    common_traps: [
      'এই অফিসিয়াল উদ্ধৃতিকে verified ভাষ্য ভাবা।',
      'বাদ পড়া বিধি/তফসিল এই HTML উদ্ধৃতিতে আছে বলে ধরে নেওয়া।',
    ],
    key_takeaways: [`অফিসিয়াল পাতা: ${t.url}`, `উদ্ধৃত: ${t.cited}`],
  }
  return {
    content_id: `BC-OFFICIAL-${t.topicId}`,
    asset_type: 'LESSON',
    lesson_id: `BC-OFFICIAL-${t.topicId}`,
    topic_id: t.topicId,
    module_id: 'BC-MOD-ETHICS',
    status: 'PENDING_REVIEW',
    verification_status: 'OFFICIAL_FETCHED_PENDING_LAWYER',
    verification_note: `Official extract retrieved ${FETCHED}. Bangla statute text was not invented. No MCQ. Lawyer review still required.`,
    is_shell: false,
    official_url: t.url,
    section_or_order: t.section,
    official_fetched_at: FETCHED,
    cited_interactive: true,
    language_versions: { en, bn },
  }
}

const assets = topics.map(makeLesson)
const batch = {
  batch_id: 'BATCH-2026-09-040-OFFICIAL-ETH',
  schema_version: '1.0',
  content_version: '2026.09.14',
  created_at: `${FETCHED}T18:00:00Z`,
  source: 'bdlaws.minlaw.gov.bd-official-html',
  operation: 'CREATE',
  status: 'PENDING_REVIEW',
  batch_purpose:
    'Official extracts for remaining ethics shells (Constitution Art.102 + Legal Aid Act 2000; Evidence ss.126–129; Order Art.10(c)/44(g); Constitution Art.111). Canons body not quoted. No invented MCQ. Not lawyer-verified.',
  asset_count: assets.length,
  assets,
}
const json = `${JSON.stringify(batch, null, 2)}\n`
writeFileSync(join(repoRoot, 'mobile', 'assets', 'career', 'bar_batch_040.json'), json)
writeFileSync(
  join(repoRoot, 'Barcouncil assets', 'batches', 'batch-2026-09-040-official-eth.json'),
  json,
)

const shellsPath = join(repoRoot, 'mobile', 'assets', 'career', 'bar_topic_shells.json')
const shells = JSON.parse(readFileSync(shellsPath, 'utf8')) as {
  assets: { topic_id?: string }[]
  asset_count?: number
  batch_purpose?: string
}
const converted = new Set(topics.map((t) => t.topicId))
shells.assets = (shells.assets || []).filter((a) => !converted.has(String(a.topic_id || '')))
shells.asset_count = shells.assets.length
shells.batch_purpose =
  'No remaining cited syllabus shells. T-ETH-02 filled from official bdlaws HTML (Constitution Art.102; Legal Aid Act 2000). Canons body not quoted. No invented MCQ.'
writeFileSync(shellsPath, `${JSON.stringify(shells, null, 2)}\n`)

const coveragePath = join(repoRoot, 'docs', 'plan', 'mobile-v3', '_career_coverage_2026-09-14.json')
const coverage = {
  date: FETCHED,
  syllabusTopics: 134,
  uniqueDoctrinalLessons: 134,
  citedInteractiveShellsEnriched: shells.assets.length,
  remainingCitedShells: shells.assets.length,
  remainingTopicIds: shells.assets.map((a) => a.topic_id),
  officialPastPapers: 0,
  officialExtractBatches: [{ n: '040', module: 'ETH', count: 4 }],
  skippedUnconverted: [],
  note: 'Unique bodies = flagship doctrinal + official bdlaws/constitution extracts (OFFICIAL_FETCHED_PENDING_LAWYER). T-ETH-02 quotes Constitution Art.102(4) + Legal Aid Act 2000 panel-advocate provisions. Canons body not in bdlaws and was not invented. Art.44(g) adoption quoted on T-ETH-05. No scraped banks, no invented law. Official past papers 0 (no barcouncil.gov.bd PDF).',
}
writeFileSync(coveragePath, `${JSON.stringify(coverage, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      converted: topics.map((t) => t.topicId),
      remainingShells: shells.assets.length,
      remainingTopicIds: shells.assets.map((a) => a.topic_id),
    },
    null,
    2,
  ),
)
