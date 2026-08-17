import { useState, useEffect } from "react";

// ─── Design Tokens ──────────────────────────────────────────
const C = {
  ink: '#0E1B2C', navy: '#12263F', navySoft: '#1E3A5F',
  brass: '#C6A15B', brassLight: '#E7D3A8', brassLighter: '#F5ECD9',
  parchment: '#F7F3EA', surface: '#FFFFFF', border: '#E5DFD2',
  success: '#1F7A5A', successBg: '#E8F5EF',
  warning: '#B8860B',
  danger: '#A4262C', dangerBg: '#FDECEA',
  info: '#2E5F8A', infoBg: '#E8F0F8',
  muted: '#94A3B8',
};
const FONT = "'Hind Siliguri', system-ui, sans-serif";
const MONO = "'Roboto Mono', monospace";

// ─── Sample Data ────────────────────────────────────────────
const CASES = [
  { id: '1', caseNo: 'দেওয়ানী ১২৩/২০২৩', type: 'দেওয়ানী', client: 'মোঃ রফিকুল ইসলাম', court: 'যুগ্ম জেলা জজ, ১ম আদালত', room: 'কক্ষ ৩', lastOutcome: 'সাক্ষ্য গ্রহণ', nextDate: 'আজ', deadline: 3, priority: 'high', status: 'active', today: true },
  { id: '2', caseNo: 'ফৌজদারী ৩৪৫/২০২৪', type: 'ফৌজদারী', client: 'আব্দুল করিম ও অন্যান্য', court: 'যুগ্ম জেলা জজ, ১ম আদালত', room: 'কক্ষ ৩', lastOutcome: 'সময়ের আরজি', nextDate: 'আজ', deadline: null, priority: 'medium', status: 'active', today: true },
  { id: '3', caseNo: 'রিট পিটিশন ৭৮/২০২৪', type: 'রিট', client: 'সুমাইয়া খানম বনাম বাংলাদেশ সরকার', court: 'হাইকোর্ট বিভাগ', room: 'কক্ষ ১২', lastOutcome: 'যুক্তিতর্ক', nextDate: 'আজ', deadline: null, priority: 'high', status: 'active', today: true },
  { id: '4', caseNo: 'আপিল ৫৬/২০২৩', type: 'আপিল', client: 'নূর মোহাম্মদ', court: 'জেলা ও দায়রা জজ আদালত', room: 'কক্ষ ১', lastOutcome: 'হাজিরা', nextDate: '১২ আগস্ট', deadline: 6, priority: 'low', status: 'active', today: false },
  { id: '5', caseNo: 'পারিবারিক ৯১/২০২৩', type: 'পারিবারিক', client: 'রাহেলা বেগম', court: 'পারিবারিক আদালত', room: 'কক্ষ ৫', lastOutcome: 'জেরা', nextDate: '১৮ আগস্ট', deadline: null, priority: 'medium', status: 'active', today: false },
  { id: '6', caseNo: 'দেওয়ানী ২২০/২০২২', type: 'দেওয়ানী', client: 'করিম ট্রেডার্স লিমিটেড', court: 'সহকারী জজ আদালত', room: 'কক্ষ ২', lastOutcome: 'আদেশ', nextDate: 'নিষ্পত্তি', deadline: null, priority: 'low', status: 'closed', today: false },
];
const TODAY = CASES.filter(c => c.today);
const OUTCOMES = ['হাজিরা', 'সময়ের আরজি', 'সাক্ষ্য গ্রহণ', 'জেরা', 'যুক্তিতর্ক', 'আদেশ', 'নথি তলব', 'স্থগিত', 'নিষ্পত্তি'];
const TYPE_ICON = { দেওয়ানী: '⚖️', ফৌজদারী: '🔒', রিট: '📜', আপিল: '↗', পারিবারিক: '👨‍👩‍👧' };
const PRI_COL = { high: C.danger, medium: C.warning, low: C.success };
const groupBy = (arr, key) => arr.reduce((a, item) => { (a[item[key]] = a[item[key]] || []).push(item); return a; }, {});

