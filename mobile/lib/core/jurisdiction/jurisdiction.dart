/// Jurisdiction (law pack) × UI language — orthogonal.
/// BD | PK | IN (IN = West Bengal/Tripura belt). UK skipped.
library;

enum JurisdictionCode { bd, pk, in_ }

enum UiLanguage { bn, en, ur }

enum PaymentRail { sslcommerzWeb, playBilling, adsOnly }

extension JurisdictionCodeX on JurisdictionCode {
  String get apiCode => switch (this) {
        JurisdictionCode.bd => 'BD',
        JurisdictionCode.pk => 'PK',
        JurisdictionCode.in_ => 'IN',
      };

  String get flag => switch (this) {
        JurisdictionCode.bd => '🇧🇩',
        JurisdictionCode.pk => '🇵🇰',
        JurisdictionCode.in_ => '🇮🇳',
      };

  String get nameEn => switch (this) {
        JurisdictionCode.bd => 'Bangladesh',
        JurisdictionCode.pk => 'Pakistan',
        JurisdictionCode.in_ => 'India (WB/Tripura)',
      };

  String get nameNative => switch (this) {
        JurisdictionCode.bd => 'বাংলাদেশ',
        JurisdictionCode.pk => 'پاکستان',
        JurisdictionCode.in_ => 'भारत',
      };

  PaymentRail get paymentRail => switch (this) {
        JurisdictionCode.bd => PaymentRail.sslcommerzWeb,
        JurisdictionCode.pk => PaymentRail.playBilling,
        JurisdictionCode.in_ => PaymentRail.playBilling,
      };

  /// Remote Config / env key
  String get guideVideoKey => switch (this) {
        JurisdictionCode.bd => 'guide_bd',
        JurisdictionCode.pk => 'guide_pk',
        JurisdictionCode.in_ => 'guide_in',
      };

  bool get guideMayMentionWebPay => this == JurisdictionCode.bd;

  bool get bdOnlyTools => this == JurisdictionCode.bd;

  /// Show Play Billing stub button only for IN/PK when inactive.
  bool get showPlayBillingCta => paymentRail == PaymentRail.playBilling;

  /// BD mobile: never show buy CTA (web SSLCommerz only).
  bool get showWebBuyCta => false;
}

extension UiLanguageX on UiLanguage {
  String get apiCode => name; // bn | en | ur

  String get label => switch (this) {
        UiLanguage.bn => 'বাংলা',
        UiLanguage.en => 'English',
        UiLanguage.ur => 'اردو',
      };
}

JurisdictionCode jurisdictionFromApi(String? code) {
  switch ((code ?? 'BD').toUpperCase()) {
    case 'PK':
      return JurisdictionCode.pk;
    case 'IN':
      return JurisdictionCode.in_;
    default:
      return JurisdictionCode.bd;
  }
}

UiLanguage uiLanguageFromApi(String? code) {
  switch ((code ?? 'bn').toLowerCase()) {
    case 'en':
      return UiLanguage.en;
    case 'ur':
      return UiLanguage.ur;
    default:
      return UiLanguage.bn;
  }
}

/// Soft multi-signal suggest — caller must still require user confirm.
JurisdictionCode suggestJurisdiction({
  String? timezone,
  String? localeTag,
}) {
  final tz = (timezone ?? '').toLowerCase();
  final loc = (localeTag ?? '').toLowerCase();
  if (tz.contains('dhaka') || loc.startsWith('bn_bd')) return JurisdictionCode.bd;
  if (tz.contains('karachi') || loc.startsWith('ur')) return JurisdictionCode.pk;
  if (tz.contains('kolkata') || tz.contains('calcutta') || loc.endsWith('_in')) {
    return JurisdictionCode.in_;
  }
  if (loc.startsWith('bn')) return JurisdictionCode.bd;
  return JurisdictionCode.bd;
}
