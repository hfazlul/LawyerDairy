/// Feature access tiers for Play-safe monetization.
///
/// - [free] — always available
/// - [adsUnlock] — free users watch rewarded interstitial; premium skips ads
/// - [premiumOnly] — deactivated until Premium Active (web entitlement sync)
enum FeatureAccess { free, adsUnlock, premiumOnly }

/// Maps product features to gates. Keep in sync with web package tiers.
class FeatureGate {
  const FeatureGate._();

  static const Map<String, FeatureAccess> features = {
    // Always free
    'home_board': FeatureAccess.free,
    'cases_basic': FeatureAccess.free,
    'calendar': FeatureAccess.free,
    'clients_basic': FeatureAccess.free,
    'guide_video': FeatureAccess.free,

    // Mid-tier: rewarded interstitial unlock for free users
    'diary_pdf': FeatureAccess.adsUnlock,
    'limitation_calc': FeatureAccess.adsUnlock,
    'court_fee_calc': FeatureAccess.adsUnlock,
    'checklist': FeatureAccess.adsUnlock,

    // Premium-only (STARTER+ / PRO+) — inactive until Premium Active
    'doc_scanner': FeatureAccess.premiumOnly,
    'doc_vault_cloud': FeatureAccess.premiumOnly,
    'cause_list': FeatureAccess.premiumOnly,
    'stats_visuals': FeatureAccess.premiumOnly,
    'unlimited_cases': FeatureAccess.premiumOnly,
    'chamber_roles': FeatureAccess.premiumOnly,
    'voice_entry': FeatureAccess.premiumOnly,
    // Web-only case manage is PRO_ADVANCE; mobile case CRUD stays local/free basic
  };

  /// Whether [featureId] may run given current premium entitlement.
  static bool isAllowed(String featureId, {required bool isPremiumActive}) {
    final gate = features[featureId] ?? FeatureAccess.premiumOnly;
    switch (gate) {
      case FeatureAccess.free:
        return true;
      case FeatureAccess.adsUnlock:
        return true; // caller shows rewarded interstitial when !isPremiumActive
      case FeatureAccess.premiumOnly:
        return isPremiumActive;
    }
  }

  /// Free users need a rewarded interstitial before [featureId].
  static bool needsRewardedAd(String featureId, {required bool isPremiumActive}) {
    if (isPremiumActive) return false;
    return features[featureId] == FeatureAccess.adsUnlock;
  }

  /// Native ads on viz/dashboard when not premium.
  static bool showNativeAds({required bool isPremiumActive}) => !isPremiumActive;
}
