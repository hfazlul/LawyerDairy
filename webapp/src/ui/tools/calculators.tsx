'use client'

import { useMemo, useState } from 'react'
import { COURT_FEE_ITEMS, COURT_FEE_SOURCE_BN, computeCourtFee } from '@/lib/tools/court-fee'
import { LIMITATION_RULES, computeLimitation, isoDate } from '@/lib/tools/limitation'
import { ANA_GONDA_TABLE, khatianShare, shareFromAnaGonda } from '@/lib/tools/ana-gonda'
import { computeFaraiz } from '@/lib/tools/faraiz'
import { KABIN_LICENCE_ROWS, KABIN_SRO, computeKabinDivorceFee, computeKabinMarriageFee } from '@/lib/tools/kabin-fee'
import { DEED_KINDS, STAMP_SOURCES, computeDeedFees, type DeedKind } from '@/lib/tools/stamp-duty'
import { MOUZA_DIVISIONS, MOUZA_PORTAL_LINKS, mouzaDistrictsFor, mouzaRateJudiciaryUrl } from '@/lib/tools/mouza-districts'
import { TAX_SOURCE, computeIndividualTax } from '@/lib/tools/tax'
import { Field, NumInput, Result, Warn } from './bits'

export function CourtFeeCalc() {
  const [id, setId] = useState('money')
  const [value, setValue] = useState('100000')
  const item = COURT_FEE_ITEMS.find((x) => x.id === id)!
  const out = computeCourtFee(item, item.needsValue ? Number(value) || 0 : undefined)
  return (
    <>
      <h1 className="hero-title">কোর্ট ফি / Court fee</h1>
      <Warn>{COURT_FEE_SOURCE_BN}</Warn>
      <Field label="ধরন / Kind">
        <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
          {COURT_FEE_ITEMS.map((x) => (
            <option key={x.id} value={x.id}>{x.titleBn} · {x.titleEn}</option>
          ))}
        </select>
      </Field>
      {item.needsValue ? (
        <Field label="দাবির মূল্য (৳) / Claim value">
          <NumInput value={value} onChange={setValue} />
        </Field>
      ) : null}
      {out ? (
        <Result>
          <strong>৳{Math.round(out.amount).toLocaleString('en-BD')}</strong>
          <p>{out.breakdownBn}</p>
          <p className="muted" style={{ color: '#c5d0de' }}>{out.breakdownEn}</p>
          {out.section35a ? <p>ধারা ৩৫এ অতিরিক্ত ফি প্রযোজ্য হতে পারে — এখানে যোগ হয়নি।</p> : null}
        </Result>
      ) : null}
    </>
  )
}

export function LimitationCalc() {
  const kinds = Object.entries(LIMITATION_RULES)
  const [kind, setKind] = useState('appealDistrictJudge')
  const [base, setBase] = useState('2026-09-01')
  const out = computeLimitation(kind, new Date(base + 'T00:00:00'))
  return (
    <>
      <h1 className="hero-title">তামাদি / Limitation</h1>
      <Warn>Limitation Act 1908 — বাংলাদেশ প্রথম তফসিল। শুক্র-শনি ধারা ৪-এ সরে যায়। নির্দেশক।</Warn>
      <Field label="অনুচ্ছেদ / Article">
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          {kinds.map(([k, r]) => (
            <option key={k} value={k}>{r.labelBn} · {r.ruleRefEn}</option>
          ))}
        </select>
      </Field>
      <Field label="শুরুর তারিখ / Base date">
        <input className="input" type="date" value={base} onChange={(e) => setBase(e.target.value)} />
      </Field>
      {out ? (
        <Result>
          <p>নির্ধারিত {out.days} দিন/বছর-সমতুল্য</p>
          <p>শেষ তারিখ: <strong>{isoDate(out.dueDate)}</strong></p>
          <p>{out.ruleRefBn}</p>
          <p>{out.isExpired ? 'সময় পার' : `বাকি ${out.daysRemaining} দিন`}</p>
        </Result>
      ) : null}
    </>
  )
}

