import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../storage/string_store.dart';
import 'sms_phone.dart';
import 'sms_vendor_adapter.dart';

/// Local 11-digit form: 01, operator 3–9, then 8 digits. 880… is accepted too.
bool isForgotBdMobile(String raw) {
  var d = raw.replaceAll(RegExp(r'\D'), '');
  if (d.startsWith('880')) d = '0${d.substring(3)}';
  return RegExp(r'^01[3-9]\d{8}$').hasMatch(d);
}

const kOtpLastSentMs = 'forgot.otp.lastMs';
const kOtpCountHour = 'forgot.otp.countHour';
const kOtpHourStartMs = 'forgot.otp.hourStart';

class ForgotOtpRequestResult {
  const ForgotOtpRequestResult({
    required this.sent,
    required this.via,
    this.passwordResetBlocked = false,
    this.reason,
    this.message,
    this.expiresInSec = 300,
  });

  final bool sent;
  final String via; // server | adapter | none
  final bool passwordResetBlocked;
  final String? reason;
  final String? message;
  final int expiresInSec;
}

class ForgotOtpCompleteResult {
  const ForgotOtpCompleteResult({required this.ok, this.reason, this.message});
  final bool ok;
  final String? reason;
  final String? message;
}

/// Phone OTP forgot-pass. Complete always hits the server — never changes
/// password from the client alone.
class ForgotPasswordOtpService {
  ForgotPasswordOtpService({
    required this.store,
    SmsVendorAdapter? adapter,
    Dio? dio,
    this.nowMs,
  })  : adapter = adapter,
        dio = dio ?? Dio(BaseOptions(baseUrl: ApiConfig.baseUrl));

  final StringStore store;
  final SmsVendorAdapter? adapter;
  final Dio dio;
  final int Function()? nowMs;

  static bool _otpApiMissing(int code) =>
      code == 404 || code == 405 || code == 410 || code == 501;

  static String? _messageBn(dynamic data) {
    if (data is Map && data['messageBn'] is String) {
      final text = (data['messageBn'] as String).trim();
      if (text.isNotEmpty) return text;
    }
    return null;
  }

  static String _reasonCode(dynamic data, int code) {
    if (data is Map && data['error'] == 'otp_expired') return 'otp_expired';
    if (data is Map && data['error'] == 'invalid_otp') return 'invalid_otp';
    return 'server_${code == 0 ? 'error' : code}';
  }

  static int _expiresIn(dynamic data) {
    if (data is Map && data['expiresInSec'] is num) {
      final n = (data['expiresInSec'] as num).toInt();
      if (n > 0 && n <= 3600) return n;
    }
    return 300;
  }

  int _now() => nowMs?.call() ?? DateTime.now().millisecondsSinceEpoch;

  Future<String?> _rateLimitError() async {
    final now = _now();
    final last = int.tryParse(await store.read(kOtpLastSentMs) ?? '') ?? 0;
    if (last > 0 && now - last < 60 * 1000) return 'rate_limit_60s';
    final hourStart =
        int.tryParse(await store.read(kOtpHourStartMs) ?? '') ?? 0;
    var count = int.tryParse(await store.read(kOtpCountHour) ?? '') ?? 0;
    if (now - hourStart > 60 * 60 * 1000) {
      count = 0;
      await store.write(kOtpHourStartMs, '$now');
    }
    if (count >= 5) return 'rate_limit_hour';
    return null;
  }

  Future<void> _markSent() async {
    final now = _now();
    final hourStart =
        int.tryParse(await store.read(kOtpHourStartMs) ?? '') ?? now;
    var count = int.tryParse(await store.read(kOtpCountHour) ?? '') ?? 0;
    if (now - hourStart > 60 * 60 * 1000) {
      count = 0;
      await store.write(kOtpHourStartMs, '$now');
    }
    await store.write(kOtpLastSentMs, '$now');
    await store.write(kOtpCountHour, '${count + 1}');
  }

  Future<ForgotOtpRequestResult> requestOtp({
    required String channel,
    String email = '',
    String phone = '',
  }) async {
    final ch = channel.trim().toLowerCase();
    if (ch == 'phone' && !isForgotBdMobile(phone)) {
      return const ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: 'invalid_phone',
      );
    }
    if (ch != 'phone' && ch != 'email') {
      return const ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: 'invalid_channel',
      );
    }
    final limited = await _rateLimitError();
    if (limited != null) {
      return ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: limited,
      );
    }

    final body = <String, dynamic>{
      'channel': ch,
      'email': email.trim(),
    };
    if (ch == 'phone') {
      body['phone'] = SmsPhone.format(phone, SmsPhoneFormat.local01);
    }

    try {
      final res = await dio.post<dynamic>(
        '/api/mobile/v1/auth/password/otp/request',
        data: body,
      );
      final code = res.statusCode ?? 0;
      if (code >= 200 && code < 300) {
        await _markSent();
        return ForgotOtpRequestResult(
          sent: true,
          via: 'server',
          expiresInSec: _expiresIn(res.data),
        );
      }
      return ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: _reasonCode(res.data, code),
        message: _messageBn(res.data),
      );
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 0;
      return ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: code == 0 ? 'network' : _reasonCode(e.response?.data, code),
        message: _messageBn(e.response?.data),
      );
    } catch (_) {
      return const ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: 'network',
      );
    }
  }

  Future<ForgotOtpCompleteResult> complete({
    String? phone,
    String? email,
    required String otp,
    required String newPassword,
  }) async {
    if (otp.trim().length != 6 || int.tryParse(otp.trim()) == null) {
      return const ForgotOtpCompleteResult(ok: false, reason: 'invalid_otp');
    }
    if (newPassword.trim().length < 6) {
      return const ForgotOtpCompleteResult(ok: false, reason: 'weak_password');
    }
    try {
      final payload = <String, dynamic>{
        'otp': otp.trim(),
        'newPassword': newPassword,
        'confirmPassword': newPassword,
      };
      if (phone != null && phone.trim().isNotEmpty) {
        payload['phone'] = SmsPhone.format(phone, SmsPhoneFormat.local01);
      }
      if (email != null && email.trim().isNotEmpty) {
        payload['email'] = email.trim();
      }
      final res = await dio.post<dynamic>(
        '/api/mobile/v1/auth/password/otp/complete',
        data: payload,
      );
      final code = res.statusCode ?? 0;
      if (code >= 200 && code < 300) {
        return const ForgotOtpCompleteResult(ok: true);
      }
      if (_otpApiMissing(code)) {
        return const ForgotOtpCompleteResult(
          ok: false,
          reason: 'blocked_webapp',
        );
      }
      return ForgotOtpCompleteResult(
        ok: false,
        reason: _reasonCode(res.data, code),
        message: _messageBn(res.data),
      );
    } on DioException catch (e) {
      final code = e.response?.statusCode ?? 0;
      if (_otpApiMissing(code) || code == 0) {
        return const ForgotOtpCompleteResult(
          ok: false,
          reason: 'blocked_webapp',
        );
      }
      return ForgotOtpCompleteResult(
        ok: false,
        reason: _reasonCode(e.response?.data, code),
        message: _messageBn(e.response?.data),
      );
    } catch (_) {
      return const ForgotOtpCompleteResult(ok: false, reason: 'network');
    }
  }
}

ForgotPasswordOtpService forgotOtpService({
  required StringStore store,
  required Map<String, String> remoteConfig,
}) {
  // OTP is issued only by the server. [remoteConfig] is unused on purpose.
  return ForgotPasswordOtpService(store: store);
}