// ─── Minimal SVG Icons ──────────────────────────────────────
const PATHS = {
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  briefcase: "M20 7H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  tool: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  plus: "M12 5v14M5 12h14",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0",
  x: "M18 6L6 18M6 6l12 12",
};
const Icon = ({ n, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {(PATHS[n] || '').split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
  </svg>
);
const WA = ({ size = 14, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color || C.success}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// ─── HOME SCREEN ────────────────────────────────────────────
function HomeScreen({ onCase, onOutcome }) {
  const courts = groupBy(TODAY, 'court');
  const urgent = TODAY.filter(c => c.deadline && c.deadline <= 7);
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.parchment }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '46px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.brassLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>বুধবার, ৫ আগস্ট ২০২৬</div>
            <div style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>আজকের বোর্ড</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 4 }}>{TODAY.length}টি শুনানি · {Object.keys(courts).length}টি আদালত</div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 12, padding: 10, cursor: 'pointer', position: 'relative' }}>
            <Icon n="bell" size={18} color="#fff" />
            <span style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, background: C.danger, borderRadius: 4, border: '1.5px solid ' + C.navy }} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[['48', 'মোট মামলা', C.brass], ['31', 'সক্রিয়', C.success], ['17', 'নিষ্পত্তি', C.muted]].map(([v, l, col]) => (
            <div key={l} style={{ flex: 1, background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: col }}>{v}</div>
              <div style={{ fontFamily: FONT, fontSize: 10, color: C.muted, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Deadline Alert */}
      {urgent.length > 0 && (
        <div style={{ margin: '12px 16px 0', background: C.dangerBg, border: '1px solid rgba(164,38,44,0.2)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⏰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.danger }}>Limitation সতর্কতা</div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.danger, opacity: 0.8, marginTop: 1 }}>{urgent[0].caseNo} — আপিলের মেয়াদ মাত্র {urgent[0].deadline} দিন বাকি</div>
          </div>
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.danger, fontWeight: 700 }}>দেখুন →</span>
        </div>
      )}
      {/* Court Groups */}
      <div style={{ padding: '12px 16px 24px' }}>
        {Object.entries(courts).map(([court, cases]) => (
          <div key={court} style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 3, height: 30, borderRadius: 2, background: C.brass, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.navy }}>{court}</div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted }}>{cases[0].room} · {cases.length}টি মামলা</div>
              </div>
            </div>
            {cases.map(c => (
              <div key={c.id} onClick={() => onCase(c)}
                style={{ background: C.surface, borderRadius: 12, padding: '14px 14px 12px', marginBottom: 10, border: `1px solid ${C.border}`, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: PRI_COL[c.priority] }} />
                <div style={{ paddingLeft: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 14 }}>{TYPE_ICON[c.type] || '⚖️'}</span>
                        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.navy, letterSpacing: 0.3 }}>{c.caseNo}</span>
                      </div>
                      <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: C.ink }}>{c.client}</div>
                    </div>
                    {c.deadline && (
                      <div style={{ background: C.dangerBg, borderRadius: 8, padding: '4px 8px', border: '1px solid rgba(164,38,44,0.2)', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, color: C.danger }}>⏰ {c.deadline} দিন</div>
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginBottom: 10 }}>গত ফলাফল: {c.lastOutcome}</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={e => { e.stopPropagation(); onOutcome(c); }}
                      style={{ flex: 1.2, background: C.brassLighter, border: `1px solid rgba(198,161,91,0.3)`, borderRadius: 8, padding: '7px 4px', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.warning, cursor: 'pointer' }}>
                      ✓ ফলাফল
                    </button>
                    <button onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: C.successBg, border: '1px solid rgba(31,122,90,0.2)', borderRadius: 8, padding: '7px 4px', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.success, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <WA size={12} color={C.success} /> জানান
                    </button>
                    <button onClick={e => e.stopPropagation()}
                      style={{ flex: 1, background: C.infoBg, border: '1px solid rgba(46,95,138,0.2)', borderRadius: 8, padding: '7px 4px', fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.info, cursor: 'pointer' }}>
                      📋 নথি
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        {/* Tomorrow preview */}
        <div style={{ background: C.surface, borderRadius: 12, padding: '14px 16px', border: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 10 }}>কালকের ঝলক — ৬ আগস্ট</div>
          {CASES.filter(c => !c.today && c.status === 'active').slice(0, 2).map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: i > 0 ? 8 : 0, borderTop: i > 0 ? `1px solid ${C.border}` : 'none' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: C.brass, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.navy }}>{c.caseNo}</div>
                <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted }}>{c.client.split(' ').slice(0, 3).join(' ')} · {c.court.split(',')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CASES SCREEN ───────────────────────────────────────────
function CasesScreen({ onCase }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const shown = CASES.filter(c => (filter === 'all' || c.status === filter) && (!q || c.caseNo.includes(q) || c.client.includes(q)));
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: C.navy, padding: '46px 16px 14px' }}>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 12 }}>মামলা তালিকা</div>
        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '0 12px' }}>
          <Icon n="search" size={15} color={C.muted} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="কেস নম্বর বা ক্লায়েন্ট..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '10px 8px', fontFamily: FONT, fontSize: 13, color: '#fff' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: C.parchment, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {[['all', 'সব', 48], ['active', 'সক্রিয়', 31], ['closed', 'নিষ্পত্তি', 17]].map(([id, label, count]) => (
          <button key={id} onClick={() => setFilter(id)}
            style={{ padding: '6px 14px', borderRadius: 20, border: filter === id ? `1.5px solid ${C.brass}` : `1px solid ${C.border}`, background: filter === id ? C.brassLighter : C.surface, fontFamily: FONT, fontSize: 12, fontWeight: filter === id ? 600 : 400, color: filter === id ? C.warning : C.muted, cursor: 'pointer' }}>
            {label} ({count})
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', background: C.parchment }}>
        {shown.map(c => (
          <div key={c.id} onClick={() => onCase(c)}
            style={{ background: C.surface, borderRadius: 12, padding: '13px 14px', marginBottom: 10, border: `1px solid ${C.border}`, cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>{TYPE_ICON[c.type] || '⚖️'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.navy }}>{c.caseNo}</span>
                <span style={{ fontFamily: FONT, fontSize: 10, color: c.status === 'closed' ? C.muted : C.success, background: c.status === 'closed' ? '#f1f5f9' : C.successBg, padding: '2px 8px', borderRadius: 10, fontWeight: 500, flexShrink: 0 }}>
                  {c.status === 'active' ? '● সক্রিয়' : '✓ নিষ্পত্তি'}
                </span>
              </div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: C.ink, marginTop: 3 }}>{c.client}</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 2 }}>{c.court}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontFamily: FONT, fontSize: 11, color: C.info }}>📅 {c.nextDate}</span>
                {c.deadline && <span style={{ fontFamily: FONT, fontSize: 11, color: C.danger, fontWeight: 600 }}>⏰ {c.deadline} দিন বাকি</span>}
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, fontFamily: FONT, fontSize: 13, color: C.muted }}>কোনো মামলা পাওয়া যায়নি</div>
        )}
      </div>
    </div>
  );
}

