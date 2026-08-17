import 'dart:convert';
import 'package:drift/drift.dart';
import '../database.dart';
import '../../sync/sync_protocol.dart';

part 'outbox_dao.g.dart';

@DriftAccessor(tables: [SyncOutboxEntries])
class OutboxDao extends DatabaseAccessor<AppDatabase> with _$OutboxDaoMixin {
  OutboxDao(super.db);

  /// Pending ops (not yet confirmed by server), ordered oldest first
  Future<List<SyncOutboxEntry>> getPending({int limit = 200}) =>
      (select(syncOutboxEntries)
        ..where((o) => o.applied.equals(false))
        ..orderBy([(o) => OrderingTerm.asc(o.createdAt)])
        ..limit(limit))
        .get();

  Future<int> pendingCount() async {
    final rows = await (select(syncOutboxEntries)
          ..where((o) => o.applied.equals(false)))
        .get();
    return rows.length;
  }

  /// Enqueue a new outbox operation
  Future<void> enqueue(SyncOp op) =>
      into(syncOutboxEntries).insert(
        SyncOutboxEntriesCompanion.insert(
          opId:      op.opId,
          entity:    op.entity,
          entityId:  op.id,
          opType:    op.type.name,
          rev:       op.rev,
          dataJson:  jsonEncode(op.data),
          createdAt: op.createdAt,
        ),
      );

  /// Mark ops as applied (server confirmed)
  Future<void> markApplied(List<String> opIds) async {
    if (opIds.isEmpty) return;
    await (update(syncOutboxEntries)
          ..where((o) => o.opId.isIn(opIds)))
        .write(const SyncOutboxEntriesCompanion(applied: Value(true)));
  }

  /// Increment retry count (for exponential back-off logging)
  Future<void> incrementRetry(String opId) =>
      (update(syncOutboxEntries)..where((o) => o.opId.equals(opId))).write(
        SyncOutboxEntriesCompanion(
          retryCount: Value(
            (syncOutboxEntries.retryCount + const Constant(1)) as int,
          ),
        ),
      );

  /// Remove applied entries older than 7 days (housekeeping)
  Future<void> pruneApplied() {
    final cutoff = DateTime.now().subtract(const Duration(days: 7));
    return (delete(syncOutboxEntries)
          ..where((o) =>
              o.applied.equals(true) &
              o.createdAt.isSmallerThanValue(cutoff)))
        .go();
  }
}
