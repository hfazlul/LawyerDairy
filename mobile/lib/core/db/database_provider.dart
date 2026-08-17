import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'database.dart';
import 'daos/case_dao.dart';
import 'daos/hearing_dao.dart';
import 'daos/client_dao.dart';
import 'daos/fee_dao.dart';
import 'daos/outbox_dao.dart';

/// Singleton database — app lifecycle
final dbProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
});

/// DAO providers — thin wrappers, available everywhere
final caseDaoProvider    = Provider((ref) => ref.watch(dbProvider).caseDao);
final hearingDaoProvider = Provider((ref) => ref.watch(dbProvider).hearingDao);
final clientDaoProvider  = Provider((ref) => ref.watch(dbProvider).clientDao);
final feeDaoProvider     = Provider((ref) => ref.watch(dbProvider).feeDao);
final outboxDaoProvider  = Provider((ref) => ref.watch(dbProvider).outboxDao);
