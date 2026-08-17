import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Entitlement synced from webapp API (not Play Billing).
///
/// Mobile shows Active/Inactive only — never Buy/Renew/checkout links.
enum PremiumStatus { inactive, active }

class EntitlementState {
  final PremiumStatus status;
  final String? planCode; // FREE | STARTER | PRO | PRO_ADVANCE | CHAMBER
  final DateTime? endsAt;
  final DateTime? lastSyncedAt;

  const EntitlementState({
    this.status = PremiumStatus.inactive,
    this.planCode,
    this.endsAt,
    this.lastSyncedAt,
  });

  bool get isPremiumActive =>
      status == PremiumStatus.active &&
      (endsAt == null || endsAt!.isAfter(DateTime.now()));

  EntitlementState copyWith({
    PremiumStatus? status,
    String? planCode,
    DateTime? endsAt,
    DateTime? lastSyncedAt,
  }) =>
      EntitlementState(
        status: status ?? this.status,
        planCode: planCode ?? this.planCode,
        endsAt: endsAt ?? this.endsAt,
        lastSyncedAt: lastSyncedAt ?? this.lastSyncedAt,
      );
}

const _kStatusKey = 'entitlement_status';
const _kPlanKey = 'entitlement_plan';
const _kEndsKey = 'entitlement_ends_at';

final entitlementProvider =
    StateNotifierProvider<EntitlementNotifier, EntitlementState>((ref) {
  return EntitlementNotifier();
});

final isPremiumActiveProvider = Provider<bool>((ref) {
  return ref.watch(entitlementProvider).isPremiumActive;
});

class EntitlementNotifier extends StateNotifier<EntitlementState> {
  EntitlementNotifier() : super(const EntitlementState()) {
    _restore();
  }

  final _storage = const FlutterSecureStorage();

  Future<void> _restore() async {
    final status = await _storage.read(key: _kStatusKey);
    final plan = await _storage.read(key: _kPlanKey);
    final ends = await _storage.read(key: _kEndsKey);
    state = EntitlementState(
      status: status == 'active' ? PremiumStatus.active : PremiumStatus.inactive,
      planCode: plan,
      endsAt: ends != null ? DateTime.tryParse(ends) : null,
    );
  }

  /// Apply payload from `GET /api/mobile/v1/entitlement` (TODO wire in SyncService).
  Future<void> applyFromServer({
    required bool active,
    String? planCode,
    DateTime? endsAt,
  }) async {
    state = EntitlementState(
      status: active ? PremiumStatus.active : PremiumStatus.inactive,
      planCode: planCode,
      endsAt: endsAt,
      lastSyncedAt: DateTime.now(),
    );
    await _storage.write(
        key: _kStatusKey, value: active ? 'active' : 'inactive');
    if (planCode != null) await _storage.write(key: _kPlanKey, value: planCode);
    if (endsAt != null) {
      await _storage.write(key: _kEndsKey, value: endsAt.toIso8601String());
    }
  }
}
