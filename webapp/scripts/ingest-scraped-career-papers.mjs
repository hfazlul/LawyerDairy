/**
 * Ingest header-verified photographs of original papers found 15 Sep 2026.
 * Not Ain Prokash / Live MCQ HTML keys. OCR flagged ocr_unverified.
 * No invented model answers. Empty MCQ years stay empty.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repo = join(here, '..', '..')
const scraped = join(repo, 'docs', 'plan', 'mobile-v3', '_inbox', 'scraped')
const keep = join(scraped, 'keep')
const outMobile = join(repo, 'mobile', 'assets', 'career')
const outBar = join(repo, 'Barcouncil assets', 'batches')

mkdirSync(keep, { recursive: true })
mkdirSync(outBar, { recursive: true })

function copyKeep(src, dest) {
  const from = join(scraped, src)
  if (!existsSync(from)) return
  copyFileSync(from, join(keep, dest))
}

copyKeep('hc-2016-p1.jpg', 'hc-2016-cover.jpg')
copyKeep('hc-2016-p2.jpg', 'hc-2016-p2-group-ab.jpg')
copyKeep('hc-2016-p3.jpg', 'hc-2016-p3-group-bc.jpg')
copyKeep('hc-2017-p1.jpg', 'hc-2017-p1-group-ab.jpg')
copyKeep('hc-2017-p2.jpg', 'hc-2017-p2-group-c.jpg')
copyKeep('bar-written-2023-bdlp-img5.jpg', 'bar-written-2023-bn-p1.jpg')
copyKeep('bar-written-2023-bdlp-img6.jpg', 'bar-written-2023-bn-p2.jpg')
copyKeep('bar-written-2023-bdlp-img1.jpg', 'bar-written-2023-en-p3.jpg')
copyKeep('bar-written-2023-bdlp-img4.jpg', 'bar-written-2023-en-p4.jpg')
copyKeep('bar-mcq-2023-bdlp-img5.jpg', 'bar-written-2025-bn-p1.jpg')
copyKeep('bar-written-2025-bdlp-img4.jpg', 'bar-written-2025-bn-p2.jpg')
copyKeep('bar-written-2025-bdlp-img5.jpg', 'bar-written-2025-en-p3.jpg')
copyKeep('bar-written-2025-bdlp-img6.jpg', 'bar-written-2025-en-p4.jpg')

const BANNER_WEB =
  'সূত্র: ওয়েব ছবি OCR (যাচাইহীন)। অফিসিয়াল বার কাউন্সিল ডাউনলোড নয়। পুনর্মুদ্রণ নিষিদ্ধ। মডেল উত্তর নেই।'

function guessSubject(text) {
  const t = text
  if (/Evidence Act|সাক্ষ্য আইন|প্রাথমিক সাক্ষ্য/.test(t)) return { module: 'BC-MOD-EVIDENCE', topic: 'T-EVID-01' }
  if (/Limitation Act|তামাদি/.test(t)) return { module: 'BC-MOD-LIMITATION', topic: 'T-LIM-01' }
  if (/Specific Relief|সুনির্দিষ্ট প্রতিকার/.test(t)) return { module: 'BC-MOD-SRA', topic: 'T-SRA-01' }
  if (/Penal Code|দণ্ডবিধি|দন্ডবিধি/.test(t)) return { module: 'BC-MOD-PENAL', topic: 'T-PENAL-01' }
  if (/Criminal Procedure|CrPC|ফৌজদার|FIR|৫৬১/.test(t)) return { module: 'BC-MOD-CRPC', topic: 'T-CRPC-01' }
  if (/Bar Council|Canons|এডভোকেট|আইনজীবী/.test(t)) return { module: 'BC-MOD-ETHICS', topic: 'T-ETH-01' }
  return { module: 'BC-MOD-CPC', topic: 'T-CPC-01' }
}

function batchEnvelope({ batchId, purpose, assets, extra = {} }) {
  return {
    batch_id: batchId,
    schema_version: '1.0',
    content_version: '2026.09.15',
    created_at: '2026-09-15T00:00:00Z',
    source: 'web-photo-ocr',
    content_source: 'web-photo-ocr',
    operation: 'CREATE',
    status: 'PENDING_REVIEW',
    batch_purpose: purpose,
    official_past_papers: 0,
    asset_count: assets.length,
    assets,
    ...extra,
  }
}

function writeJson(abs, obj) {
  writeFileSync(abs, `${JSON.stringify(obj, null, 2)}\n`, 'utf8')
}

function writtenAsset({ year, n, group, promptBn, promptEn, prefix = 'WEB' }) {
  const id = `BC-WQ-${prefix}-${year}-${String(n).padStart(2, '0')}`
  const sub = guessSubject(`${promptBn} ${promptEn}`)
  const title = `বার কাউন্সিল লিখিত ${year} — প্রশ্ন ${n}${group ? ` (${group} অংশ)` : ''}`
  const bnQ = `${BANNER_WEB}\nপরীক্ষা: ${year}।\n\n${promptBn}`
  const enQ = `${BANNER_WEB}\nExam: ${year}.\n\n${promptEn || promptBn}`
  return {
    content_id: id,
    written_question_id: id,
    asset_type: 'WRITTEN_QUESTION',
    section_id: 'SEC-PREVQ',
    module_id: sub.module,
    topic_id: sub.topic,
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: 'web-photo-ocr',
    exam_year: String(year),
    paper_year: String(year),
    exam_stage: 'WRITTEN',
    exam_board: 'Bangladesh Bar Council',
    group_label: group || null,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'NOT_VERIFIED',
    answer_type: 'NONE',
    flags: ['ocr_unverified', 'web_photo_ocr', 'reproduction_prohibited_not_official_download'],
    flag_note:
      'OCR of a photograph of the printed paper with Bangladesh Bar Council header + year + written stage. Not an official download. No model answer invented. Messy OCR kept with ocr_unverified.',
    language_versions: {
      bn: {
        title,
        question: bnQ,
        answer_outline: [
          'প্রশ্নে যা চাওয়া হয়েছে তাই লিখুন।',
          'সংশ্লিষ্ট ধারা/আদেশ উল্লেখ করুন।',
          'মডেল উত্তর ওয়েব ছবিতে নেই — অ্যাপে উদ্ভাবন করা হয়নি।',
        ],
        marking_points: [
          'প্রশ্নের সব অংশ উত্তর দিয়েছি',
          'সংশ্লিষ্ট আইন/ধারা উল্লেখ করেছি',
          'প্রার্থনা/খসড়া চাইলে কাঠামো মেনেছি',
        ],
        model_answer: '',
      },
      en: {
        title: `Bar Council written ${year} — Q${n}`,
        question: enQ,
        answer_outline: [
          'Answer only what the paper asks.',
          'Cite the relevant section/order.',
          'No model answer on the photo — none invented.',
        ],
        marking_points: [
          'Answered every part',
          'Cited the relevant law',
          'Used a drafting structure if a petition was asked',
        ],
        model_answer: '',
      },
    },
  }
}

function hcAsset({ year, n, group, groupName, marks, isOr, examDate, prompt }) {
  const id = `HC-WQ-WEB-${year}-${String(n).padStart(2, '0')}`
  const orBn = isOr ? ' OR' : ''
  const title = `HC পারমিশন লিখিত ${year} — প্রশ্ন ${n} (Group ${group} ${groupName}${orBn}) · ${marks}`
  const banner = `${BANNER_WEB}\nপরীক্ষা: ${examDate}। Group ${group} (${groupName}) · ${marks} নম্বর${isOr ? ' · OR' : ''}।\n\n`
  return {
    content_id: id,
    written_question_id: id,
    asset_type: 'WRITTEN_QUESTION',
    section_id: 'SEC-PREVQ',
    module_id: 'SEC-PREVQ',
    topic_id: id,
    order: year === '2016' ? 10 + n : 20 + n,
    question_origin: 'AUTHENTIC_REPORTED_QUESTION',
    question_category_authenticity: 'AUTHENTIC_REPORTED_QUESTION',
    content_source: 'web-photo-ocr',
    exam_year: String(year),
    paper_year: String(year),
    exam_date: examDate,
    exam_stage: 'WRITTEN',
    exam_board: 'Bangladesh Bar Council',
    group_label: group,
    marks,
    version: 1,
    status: 'PENDING_REVIEW',
    verification_status: 'NOT_VERIFIED',
    answer_type: 'NONE',
    flags: ['ocr_unverified', 'web_photo_ocr', 'reproduction_prohibited_not_official_download'],
    flag_note:
      'OCR of a QuesBankBD-hosted photograph of the printed HC Permission paper (Bar Council header + date + Group A/B/C). Reproduction without permission is prohibited. Not shipped as an official download. No model answer invented.',
    language_versions: {
      bn: {
        title,
        question: `${banner}${prompt}`,
        answer_outline: [
          'প্রশ্নে যা চাওয়া হয়েছে তাই খসড়া করুন (brief / petition / next course)।',
          'সংশ্লিষ্ট ধারা/আদেশ ও ফোরাম উল্লেখ করুন।',
          'মডেল উত্তর নেই — অ্যাপে উদ্ভাবন করা হয়নি।',
        ],
        marking_points: [
          'সঠিক ফোরাম ও প্রতিকার বেছেছি',
          'ঘটনা কালানুক্রমে সাজিয়েছি',
          'গ্রাউন্ডস ও প্রার্থনা আলাদা করেছি',
        ],
        model_answer: '',
      },
      en: {
        title: `HC Permission written ${year} — Q${n} (Group ${group}${orBn})`,
        question: `${banner}${prompt}`,
        answer_outline: [
          'Draft only what the paper asks (brief / petition / next course).',
          'Cite the forum and the relevant section/order.',
          'No model answer was on the photo — none invented.',
        ],
        marking_points: [
          'Chose the correct forum and remedy',
          'Set out facts in order',
          'Separated grounds and prayer',
        ],
        model_answer: '',
      },
    },
  }
}

const hc2016 = [
  hcAsset({
    year: '2016',
    n: 1,
    group: 'A',
    groupName: 'CIVIL',
    marks: 8,
    isOr: false,
    examDate: '9 January 2016',
    prompt:
      "'A' instituted a suit against 'B' in the 1st Court of the Assistant Judge, Sylhet for a decree of perpetual injunction simpliciter with reference to certain property. Anyway, 'B' filed an application for local investigation of the suit property and that was allowed by the Assistant Judge. 'A' being aggrieved by the aforesaid order moved the District Judge of Sylhet who also affirmed the order of the Assistant Judge. Advise 'A' as to the next course of action and prepare a brief as per provisions of the relevant law in this regard.",
  }),
  hcAsset({
    year: '2016',
    n: 2,
    group: 'A',
    groupName: 'CIVIL',
    marks: 8,
    isOr: true,
    examDate: '9 January 2016',
    prompt:
      "'A' as plaintiff filed a suit against 'B' in the 1st Court of the Joint District Judge, Dhaka for declaration of title to and recovery of khas possession of the suit property measuring an area of 80 decimals recorded in R.S. Plot No.172 under R.S. Khatian No.16 of Mouza Gulshan, P.S. Gulshan, District-Dhaka. The plaintiff's case, in short, is that he purchased the suit property from 'X' on 26th December, 2013 by a registered sale deed for a consideration of Tk.5 crore and since then he has been owning and possessing the same. On 14th February, 2014, 'B', having no title to the suit property, illegally dispossessed him therefrom and hence the suit. 'B' contested the suit by filing a written statement denying the material allegations made in the plaint and contended, inter alia, that 'A' had no title to and possession in the suit property and that 'A's kabala from 'X' is nothing but a fraudulent document. 'B' further contended that he purchased the suit property from 'Y', uncle of 'X', on 18th March, 2013 for a consideration of Tk.6 crore and since then he has been owning and possessing the same. It was also contended that 'Y' inherited the suit property along with other properties from his father 'Z' and he owned and possessed the same in his own right for a long time. The learned Joint District Judge dismissed the suit by his judgment and decree dated 10th July, 2015. 'A' approaches you for doing the needful. What advice will you render to 'A' in this respect? How will you prepare a memorandum of appeal, if you desire to do so?",
  }),
  hcAsset({
    year: '2016',
    n: 3,
    group: 'B',
    groupName: 'CRIMINAL',
    marks: 8,
    isOr: false,
    examDate: '9 January 2016',
    prompt:
      "'A' was suffering from a heart disease. He hired a taxi from Banani to take him to New Market. 'B', the taxi-driver, was not aware of the illness of 'A'. When 'A' reached New Market and offered 'B' Tk.100.00 as fare, 'B' demanded Tk.200.00 from 'A'. An altercation followed. During tussle, 'B' lifted 'A' and threw him to the ground with sufficient force. As a result, 'A' got his ribs fractured and died of rupture of the heart. The Metropolitan Sessions Judge, Dhaka by his judgment and order dated 20th November, 2015 found 'B' guilty of murder under section 302 of the Penal Code and sentenced him thereunder to suffer imprisonment for life and to pay a fine of Tk.25,000.00, in default, to suffer rigorous imprisonment for a further period of one year.\n\n(a) Draft a petition of appeal challenging the aforesaid judgment and order of conviction and sentence passed by the learned Metropolitan Sessions Judge, Dhaka for presentation before the High Court Division mentioning the relevant Section under which the appeal can be filed.\n(b) Draft an application for bail of the convict-appellant 'B' stating the Section under which such application can be filed.",
  }),
  hcAsset({
    year: '2016',
    n: 4,
    group: 'B',
    groupName: 'CRIMINAL',
    marks: 8,
    isOr: true,
    examDate: '9 January 2016',
    prompt:
      "Arfan was convicted by the Nari-O-Shishu Nirjatan Daman Tribunal No.1, Comilla by the impugned judgment and order dated 03.07.2011 on a charge of rape on Rahima, a girl of 18 years. Arfan was sentenced to suffer imprisonment for life and to pay a fine of Tk.5,000/-, in default, to suffer rigorous imprisonment for a further period of 1 (one) year. The occurrence took place at dead of night. The FIR was lodged after 7 days of the occurrence without any cogent explanation. The Tribunal based its decision on the uncorroborated solitary testimony of Rahima.\n\nPrepare a petition of appeal mentioning the relevant provision of law in the cause-title and setting forth the grounds of appeal. Also prepare an application for bail on behalf of the convict-appellant Arfan for filing in the Appellate Court.",
  }),
  hcAsset({
    year: '2016',
    n: 5,
    group: 'C',
    groupName: 'WRIT',
    marks: 9,
    isOr: false,
    examDate: '9 January 2016',
    prompt:
      "Babul was arrested from his house on 24.12.2015 by the police under Section 54 of the Code of Criminal Procedure and was produced before the Chief Metropolitan Magistrate, Dhaka on the following day, i.e., 25.12.2015. Meanwhile he was served with an order of detention issued by the District Magistrate, Dhaka purporting to act under Section 3(2) of the Special Powers Act, 1974 ordering his detention in Dhaka Central Jail for a period of 30 days. In the grounds of detention served on Babul, it was stated that he was a gangster, notorious extortionist and a man of bad character in the locality and was wanted in connection with a number of criminal cases.\n\nDraft an appropriate application for presentation before the High Court Division under the relevant provisions of the Constitution challenging the legality of the impugned order of detention.",
  }),
  hcAsset({
    year: '2016',
    n: 6,
    group: 'C',
    groupName: 'WRIT',
    marks: 9,
    isOr: true,
    examDate: '9 January 2016',
    prompt:
      "Farida Begum took her disabled son Redwan on a wheel-chair to Dhanmondi Government Boys' High School, Dhaka for admission. The Headmaster politely refused to admit Redwan on the ground that in a crowded school, it is not safe for Redwan to be in the classroom as the students may jeer at him and in consequence, the discipline and efficiency of the school management may be affected.\n\nFarida Begum comes to you for seeking legal remedy, if any. Do you think that there is any remedy you can seek in the High Court Division? If so, draft an application for moving the High Court Division under the relevant Article of the Constitution.",
  }),
]

const hc2017 = [
  hcAsset({
    year: '2017',
    n: 1,
    group: 'A',
    groupName: 'CIVIL',
    marks: 8,
    isOr: false,
    examDate: '2017',
    prompt:
      "'A' instituted a suit against 'B' in the 1st Court of Joint District Judge, Dhaka praying for declaration of title to the suit property. 'A' claimed the suit property by way of inheritance. On the other hand, 'B' claimed the same by way of purchase from one of the co-sharers of 'A'. The Joint District Judge dismissed the suit on the ground that 'A' was an attesting witness to the deed of transfer executed in favour of 'B' in respect of the self-same property. Draft a memorandum of Appeal for presentation to the High Court Division of the Supreme Court of Bangladesh.",
  }),
  hcAsset({
    year: '2017',
    n: 2,
    group: 'A',
    groupName: 'CIVIL',
    marks: 8,
    isOr: true,
    examDate: '2017',
    prompt:
      "'A' instituted a suit against 'B' in the 1st Court of the Assistant Judge, Sylhet for a decree of perpetual injunction simpliciter with reference to certain property. Anyway, 'B' filed an application for local investigation of the suit property and that was allowed by the Assistant Judge. 'A' being aggrieved by the aforesaid order moved the District Judge of Sylhet who also affirmed the order of the Assistant Judge. Advise 'A' as to the next course of action and prepare a brief as per provisions of the relevant law in this regard.",
  }),
  hcAsset({
    year: '2017',
    n: 3,
    group: 'B',
    groupName: 'CRIMINAL',
    marks: 8,
    isOr: false,
    examDate: '2017',
    prompt:
      "'A' lodged an ejahar (First Information Report) against 'B' with Ramna Police Station, Dhaka Metropolitan Police, Dhaka for commission of theft in his house on 10.10.2016. Police started a regular case and submitted final report against 'B' after investigation. No naraji petition (petition of protest) was filed by 'A' and the Court accepted the final report and discharged 'B' from the case. Anyway, after 6 (six) months of the acceptance of the final report, 'A' filed a C.R. Case against 'B' in the Court of Chief Metropolitan Magistrate, Dhaka on the self-same occurrence.\nNow what remedy is open to 'B'? Draft an application invoking the relevant provision of law.",
  }),
  hcAsset({
    year: '2017',
    n: 4,
    group: 'B',
    groupName: 'CRIMINAL',
    marks: 8,
    isOr: true,
    examDate: '2017',
    prompt:
      "'A' is a businessman and 'B' had business transactions with 'A' for quite some time. 'B' took some loan from 'A' and with the loan money, 'B' used to purchase rice and spices from the village and sell them to retailers including 'A'. But unfortunately 'B's wife fell seriously ill and he spent the entire loan money for her treatment. When 'A' wanted his money back, 'B' always told him that he would repay the loan after a fortnight. However, after waiting for a year or so, 'A' lodged a complaint against 'B' under Section 406 of the Penal Code, 1860 and accordingly the Metropolitan Magistrate took cognizance of the offence punishable thereunder.\n'B' approaches you for an appropriate legal remedy. You suggest the remedy and do the needful.",
  }),
  hcAsset({
    year: '2017',
    n: 5,
    group: 'C',
    groupName: 'WRIT',
    marks: 9,
    isOr: false,
    examDate: '2017',
    prompt:
      "'A' obtained loan from Sonali Bank, Ramna Branch, Dhaka for business purpose, but failed to repay the same within the period stipulated in the sanction letter. Sonali Bank filed a suit against 'A' in the 1st Artha Rin Adalat, Dhaka for realization of the loan amount. During pendency of the suit, 'A' submitted an application for Settlement Conference with the consent of the Bank as per provision of the Artha Rin Adalat Ain, 2003. The Adalat rejected the same without assigning any reason. Prepare a Writ Petition under Article 102 of the Constitution challenging the aforesaid order of rejection.",
  }),
  hcAsset({
    year: '2017',
    n: 6,
    group: 'C',
    groupName: 'WRIT',
    marks: 9,
    isOr: true,
    examDate: '2017',
    prompt:
      "'Y', an employee of Sylhet City Corporation, was terminated from service on 01.09.2017 with three months' notice, pay and other benefits. In the termination letter, serious allegations of misconduct were leveled against him without any prior show-cause notice.\n'Y' requests you to take the requisite legal step against his termination from service. In what manner and how will you give legal remedy to 'Y'? Explain.",
  }),
]

const w2023 = [
  {
    n: 1,
    group: 'ক',
    bn: 'ক) "Pleading shall contain only material facts"—The Code of Civil Procedure, 1908 এর Order VI অনুযায়ী এর বিষয়বস্তু বর্ণিয়ে আলোচনা করুন। [≈১০]\n\nখ) Y দেওয়ানী ৮৩/২০২২ নং স্বত্ব ঘোষণা মোকদ্দমা দায়ের করেন এবং আরজিতে দাবি করেন যে, তিনি ইতোপূর্বে গৃহীত সহকারী শিক্ষক পদে নিয়োগ পরীক্ষায় প্রথম হওয়া সত্ত্বেও কাউকে নিয়োগ না দিয়ে ঐ পদে নতুন নিয়োগ বিজ্ঞপ্তি প্রচার অবৈধ। সংশ্লিষ্ট আইন ও কারণ উল্লেখ করে আরজি প্রত্যাখ্যানের দরখাস্ত প্রস্তুত করুন। [≈৫]',
    en: 'a) "Pleading shall contain only material facts"—discuss in the context of the contents of pleading according to Order VI of the Code of Civil Procedure, 1908. [10]\n\nb) Y filed a suit for declaration bearing no. 83/2022 and claimed in the plaint that the fresh advertisement for appointment in the post of Assistant Teacher without appointing anyone is illegal, despite the fact that he stood first in the recruitment examination for the same position held earlier. Prepare an application for rejection of the plaint stating relevant laws and reasons. [5]',
  },
  {
    n: 2,
    group: 'ক',
    bn: 'ক) দেওয়ানী মোকদ্দমায় পক্ষগণের হাজিরা ও অহাজিরার ফলাফল কী? এক্ষেত্রে ক্ষতিগ্রস্ত পক্ষের প্রতিকার কী? The Code of Civil Procedure, 1908 এর প্রাসঙ্গিক বিধান উল্লেখ্য উত্তর দিন। [≈১০]\n\nখ) বাদীর অস্থায়ী নিষেধাজ্ঞার আবেদন শুনানীর দিন কোনোপক্ষে হাজির না থাকায় নামঞ্জুর করা হয়। কয়েকদিন পর বাদী The Code of Civil Procedure, 1908 এর ১৫১ ধারামতে একটি দরখাস্ত দাখিল করে তিনি ধার্য তারিখে অসুস্থ থাকায় আদালতে হাজির হতে পারেননি বলে অস্থায়ী নিষেধাজ্ঞার দরখাস্ত নামঞ্জুর আদেশটি বাতিল চান। তদনিরূপ প্রাসঙ্গিক বিধান উল্লেখ্য আপত্তি মুসাবিদা করুন। [≈৫]',
    en: "a) What are the consequences of appearance and non-appearance of parties in a civil suit? What remedies are available to the party aggrieved thereby? Answer mentioning the relevant provisions of the Code of Civil Procedure, 1908. [10]\n\nb) The plaintiff's application for temporary injunction was rejected for non-appearance of the parties on the date of hearing. A few days later the plaintiff filed a petition under section 151 of the Code of Civil Procedure, 1908 for setting aside the order rejecting the application for temporary injunction on the assertion that due to illness he could not appear in the court on the date fixed. Draft a written objection against the aforesaid petition referring to relevant laws. [5]",
  },
  {
    n: 3,
    group: 'ক',
    bn: 'ক) The Specific Relief Act, 1877 অনুযায়ী কোন কোন চুক্তি সুনির্দিষ্টভাবে বলবৎযোগ্য নয়? সংশ্লিষ্ট ধারাসমূহের উল্লেখ্য সংক্ষেপে উত্তর দিন। [≈৫]\n\nখ) পিতা F তার পুত্র Z কে ৫ শতক টাকা মূল্যমানের ১১ শতক অবিভক্ত জমির মধ্যে ৫ শতক দানপত্রের মাধ্যমে দান করেন। F এর মৃত্যুর পর তার অপর পুত্র X ও Y দানপত্রটি জালিত ও তাতে অন্তর্ভুক্ত জমিতে Z স্বত্ব অর্জন করে নাই মর্মে দাবি করেন। এমতাবস্থায়, Z এর পক্ষে প্রতিকার প্রার্থনা উপযুক্ত আদালতে দাখিলের জন্য একটি আরজির মুসাবিদা করুন এবং পৃথকভাবে আরজিতে প্রার্থিত প্রতিকারসমূহ পক্ষে আইনসমূহ উল্লেখ করুন। [≈৭+৩=১০]',
    en: 'a) Which contracts are not specifically enforceable under the Specific Relief Act, 1877? Answer briefly with reference to relevant sections. [5]\n\nb) Father F makes a hiba of 5 decimals of land out of his undivided 11 decimals of land worth Tk. 33 lac in favour of his son Z through a deed of hiba. After the death of F, his other sons X and Y claimed that the deed of hiba was forged and Z did not acquire title to the land included in the deed. In this context draft a plaint for filing in the competent court seeking remedies on behalf of Z and mention separately relevant laws in support of the remedies sought in the plaint. [7+3=10]',
  },
  {
    n: 4,
    group: 'খ',
    bn: 'ক) The Code of Criminal Procedure, 1898 এর সংশ্লিষ্ট ধারার উল্লেখ্য গ্রেফতারকৃত ব্যক্তির অধিকারসমূহ আলোচনা করুন। [≈১০]\n\nখ) X Y কে আঘাত করেন। এতে Y প্রচণ্ড ক্রোধাবিষ্ট হন, Z, Y এর ক্রোধের সুযোগ নিয়ে Y কর্তৃক X কে হত্যার অভিপ্রায়ে Y এর হাতে একটি ছুরি তুলে দেন। Y ঐ ছুরির সাহায্যে ০৩/১১/২০২৩ তারিখ সকাল ৯.০০ টায় সদর থানার রাসুলপুর বাজারে X কে হত্যা করেন। এই ঘটনায় পুলিশ Y ও Z কে অভিযুক্ত করে The Penal Code, 1860 এর ১০৯, ৩৪, ৩২৩ ও ৩২৬ ধারায় অভিবচন দাখিল করে। The Penal Code, 1860 অনুযায়ী Y ও Z এর ফৌজদারি দায় নিরুপণপূর্বক পুলিশ প্রতিবেদনের বিরুদ্ধে সংশ্লিষ্ট আদালতে দাখিলের জন্য একটি নারাজি দরখাস্ত প্রস্তুত করুন। [≈৫]',
    en: "a) Discuss the rights of an arrested person mentioning the relevant sections of the Code of Criminal Procedure, 1898 and leading case laws. [10]\n\nb) X strikes Y. By this Y gets excited to violent rage. Z taking the advantage of Y's rage, and intending to cause him (Y) to kill X, puts a knife into Y's hand. Y kills X with the knife on 03/11/2023 at 9.00 A.M at Rasulpur Bazaar under Sadar Police Station. Police, in this occurrence, submits report accusing Y and Z under sections 109, 34, 323 and 326 of the Penal Code, 1860. Ascertain the criminal liabilities of Y and Z according to the Penal Code, 1860 and prepare a Naraji petition against the police report for filing in the competent court. [5]",
  },
  {
    n: 5,
    group: 'খ',
    bn: 'ক) অব্যাহতি ও খালাসের মধ্যে পার্থক্য কী? অভিযোগ গঠনকালে আসামীপক্ষের কাগজপত্র দেখে অব্যাহতি দেওয়া যায় কি? [≈৩+২=৫]\n\nখ) ১৫/০২/২০২৩ তারিখ সকাল ১০.০০ টায় X তার বন্ধু P, Q ও R সাথে রাজপুর বাজারে সদর থানার পথে সদর থানার রাজপুর নামক স্থানে Y ও Z তাহসিল আটক করে ৩০,০০০ টাকা চাঁদা দাবি করেন এবং প্রাণনাশের হুমকি দেন। হঠাৎ N, Y ও Z, X কে এলোপাতাড়ি ঘুসি মারতে থাকেন। M রাস্তার পাশের দোকান থেকে ফুটন্ত পানি এনে X এর শরীরে ঢেলে দেন। X মারাত্মক আহত হয়। এই ঘটনায় The Penal Code, 1860 অনুসারে প্রত্যেক আসামীর ফৌজদারি দায় নিরুপণপূর্বক একটি নালিশ প্রস্তুত করুন। [≈১০]',
    en: 'a) What is the difference between discharge and acquittal? Can the accused be discharged on perusal of the documents of the defence side during framing of charge? [3+2=5]\n\nb) On 15/02/2023 at 10.00 A.M., X with his friends P, Q and R while was at Rajapur under Sadar Police Station on their way to the local market, Y and Z obstructed them and demanded ransom of Tk. 30,000 and also put them in fear of death. Suddenly, N, Y and Z started striking X with clenched fist indiscriminately. M brought boiling water from a roadside tea stall and poured it on X\'s body. X got fatally injured. In this occurrence, prepare a complaint determining the criminal liability of each offender under the Penal Code, 1860. [10]',
  },
  {
    n: 6,
    group: 'গ',
    bn: "ক) কোন পরিস্থিতিতে কোনো ব্যক্তি কর্তৃক 'আইনবলে বাধ্য' বা 'আইনবলে ন্যায়সঙ্গত' ধারায় সরল বিশ্বাসে সম্পাদিত কাজ ফৌজদারি অপরাধের অভিযোগের বিরুদ্ধে যথেষ্ট প্রতিরক্ষা বিবেচনা গণ্য হবে? [≈১০]\n\nখ) সমবায় সমিতির মালিকানাধীন একটি স্থাবর সম্পত্তি নিলামে নব্বই শতক জায়গা Q ক্রয় করেন। Y ও Z এর সাথে যোগসাজশে ঐ সমবায় সমিতির সেক্রেটারি X ঐ সম্পত্তির মূল্য চল্লিশ শতক টাকা উল্লেখ্য Z এর অনুকূলে একটি জাল দলিল করেন মর্মে সাক্ষ্যে প্রমাণিত হয়। X, Y ও Z কে The Penal Code, 1860 এর কোন কোন ধারার অধীনে দোষী সাব্যস্ত ও দণ্ডিত করা যেতে পারে? প্রাসঙ্গিক বিধান উল্লেখ্য উত্তর দিন। [≈৫]",
    en: "a) Under what circumstances act done by a person in good faith believing himself to be 'bound by law' or 'justified by law' be considered sufficient defence against charge of criminal offence? [10]\n\nb) Q purchased at auction an immovable property belonging to a co-operative society at Tk. ninety lac. It was proved through evidence that X, secretary of the said co-operative society, in collusion with Y and Z, forged a document in favour of Z mentioning therein Tk. forty lac as the value of property. Under which sections of the Penal Code, 1860 X, Y and Z may be found guilty and sentenced? Answer with reference to relevant provisions. [5]",
  },
  {
    n: 7,
    group: 'গ',
    bn: 'ক) The Penal Code, 1860 অনুসারে নিম্নবর্ণিত বিষয়সমূহের মধ্যে পার্থক্য লিখুন— [৪×২.৫=১০]\ni) গুরুতর আঘাত ও আঘাত;\nii) সাধারণ অভিপ্রায় ও সাধারণ উদ্দেশ্য;\niii) অপহরণ ও অপহরণণ [OCR_UNCERTAIN: kidnapping/abduction];\niv) অবৈধ বাধা ও অবৈধ অবরোধ।\n\nখ) X মৃত্যু হবে জেনেও Y এর মৃত্যু ঘটানোর উদ্দেশ্যে গুলি ছোড়েন। কিন্তু ঐ গুলিতে Z এর মৃত্যু হয়। X এক্ষেত্রে The Penal Code, 1860 এর কোন ধারার অধীনে অপরাধ করেছেন? ব্যাখ্যা করুন। [≈৫]',
    en: 'a) Distinguish between the following topics according to the Penal Code, 1860: [4×2.5=10]\ni) Grievous hurt and hurt;\nii) Common intention and common object;\niii) Kidnapping and abduction;\niv) Wrongful restraint and wrongful confinement.\n\nb) X, knowing and intending that it would likely cause death of Y, fires bullet. But it causes death of Z. Under which provision of the Penal Code, 1860 X committed the offence? Explain. [5]',
  },
  {
    n: 8,
    group: 'ঘ',
    bn: 'ক) The Evidence Act, 1872 অনুসারে শিশু, বোবা ও বৈরী সাক্ষীর সাক্ষ্য কখন ও কতটুকু গ্রহণযোগ্য? মূল দলিলের ফটোকপি সাক্ষ্য হিসাবে গ্রহণযোগ্য কি? [≈১০]\n\nখ) X অগ্নিদগ্ধ হয়ে ০২/০৩/২০২৩ তারিখে ডাক্তার D এর নিকট প্রকাশ করেন যে, N ও Z তার গায়ে দাহ্য পদার্থ ঢেলে আগুন ধরিয়ে দেন। X পরদিন পুলিশ কর্মকর্তা P এর নিকট বলেন যে, N, Y ও Z তার গায়ে কেরোসিন ঢেলে আগুন ধরিয়ে দেন। X ১৫/০৩/২০২৩ তারিখে মৃত্যুশয্যায় মারা যান। X এর বক্তব্যের ভিত্তিতে N, Y ও Z কে সাজা প্রদান করা যাবে কি? The Evidence Act, 1872 এর মৃত্যুকালীন ঘোষণা সংক্রান্ত বিধানানুসারে উত্তর দিন। [≈৫]',
    en: "a) When and to what extent the testimony of minor, dumb and hostile witnesses is admissible under the Evidence Act, 1872? Is photocopy of the original document admissible in evidence? [10]\n\nb) X, being burnt, discloses to the doctor D on 02/03/2023 that N and Z poured 'flammable substance' on her and set her on fire. On the next day X tells to police officer P that N, Y and Z poured 'kerosene' on her and set her on fire. X died in a dying state on 15/03/2023. Can N, Y and Z be punished on the basis of X's statement? Answer according to the provision(s) regarding dying declaration under the Evidence Act, 1872. [5]",
  },
  {
    n: 9,
    group: 'ঘ',
    bn: 'ক) "Evidence has to be weighed and not counted"—The Evidence Act, 1872 এর ১১৪ ও ১৩৪ ধারার আলোকে দেওয়ানী মোকদ্দমা ও ফৌজদারি মামলায় এই ধারণার প্রয়োগযোগ্যতা উদাহরণসহ আলোচনা করুন। [≈১০]\n\nখ) বাটোয়ারা মোকদ্দমায় বাদী পিতৃত্ব প্রমাণের জন্য DNA পরীক্ষার প্রতিবেদন জমা দেন। আদালত অভিমত ব্যক্ত করেন যে, উক্ত প্রতিবেদন দেওয়ানী মোকদ্দমায় সাক্ষ্য হিসাবে গ্রহণযোগ্য নয়। আদালতের এই অভিমত The Evidence Act, 1872 অনুসারে আইনসঙ্গত কি? উত্তরের স্বপক্ষে সংশ্লিষ্ট বিধান উল্লেখ্য যুক্তি দিন। [≈৫]',
    en: 'a) "Evidence has to be weighed and not counted"—discuss with illustrations the applicability of this concept to civil suits and criminal cases in the light of sections 114 and 134 of the Evidence Act, 1872. [10]\n\nb) In the suit for partition, the plaintiff submitted a DNA test report to prove paternity. The court opined that such report is not admissible as evidence in civil suits. Is the opinion of the court lawful under the Evidence Act, 1872? Assign reasons in support of the answer with reference to relevant provisions. [5]',
  },
  {
    n: 10,
    group: 'ঙ',
    bn: 'ক) "Limitation bars the remedy but does not destroy the right."—The Limitation Act, 1908 অনুসারে এই ধারণাটি ব্যতিক্রমসহ (যদি থাকে) আলোচনা করুন। [≈১০]\n\nখ) নাবালক X এর সম্পত্তি তার মাতা Y বৈধ কর্তৃত্ব ছাড়াই ২০১২ সালে বিক্রয় করেন। X ২০১৮ সালে সাবালকত্ব অর্জন করেন। X উক্ত সম্পত্তি দখল উদ্ধারের জন্য ২০২৩ সালে মোকদ্দমা করতে চান। মোকদ্দমাটি দায়েরের ক্ষেত্রে প্রয়োজ্য তামাদি উল্লেখ্য X কে পরামর্শ দিন। [≈৫]',
    en: 'a) "Limitation bars the remedy but does not destroy the right"—discuss the concept with exception(s), if any, as per the Limitation Act, 1908. [10]\n\nb) Minor X\'s property was sold by his mother Y in 2012 without lawful authority. X attained majority in 2018. X intends to sue in 2023 to recover possession of the said property. Advise X on limitation applicable to the filing of the suit. [5]',
  },
  {
    n: 11,
    group: 'ঙ',
    bn: 'ক) "The Court has no jurisdiction to extend time where the petitioner has been negligent and inactive."—The Limitation Act, 1908 এবং "তামাদির সময় বৃদ্ধি" সংক্রান্ত বিধান উল্লেখ্য বক্তব্যটি ব্যাখ্যা করুন। [≈১০]\n\nখ) X ২০/০২/২০২০ তারিখ খাস দখলের মোকদ্দমায় ডিক্রি পান। Y ঐ ডিক্রি রদ-রহিছের জন্য পৃথক মোকদ্দমা করলে আদালত ২৫/০১/২০২৩ তারিখ ডিক্রির কার্যকারিতা ৬ মাসের জন্য স্থগিত করেন। X ২২/১১/২০২৩ তারিখ উক্ত ডিক্রি জারির জন্য দরখাস্ত দাখিল করতে চান। তামাদি সংশ্লিষ্ট বিধান উল্লেখ্য X কে পরামর্শ দিন। [≈৫]',
    en: 'a) "The Court has no jurisdiction to extend time where the petitioner has been negligent and inactive"—explain the statement with reference to the provision of the Limitation Act, 1908 relating to \'extension of the period of limitation\'. [10]\n\nb) X obtained a decree on 20/02/2020 in a suit for Khas possession. Y filed a separate suit for setting aside the decree, wherein on 25/01/2023 the court stayed the operation of the decree for 6 months. X desires to file an application for the execution of the decree on 22/11/2023. Advise X with reference to relevant provisions of limitation. [5]',
  },
  {
    n: 12,
    group: 'চ',
    bn: 'ক) প্রাসঙ্গিক বিধান উল্লেখ্য বার কাউন্সিলের চেয়ারম্যান এর ক্ষমতা ও কার্যাবলি আলোচনা করুন। [≈৭]\n\nখ) আইনজীবী X বাদী হয়ে মোকদ্দমা করেন। Y বিবাদীর আইনজীবী। মোকদ্দমাটি চলাকালে প্রায়ই প্রকাশ্য আদালতে X ও Y তর্কাতর্কি করেন এবং ব্যক্তিগত বিষয় নিয়ে পরস্পরকে আক্রমণ করেন। The Canons of Professional Conduct and Etiquette এর আলোকে উভয় আইনজীবীর আচরণ মূল্যায়ন করুন। [≈৩]',
    en: 'a) Discuss the powers and functions of the Chairman of the Bar Council with reference to relevant provisions. [7]\n\nb) Advocate X files a suit as plaintiff. Y is defendant\'s Advocate. During the proceedings of the suit, X and Y frequently engage in altercations and attack each other on personal issues in the open court. Evaluate the conduct of both the Advocates in the light of the Canons of Professional Conduct and Etiquette. [3]',
  },
  {
    n: 13,
    group: 'চ',
    bn: 'ক) "In doing professional duty an Advocate must obey the voice of his conscience and not that of his client."—The Canons of Professional Conduct and Etiquette অনুসারে নীতিটি ব্যাখ্যা করুন। [≈৭]\n\nখ) একজন আইনজীবীর শিক্ষাগত যোগ্যতার সনদ জাল বা ভুয়া হলে বার কাউন্সিল তার বিরুদ্ধে কী ধরনের ব্যবস্থা নিতে পারে? [≈৩]',
    en: 'a) "In doing professional duty an Advocate must obey the voice of his conscience and not that of his client"—explain the principle as per the Canons of Professional Conduct and Etiquette. [7]\n\nb) What action can the Bar Council take against an Advocate if his/her academic certificate is found forged or fake? [3]',
  },
].map((q) => writtenAsset({ year: '2023', n: q.n, group: q.group, promptBn: q.bn, promptEn: q.en, prefix: 'WEB' }))

const w2025extra = [
  {
    n: 8,
    group: 'ঘ',
    bn: 'ক) "Once a tenant is always a tenant and once a licensee is always a licensee" — The Evidence Act, 1872 এর ধারা ১১৫ ও ১১৬ এর আলোকে নীতিটি ব্যাখ্যা করুন। [≈১০]\n\nখ) C কে হত্যার দায়ে B অভিযুক্ত হয়। B দাবি করে মানসিক অস্বস্তিত্বতার কারণে সে তার কৃতকার্যের প্রকৃতি সম্পর্কে জ্ঞাত ছিলনা। The Evidence Act, 1872 এর প্রাসঙ্গিক ধারা (সমূহ) উল্লেখ্য মানসিক অস্বস্তিত্বতা প্রমাণে B এর কোনো দায়িত্ব আছে কিনা আলোচনা করুন। [≈৫]',
    en: 'a) "Once a tenant is always a tenant and once a licensee is always a licensee" — Explain the principle in the light of section 115 and 116 of the Evidence Act, 1872. [10]\n\nb) B is accused of murdering C. B claims that due to unsoundness of mind, he did not know the nature of the act. Discuss whether B has any burden to prove his unsoundness of mind referring to relevant section(s) of the Evidence Act, 1872. [5]',
  },
  {
    n: 9,
    group: 'ঘ',
    bn: "ক) 'Oral Evidence must be direct' — The Evidence Act, 1872 এর ধারা ৬০ অনুযায়ী বিধানটি আলোচনা করুন। [≈১০]\n\nখ) X কে বিষ প্রয়োগে হত্যার দায়ে Y অভিযুক্ত হয়। মামলা চলাকালে সাক্ষ্য প্রদান করা হয় যে, X কে যে বিষ প্রয়োগ করা হয়, তার অনুরূপ বিষ X এর মৃত্যুর পূর্বে Y সংগ্রহ করেছিল। আপনি কি মনে করেন Y কর্তৃক অনুরূপ বিষ সংগ্রহ কোনোভাবে এই মামলায় প্রাসঙ্গিক? The Evidence Act, 1872 এর উপযুক্ত ধারা উল্লেখ্য উত্তর দিন। [≈৫]",
    en: "a) 'Oral Evidence must be direct' — discuss the provision according to section 60 of the Evidence Act, 1872. [10]\n\nb) Y is charged with murder of X by poison. During trial evidence was adduced that before the death of X similar poison that was administered to X was procured by Y. Do you think procuring similar poison by Y is anyway relevant to the case? Answer with reference to appropriate section of the Evidence Act, 1872. [5]",
  },
  {
    n: 10,
    group: 'ঙ',
    bn: 'ক) The Limitation Act, 1908 এর বিলম্ব মঞ্জুরুক সংক্রান্ত ৫ ধারার পরিধি আলোচনা করুন। বিলম্ব মঞ্জুরুকের যথাযথ কারণসমূহ কী? [≈৪+৪=৮]\n\nখ) বিশেষ আইনসমূহের ক্ষেত্রে The Limitation Act, 1908 এর ৫ ধারার প্রয়োগ সম্পর্কে আলোকপাত করুন। টাকার মোকদ্দমায় Y এর বিরুদ্ধে গত ১০/৫/২০২৫ তারিখে সহকারী জজ রায় ও ডিক্রি প্রদান করেন এবং সে মোতাবেক গত ১৫/৫/২০২৫ তারিখ ডিক্রি প্রস্তুত হয়। Y গত ২২/৫/২০২৫ তারিখ রায় ও ডিক্রির প্রত্যয়িত অনুলিপি প্রাপ্ত হন। জেলা জজের নিকট সর্বশেষ কত তারিখ পর্যন্ত আপিল দায়ের করা যাবে তা জানার জন্য Y ২৮/৫/২০২৫ তারিখ আপনার নিকট পরামর্শ প্রদান করুন। The Limitation Act, 1908 এর সংশ্লিষ্ট বিধানসমূহ উল্লেখ্য Y কে আপনার পরামর্শ প্রদান করুন। [≈৩+৪=৭]',
    en: 'a) Discuss the scope of section 5 of the Limitation Act, 1908 relating to condonation of delay. What are the sufficient grounds for condonation of delay? [4+4=8]\n\nb) Discuss the application of section 5 of the Limitation Act, 1908 in respect of special laws. In a money suit the Assistant Judge pronounced a judgment and decree against Y on 10/5/2025 and accordingly the decree was drawn up on 15/5/2025. Y got certified copies of the judgment and decree on 22/5/2025. To know the last date for preferring appeal to the District Judge Y came to you for your advice on 28/5/2025. Advice Y mentioning the relevant provisions of the Limitation Act, 1908. [3+4=7]',
  },
  {
    n: 11,
    group: 'ঙ',
    bn: 'ক) "কিছু কিছু ক্ষেত্রে The Limitation Act, 1908 দলিল ছাড়া মালিকানা, অধিকার ও স্বত্ব সৃষ্টি করে।" সংশ্লিষ্ট ধারা (সমূহ) উল্লেখ্য ব্যাখ্যা করুন। [≈৭]\n\nখ) তামাদির মেয়াদ গণনার ক্ষেত্রে প্রতারণার ফলাফল কী? উদাহরণসহ ব্যাখ্যা করুন। Y পৈত্রিক সূত্রে পাওয়া ১০ শতক জমি ভোগদখলীয়া থাকা অবস্থায় গত ১/৩/২০০৮ তারিখ অস্বস্তিত্ব হয়ে যায়। ৪/৬/২০০৮ তারিখ Z, Y কে উক্ত জমি হতে বেদখল করে এবং নিজের মালিক দাবি করেন। Y ৯/৭/২০২০ তারিখ মুক্ত হয়। পরবর্তীতে ২৮/৬/২০২৫ তারিখ Y স্বত্ব সারাতে সন দখলের মামলা করে। উক্ত মামলার তামাদির বিষয়ে The Limitation Act, 1908 এর প্রাসঙ্গিক বিধান উল্লেখ্য আপনার মতামত প্রদান করুন। [≈৪+৪=৮]',
    en: 'a) "In some instances, the Limitation Act, 1908 creates ownership, rights and title without deeds." Describe referring concerned sections. [7]\n\nb) What is the effect of fraud in computing the period of limitation? Explain with illustration. Y became insane on 1/3/2008 while enjoying 10 decimals of land inherited from his father. On 4/6/2008, Z dispossessed Y from the land and claimed his ownership. Y recovered from insanity on 9/7/2020. Afterwards on 28/6/2025 Y filed a suit for declaration of title and recovery of khas possession. Give your opinion regarding limitation of the said suit mentioning relevant provisions of the Limitation Act, 1908. [4+4=8]',
  },
  {
    n: 12,
    group: 'চ',
    bn: "ক) 'It is the duty of an advocate to maintain towards the courts a respectful attitude, not for the sake of the temporary incumbent of judicial office, but for the maintenance of its supreme importance.'— The Canons of Professional Conduct and Etiquette এর সংশ্লিষ্ট বিধানের আলোকে নীতিটি ব্যাখ্যা করুন। [≈৫]\n\nখ) The Bangladesh Legal Practitioners and Bar Council Order, 1972— এর বিধান অনুযায়ী ট্রাইব্যুনাল এর গঠন ও কার্যাবলী আলোচনা করুন। [≈৫]",
    en: "a) 'It is the duty of an advocate to maintain towards the courts a respectful attitude, not for the sake of the temporary incumbent of judicial office, but for the maintenance of its supreme importance'— Explain the principle in light of the pertinent provision of the Canons of Professional Conduct and Etiquette. [5]\n\nb) Discuss the constitution and functions of the Tribunal under the Bangladesh Legal Practitioners and Bar Council Order, 1972. [5]",
  },
  {
    n: 13,
    group: 'চ',
    bn: 'ক) আইনজীবীদের পেশাগত দক্ষতা ও শৃঙ্খলা রক্ষার ক্ষেত্রে বাংলাদেশ বার কাউন্সিল এর ভূমিকাকে আপনি কিভাবে মূল্যায়ন করবেন? [≈৩]\n\nখ) জনাব X, একজন অ্যাডভোকেট, মিস Y এর পক্ষে একটি পারিবারিক মোকদ্দমায় প্রতিবিধি করছিলেন। মামলার রায়ে আলাদত দেনমোহর ও খোরপোষ বাবদ ৫০০০০০ টাকা বাদী মিস Y বরাবর প্রদান করার জন্য বিবাদী পক্ষকে নির্দেশ প্রদান করেন। উক্ত টাকা বিবাদীপক্ষ হতে প্রাপ্ত হয়ে জনাব X ব্যক্তিগত একাউন্টে জমা করেন এবং এক মাসের বেশি সময় ধরে মিস Y কে এ বিষয়ে তিনি কিছু জানাননি। পরবর্তীতে মিস Y জানতে চাইলে তিনি স্বীকার করেন যে, চেম্বার খরচ মেটাতে ঐ টাকার একটি অংশ তিনি খরচ করেছেন এবং শীঘ্রই তা ফেরত দেবেন বলে আশ্বাস দেন। আপনি কি মনে করেন যে, জনাব X এর কাজ The Canons of Professional Conduct and Etiquette এর লঙ্ঘন? এক্ষেত্রে মিস Y জনাব X এর বিরুদ্ধে একটি অভিযোগ দায়েরে মনস্থ করে আপনাকে নিযুক্ত করেন। সংশ্লিষ্ট বিধান উল্লেখপূর্বক বাংলাদেশ বার কাউন্সিল এর যথাযথ কর্তৃপক্ষ নিকট দায়েরের জন্য একটি দরখাস্ত মুসাবিদা করুন। [≈৭]',
    en: 'a) How would you evaluate the role of Bangladesh Bar Council in upholding the professional efficiency and discipline of lawyers? [3]\n\nb) Mr. X, an Advocate, was representing Ms. Y in a family suit. In the Judgment of the suit the court ordered the defendant to pay Tk. 500000/- as dower and maintenance to Ms. Y. After receiving the money from the defendant side, Mr. X deposited the same to his personal bank account and he delayed informing Ms. Y for over a month. Subsequently, being inquired by Ms. Y, he admitted to using a portion of the funds to cover his chamber expenses and promised to return it soon. Do you consider such practice of Mr. X as a breach of the Canons of Professional Conduct and Etiquette? Ms. Y decides to complain against Mr. X and appoints you. Draft an application to be filed to the appropriate authority of the Bangladesh Bar Council referring relevant provisions. [7]',
  },
].map((q) => writtenAsset({ year: '2025', n: q.n, group: q.group, promptBn: q.bn, promptEn: q.en, prefix: 'US' }))

const hcPack = batchEnvelope({
  batchId: 'BATCH-2026-09-046-HC-WRITTEN-2016-2017-WEB',
  purpose:
    'Web-photo OCR of HC Permission written 2016 (9 Jan) and 2017. AUTHENTIC_REPORTED_QUESTION. Photographs hosted on QuesBankBD. Not an official download. No model answers. No HC MCQ invented.',
  assets: [...hc2016, ...hc2017],
  extra: { exam_years: ['2016', '2017'], hc_mcq_invented: false },
})
writeJson(join(outMobile, 'hc_written_2016_2017.json'), hcPack)

const bar045 = batchEnvelope({
  batchId: 'BATCH-2026-09-045-WRITTEN-2023-WEB',
  purpose:
    'Web-photo OCR of Bar Council written 2023 (23 Dec 2023). AUTHENTIC_REPORTED_QUESTION. BD Law Post photographs of the printed paper. Not an official PDF. No model answers.',
  assets: w2023,
  extra: { exam_years: ['2023'] },
})
writeJson(join(outBar, 'batch-2026-09-045-written-2023-web.json'), bar045)
writeJson(join(outMobile, 'bar_batch_045.json'), bar045)

const pack044Path = join(outMobile, 'bar_batch_044.json')
const pack044 = JSON.parse(readFileSync(pack044Path, 'utf8'))
pack044.assets = pack044.assets.map((a) => {
  if (a.exam_year !== '2025') return a
  const flags = (a.flags || []).filter((f) => f !== 'page_1_only')
  if (!flags.includes('web_photo_ocr')) flags.push('web_photo_ocr')
  return {
    ...a,
    flags,
    flag_note:
      'Page 1 was user photo OCR. Pages 2+ found as BD Law Post photographs of the same 28 Jun 2025 paper. page_1_only removed. Still ocr_unverified. No model answers invented.',
  }
})
const existing2025 = new Set(pack044.assets.filter((a) => a.exam_year === '2025').map((a) => a.content_id))
for (const extra of w2025extra) {
  if (!existing2025.has(extra.content_id)) pack044.assets.push(extra)
}
pack044.asset_count = pack044.assets.length
pack044.batch_purpose =
  'User-supplied written 2017, 2020, 2021, 2022 + 2025 full paper (page 1 user OCR + pages 2–4 web photos). No invented model answers.'
writeJson(pack044Path, pack044)
writeJson(join(outBar, 'batch-2026-09-044-written-2017-2025-user.json'), pack044)

const n2025 = pack044.assets.filter((a) => a.exam_year === '2025').length
console.log(
  JSON.stringify(
    {
      hc_2016: hc2016.length,
      hc_2017: hc2017.length,
      written_2023: w2023.length,
      written_2025_total: n2025,
      bar_045: bar045.asset_count,
    },
    null,
    2,
  ),
)
