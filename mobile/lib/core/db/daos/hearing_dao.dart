import 'package:drift/drift.dart';
import '../database.dart';

part 'hearing_dao.g.dart';

@DriftAccessor(tables: [Hearings])
class HearingDao extends DatabaseAccessor<AppDatabase> with _$HearingDaoMixin {
  HearingDao(super.db);

  /// All hearings for a case, newest first — for timeline tab
  Stream<List<Hearing>> watchCaseHearings(String caseId) =>
      (select(hearings)
        ..where((h) => h.caseId.equals(caseId) & h.deletedAt.isNull())
        ..orderBy([(h) => OrderingTerm.desc(h.date)]))
        .watch();

  /// Hearings for a specific date (calendar screen)
  Stream<List<Hearing>> watchHearingsOnDate(String chamberId, DateTime date) {
    final start = DateTime(date.year, date.month, date.day);
    final end   = start.add(const Duration(days: 1));
    return (select(hearings)
      ..where((h) =>
          h.chamberId.equals(chamberId) &
          h.date.isBetweenValues(start, end) &
          h.deletedAt.isNull())
      ..orderBy([(h) => OrderingTerm.asc(h.date)]))
      .watch();
  }

  /// Hearing count per date for calendar badge rendering
  Future<Map<DateTime, int>> getHearingCountsForMonth(
    String chamberId,
    int year,
    int month,
  ) async {
    final start = DateTime(year, month);
    final end   = DateTime(year, month + 1);
    final rows  = await (select(hearings)
          ..where((h) =>
              h.chamberId.equals(chamberId) &
              h.date.isBetweenValues(start, end) &
              h.deletedAt.isNull()))
        .get();
    final counts = <DateTime, int>{};
    for (final r in rows) {
      final day = DateTime(r.date.year, r.date.month, r.date.day);
      counts[day] = (counts[day] ?? 0) + 1;
    }
    return counts;
  }

  /// Insert or update a hearing
  Future<void> upsertHearing(HearingsCompanion h) =>
      into(hearings).insertOnConflictUpdate(h);

  /// Append outcome to existing hearing (never overwrite full note)
  Future<void> recordOutcome({
    required String hearingId,
    required String outcome,
    String? appendNote,
  }) async {
    final existing = await (select(hearings)
          ..where((h) => h.id.equals(hearingId)))
        .getSingleOrNull();
    final prevNote = existing?.note ?? '';
    final newNote  = appendNote != null
        ? '$prevNote\n${DateTime.now().toIso8601String().substring(0, 16)}: $appendNote'.trim()
        : prevNote;
    await (update(hearings)..where((h) => h.id.equals(hearingId))).write(
      HearingsCompanion(
        outcome:   Value(outcome),
        attended:  const Value(true),
        note:      Value(newNote.isEmpty ? null : newNote),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> softDelete(String id) =>
      (update(hearings)..where((h) => h.id.equals(id))).write(
        HearingsCompanion(
          deletedAt: Value(DateTime.now()),
          updatedAt: Value(DateTime.now()),
        ),
      );
}
