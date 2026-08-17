import '../jurisdiction/jurisdiction.dart';
import 'limitation_engine.dart';

/// Per-jurisdiction limitation rule row (structure for IN/PK scaffolds).
class LimitationRuleRow {
  final String kind;
  final String label;
  final int? days;
  final String ruleRef;
  final bool scaffoldOnly;

  const LimitationRuleRow({
    required this.kind,
    required this.label,
    required this.days,
    required this.ruleRef,
    this.scaffoldOnly = false,
  });
}

/// BD = full Limitation Act 1908 engine.
/// IN = Limitation Act 1963 scaffold (WB/Tripura pack) — placeholders.
/// PK = PK limitation scaffold — placeholders.
class LimitationPacks {
  LimitationPacks._();

  static List<LimitationRuleRow> rulesFor(JurisdictionCode code) {
    switch (code) {
      case JurisdictionCode.bd:
        return LimitationEngine.kindLabels.entries
            .map(
              (e) => LimitationRuleRow(
                kind: e.key,
                label: e.value,
                days: _bdDays[e.key],
                ruleRef: _bdRefs[e.key] ?? 'Limitation Act 1908',
              ),
            )
            .toList();
      case JurisdictionCode.in_:
        return _inScaffold;
      case JurisdictionCode.pk:
        return _pkScaffold;
    }
  }

  static Map<String, String> kindLabelsFor(JurisdictionCode code) {
    final map = <String, String>{};
    for (final r in rulesFor(code)) {
      map[r.kind] = r.label;
    }
    return map;
  }

  /// Computes when tables are real; returns scaffold stub for IN/PK.
  static LimitationResult? compute(
    JurisdictionCode code,
    String kind,
    DateTime baseDate,
  ) {
    switch (code) {
      case JurisdictionCode.bd:
        return LimitationEngine.compute(kind, baseDate);
      case JurisdictionCode.in_:
      case JurisdictionCode.pk:
        LimitationRuleRow? row;
        for (final r in rulesFor(code)) {
          if (r.kind == kind) {
            row = r;
            break;
          }
        }
        if (row == null || row.days == null) return null;
        final due = baseDate.add(Duration(days: row.days!));
        final remaining = due.difference(DateTime.now()).inDays;
        return LimitationResult(
          kind: kind,
          baseDate: baseDate,
          days: row.days!,
          dueDate: due,
          ruleRef: row.ruleRef,
          isExpired: remaining < 0,
          daysRemaining: remaining,
          disclaimer:
              'SCAFFOLD ONLY — ${code.apiCode} tables incomplete. Verify against statute. ${row.ruleRef}',
        );
    }
  }

  static bool isScaffold(JurisdictionCode code) =>
      code == JurisdictionCode.in_ || code == JurisdictionCode.pk;

  static const _bdDays = <String, int>{
    'appealDistrictJudge': 30,
    'appealHighCourtCivil': 90,
    'appealHighCourtCriminal': 60,
    'appealSupremeCourt': 90,
    'revisionCivil': 90,
    'revisionCriminal': 90,
    'reviewCivil': 30,
    'reviewHighCourt': 30,
    'executionDecree': 3 * 365,
    'moneySuit': 3 * 365,
    'niActCheque': 30,
  };

  static const _bdRefs = <String, String>{
    'appealDistrictJudge': 'Art. 152',
    'appealHighCourtCivil': 'Art. 150',
    'appealHighCourtCriminal': 'Art. 154',
    'appealSupremeCourt': 'Art. 156',
    'revisionCivil': 'Art. 131',
    'revisionCriminal': 'Art. 155',
    'reviewCivil': 'Art. 122',
    'reviewHighCourt': 'Art. 123',
    'executionDecree': 'Art. 136',
    'moneySuit': 'Art. 27',
    'niActCheque': 'NI Act §138',
  };

  /// Limitation Act 1963 — structure only (TODO: fill Schedule articles).
  static const _inScaffold = <LimitationRuleRow>[
    LimitationRuleRow(
      kind: 'in_suit_contract',
      label: 'Suit on contract (placeholder)',
      days: 3 * 365,
      ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
    LimitationRuleRow(
      kind: 'in_appeal_hc',
      label: 'Appeal to High Court (placeholder)',
      days: 90,
      ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
    LimitationRuleRow(
      kind: 'in_revision',
      label: 'Revision (placeholder)',
      days: 90,
      ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
    LimitationRuleRow(
      kind: 'in_execution',
      label: 'Execution of decree (placeholder)',
      days: 12 * 365,
      ruleRef: 'Limitation Act 1963 — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
  ];

  /// Pakistan limitation pack — structure only.
  static const _pkScaffold = <LimitationRuleRow>[
    LimitationRuleRow(
      kind: 'pk_suit_contract',
      label: 'Suit on contract (placeholder)',
      days: 3 * 365,
      ruleRef: 'PK Limitation — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
    LimitationRuleRow(
      kind: 'pk_appeal_hc',
      label: 'Appeal to High Court (placeholder)',
      days: 90,
      ruleRef: 'PK Limitation — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
    LimitationRuleRow(
      kind: 'pk_revision',
      label: 'Revision (placeholder)',
      days: 90,
      ruleRef: 'PK Limitation — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
    LimitationRuleRow(
      kind: 'pk_execution',
      label: 'Execution of decree (placeholder)',
      days: 6 * 365,
      ruleRef: 'PK Limitation — Art. TBD (scaffold)',
      scaffoldOnly: true,
    ),
  ];
}