// ─── CALENDAR SCREEN ────────────────────────────────────────
function CalendarScreen() {
  const [sel, setSel] = useState(5);
  const hearings = { 5: 3, 7: 2, 10: 1, 12: 4, 15: 2, 18: 1, 20: 3, 25: 2 };
  const holidays = [14, 21];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.parchment }}>
      <div style={{ background: C.navy, padding: '46px 16px 18px' }}>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: '#fff' }}>আগস্ট ২০২৬</div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 3 }}>রবি–বৃহস্পতি কর্মদিবস · শুক্র-শনি বন্ধ</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '8px 8px 4px' }}>
        {['রবি', 'সোম', 'মঙ্গ', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'].map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontFamily: FONT, fontSize: 10, fontWeight: 600, color: i >= 5 ? C.danger : C.muted }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: C.surface, padding: '4px 8px 12px', gap: 2 }}>
        {Array(6).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
          const col = (d + 5) % 7;
          const isOff = col >= 5, isHol = holidays.includes(d), isSel = d === sel, count = hearings[d];
          return (
            <div key={d} onClick={() => !isOff && !isHol && setSel(d)}
              style={{ textAlign: 'center', padding: '5px 2px', borderRadius: 8, cursor: !isOff && !isHol ? 'pointer' : 'default', background: isSel ? C.brass : 'transparent', opacity: isOff || isHol ? 0.35 : 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: isSel ? 700 : 400, color: isSel ? '#fff' : C.ink }}>{d}</div>
              {count && !isHol && (
                <div style={{ width: 18, height: 14, borderRadius: 7, background: isSel ? 'rgba(255,255,255,0.3)' : C.brassLighter, margin: '2px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: isSel ? '#fff' : C.warning }}>{count}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 10 }}>
          {sel} আগস্টের শুনানি ({hearings[sel] || 0}টি)
        </div>
        {sel === 5 ? TODAY.map(c => (
          <div key={c.id} style={{ background: C.surface, borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.navy }}>{c.caseNo}</div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 3 }}>{c.client} · {c.court.split(',')[0]}</div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: 28, fontFamily: FONT, fontSize: 13, color: C.muted }}>
            {hearings[sel] ? `${hearings[sel]}টি শুনানি আছে — ডেটা লোড হবে` : 'এই দিনে কোনো শুনানি নেই'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TOOLS SCREEN ───────────────────────────────────────────
function ToolsScreen() {
  const tools = [
    { e: '⏳', l: 'Limitation Calculator', d: 'আপিল ও রিভিশনের মেয়াদ', hot: true },
    { e: '🧾', l: 'Court Fee Calculator', d: 'কোর্ট ফি তফসিল অনুযায়ী' },
    { e: '📖', l: 'Bare Acts Library', d: 'bdlaws.minlaw.gov.bd' },
    { e: '🌾', l: 'খতিয়ান Calculator', d: 'জমির অংশ হিসাব' },
    { e: '✅', l: 'হিয়ারিং Checklist', d: 'প্রস্তুতির তালিকা' },
    { e: '🖨️', l: 'ডায়েরি প্রিন্ট', d: 'মাসিক PDF রিপোর্ট' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.parchment }}>
      <div style={{ background: C.navy, padding: '46px 16px 20px' }}>
        <div style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: '#fff' }}>সরঞ্জাম</div>
        <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 3 }}>আইনি হিসাব ও রেফারেন্স</div>
      </div>
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tools.map(t => (
          <div key={t.l} style={{ background: t.hot ? C.brassLighter : C.surface, borderRadius: 14, padding: '16px 14px', border: t.hot ? `1.5px solid rgba(198,161,91,0.4)` : `1px solid ${C.border}`, cursor: 'pointer' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{t.e}</div>
            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 600, color: C.navy, lineHeight: 1.3 }}>{t.l}</div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>{t.d}</div>
            {t.hot && <div style={{ fontFamily: FONT, fontSize: 10, color: C.brass, fontWeight: 700, marginTop: 8 }}>★ Unique Feature</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CASE DETAIL MODAL ──────────────────────────────────────
function CaseDetailModal({ c, onClose, onOutcome }) {
  const [tab, setTab] = useState('তথ্য');
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 0.12, background: 'rgba(14,27,44,0.72)' }} onClick={onClose} />
      <div style={{ flex: 0.88, background: C.parchment, borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ textAlign: 'center', paddingTop: 10 }}>
          <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto' }} />
        </div>
        <div style={{ background: C.navy, padding: '12px 18px 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 26 }}>{TYPE_ICON[c.type] || '⚖️'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>{c.caseNo}</div>
              <div style={{ fontFamily: FONT, fontSize: 13, color: C.brassLight, marginTop: 2 }}>{c.client}</div>
              <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 1 }}>{c.court}</div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer' }}>
              <Icon n="x" size={16} color="#fff" />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => { onClose(); onOutcome(c); }}
              style={{ flex: 1, background: C.brass, border: 'none', borderRadius: 10, padding: '10px', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
              ✓ ফলাফল দিন
            </button>
            <button style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              📱 WhatsApp
            </button>
          </div>
          <div style={{ display: 'flex' }}>
            {['তথ্য', 'টাইমলাইন', 'নথি', 'ফি'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, background: 'none', border: 'none', padding: '8px 0', fontFamily: FONT, fontSize: 12, fontWeight: tab === t ? 700 : 400, color: tab === t ? C.brass : C.muted, cursor: 'pointer', borderBottom: `2px solid ${tab === t ? C.brass : 'transparent'}` }}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          {tab === 'তথ্য' && [['কেস নম্বর', c.caseNo], ['আদালত', c.court], ['কক্ষ', c.room], ['ক্লায়েন্ট', c.client], ['গত ফলাফল', c.lastOutcome], ['পরবর্তী তারিখ', c.nextDate], ['অগ্রাধিকার', c.priority === 'high' ? '🔴 উচ্চ' : c.priority === 'medium' ? '🟡 মাঝারি' : '🟢 কম']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '11px 0', gap: 12 }}>
              <div style={{ width: 100, fontFamily: FONT, fontSize: 12, color: C.muted, flexShrink: 0 }}>{k}</div>
              <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: C.ink }}>{v}</div>
            </div>
          ))}
          {tab === 'টাইমলাইন' && [
            { date: '৫ আগস্ট ২০২৬', action: 'শুনানি নির্ধারিত', note: 'আজকের বোর্ডে', cur: true },
            { date: '২১ জুলাই ২০২৬', action: 'সাক্ষ্য গ্রহণ', note: 'সাক্ষী জামাল উদ্দিন হাজির' },
            { date: '৫ জুলাই ২০২৬', action: 'সময়ের আরজি মঞ্জুর', note: '' },
            { date: '১৫ জুন ২০২৬', action: 'হাজিরা দিলাম', note: '' },
          ].map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: e.cur ? C.brass : C.border }} />
                {i < 3 && <div style={{ width: 2, flex: 1, minHeight: 18, background: C.border, margin: '3px 0' }} />}
              </div>
              <div>
                <div style={{ fontFamily: FONT, fontSize: 10, color: C.muted }}>{e.date}</div>
                <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: C.ink, marginTop: 2 }}>{e.action}</div>
                {e.note && <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 2 }}>{e.note}</div>}
              </div>
            </div>
          ))}
          {tab === 'নথি' && (
            <div>
              {[{ n: 'আরজি_২০২৩.pdf', s: '245 KB', d: '১২ জুন ২০২৩', i: '📄' }, { n: 'আদেশ_২১জুলাই.pdf', s: '120 KB', d: '২১ জুলাই ২০২৬', i: '📋' }].map((f, i) => (
                <div key={i} style={{ background: C.surface, borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{f.i}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: C.navy }}>{f.n}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 2 }}>{f.s} · {f.d}</div>
                  </div>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 11, color: C.info }}>দেখুন</button>
                </div>
              ))}
              <button style={{ width: '100%', background: C.brassLighter, border: `1.5px dashed rgba(198,161,91,0.5)`, borderRadius: 10, padding: 16, fontFamily: FONT, fontSize: 13, color: C.warning, cursor: 'pointer' }}>
                + স্ক্যান করে নথি যোগ করুন
              </button>
            </div>
          )}
          {tab === 'ফি' && (
            <div>
              <div style={{ background: C.navySoft, borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted }}>মোট বকেয়া</div>
                  <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: C.brass, marginTop: 4 }}>৳ ১৫,০০০</div>
                </div>
                <button style={{ background: C.brass, border: 'none', borderRadius: 10, padding: '8px 14px', fontFamily: FONT, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>+ আদায়</button>
              </div>
              {[{ l: 'ওকালতনামা ফি', a: '৳ ২০,০০০', d: '১২ জুন ২০২৩', col: C.info }, { l: 'আদায়', a: '-৳ ৫,০০০', d: '১৫ জুন ২০২৬', col: C.success }].map((f, i) => (
                <div key={i} style={{ background: C.surface, borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 500, color: C.ink }}>{f.l}</div>
                    <div style={{ fontFamily: FONT, fontSize: 11, color: C.muted, marginTop: 2 }}>{f.d}</div>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: f.col }}>{f.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── OUTCOME SHEET ──────────────────────────────────────────
function OutcomeSheet({ c, onClose }) {
  const [sel, setSel] = useState(null);
  const [date, setDate] = useState('2026-08-25');
  const [note, setNote] = useState('');
  if (!c) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, background: 'rgba(14,27,44,0.75)' }} onClick={onClose} />
      <div style={{ background: C.surface, borderRadius: '20px 20px 0 0', padding: '16px 20px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 12px' }} />
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.navy }}>আজকের ফলাফল</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 2 }}>{c.caseNo}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8 }}>কী হলো?</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {OUTCOMES.map(o => (
              <button key={o} onClick={() => setSel(o === sel ? null : o)}
                style={{ padding: '7px 13px', borderRadius: 20, border: sel === o ? `1.5px solid ${C.brass}` : `1px solid ${C.border}`, background: sel === o ? C.brassLighter : C.parchment, fontFamily: FONT, fontSize: 12, fontWeight: sel === o ? 700 : 400, color: sel === o ? C.warning : C.ink, cursor: 'pointer' }}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7 }}>পরবর্তী তারিখ</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', fontFamily: FONT, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 10, background: C.parchment, color: C.ink, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: FONT, fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 7 }}>সংক্ষিপ্ত নোট (ঐচ্ছিক)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="আদেশের সারসংক্ষেপ..."
            style={{ width: '100%', padding: '10px 12px', fontFamily: FONT, fontSize: 13, border: `1px solid ${C.border}`, borderRadius: 10, background: C.parchment, color: C.ink, outline: 'none', resize: 'none', height: 60, boxSizing: 'border-box' }} />
        </div>
        <button onClick={sel ? onClose : undefined} disabled={!sel}
          style={{ width: '100%', padding: '14px', background: sel ? C.brass : '#e2e8f0', border: 'none', borderRadius: 12, fontFamily: FONT, fontSize: 14, fontWeight: 700, color: sel ? '#fff' : '#94a3b8', cursor: sel ? 'pointer' : 'not-allowed' }}>
          {sel ? `"${sel}" — সংরক্ষণ করুন` : 'প্রথমে ফলাফল বেছে নিন'}
        </button>
      </div>
    </div>
  );
}

