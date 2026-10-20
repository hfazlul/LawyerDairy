import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show appFlavor;

/// API host for Dio [BaseOptions.baseUrl].
/// Paths in auth/sync already include `/api/mobile/v1/...`.
///
/// Debug defaults:
/// - Android phone → [kDevApiBase] (live VPS, plain HTTP until DNS/HTTPS)
/// - iOS simulator / desktop → `http://127.0.0.1:3000`
/// - Override with `--dart-define=API_BASE=...`
///
/// Release/profile without an override still uses [kProdApiBase].
/// The human-visible website in SMS is https://mamlaq.com and is not this host.
class ApiConfig {
  ApiConfig._();

  /// Production API host (no trailing slash).
  static const String kProdApiBase = 'https://api.lawyerdiarybd.com';

  /// Debug/dev API on the VPS. Not mamlaq.com until DNS and HTTPS are confirmed.
  static const String kDevApiBase = 'http://187.77.153.28';

  /// `--dart-define=FLAVOR=dev|staging|prod` (Gradle productFlavors optional).
  static const String flavor =
      String.fromEnvironment('FLAVOR', defaultValue: 'dev');

  /// Gradle `--flavor` wins when set (`FLUTTER_APP_FLAVOR`); else [flavor].
  static String get resolvedFlavor =>
      (appFlavor ?? flavor).toLowerCase();

  /// Debug + `dev` flavor only. False in profile/release and in staging/prod.
  static bool get allowLocalLoginBypass =>
      kDebugMode && resolvedFlavor == 'dev';

  /// Compile-time override: `--dart-define=API_BASE=http://x.x.x.x:3000`
  static const String _fromDefine = String.fromEnvironment('API_BASE');

  static const String kStagingApiBase = 'https://staging.lawyerdiarybd.com';

  /// Matches pubspec `version:` (major.minor.patch) for minAppVersion checks.
  static const String appVersion = '1.0.0';

  static String get baseUrl {
    if (_fromDefine.isNotEmpty) return _stripSlash(_fromDefine);

    if (flavor == 'prod') return kProdApiBase;
    if (flavor == 'staging') return kStagingApiBase;

    // Release/profile → production unless explicitly overridden above.
    const isRelease = bool.fromEnvironment('dart.vm.product');
    if (isRelease) return kProdApiBase;

    if (Platform.isAndroid) {
      return kDevApiBase;
    }
    if (Platform.isIOS) {
      return 'http://127.0.0.1:3000';
    }
    // Desktop / other debug targets
    return 'http://127.0.0.1:3000';
  }

  static String _stripSlash(String url) =>
      url.endsWith('/') ? url.substring(0, url.length - 1) : url;
}
