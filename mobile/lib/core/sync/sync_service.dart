import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../auth/auth_provider.dart';
import '../config/api_config.dart';
import '../db/database_provider.dart';
import '../db/database.dart';
import '../db/daos/case_dao.dart';
import '../db/daos/hearing_dao.dart';
import 'sync_protocol.dart';

const _kSyncCursorKey = 'sync_cursor';

final syncServiceProvider = Provider<SyncService>((ref) {
  final dio     = Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));
  final storage = const FlutterSecureStorage();
  return SyncService(ref: ref, dio: dio, storage: storage);
});

/// SyncState — shown in UI as a small badge or indicator
enum SyncPhase { idle, pulling, pushing, done, error }

class SyncState {
  final SyncPhase phase;
  final int       pendingOps;
  final String?   error;
  final DateTime? lastSync;
  const SyncState({
    this.phase      = SyncPhase.idle,
    this.pendingOps = 0,
    this.error,
    this.lastSync,
  });
}

/// Full sync lifecycle:
/// 1. Push outbox ops (local changes → server)
/// 2. Pull server changes (server changes → local)
/// 3. Apply conflicts (server wins on field-level last-write-wins)
///
/// Trigger points:
/// - App foreground (workmanager)
/// - After every local write (immediate push)
/// - FCM data push (server nudge)
class SyncService {
  final Ref                   _ref;
  final Dio                   _dio;
  final FlutterSecureStorage  _storage;

  SyncService({required Ref ref, required Dio dio,
    required FlutterSecureStorage storage})
      : _ref = ref, _dio = dio, _storage = storage;

  // ── Entry point ───────────────────────────────────────────────────────────

  Future<void> sync() async {
    final user = _ref.read(currentUserProvider);
    if (user == null) return;

    _setAuth(user.accessToken);

    try {
      await _push();
      await _pull(user.chamberId);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        // Token expired — auth notifier will handle refresh on next launch
      }
      rethrow;
    }
  }

  // ── PUSH: local outbox → server ───────────────────────────────────────────

  Future<void> _push() async {
    final outbox = _ref.read(outboxDaoProvider);
    final pending = await outbox.getPending(limit: 200);
    if (pending.isEmpty) return;

    final ops = pending.map((e) => {
      'opId':      e.opId,
      'entity':    e.entity,
      'id':        e.entityId,
      'type':      e.opType,
      'rev':       e.rev,
      'data':      jsonDecode(e.dataJson),
      'createdAt': e.createdAt.toIso8601String(),
    }).toList();

    final res = await _dio.post(
      '/api/mobile/v1/sync/push',
      data: {'ops': ops},
    );

    final applied   = List<String>.from(res.data['applied']  ?? []);
    final conflicts = res.data['conflicts'] as List? ?? [];

    // Mark confirmed ops as applied
    await outbox.markApplied(applied);

    // Handle conflicts: server data wins — apply server version locally
    for (final c in conflicts) {
      await _applyConflict(
        entity:     c['entity'],
        id:         c['id'],
        serverRev:  c['serverRev'],
        serverData: Map<String, dynamic>.from(c['serverData']),
      );
    }
  }

  // ── PULL: server → local ──────────────────────────────────────────────────

  Future<void> _pull(String chamberId) async {
    final cursor  = await _storage.read(key: _kSyncCursorKey) ?? '0';
    final caseDao = _ref.read(caseDaoProvider);

    var nextCursor = cursor;
    var hasMore    = true;

    while (hasMore) {
      final res = await _dio.get(
        '/api/mobile/v1/sync/pull',
        queryParameters: {
          'since':     nextCursor,
          'limit':     500,
          'chamberId': chamberId,
        },
      );

      final data      = res.data as Map<String, dynamic>;
      final changes   = data['changes']   as Map<String, dynamic>? ?? {};
      final newCursor = data['nextCursor'] as String?;
      hasMore         = newCursor != null;

      // Apply case changes
      for (final row in (changes['cases'] as List? ?? [])) {
        await _applyCase(Map<String, dynamic>.from(row), caseDao);
      }

      // Apply hearing changes
      final hearingDao = _ref.read(hearingDaoProvider);
      for (final row in (changes['hearings'] as List? ?? [])) {
        await _applyHearing(Map<String, dynamic>.from(row), hearingDao);
      }

      // TODO: apply clients, fees, documents changes

      if (newCursor != null) {
        nextCursor = newCursor;
        await _storage.write(key: _kSyncCursorKey, value: nextCursor);
      } else {
        hasMore = false;
      }
    }
  }

  // ── Apply incoming case row ───────────────────────────────────────────────

  Future<void> _applyCase(
    Map<String, dynamic> row,
    CaseDao dao,
  ) async {
    final existing = await dao.getCase(row['id'] as String);

    // Skip if local version is newer (local edit not yet confirmed by server)
    if (existing != null && existing.rev >= (row['rev'] as int)) return;

    await dao.upsertCase(CasesCompanion(
      id:           Value(row['id']),
      chamberId:    Value(row['chamberId']),
      caseNo:       Value(row['caseNo']),
      caseYear:     Value(row['caseYear'] as int?),
      court:        Value(row['court'] ?? 'judgesCourt'),
      courtName:    Value(row['courtName'] as String?),
      courtRoom:    Value(row['courtRoom'] as String?),
      judgeName:    Value(row['judgeName'] as String?),
      caseType:     Value(row['caseType'] ?? ''),
      actsSections: Value(row['actsSections'] as String?),
      policeStation:Value(row['policeStation'] as String?),
      onBehalf:     Value(row['onBehalf'] ?? 'plaintiff'),
      priority:     Value(row['priority'] ?? 'medium'),
      status:       Value(row['status'] ?? 'active'),
      clientId:     Value(row['clientId'] as String?),
      nextDate:     Value(row['nextDate'] != null
          ? DateTime.tryParse(row['nextDate']) : null),
      lastOutcome:  Value(row['lastOutcome'] as String?),
      rev:          Value(row['rev'] as int? ?? 0),
      updatedAt:    Value(DateTime.parse(row['updatedAt'])),
      deletedAt:    Value(row['deletedAt'] != null
          ? DateTime.tryParse(row['deletedAt']) : null),
    ));
  }

  Future<void> _applyHearing(
    Map<String, dynamic> row,
    HearingDao dao,
  ) async {
    await dao.upsertHearing(HearingsCompanion(
      id:             Value(row['id']),
      caseId:         Value(row['caseId']),
      chamberId:      Value(row['chamberId']),
      date:           Value(DateTime.parse(row['date'])),
      purpose:        Value(row['purpose'] as String?),
      outcome:        Value(row['outcome'] as String?),
      note:           Value(row['note'] as String?),
      attended:       Value(row['attended'] as bool? ?? false),
      appearingUserId:Value(row['appearingUserId'] as String?),
      rev:            Value(row['rev'] as int? ?? 0),
      updatedAt:      Value(DateTime.parse(row['updatedAt'])),
      deletedAt:      Value(row['deletedAt'] != null
          ? DateTime.tryParse(row['deletedAt']) : null),
    ));
  }

  Future<void> _applyConflict(
    {required String entity, required String id,
     required int serverRev, required Map<String, dynamic> serverData}) async {
    // Server always wins — re-apply server data
    if (entity == 'case') {
      await _applyCase(serverData, _ref.read(caseDaoProvider));
    } else if (entity == 'hearing') {
      await _applyHearing(serverData, _ref.read(hearingDaoProvider));
    }
  }

  void _setAuth(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }
}
