import 'dart:io' show Platform;

/// API host for Dio [BaseOptions.baseUrl].
/// Paths in auth/sync already include `/api/mobile/v1/...`.
///
/// Debug defaults:
/// - Android emulator → `http://10.0.2.2:3000` (host machine localhost)
/// - iOS simulator → `http://127.0.0.1:3000`
/// - Physical device → set [kLanApiBase] to your PC LAN IP (see below)
///
/// Override at run/build time:
/// ```bash
/// flutter run --dart-define=API_BASE=http://192.168.0.99:3000
/// flutter build apk --debug --dart-define=API_BASE=http://192.168.0.99:3000
/// ```
///
/// Production builds (release/profile without override) use [kProdApiBase].
class ApiConfig {
  ApiConfig._();

  /// Production API host (no trailing slash).
  static const String kProdApiBase = 'https://api.lawyerdiarybd.com';

  /// LAN IP of the machine running `webapp` (`npm run dev` on :3000).
  /// Update this when your Wi‑Fi IP changes, or pass `--dart-define=API_BASE=...`.
  /// Current machine example IPs seen on setup: 192.168.0.99 / 192.168.30.68
  static const String kLanApiBase = 'http://192.168.0.99:3000';

  /// Compile-time override: `--dart-define=API_BASE=http://x.x.x.x:3000`
  static const String _fromDefine = String.fromEnvironment('API_BASE');

  /// Force physical-device LAN default even on Android when true:
  /// `--dart-define=USE_LAN_API=true`
  static const bool _useLan =
      bool.fromEnvironment('USE_LAN_API', defaultValue: false);

  static String get baseUrl {
    if (_fromDefine.isNotEmpty) return _stripSlash(_fromDefine);

    // Release/profile → production unless explicitly overridden above.
    const isRelease = bool.fromEnvironment('dart.vm.product');
    if (isRelease) return kProdApiBase;

    if (_useLan) return kLanApiBase;

    if (Platform.isAndroid) {
      // Emulator loopback to host. Physical device: use USE_LAN_API or API_BASE.
      return 'http://10.0.2.2:3000';
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
