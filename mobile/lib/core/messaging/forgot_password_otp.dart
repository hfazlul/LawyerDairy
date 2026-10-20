import 'dart:math';

import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../storage/string_store.dart';
import 'sms_phone.dart';
import 'sms_vendor_adapter.dart';
import 'sms_vendor_config.dart';

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
    this.expiresInSec = 600,
  });

  final bool sent;
  final String via; // server | adapter | none
  final bool passwordResetBlocked;
  final String? reason;
  final int expiresInSec;
}

class ForgotOtpCompleteResult {
  const ForgotOtpCompleteResult({required this.ok, this.reason});
  final bool ok;
  final String? reason;
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

  /// Unknown numbers must not fall through to the local SMS adapter.
  static ForgotOtpRequestResult? _unknownPhone(dynamic data) {
    if (data is Map && data['error'] == 'unknown_phone') {
      return const ForgotOtpRequestResult(
        sent: false,
        via: 'server',
        reason: 'unknown_phone',
      );
    }
    return null;
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

  static String generateOtp([Random? random]) {
    final n = (random ?? Random.secure()).nextInt(1000000);
    return n.toString().padLeft(6, '0');
  }

  Future<ForgotOtpRequestResult> requestOtp(String phone) async {
    if (!isForgotBdMobile(phone)) {
      return const ForgotOtpRequestResult(
        sent: false,
        via: 'none',
        reason: 'invalid_phone',
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

    try {
      final res = await dio.post<dynamic>(
        '/api/mobile/v1/auth/password/otp/request',
        data: {'phone': SmsPhone.format(phone, SmsPhoneFormat.local01)},
      );
      final unknown = _unknownPhone(res.data);
      if (unknown != null) return unknown;
      final code = res.statusCode ?? 0;
      if (code >= 200 && code < 300) {
        await _markSent();
        return const ForgotOtpRequestResult(sent: true, via: 'server');
      }
      if (!_otpApiMissing(code)) {
        return ForgotOtpRequestResult(
          sent: false,
          via: 'none',
          reason: 'server_$code',
        );
      }
    } on DioException catch (e) {
      final unknown = _unknownPhone(e.response?.data);
      if (unknown != null) return unknown;
      final code = e.response?.statusCode ?? 0;
      if (!_otpApiMissing(code) && code != 0) {
        return ForgotOtpRequestResult(
          sent: false,
          via: 'none',
          reason: 'server_$code',
        );
      }
    } catch (_) {}

    final sms = adapter;
    if (sms != null && sms.config.configured) {
      final otp = generateOtp();
      final body =
          'MAMLAQ-Lawyer Dairy\nYour 6 digit OTP is : $otp\nhttps://mamlaq.com';
      final out = await sms.send(
        to: phone,
        message: body,
      );
      if (out.ok) {
        await _markSent();
        return const ForgotOtpRequestResult(
          sent: true,
          via: 'adapter',
          passwordResetBlocked: true,
        );
      }
      return ForgotOtpRequestResult(
        sent: false,
        via: 'adapter',
        passwordResetBlocked: true,
        reason: out.reason,
      );
    }

    return const ForgotOtpRequestResult(
      sent: false,
      via: 'none',
      passwordResetBlocked: true,
      reason: 'otp_api_missing',
    );
  }

  Future<ForgotOtpCompleteResult> complete({
    required String phone,
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
      final res = await dio.post<dynamic>(
        '/api/mobile/v1/auth/password/otp/complete',
        data: {
          'phone': SmsPhone.format(phone, SmsPhoneFormat.local01),
          'otp': otp.trim(),
          'newPassword': newPassword,
          'confirmPassword': newPassword,
        },
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
      return ForgotOtpCompleteResult(ok: false, reason: 'server_$code');
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
        reason: 'server_${code == 0 ? 'error' : code}',
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
  final cfg = SmsVendorConfig.resolve(remoteConfig: remoteConfig);
  return ForgotPasswordOtpService(
    store: store,
    adapter: cfg.configured ? SmsVendorAdapter(config: cfg) : null,
  );
}
