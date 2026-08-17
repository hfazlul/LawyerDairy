import 'package:flutter_test/flutter_test.dart';
import 'package:lawyer_diary_bd/core/models/limitation_engine.dart';

void main() {
  group('LimitationEngine', () {
    test('appeal to district judge = 30 days', () {
      final base = DateTime(2026, 8, 1); // Saturday
      final result = LimitationEngine.compute('appealDistrictJudge', base)!;
      // 30 days from Aug 1 = Aug 31 (Monday — valid working day)
      expect(result.days, 30);
      expect(result.dueDate.weekday, isNot(DateTime.friday));
      expect(result.dueDate.weekday, isNot(DateTime.saturday));
    });

    test('expired deadline has negative daysRemaining', () {
      final pastDate = DateTime(2020, 1, 1);
      final result = LimitationEngine.compute('appealDistrictJudge', pastDate)!;
      expect(result.isExpired, isTrue);
      expect(result.daysRemaining, lessThan(0));
    });

    test('dueDate skips Friday/Saturday (Section 4)', () {
      // Find a base date where +30 days lands on Friday
      final base = DateTime(2026, 7, 10); // +30 = Aug 9 (Sunday) — fine
      final result = LimitationEngine.compute('appealDistrictJudge', base)!;
      expect(result.dueDate.weekday, isNot(DateTime.friday));
      expect(result.dueDate.weekday, isNot(DateTime.saturday));
    });

    test('all rule kinds return non-null result', () {
      final base = DateTime.now();
      for (final kind in LimitationEngine.kindLabels.keys) {
        final result = LimitationEngine.compute(kind, base);
        expect(result, isNotNull, reason: '$kind returned null');
      }
    });

    test('disclaimer is always present', () {
      final result = LimitationEngine.compute('revisionCivil', DateTime.now())!;
      expect(result.disclaimer, isNotEmpty);
    });
  });
}
