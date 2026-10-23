import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/support_contact.dart';

/// Entitlement synced from webapp API (not Play Billing).
enum PremiumStatus { inactive, active }

class EntitlementLimits {
  final int? clientCountCap;
  final int? caseCountCap;
  final int? hearingCountCap;
  final int teamSeats;
  final int smsMonthly;
  final int? findLawyerReceiveCap;
  final int? findLawyerClientContactCap;
  final int careerLocalPct;
  final bool careerFull;

  const EntitlementLimits({
    this.clientCountCap = 20,
    this.caseCountCap = 20,
    this.hearingCountCap = 20,
    this.teamSeats = 1,
    this.smsMonthly = 0,
    this.findLawyerReceiveCap = 5,
    this.findLawyerClientContactCap = 3,
    this.careerLocalPct = 20,
    this.careerFull = false,
  });

  static const paidUnlimited = EntitlementLimits(
    clientCountCap: null,
    caseCountCap: null,
    hearingCountCap: null,
    teamSeats: 2,
    smsMonthly: 0,
    findLawyerReceiveCap: null,
    findLawyerClientContactCap: null,
    careerLocalPct: 100,
    careerFull: true,
  );

  factory EntitlementLimits.fromMap(Map<String, dynamic>? m, {required bool paid}) {
    if (m == null) return paid ? paidUnlimited : const EntitlementLimits();
    int? n(String k) {
      final v = m[k];
      if (v is num) return v.toInt();
      return int.tryParse('$v');
    }

    return EntitlementLimits(
      clientCountCap: paid ? null : (n('clientCountCap') ?? 20),
      caseCountCap: paid ? null : (n('caseCountCap') ?? 20),
      hearingCountCap: paid ? null : (n('hearingCountCap') ?? 20),
      teamSeats: n('maxTeamMembers') ?? (paid ? 2 : 1),
      smsMonthly: n('smsCreditsPerMonth') ?? 0,
      findLawyerReceiveCap: paid ? null : (n('findLawyerReceiveCap') ?? 5),
      findLawyerClientContactCap: paid ? null : (n('findLawyerClientContactCap') ?? 3),
      careerLocalPct: n('careerLocalPct') ?? (paid ? 100 : 20),
      careerFull: paid,
    );
  }
}

class EntitlementState {
  final PremiumStatus status;
  final String? planCode;
  final DateTime? endsAt;
  final DateTime? lastSyncedAt;
  final DateTime? accountCreatedAt;
  final String payOnWebUrl;
  final bool adsOff;
  final bool fullAccess;
  final EntitlementLimits limits;

  const EntitlementState({
    this.status = PremiumStatus.inactive,
    this.planCode,
    this.endsAt,
    this.lastSyncedAt,
    this.accountCreatedAt,
    this.payOnWebUrl = kWebsitePaymentUrl,
    this.adsOff = false,
    this.fullAccess = false,
    this.limits = const EntitlementLimits(),
  });

  bool get isPremiumActive =>
      fullAccess ||
      (status == PremiumStatus.active &&
          (endsAt == null || endsAt!.isAfter(DateTime.now())));

  bool get careerFull => isPremiumActive || inGracePeriod || limits.careerFull;

  bool get inGracePeriod {
    if (isPremiumActive) return false;
    if (planCode == null || planCode == 'FREE') return false;
    final last = lastSyncedAt;
    if (last == null) return false;
    return DateTime.now().difference(last) < const Duration(days: 8);
  }
}

const _kStatusKey = 'entitlement_status';
const _kPlanKey = 'entitlement_plan';
const _kEndsKey = 'entitlement_ends_at';
const _kLastSyncKey = 'entitlement_last_synced';
const _kPayWebKey = 'entitlement_pay_web';
const _kCreatedKey = 'entitlement_account_created';
const _kLimitsKey = 'entitlement_limits_json';
const _kFullAccessKey = 'entitlement_full_access';

