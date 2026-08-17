import 'dart:convert';
import 'package:uuid/uuid.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../db/database_provider.dart';
import '../db/database.dart';
import 'sync_protocol.dart';

/// Convenience methods to enqueue sync ops after every local write.
/// Call these immediately after every DAO upsert/delete.
class OutboxHelper {
  static Future<void> enqueueCase(Ref ref, Case c, {bool deleted = false}) async {
    final dao = ref.read(outboxDaoProvider);
    await dao.enqueue(SyncOp(
      opId:      const Uuid().v4(),
      entity:    'case',
      id:        c.id,
      type:      deleted ? SyncOpType.delete : SyncOpType.upsert,
      rev:       c.rev,
      data:      _caseToMap(c),
      createdAt: DateTime.now(),
    ));
  }

  static Future<void> enqueueHearing(Ref ref, Hearing h, {bool deleted = false}) async {
    final dao = ref.read(outboxDaoProvider);
    await dao.enqueue(SyncOp(
      opId:      const Uuid().v4(),
      entity:    'hearing',
      id:        h.id,
      type:      deleted ? SyncOpType.delete : SyncOpType.upsert,
      rev:       h.rev,
      data:      _hearingToMap(h),
      createdAt: DateTime.now(),
    ));
  }

  static Future<void> enqueueClient(Ref ref, Client c, {bool deleted = false}) async {
    final dao = ref.read(outboxDaoProvider);
    await dao.enqueue(SyncOp(
      opId:      const Uuid().v4(),
      entity:    'client',
      id:        c.id,
      type:      deleted ? SyncOpType.delete : SyncOpType.upsert,
      rev:       0,
      data:      {
        'id': c.id, 'chamberId': c.chamberId, 'name': c.name,
        'phone': c.phone, 'altPhone': c.altPhone, 'email': c.email,
        'nid': c.nid, 'address': c.address, 'fileNo': c.fileNo,
        'note': c.note,
        'createdAt': c.createdAt.toIso8601String(),
        'deletedAt': c.deletedAt?.toIso8601String(),
      },
      createdAt: DateTime.now(),
    ));
  }

  static Map<String, dynamic> _caseToMap(Case c) => {
    'id': c.id, 'chamberId': c.chamberId, 'caseNo': c.caseNo,
    'caseYear': c.caseYear, 'court': c.court, 'courtName': c.courtName,
    'courtRoom': c.courtRoom, 'judgeName': c.judgeName,
    'caseType': c.caseType, 'actsSections': c.actsSections,
    'policeStation': c.policeStation, 'onBehalf': c.onBehalf,
    'stage': c.stage, 'priority': c.priority, 'status': c.status,
    'clientId': c.clientId,
    'filingDate': c.filingDate?.toIso8601String(),
    'nextDate':   c.nextDate?.toIso8601String(),
    'lastOutcome': c.lastOutcome,
    'rev': c.rev,
    'updatedAt': c.updatedAt.toIso8601String(),
    'deletedAt': c.deletedAt?.toIso8601String(),
  };

  static Map<String, dynamic> _hearingToMap(Hearing h) => {
    'id': h.id, 'caseId': h.caseId, 'chamberId': h.chamberId,
    'date': h.date.toIso8601String(), 'purpose': h.purpose,
    'outcome': h.outcome, 'note': h.note,
    'attended': h.attended, 'appearingUserId': h.appearingUserId,
    'rev': h.rev,
    'updatedAt': h.updatedAt.toIso8601String(),
    'deletedAt': h.deletedAt?.toIso8601String(),
  };
}
