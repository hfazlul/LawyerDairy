import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';
import 'auth_state.dart';

const _kTokenKey   = 'access_token';
const _kRefreshKey = 'refresh_token';
const _kUserKey    = 'user_json';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    dio: Dio(BaseOptions(baseUrl: ApiConfig.baseUrl)),
    storage: const FlutterSecureStorage(),
  );
});

/// Convenience — access current user anywhere
final currentUserProvider = Provider<AuthUser?>((ref) {
  return ref.watch(authProvider).user;
});

final chamberIdProvider = Provider<String>((ref) {
  return ref.watch(currentUserProvider)?.chamberId ?? '';
});

class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio;
  final FlutterSecureStorage _storage;

  AuthNotifier({required Dio dio, required FlutterSecureStorage storage})
      : _dio = dio,
        _storage = storage,
        super(const AuthState.unknown()) {
    _tryRestoreSession();
  }

  // ── Session restore on app start ─────────────────────────────────────────

  Future<void> _tryRestoreSession() async {
    try {
      final userJson = await _storage.read(key: _kUserKey);
      if (userJson == null) {
        state = const AuthState.unauthenticated();
        return;
      }
      final user = _userFromJson(jsonDecode(userJson));
      if (user.isExpired) {
        await _refresh(user.refreshToken);
      } else {
        state = AuthState.authenticated(user);
      }
    } catch (_) {
      state = const AuthState.unauthenticated();
    }
  }

  // ── OTP flow ──────────────────────────────────────────────────────────────

  /// Step 1: Request OTP to phone number
  Future<void> requestOtp(String phone) async {
    await _dio.post('/api/mobile/v1/auth/otp/request', data: {'phone': phone});
  }

  /// Step 2: Verify OTP and get tokens
  Future<void> verifyOtp(String phone, String otp) async {
    try {
      final res = await _dio.post(
        '/api/mobile/v1/auth/otp/verify',
        data: {'phone': phone, 'otp': otp},
      );
      final user = _userFromJson(res.data['user']);
      await _persistSession(user, res.data);
      state = AuthState.authenticated(user);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] ?? 'ভুল OTP বা সার্ভার সমস্যা';
      state = AuthState.error(msg);
    }
  }

  /// Testing only: skip OTP verification and enter the app as authenticated.
  /// Uses the same success path as [verifyOtp] (persist session → authenticated).
  Future<void> bypassOtpForTesting({String? phone}) async {
    final expiresAt =
        DateTime.now().add(const Duration(days: 30)).toIso8601String();
    final userMap = <String, dynamic>{
      'id': 'test-user-id',
      'chamberId': 'test-chamber-id',
      'name': 'টেস্ট ব্যবহারকারী',
      'phone': phone ?? '+8801700000000',
      'role': 'OWNER',
      'barRegNo': null,
      'accessToken': 'test-access-token',
      'refreshToken': 'test-refresh-token',
      'tokenExpiresAt': expiresAt,
    };
    final user = _userFromJson(userMap);
    await _persistSession(user, {
      'accessToken': userMap['accessToken'],
      'refreshToken': userMap['refreshToken'],
      'user': userMap,
    });
    state = AuthState.authenticated(user);
  }

  // ── Token refresh ─────────────────────────────────────────────────────────

  Future<void> _refresh(String refreshToken) async {
    try {
      final res = await _dio.post(
        '/api/mobile/v1/auth/token/refresh',
        data: {'refreshToken': refreshToken},
      );
      final user = _userFromJson(res.data['user']);
      await _persistSession(user, res.data);
      state = AuthState.authenticated(user);
    } catch (_) {
      await signOut();
    }
  }

  // ── Sign out ──────────────────────────────────────────────────────────────

  Future<void> signOut() async {
    await _storage.deleteAll();
    state = const AuthState.unauthenticated();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  Future<void> _persistSession(AuthUser user, Map<String, dynamic> raw) async {
    await _storage.write(key: _kTokenKey,   value: raw['accessToken']);
    await _storage.write(key: _kRefreshKey, value: raw['refreshToken']);
    await _storage.write(key: _kUserKey,    value: jsonEncode(raw['user']));
  }

  AuthUser _userFromJson(Map<String, dynamic> j) => AuthUser(
    id:             j['id'],
    chamberId:      j['chamberId'],
    name:           j['name'],
    phone:          j['phone'],
    role:           j['role'],
    barRegNo:       j['barRegNo'],
    accessToken:    j['accessToken'] ?? '',
    refreshToken:   j['refreshToken'] ?? '',
    tokenExpiresAt: DateTime.parse(j['tokenExpiresAt'] ??
        DateTime.now().add(const Duration(minutes: 15)).toIso8601String()),
  );
}
