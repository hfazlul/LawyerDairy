import 'package:drift/drift.dart';
import '../database.dart';

part 'case_dao.g.dart';

@DriftAccessor(tables: [Cases, Hearings])
class CaseDao extends DatabaseAccessor<AppDatabase> with _$CaseDaoMixin {
  CaseDao(super.db);

  // ── Reads ─────────────────────────────────────────────────────────────────

  /// Today's hearings, grouped-ready (sorted by courtName → nextDate)
  Stream<List<Case>> watchTodayCases(String chamberId) {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    final end   = start.add(const Duration(days: 1));
    return (select(cases)
      ..where((c) =>
          c.chamberId.equals(chamberId) &
          c.nextDate.isBetweenValues(start, end) &
          c.deletedAt.isNull() &
          c.status.equals('active'))
      ..orderBy([
        (c) => OrderingTerm.asc(c.courtName),
        (c) => OrderingTerm.asc(c.nextDate),
      ]))
      .watch();
  }

  /// Tomorrow's cases (for preview on home screen)
  Stream<List<Case>> watchTomorrowCases(String chamberId) {
    final now      = DateTime.now();
    final tomorrow = DateTime(now.year, now.month, now.day + 1);
    final dayAfter = tomorrow.add(const Duration(days: 1));
    return (select(cases)
      ..where((c) =>
          c.chamberId.equals(chamberId) &
          c.nextDate.isBetweenValues(tomorrow, dayAfter) &
          c.deletedAt.isNull() &
          c.status.equals('active'))
      ..orderBy([(c) => OrderingTerm.asc(c.courtName)]))
      .watch();
  }

  /// All cases with optional filter — used in cases list screen
  Stream<List<Case>> watchAllCases(
    String chamberId, {
    String? statusFilter,  // 'active' | 'closed' | null = all
    String? query,         // searches caseNo + clientId
  }) {
    return (select(cases)
      ..where((c) {
        Expression<bool> expr =
            c.chamberId.equals(chamberId) & c.deletedAt.isNull();
        if (statusFilter != null) {
          expr = expr & c.status.equals(statusFilter);
        }
        if (query != null && query.trim().isNotEmpty) {
          final q = '%${query.trim()}%';
          expr = expr & (c.caseNo.like(q) | c.clientId.like(q));
        }
        return expr;
      })
      ..orderBy([
        (c) => OrderingTerm.desc(c.nextDate),
        (c) => OrderingTerm.desc(c.updatedAt),
      ]))
      .watch();
  }

  /// Single case (for detail screen)
  Stream<Case?> watchCase(String id) =>
      (select(cases)..where((c) => c.id.equals(id))).watchSingleOrNull();

  Future<Case?> getCase(String id) =>
      (select(cases)..where((c) => c.id.equals(id))).getSingleOrNull();

  /// Cases modified since [cursor] — for sync push
  Future<List<Case>> getModifiedSince(String chamberId, DateTime cursor) =>
      (select(cases)
        ..where((c) =>
            c.chamberId.equals(chamberId) &
            c.updatedAt.isBiggerThanValue(cursor)))
        .get();

  // ── Writes ────────────────────────────────────────────────────────────────

  /// Insert or update (upsert) — the single write method for both local & sync
  Future<void> upsertCase(CasesCompanion c) =>
      into(cases).insertOnConflictUpdate(c);

  /// Soft delete — NEVER hard delete lawyer data
  Future<void> softDelete(String id) {
    return (update(cases)..where((c) => c.id.equals(id))).write(
      CasesCompanion(
        deletedAt: Value(DateTime.now()),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Update only nextDate + lastOutcome after hearing (fast path)
  Future<void> updateAfterHearing({
    required String caseId,
    required DateTime nextDate,
    required String outcome,
  }) {
    return (update(cases)..where((c) => c.id.equals(caseId))).write(
      CasesCompanion(
        nextDate:    Value(nextDate),
        lastOutcome: Value(outcome),
        updatedAt:   Value(DateTime.now()),
      ),
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  Future<Map<String, int>> getCaseStats(String chamberId) async {
    final all = await (select(cases)
          ..where((c) => c.chamberId.equals(chamberId) & c.deletedAt.isNull()))
        .get();
    return {
      'total':  all.length,
      'active': all.where((c) => c.status == 'active').length,
      'closed': all.where((c) => c.status == 'closed').length,
    };
  }
}
