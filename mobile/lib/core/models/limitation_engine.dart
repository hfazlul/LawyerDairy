/// Limitation Act 1908 — Schedule-based deadline calculator
///
/// ⚠️  DISCLAIMER (always shown to user):
///     এই হিসাব নির্দেশক মাত্র। আইনি সময়সীমা নিজে যাচাই করুন।
///
/// Section 4: If limitation expires on a day court is closed,
/// it extends to the NEXT open court day.
/// Fri + Sat = BD court holidays (weekly). Add gazette holidays separately.

class LimitationResult {
  final String   kind;
  final DateTime baseDate;
  final int      days;
  final DateTime dueDate;
  final String   ruleRef;       // "Limitation Act 1908, Art. 152"
  final bool     isExpired;
  final int      daysRemaining;
  final String   disclaimer;

  const LimitationResult({
    required this.kind,
    required this.baseDate,
    required this.days,
    required this.dueDate,
    required this.ruleRef,
    required this.isExpired,
    required this.daysRemaining,
    required this.disclaimer,
  });
}

/// Rules extracted from Limitation Act 1908 Tafshil (schedule)
/// ( days, ruleRef )
const Map<String, (int, String)> _kRules = {
  // Appeals ──────────────────────────────────────────────────────────────────
  'appealDistrictJudge':      (30,  'Art. 152 — জেলা জজ আদালতে আপিল'),
  'appealHighCourtCivil':     (90,  'Art. 150 — হাইকোর্টে দেওয়ানী আপিল'),
  'appealHighCourtCriminal':  (60,  'Art. 154 — হাইকোর্টে ফৌজদারী আপিল'),
  'appealSupremeCourt':       (90,  'Art. 156 — আপিল বিভাগে আপিল'),
  // Revisions ────────────────────────────────────────────────────────────────
  'revisionCivil':            (90,  'Art. 131 — দেওয়ানী রিভিশন (CPC §115)'),
  'revisionCriminal':         (90,  'Art. 155 — ফৌজদারী রিভিশন (CrPC §439)'),
  // Reviews ──────────────────────────────────────────────────────────────────
  'reviewCivil':              (30,  'Art. 122 — দেওয়ানী রিভিউ'),
  'reviewHighCourt':          (30,  'Art. 123 — হাইকোর্টে রিভিউ'),
  // Execution ────────────────────────────────────────────────────────────────
  'executionDecree':          (3 * 365,  'Art. 136 — ডিক্রি জারি (সাধারণ)'),
  'executionMortgage':        (12 * 365, 'Art. 132 — বন্ধকী ডিক্রি জারি'),
  // Money / Contract ─────────────────────────────────────────────────────────
  'moneySuit':                (3 * 365, 'Art. 27 — অর্থ মোকদ্দমা'),
  'contractBreach':           (3 * 365, 'Art. 55 — চুক্তি লঙ্ঘন'),
  // NI Act ───────────────────────────────────────────────────────────────────
  'niActCheque':              (30, 'NI Act §138 — চেক ডিজঅনার — নোটিশের পর ৩০ দিন'),
};

class LimitationEngine {
  /// Gazette holidays — update each year from official notification
  /// Key: DateTime(year, month, day)
  static final Set<DateTime> gazetteHolidays = {};

  static LimitationResult? compute(String kind, DateTime baseDate) {
    final rule = _kRules[kind];
    if (rule == null) return null;
    final (days, ruleRef) = rule;

    // Add limitation period
    DateTime due = baseDate.add(Duration(days: days));

    // Section 4: advance past closed days
    while (_isClosed(due)) {
      due = due.add(const Duration(days: 1));
    }

    final remaining = due.difference(DateTime.now()).inDays;
    return LimitationResult(
      kind: kind,
      baseDate: baseDate,
      days: days,
      dueDate: due,
      ruleRef: ruleRef,
      isExpired: remaining < 0,
      daysRemaining: remaining,
      disclaimer: 'নির্দেশক হিসাব মাত্র। আইনি সময়সীমা নিজে যাচাই করুন — $ruleRef।',
    );
  }

  /// BD court weekly holidays: Friday (5) + Saturday (6)
  static bool _isClosed(DateTime d) {
    if (d.weekday == DateTime.friday || d.weekday == DateTime.saturday) return true;
    return gazetteHolidays.contains(DateTime(d.year, d.month, d.day));
  }

  static const Map<String, String> kindLabels = {
    'appealDistrictJudge':     'আপিল — জেলা জজ',
    'appealHighCourtCivil':    'আপিল — হাইকোর্ট (দেওয়ানী)',
    'appealHighCourtCriminal': 'আপিল — হাইকোর্ট (ফৌজদারী)',
    'appealSupremeCourt':      'আপিল — আপিল বিভাগ',
    'revisionCivil':           'রিভিশন — দেওয়ানী',
    'revisionCriminal':        'রিভিশন — ফৌজদারী',
    'reviewCivil':             'রিভিউ — দেওয়ানী',
    'reviewHighCourt':         'রিভিউ — হাইকোর্ট',
    'executionDecree':         'ডিক্রি জারি',
    'moneySuit':               'অর্থ মোকদ্দমা',
    'niActCheque':             'চেক ডিজঅনার মামলা',
  };
}
