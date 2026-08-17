import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../monetization/entitlement.dart';

/// AdMob service stub — native ads + rewarded interstitial only.
///
/// Play-safe: no IAP, no classic interstitial, no classic rewarded-only.
/// Ads run only when Premium is Inactive.
///
/// TODO(production):
/// 1. Call `MobileAds.instance.initialize()` after consent (if required)
/// 2. Replace test unit IDs with AdMob console IDs
/// 3. Wire `google_mobile_ads` NativeAd / RewardedInterstitialAd widgets
class AdMobService {
  AdMobService({required this.isPremiumActive});

  final bool isPremiumActive;

  // Google sample / test IDs — DO NOT ship to production
  static const nativeAdUnitId = String.fromEnvironment(
    'ADMOB_NATIVE_ID',
    defaultValue: 'ca-app-pub-3940256099942544/2247696110', // TEST
  );
  static const rewardedInterstitialAdUnitId = String.fromEnvironment(
    'ADMOB_REWARDED_INTERSTITIAL_ID',
    defaultValue: 'ca-app-pub-3940256099942544/5354046379', // TEST
  );

  bool get adsEnabled => !isPremiumActive;

  Future<void> initialize() async {
    if (!adsEnabled) {
      debugPrint('[AdMob] Premium Active — ads disabled');
      return;
    }
    // TODO: await MobileAds.instance.initialize();
    debugPrint('[AdMob] stub init (native + rewarded interstitial)');
  }

  /// Placeholder for dashboard/visualization native ad load.
  Future<bool> loadNativeAd() async {
    if (!adsEnabled) return false;
    debugPrint('[AdMob] loadNativeAd stub → $nativeAdUnitId');
    return true;
  }

  /// Mid-tier feature unlock for free users.
  /// Returns true if user earned access (or premium).
  Future<bool> showRewardedInterstitial() async {
    if (!adsEnabled) return true;
    // TODO: RewardedInterstitialAd.load + show; await reward callback
    debugPrint(
        '[AdMob] showRewardedInterstitial stub → $rewardedInterstitialAdUnitId');
    return true; // stub grants access in debug; production waits for reward
  }
}

final adMobServiceProvider = Provider<AdMobService>((ref) {
  final premium = ref.watch(isPremiumActiveProvider);
  return AdMobService(isPremiumActive: premium);
});
