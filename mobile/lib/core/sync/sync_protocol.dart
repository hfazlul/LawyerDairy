/// Offline-first sync — outbox queue pattern
///
/// PULL: GET /api/mobile/v1/sync/pull?since=<cursor>&limit=500
///   → { changes: { cases:[], hearings:[], ... }, nextCursor, serverTime }
///
/// PUSH: POST /api/mobile/v1/sync/push
///   Body: { ops: [ { opId, entity, id, type, rev, data } ] }
///   → { applied:[opId], conflicts:[{id,serverRev,serverData}], serverTime }
///
/// Rules:
/// 1. Every row has: rev, updatedAt, deletedAt (soft delete only)
/// 2. Push uses UUID opId as idempotency key — duplicate pushes are safe
/// 3. Conflict: field-level last-write-wins by server clock
/// 4. HearingModel.note is append-only → zero merge conflicts
/// 5. NEVER hard delete — deletedAt marks deletion
/// 6. Document blob: metadata always syncs, blob only on WiFi (user setting)

enum SyncOpType { upsert, delete }

class SyncOp {
  final String      opId;        // UUID v4 — idempotency key
  final String      entity;      // 'case' | 'hearing' | 'client' | 'fee' | 'document'
  final String      id;
  final SyncOpType  type;
  final int         rev;
  final Map<String, dynamic> data;
  final DateTime    createdAt;

  const SyncOp({
    required this.opId, required this.entity, required this.id,
    required this.type, required this.rev, required this.data,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
    'opId': opId, 'entity': entity, 'id': id,
    'type': type.name, 'rev': rev, 'data': data,
    'createdAt': createdAt.toIso8601String(),
  };
}

class SyncConflict {
  final String id, entity;
  final int serverRev;
  final Map<String, dynamic> serverData;
  const SyncConflict({required this.id, required this.entity,
    required this.serverRev, required this.serverData});
}

class PushResponse {
  final List<String>       applied;
  final List<SyncConflict> conflicts;
  final DateTime           serverTime;
  const PushResponse({required this.applied, required this.conflicts, required this.serverTime});
}

class PullResponse {
  final Map<String, List<Map<String, dynamic>>> changes; // entity → list of rows
  final String?  nextCursor;
  final DateTime serverTime;
  const PullResponse({required this.changes, this.nextCursor, required this.serverTime});
}
