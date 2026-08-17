import 'package:flutter/foundation.dart';

/// Google Play Billing scaffold for IN / PK only.
/// BD never uses this path (web SSLCommerz).
///
/// TODO(production):
/// 1. Add `in_app_purchase` / Play Billing Library
/// 2. Product IDs per STARTER / PRO / PRO_ADVANCE
/// 3. Server-side purchase token verification → activate Chamber.plan
class PlayBillingService {
  PlayBillingService._();
  static final instance = PlayBillingService._();

  static const productIds = <String>[
    'starter_monthly', // TODO
    'pro_monthly',
    'pro_advance_monthly',
  ];

  Future<bool> isAvailable() async {
    // TODO: InAppPurchase.instance.isAvailable()
    debugPrint('[PlayBilling] stub isAvailable → false (scaffold)');
    return false;
  }

  /// Returns false until real Billing Client is wired.
  Future<bool> startPurchase(String productId) async {
    debugPrint('[PlayBilling] stub startPurchase($productId) — not wired');
    return false;
  }
}
