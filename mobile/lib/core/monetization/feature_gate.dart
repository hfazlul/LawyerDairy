/// Feature access. Free diary caps are [UsageCaps], not this map.
enum FeatureAccess { free, premiumOnly }

class FeatureGate {
  const FeatureGate._();

  static const Map<String, FeatureAccess> features = {
    'home_board': FeatureAccess.free,
    'cases_basic': FeatureAccess.free,
    'calendar': FeatureAccess.free,
    'clients_basic': FeatureAccess.free,
    'guide_video': FeatureAccess.free,
    'limitation_calc': FeatureAccess.free,
    'court_fee_calc': FeatureAccess.free,
    'land_unit': FeatureAccess.free,
    'land_hissa': FeatureAccess.free,
    'cause_list': FeatureAccess.free,
    'career_mcq': FeatureAccess.free,
    'find_lawyer': FeatureAccess.free,
    'universal_search': FeatureAccess.free,
    'checklist': FeatureAccess.free,
    'diary_pdf': FeatureAccess.premiumOnly,
    'doc_vault_cloud': FeatureAccess.premiumOnly,
    'stats_visuals': FeatureAccess.premiumOnly,
    'chamber_roles': FeatureAccess.premiumOnly,
  };

  static bool isAllowed(String featureId, {required bool isPremiumActive}) {
    final gate = features[featureId] ?? FeatureAccess.free;
    switch (gate) {
      case FeatureAccess.free:
        return true;
      case FeatureAccess.premiumOnly:
        return isPremiumActive;
    }
  }

  static bool needsRewardedAd(String featureId, {required bool isPremiumActive}) =>
      false;

  /// Ads are not requested anywhere. The flag stays so older call sites compile.
  static bool showNativeAds({required bool isPremiumActive}) => false;
}
