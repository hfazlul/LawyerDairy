import 'package:flutter_test/flutter_test.dart';
import 'package:lawyer_diary_bd/core/jurisdiction/jurisdiction.dart';
import 'package:lawyer_diary_bd/core/models/limitation_packs.dart';

void main() {
  group('LimitationPacks', () {
    test('BD uses full engine kinds', () {
      final labels = LimitationPacks.kindLabelsFor(JurisdictionCode.bd);
      expect(labels.containsKey('appealDistrictJudge'), isTrue);
      expect(LimitationPacks.isScaffold(JurisdictionCode.bd), isFalse);
    });

    test('IN scaffold has placeholder kinds', () {
      final rules = LimitationPacks.rulesFor(JurisdictionCode.in_);
      expect(rules, isNotEmpty);
      expect(rules.every((r) => r.scaffoldOnly), isTrue);
      expect(LimitationPacks.isScaffold(JurisdictionCode.in_), isTrue);
    });

    test('PK scaffold compute returns disclaimer', () {
      final r = LimitationPacks.compute(
        JurisdictionCode.pk,
        'pk_appeal_hc',
        DateTime(2026, 1, 1),
      );
      expect(r, isNotNull);
      expect(r!.disclaimer.contains('SCAFFOLD'), isTrue);
      expect(r.days, 90);
    });
  });
}
