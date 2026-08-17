import 'package:drift/drift.dart';
import '../database.dart';

part 'fee_dao.g.dart';

@DriftAccessor(tables: [FeeEntries])
class FeeDao extends DatabaseAccessor<AppDatabase> with _$FeeDaoMixin {
  FeeDao(super.db);

  Stream<List<FeeEntry>> watchCaseFees(String caseId) =>
      (select(feeEntries)
        ..where((f) => f.caseId.equals(caseId))
        ..orderBy([(f) => OrderingTerm.desc(f.date)]))
        .watch();

  Stream<List<FeeEntry>> watchChamberFees(String chamberId, {
    DateTime? from,
    DateTime? to,
  }) {
    return (select(feeEntries)
      ..where((f) {
        Expression<bool> expr = f.chamberId.equals(chamberId);
        if (from != null) expr = expr & f.date.isBiggerOrEqualValue(from);
        if (to   != null) expr = expr & f.date.isSmallerOrEqualValue(to);
        return expr;
      })
      ..orderBy([(f) => OrderingTerm.desc(f.date)]))
      .watch();
  }

  /// Outstanding balance for a case (agreed - received)
  Future<double> getCaseBalance(String caseId) async {
    final fees = await (select(feeEntries)
          ..where((f) => f.caseId.equals(caseId)))
        .get();
    double balance = 0;
    for (final f in fees) {
      if (f.type == 'feeAgreed') balance += f.amount;
      if (f.type == 'received')  balance -= f.amount;
    }
    return balance;
  }

  Future<void> insertFee(FeeEntriesCompanion f) =>
      into(feeEntries).insert(f);

  Future<void> deleteFee(String id) =>
      (delete(feeEntries)..where((f) => f.id.equals(id))).go();
}