final entitlementProvider =
    StateNotifierProvider<EntitlementNotifier, EntitlementState>((ref) {
  return EntitlementNotifier();
});

final isPremiumActiveProvider = Provider<bool>((ref) {
  return ref.watch(entitlementProvider).isPremiumActive;
});

class EntitlementNotifier extends StateNotifier<EntitlementState> {
  EntitlementNotifier() : super(const EntitlementState()) {
    ready = _restore();
  }

  late final Future<void> ready;

  final _storage = const FlutterSecureStorage();

  Future<void> _restore() async {
    final status = await _storage.read(key: _kStatusKey);
    final plan = await _storage.read(key: _kPlanKey);
    final ends = await _storage.read(key: _kEndsKey);
    final last = await _storage.read(key: _kLastSyncKey);
    final pay = await _storage.read(key: _kPayWebKey);
    final created = await _storage.read(key: _kCreatedKey);
    final limitsRaw = await _storage.read(key: _kLimitsKey);
    final fullRaw = await _storage.read(key: _kFullAccessKey);
    final fullAccess = fullRaw == '1';
    Map<String, dynamic>? limitsMap;
    if (limitsRaw != null && limitsRaw.isNotEmpty) {
      try {
        final decoded = jsonDecode(limitsRaw);
        if (decoded is Map) limitsMap = Map<String, dynamic>.from(decoded);
      } catch (_) {}
    }
    final active = status == 'active' || fullAccess;
    state = EntitlementState(
      status: active ? PremiumStatus.active : PremiumStatus.inactive,
      planCode: plan,
      endsAt: ends != null ? DateTime.tryParse(ends) : null,
      lastSyncedAt: last != null ? DateTime.tryParse(last) : null,
      accountCreatedAt: created != null ? DateTime.tryParse(created) : null,
      payOnWebUrl: (pay != null && pay.isNotEmpty) ? pay : kWebsitePaymentUrl,
      adsOff: active,
      fullAccess: fullAccess,
      limits: EntitlementLimits.fromMap(limitsMap, paid: active),
    );
  }

  Future<void> applyFromServer({
    required bool active,
    String? planCode,
    DateTime? endsAt,
    String? payOnWebUrl,
    DateTime? accountCreatedAt,
    Map<String, dynamic>? limits,
    Map<String, dynamic>? features,
  }) async {
    final now = DateTime.now();
    final url = payOnWebUrl ?? state.payOnWebUrl;
    final fullAccess = features?['fullAccess'] == true;
    final unlocked = active || fullAccess;
    final parsed = EntitlementLimits.fromMap(limits, paid: unlocked);
    state = EntitlementState(
      status: unlocked ? PremiumStatus.active : PremiumStatus.inactive,
      planCode: planCode,
      endsAt: endsAt,
      lastSyncedAt: now,
      accountCreatedAt: accountCreatedAt ?? state.accountCreatedAt,
      payOnWebUrl: url,
      adsOff: unlocked || features?['adsOff'] == true,
      fullAccess: fullAccess,
      limits: parsed,
    );
    await _storage.write(key: _kStatusKey, value: unlocked ? 'active' : 'inactive');
    if (planCode != null) await _storage.write(key: _kPlanKey, value: planCode);
    if (endsAt != null) {
      await _storage.write(key: _kEndsKey, value: endsAt.toIso8601String());
    }
    await _storage.write(key: _kLastSyncKey, value: now.toIso8601String());
    await _storage.write(key: _kPayWebKey, value: url);
    if (accountCreatedAt != null) {
      await _storage.write(key: _kCreatedKey, value: accountCreatedAt.toIso8601String());
    }
    if (limits != null) {
      await _storage.write(key: _kLimitsKey, value: jsonEncode(limits));
    }
    await _storage.write(key: _kFullAccessKey, value: fullAccess ? '1' : '0');
  }
}
