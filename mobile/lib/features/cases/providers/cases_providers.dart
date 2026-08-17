import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/db/database_provider.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/db/database.dart';
import '../../../core/db/daos/hearing_dao.dart';
import '../../../core/db/daos/fee_dao.dart';

// ── Filter state ──────────────────────────────────────────────────────────────

class CasesFilter {
  final String? status;   // null = all
  final String? query;
  const CasesFilter({this.status, this.query});
  CasesFilter copyWith({String? status, String? query}) =>
      CasesFilter(status: status ?? this.status, query: query ?? this.query);
}

final casesFilterProvider = StateProvider<CasesFilter>((_) => const CasesFilter());

// ── Cases list ────────────────────────────────────────────────────────────────

final casesListProvider = StreamProvider<List<Case>>((ref) {
  final dao       = ref.watch(caseDaoProvider);
  final chamberId = ref.watch(chamberIdProvider);
  final filter    = ref.watch(casesFilterProvider);
  if (chamberId.isEmpty) return const Stream.empty();
  return dao.watchAllCases(
    chamberId,
    statusFilter: filter.status,
    query:        filter.query,
  );
});

// ── Single case detail ────────────────────────────────────────────────────────

final caseDetailProvider = StreamProvider.family<Case?, String>((ref, id) {
  return ref.watch(caseDaoProvider).watchCase(id);
});

// ── Hearings for a case (timeline tab) ───────────────────────────────────────

final caseHearingsProvider = StreamProvider.family<List<Hearing>, String>((ref, caseId) {
  return ref.watch(hearingDaoProvider).watchCaseHearings(caseId);
});

// ── Fees for a case ───────────────────────────────────────────────────────────

final caseFeesProvider = StreamProvider.family<List<FeeEntry>, String>((ref, caseId) {
  return ref.watch(feeDaoProvider).watchCaseFees(caseId);
});

final caseBalanceProvider = FutureProvider.family<double, String>((ref, caseId) {
  return ref.watch(feeDaoProvider).getCaseBalance(caseId);
});

// ── Calendar: hearings count per day ─────────────────────────────────────────

final calendarMonthProvider = FutureProvider.family<Map<DateTime, int>,
    ({String chamberId, int year, int month})>((ref, args) {
  return ref.watch(hearingDaoProvider).getHearingCountsForMonth(
    args.chamberId, args.year, args.month,
  );
});

// ── Pending outbox count (sync badge) ─────────────────────────────────────────

final pendingSyncCountProvider = FutureProvider<int>((ref) {
  return ref.watch(outboxDaoProvider).pendingCount();
});

// ── Calendar: cases on a specific day ────────────────────────────────────────
final calendarDayHearingsProvider = StreamProvider.family<List<dynamic>,
    ({String chamberId, DateTime date})>((ref, args) {
  final dao = ref.watch(caseDaoProvider);
  // Stream cases where nextDate falls on args.date
  final start = DateTime(args.date.year, args.date.month, args.date.day);
  final end   = start.add(const Duration(days: 1));
  return dao.watchAllCases(args.chamberId).map((cases) =>
      cases.where((c) =>
          c.nextDate != null &&
          !c.nextDate!.isBefore(start) &&
          c.nextDate!.isBefore(end)).toList());
});
