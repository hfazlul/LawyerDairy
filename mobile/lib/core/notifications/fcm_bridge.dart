/// Callbacks so [AuthNotifier] can register/revoke FCM without importing Firebase.
class FcmBridge {
  FcmBridge._();

  static Future<void> Function({
    required String accessToken,
    required String deviceId,
    required bool masterEnabled,
  })? register;

  static Future<void> Function({required String? accessToken})? revoke;
}