// ─── QUICK ADD SHEET ─────────────────────────────────────────
function QuickAddSheet({ onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 0.3, background: 'rgba(14,27,44,0.7)' }} onClick={onClose} />
      <div style={{ background: C.surface, borderRadius: '20px 20px 0 0', padding: '16px 20px 36px' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ width: 36, height: 4, background: C.border, borderRadius: 2, margin: '0 auto 12px' }} />
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: C.navy }}>নতুন মামলা যোগ করুন</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 3 }}>সবই ১০ সেকেন্ডের কাজ</div>
        </div>
        {[
          { icon: '📷', label: 'স্ক্যান করে', desc: 'কাগজ স্ক্যান → ফিল্ড স্বয়ংক্রিয় পূরণ', color: C.info },
          { icon: '🎙️', label: 'বলে যোগ', desc: '"তিন নম্বর কোর্ট, দেওয়ানী ১২৩..." — বাংলায় বলুন', color: C.success },
          { icon: '✏️', label: 'টাইপ করে', desc: '৩ ধাপ: কোর্ট → কেস → তারিখ', color: C.navy },
        ].map(o => (
          <button key={o.label} onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', background: C.parchment, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', marginBottom: 10, boxSizing: 'border-box' }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: `${o.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{o.icon}</div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.navy }}>{o.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.4 }}>{o.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── BOTTOM NAV ──────────────────────────────────────────────
function BottomNav({ active, onChange, onAdd }) {
  const tabs = [
    { id: 'home', label: 'বোর্ড', icon: 'home' },
    { id: 'cases', label: 'মামলা', icon: 'briefcase' },
    null,
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: 'calendar' },
    { id: 'tools', label: 'সরঞ্জাম', icon: 'tool' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: C.surface, borderTop: `1px solid ${C.border}`, paddingBottom: 6, flexShrink: 0 }}>
      {tabs.map((tab, i) => {
        if (!tab) return (
          <div key="fab" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <button onClick={onAdd}
              style={{ width: 52, height: 52, borderRadius: 26, background: `linear-gradient(145deg, ${C.brass}, #a0803f)`, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginTop: -20, boxShadow: `0 4px 14px rgba(198,161,91,0.45)` }}>
              <Icon n="plus" size={22} color="#fff" />
            </button>
          </div>
        );
        const on = active === tab.id;
        return (
          <button key={tab.id} onClick={() => onChange(tab.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 10, paddingBottom: 4, border: 'none', background: 'none', cursor: 'pointer', gap: 3 }}>
            <Icon n={tab.icon} size={20} color={on ? C.brass : C.muted} />
            <span style={{ fontFamily: FONT, fontSize: 10, color: on ? C.brass : C.muted, fontWeight: on ? 700 : 400 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ROOT APP ────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('home');
  const [caseModal, setCaseModal] = useState(null);
  const [outcomeCase, setOutcomeCase] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Roboto+Mono:wght@400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch(e){} };
  }, []);

  const handleNav = (t) => { setTab(t); setCaseModal(null); setOutcomeCase(null); setShowAdd(false); };
  const handleOutcome = (c) => { setCaseModal(null); setOutcomeCase(c); };

  return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT }}>
      {/* Phone frame */}
      <div style={{ width: 375, height: 812, borderRadius: 44, background: C.parchment, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 40px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)' }}>
        {/* Status bar */}
        <div style={{ background: C.navy, padding: '14px 24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: '#fff' }}>9:41</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>▲▲▲▲</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>WiFi</span>
            <span style={{ fontSize: 11 }}>🔋</span>
          </div>
        </div>
        {/* Screen */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {tab === 'home' && <HomeScreen onCase={setCaseModal} onOutcome={setOutcomeCase} />}
          {tab === 'cases' && <CasesScreen onCase={setCaseModal} />}
          {tab === 'calendar' && <CalendarScreen />}
          {tab === 'tools' && <ToolsScreen />}
          {caseModal && <CaseDetailModal c={caseModal} onClose={() => setCaseModal(null)} onOutcome={handleOutcome} />}
          {outcomeCase && <OutcomeSheet c={outcomeCase} onClose={() => setOutcomeCase(null)} />}
          {showAdd && <QuickAddSheet onClose={() => setShowAdd(false)} />}
        </div>
        <BottomNav active={tab} onChange={handleNav} onAdd={() => setShowAdd(true)} />
      </div>
    </div>
  );
}