export function AnaGondaCalc() {
  const [total, setTotal] = useState('100')
  const [ana, setAna] = useState('8')
  const [ganda, setGanda] = useState('0')
  const [katha, setKatha] = useState('1.65')
  const r = shareFromAnaGonda(
    { ana: Number(ana) || 0, ganda: Number(ganda) || 0 },
    Number(total) || 0,
    Number(katha) || 1.65,
  )
  return (
    <>
      <h1 className="hero-title">আনা-গন্ডা / Ana-gonda</h1>
      <Warn>প্রচলিত খতিয়ান একক: ১৬ আনা = সম্পূর্ণ। অফিসিয়াল খতিয়ান বা মৌজা রেট নয়।</Warn>
      <Field label="মোট শতক / Total shotok"><NumInput value={total} onChange={setTotal} /></Field>
      <Field label="আনা / Ana"><NumInput value={ana} onChange={setAna} /></Field>
      <Field label="গন্ডা / Ganda"><NumInput value={ganda} onChange={setGanda} /></Field>
      <Field label="কাঠা হার (শতক) / Katha rate"><NumInput value={katha} onChange={setKatha} /></Field>
      <Result>
        <p>ভগ্নাংশ {r.fraction.toFixed(6)} · শতক {r.shotok.toFixed(4)} · কাঠা {r.katha.toFixed(4)} · একর {r.acre.toFixed(4)}</p>
      </Result>
      <table className="table">
        <tbody>
          {ANA_GONDA_TABLE.map((row) => (
            <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export function KhatianCalc() {
  const [total, setTotal] = useState('100')
  const [num, setNum] = useState('1')
  const [den, setDen] = useState('2')
  const [katha, setKatha] = useState('1.65')
  const r = khatianShare(Number(total) || 0, Number(num) || 0, Number(den) || 0, Number(katha) || 1.65)
  return (
    <>
      <h1 className="hero-title">খতিয়ান হিস্যা / Khatian share</h1>
      <Warn>ভগ্নাংশ সাহায্যকারী মাত্র — SA/RS/BS খতিয়ান নয়। ই-পর্চা: eporcha.gov.bd । ফরায়েজ আলাদা পাতায়।</Warn>
      <Field label="মোট শতক / Total shotok"><NumInput value={total} onChange={setTotal} /></Field>
      <Field label="লব / Numerator"><NumInput value={num} onChange={setNum} /></Field>
      <Field label="হর / Denominator"><NumInput value={den} onChange={setDen} /></Field>
      <Field label="কাঠা হার / Katha rate"><NumInput value={katha} onChange={setKatha} /></Field>
      {r ? (
        <Result>
          <p>হিস্যা {r.shotok.toFixed(4)} শতক · {r.katha.toFixed(4)} কাঠা · {r.acre.toFixed(4)} একর</p>
        </Result>
      ) : <p className="error">হর শূন্য হতে পারে না।</p>}
      <p><a href="https://eporcha.gov.bd/" target="_blank" rel="noreferrer">ই-পর্চা খুলুন</a></p>
    </>
  )
}

export function FaraizCalc() {
  const [estate, setEstate] = useState('1000000')
  const [male, setMale] = useState(true)
  const [wives, setWives] = useState('0')
  const [husband, setHusband] = useState(false)
  const [sons, setSons] = useState('1')
  const [daughters, setDaughters] = useState('0')
  const [father, setFather] = useState(false)
  const [mother, setMother] = useState(false)
  const out = computeFaraiz({
    estate: Number(estate) || 0,
    deceasedMale: male,
    wives: Number(wives) || 0,
    husband,
    sons: Number(sons) || 0,
    daughters: Number(daughters) || 0,
    father,
    mother,
  })
  return (
    <>
      <h1 className="hero-title">ফরায়েজ / Faraiz</h1>
      <Warn>হানাফি — কুরআন ৪:১১, ৪:১২, ৪:১৭৬ ও মুসলিম পার্সোনাল ল অ্যাক্ট ১৯৩৭। শিক্ষামূলক; দূরবর্তী আসাবা নেই।</Warn>
      <Field label="সম্পত্তি (৳) / Estate"><NumInput value={estate} onChange={setEstate} /></Field>
      <Field label="মৃত / Deceased">
        <select className="input" value={male ? 'm' : 'f'} onChange={(e) => setMale(e.target.value === 'm')}>
          <option value="m">পুরুষ / Male</option>
          <option value="f">নারী / Female</option>
        </select>
      </Field>
      {male ? (
        <Field label="স্ত্রী সংখ্যা / Wives"><NumInput value={wives} onChange={setWives} /></Field>
      ) : (
        <label className="label"><input type="checkbox" checked={husband} onChange={(e) => setHusband(e.target.checked)} /> স্বামী / Husband</label>
      )}
      <Field label="পুত্র / Sons"><NumInput value={sons} onChange={setSons} /></Field>
      <Field label="কন্যা / Daughters"><NumInput value={daughters} onChange={setDaughters} /></Field>
      <label className="label"><input type="checkbox" checked={father} onChange={(e) => setFather(e.target.checked)} /> পিতা / Father</label>
      <label className="label"><input type="checkbox" checked={mother} onChange={(e) => setMother(e.target.checked)} /> মাতা / Mother</label>
      {out.errorBn ? <p className="error">{out.errorBn}</p> : (
        <Result>
          {out.awl ? <p>আউল হয়েছে</p> : null}
          {out.radd ? <p>রদ্দ প্রয়োগ</p> : null}
          {out.shares.map((s) => (
            <p key={s.id}><strong>{s.nameBn}</strong> ({s.nameEn}) · {s.fractionBn} · ৳{Math.round(s.amount).toLocaleString('en-BD')} · {s.roleBn}</p>
          ))}
        </Result>
      )}
    </>
  )
}

export function KabinCalc() {
  const [dower, setDower] = useState('100000')
  const [divorce, setDivorce] = useState(false)
  const out = divorce ? computeKabinDivorceFee() : computeKabinMarriageFee(Number(dower) || 0)
  return (
    <>
      <h1 className="hero-title">কাবিন / নিকাহ ফি</h1>
      <p className="muted">Kabin / nikah registrar fee</p>
      <Warn>
        {KABIN_SRO.noBn} · {KABIN_SRO.dateBn} (গেজেট {KABIN_SRO.gazetteBn})। বিধিমালা ২০০৯ বিধি ২১ সংশোধন।
        {' '}<a href={KABIN_SRO.pdf} target="_blank" rel="noreferrer">DPP PDF</a>
        । ২০০৳ তল ও অতিরিক্ত লক্ষে ১০০৳ সেই এস.আর.ও.-তে বদলায়নি। এস.আর.ও. ৯২/৪৬৩-আইন/২০২৫ অনলাইন পদ্ধতি — ফি ছক নয়।
      </Warn>
      <label className="label">
        <input type="checkbox" checked={divorce} onChange={(e) => setDivorce(e.target.checked)} /> তালাক নিবন্ধন / Divorce registration
      </label>
      {!divorce ? (
        <Field label="দেনমোহর (৳) / Dower"><NumInput value={dower} onChange={setDower} /></Field>
      ) : null}
      <Result>
        <strong>৳{out.fee.toLocaleString('en-BD')}</strong>
        <p>{out.breakdownBn}</p>
        <p style={{ color: '#c5d0de' }}>{out.breakdownEn}</p>
      </Result>
      <h2>লাইসেন্স ফি (একই গেজেট)</h2>
      <table className="table">
        <tbody>
          {KABIN_LICENCE_ROWS.map((r) => (
            <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="muted">পারিবারিক আরজির ২০০৳ (২০২৩ ধারা ২৫) কাবিন ফি নয়। ধারা ৯: পক্ষদের অনুলিপি বিনা খরচে।</p>
    </>
  )
}

export function StampCalc() {
  const [kind, setKind] = useState<DeedKind>('conveyance')
  const [value, setValue] = useState('1000000')
  const meta = DEED_KINDS.find((x) => x.kind === kind)!
  const out = computeDeedFees(kind, Number(value) || 0)
  return (
    <>
      <h1 className="hero-title">স্ট্যাম্প ও নিবন্ধন / Stamp & registration</h1>
      <Warn>
        স্ট্যাম্প: অর্থ আইন ২০২২ তফসিল ১ (১ জুলাই ২০২২)। নিবন্ধন ফি: এস. আর. ও. ২৫৪-আইন/২০১৪ (সাল লেবেল)। মৌজা রেট, সিটি ট্যাক্স, উৎসে কর নেই। জাতীয় ৩%+২% বানানো হয়নি।
      </Warn>
      <Field label="দলিল / Instrument">
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value as DeedKind)}>
          {DEED_KINDS.map((x) => (
            <option key={x.kind} value={x.kind}>{x.titleBn} · {x.titleEn}</option>
          ))}
        </select>
      </Field>
      {meta.needsValue ? (
        <Field label="মূল্য (৳) / Value"><NumInput value={value} onChange={setValue} /></Field>
      ) : null}
      <Result>
        {out.stamp != null ? <p>স্ট্যাম্প ৳{Math.round(out.stamp).toLocaleString('en-BD')} — {out.stampNoteBn}</p> : null}
        {out.registration != null ? <p>নিবন্ধন (২০১৪) ৳{Math.round(out.registration).toLocaleString('en-BD')} — {out.regNoteBn}</p> : null}
        <p style={{ color: '#c5d0de' }}>{out.stampNoteEn} · {out.regNoteEn}</p>
      </Result>
      <p>
        <a href={STAMP_SOURCES.schIPdf} target="_blank" rel="noreferrer">তফসিল ১ PDF</a>
        {' · '}
        <a href={STAMP_SOURCES.regFee2014Pdf} target="_blank" rel="noreferrer">নিবন্ধন ছক ২০১৪ PDF</a>
        {' · '}
        <a href={STAMP_SOURCES.nbrFinanceActs} target="_blank" rel="noreferrer">NBR অর্থ আইন</a>
      </p>
    </>
  )
}

export function MouzaCalc() {
  const [div, setDiv] = useState('')
  const districts = useMemo(() => mouzaDistrictsFor(div || null), [div])
  return (
    <>
      <h1 className="hero-title">মৌজা রেট / Mouza rate</h1>
      <Warn>
        সারাদেশের হার এখানে নেই। বিভাগ → জেলা চাপলে judiciary.gov.bd-এর সরকারি Mouza Rate পাতা খোলে। ঢাকা মেট্রো: metrodhaka। খালি পাতা হলে ভূমি মন্ত্রণালয় বা সাব-রেজিস্ট্রি।
      </Warn>
      <div className="tools-links">
        {MOUZA_PORTAL_LINKS.map((l) => (
          <a key={l.href} className="btn ghost" href={l.href} target="_blank" rel="noreferrer">{l.bn}</a>
        ))}
      </div>
      <Field label="বিভাগ / Division">
        <select className="input" value={div} onChange={(e) => setDiv(e.target.value)}>
          <option value="">সব / All</option>
          {MOUZA_DIVISIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.bn} · {d.en}</option>
          ))}
        </select>
      </Field>
      <div className="tools-grid" style={{ marginTop: '1rem' }}>
        {districts.map((d) => (
          <a
            key={d.slug}
            className="tools-card"
            href={mouzaRateJudiciaryUrl(d.slug)}
            target="_blank"
            rel="noreferrer"
          >
            <strong>{d.nameBn}</strong>
            <span className="muted">{d.nameEn} · {d.divisionBn}</span>
          </a>
        ))}
      </div>
    </>
  )
}

export function TaxCalc() {
  const [kind, setKind] = useState('general')
  const [salary, setSalary] = useState('0')
  const [other, setOther] = useState('600000')
  const [invest, setInvest] = useState('0')
  const [first, setFirst] = useState(false)
  const r = computeIndividualTax({
    kind,
    salary: Number(salary) || 0,
    otherIncome: Number(other) || 0,
    investment: Number(invest) || 0,
    firstTimeFiler: first,
  })
  return (
    <>
      <h1 className="hero-title">আয়কর / Income tax</h1>
      <Warn>{TAX_SOURCE} এটি NBR রিটার্ন নয়।</Warn>
      <Field label="শ্রেণি / Class">
        <select className="input" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="general">সাধারণ / General</option>
          <option value="woman">নারী / ৬৫+ / Woman</option>
          <option value="disabled">প্রতিবন্ধী / Disabled</option>
          <option value="freedom">মুক্তিযোদ্ধা / যুদ্ধাহত / Freedom fighter</option>
        </select>
      </Field>
      <Field label="চাকরি আয় (৳) / Salary"><NumInput value={salary} onChange={setSalary} /></Field>
      <Field label="অন্যান্য আয় (৳) / Other income"><NumInput value={other} onChange={setOther} /></Field>
      <Field label="বিনিয়োগ (৳) / Investment"><NumInput value={invest} onChange={setInvest} /></Field>
      <label className="label"><input type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)} /> প্রথমবার ফাইলার / First-time filer</label>
      <Result>
        <p>করমুক্ত সীমা ৳{r.nilBand.toLocaleString('en-BD')}</p>
        <p>মোট আয় ৳{Math.round(r.total).toLocaleString('en-BD')}</p>
        <p>স্ল্যাব কর ৳{Math.round(r.tax0).toLocaleString('en-BD')}</p>
        <p>রয়াত ৳{Math.round(r.rebate).toLocaleString('en-BD')}</p>
        <p><strong>প্রদেয় ৳{Math.round(r.payable).toLocaleString('en-BD')}</strong></p>
      </Result>
    </>
  )
}
