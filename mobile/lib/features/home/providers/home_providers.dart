import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/db/database_provider.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/db/database.dart';

/// Today's cases — streams from local Drift DB (instant, offline)
final todayCasesProvider = StreamProvider<List<Case>>((ref) {
  final dao       = ref.watch(caseDaoProvider);
  final chamberId = ref.watch(chamberIdProvider);
  if (chamberId.isEmpty) return const Stream.empty();
  return dao.watchTodayCases(chamberId);
});

/// Tomorrow preview
final tomorrowCasesProvider = StreamProvider<List<Case>>((ref) {
  final dao       = ref.watch(caseDaoProvider);
  final chamberId = ref.watch(chamberIdProvider);
  if (chamberId.isEmpty) return const Stream.empty();
  return dao.watchTomorrowCases(chamberId);
});

/// Cases with deadline within 7 days (for alert bar)
final urgentCasesProvider = Provider<List<Case>>((ref) {
  final today = ref.watch(todayCasesProvider).valueOrNull ?? [];
  // In production: query a separate Deadlines table via LimitationEngine
  // For now: filter by a custom field or use nextDate proximity
  return today.where((c) =>
      c.nextDate != null &&
      c.nextDate!.difference(DateTime.now()).inDays <= 7).toList();
});

/// Case stats (total / active / closed) — computed once per session
final caseStatsProvider = FutureProvider<Map<String, int>>((ref) {
  final dao       = ref.watch(caseDaoProvider);
  final chamberId = ref.watch(chamberIdProvider);
  if (chamberId.isEmpty) return Future.value({'total': 0, 'active': 0, 'closed': 0});
  return dao.getCaseStats(chamberId);
});

/// Group today's cases by court name (for home screen grouped list)
final todayByCourtProvider = Provider<Map<String, List<Case>>>((ref) {
  final cases = ref.watch(todayCasesProvider).valueOrNull ?? [];
  final result = <String, List<Case>>{};
  for (final c in cases) {
    final key = c.courtName ?? 'অজানা আদালত';
    (result[key] ??= []).add(c);
  }
  return result;
});
