import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';
import '../config/api_config.dart';
import '../jurisdiction/locale_provider.dart';
import '../monetization/entitlement.dart';
import '../notifications/fcm_bridge.dart';
import '../utils/notification_service.dart';
import 'auth_copy.dart';
import 'auth_state.dart';
import 'welcome_hold.dart';
import 'guest_gate.dart';
import 'isolate_auth_snapshot.dart';

const _kTokenKey = 'access_token';
const _kRefreshKey = 'refresh_token';
const _kUserKey = 'user_json';
const _kDeviceKey = 'device_id';
const _kLocalBypassUserKey = 'local_bypass_user_id';
const _kLocalBypassWsKey = 'local_bypass_workspace_id';
const _kGuestUserKey = 'guest_user_id';
const _kGuestWsKey = 'guest_workspace_id';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    dio: Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
    )),
    storage: const FlutterSecureStorage(),
    ref: ref,
  );
});

final currentUserProvider = Provider<AuthUser?>((ref) {
  return ref.watch(authProvider).user;
});

final workspaceIdProvider = Provider<String>((ref) {
  return ref.watch(currentUserProvider)?.activeWorkspaceId ?? '';
});

/// @deprecated use [workspaceIdProvider]
final chamberIdProvider = workspaceIdProvider;

class AuthNotifier extends StateNotifier<AuthState> {
  final Dio _dio;
  final FlutterSecureStorage _storage;
  final Ref _ref;
  Future<void> _restoreFuture = Future.value();

  AuthNotifier({
    required Dio dio,
    required FlutterSecureStorage storage,
    required Ref ref,
    bool restoreSession = true,
  })  : _dio = dio,
        _storage = storage,
        _ref = ref,
        super(const AuthState.unknown()) {
    if (restoreSession) {
      _restoreFuture = _tryRestoreSession();
    } else {
      state = const AuthState.unauthenticated();
    }
  }

  /// Awaitable isolate/UI restore (secure storage, then documents snapshot).
  Future<void> get sessionReady => _restoreFuture;

  bool get _en {
    try {
      return _ref.read(localePrefsProvider).language == UiLanguage.en;
    } catch (_) {
      return false;
    }
  }

  Future<String> _deviceId() async {
    try {
      final existing = await _storage
          .read(key: _kDeviceKey)
          .timeout(const Duration(seconds: 2));
      if (existing != null && existing.isNotEmpty) return existing;
    } catch (_) {}
    final created = const Uuid().v4();
    unawaited(() async {
      try {
        await _storage
            .write(key: _kDeviceKey, value: created)
            .timeout(const Duration(seconds: 2));
      } catch (_) {}
    }());
    return created;
  }

  Future<void> _tryRestoreSession() async {
    try {
      var userJson = await _storage.read(key: _kUserKey);
      if (userJson == null || userJson.isEmpty) {
        userJson = await IsolateAuthSnapshot.instance.read();
      }
      if (userJson == null || userJson.isEmpty) {
        state = const AuthState.unauthenticated();
        return;
      }
      final user = _userFromStored(jsonDecode(userJson) as Map<String, dynamic>);
      if (user.isGuest) {
        state = AuthState.authenticated(user);
        return;
      }
      if (user.isLocalBypass) {
        if (!ApiConfig.allowLocalLoginBypass) {
          await signOut();
          return;
        }
        state = AuthState.authenticated(user);
        return;
      }
      if (user.isExpired) {
        await refreshSession();
      } else {
        state = AuthState.authenticated(user);
        unawaited(reloadProfile());
      }
    } catch (_) {
      state = const AuthState.unauthenticated();
    }
  }

  Future<void> login({
    required String identifier,
    required String password,
  }) async {
    try {
      final deviceId = await _deviceId();
      final res = await _dio.post(
        '/api/mobile/v1/auth/login',
        data: {
          'identifier': identifier.trim(),
          'password': password,
          'device': {
            'deviceId': deviceId,
            'platform': 'android',
            'label': 'Android',
          },
        },
      );
      _ref.read(welcomeHoldProvider).value = false;
      await _applyEnvelope(res.data as Map<String, dynamic>, deviceId);
    } on DioException catch (e) {
      final fallback = AuthCopy.loginFailed(_en);
      final msg = e.response?.data is Map
          ? (e.response!.data['messageBn'] ??
              e.response!.data['error'] ??
              fallback)
          : fallback;
      state = AuthState.error('$msg');
    } catch (_) {
      state = AuthState.error(AuthCopy.loginFailed(_en));
    }
  }

  Future<void> signup({
    required String name,
    required String phone,
    String? email,
    required String password,
    required String confirmPassword,
    String? referralCode,
  }) async {
    try {
      final deviceId = await _deviceId();
      final res = await _dio.post(
        '/api/mobile/v1/auth/signup',
        data: {
          'name': name.trim(),
          'phone': phone.trim(),
          'email': (email ?? '').trim(),
          'password': password,
          'confirmPassword': confirmPassword,
          'acceptedTerms': true,
          'uiLanguage': 'bn',
          if (referralCode != null && referralCode.trim().isNotEmpty)
            'referralCode': referralCode.trim(),
          'device': {
            'deviceId': deviceId,
            'platform': 'android',
            'label': 'Android',
          },
        },
      );
      await _applyEnvelope(res.data as Map<String, dynamic>, deviceId);
    } on DioException catch (e) {
      final data = e.response?.data;
      String msg = AuthCopy.signupFailed(_en);
      if (data is Map) {
        msg = '${data['messageBn'] ?? data['error'] ?? msg}';
        if (data['error'] == 'name_taken') {
          msg = '${data['messageBn'] ?? 'এই নামে ইতিমধ্যে একটি অ্যাকাউন্ট আছে। অন্য নাম দিয়ে সাইন আপ করুন।'}';
        }
        final fields = data['fieldErrors'];
        if (fields is Map && fields.isNotEmpty) {
          msg = fields.values.first.toString();
        }
      }
      state = AuthState.error(msg);
    }
  }

  Future<void> requestPasswordReset(String identifier) async {
    await _dio.post(
      '/api/mobile/v1/auth/password/reset/request',
      data: {'identifier': identifier.trim()},
    );
  }

  /// Explore-only session in the same user snapshot. No auth APIs.
  Future<void> enterGuest() async {
    var userId = await _storage.read(key: _kGuestUserKey);
    var wsId = await _storage.read(key: _kGuestWsKey);
    if (userId == null || userId.isEmpty) {
      userId = const Uuid().v4();
      await _storage.write(key: _kGuestUserKey, value: userId);
    }
    if (wsId == null || wsId.isEmpty) {
      wsId = const Uuid().v4();
      await _storage.write(key: _kGuestWsKey, value: wsId);
    }
    final deviceId = await _deviceId();
    final user = AuthUser(
      id: userId,
      username: 'guest',
      name: 'অতিথি',
      phone: '',
      activeWorkspaceId: wsId,
      workspaces: [
        WorkspaceInfo(
          id: wsId,
          name: AuthCopy.myDiary(_en),
          kind: 'personal',
          role: 'owner',
          plan: 'FREE',
        ),
      ],
      accessToken: '',
      refreshToken: '',
      tokenExpiresAt: DateTime.now().add(const Duration(days: 3650)),
      deviceId: deviceId,
      isLocalBypass: true,
      isGuest: true,
    );
    await _storage.delete(key: _kTokenKey);
    await _storage.delete(key: _kRefreshKey);
    await _writeUserJson(user);
    state = AuthState.authenticated(user);
  }

  /// Debug/`dev` only: local test session. No auth APIs, no paid entitlement.
  Future<void> enterLocalBypass() async {
    if (!kDebugMode || !ApiConfig.allowLocalLoginBypass) return;

    var userId = await _storage.read(key: _kLocalBypassUserKey);
    var wsId = await _storage.read(key: _kLocalBypassWsKey);
    if (userId == null || userId.isEmpty) {
      userId = const Uuid().v4();
      await _storage.write(key: _kLocalBypassUserKey, value: userId);
    }
    if (wsId == null || wsId.isEmpty) {
      wsId = const Uuid().v4();
      await _storage.write(key: _kLocalBypassWsKey, value: wsId);
    }

    final deviceId = await _deviceId();
    final user = AuthUser(
      id: userId,
      username: 'local_test',
      name: AuthCopy.localTestName(_en),
      phone: '',
      activeWorkspaceId: wsId,
      workspaces: [
        WorkspaceInfo(
          id: wsId,
          name: AuthCopy.myDiary(_en),
          kind: 'personal',
          role: 'owner',
          plan: 'FREE',
        ),
      ],
      accessToken: '',
      refreshToken: '',
      tokenExpiresAt: DateTime.now().add(const Duration(days: 3650)),
      deviceId: deviceId,
      isLocalBypass: true,
    );
    await _storage.delete(key: _kTokenKey);
    await _storage.delete(key: _kRefreshKey);
    await _writeUserJson(user);
    state = AuthState.authenticated(user);
  }

  Future<void> refreshSession() async {
    if (state.user?.isLocalBypass == true) return;
    final refresh = await _storage.read(key: _kRefreshKey);
    if (refresh == null) {
      await signOut();
      return;
    }
    try {
      final deviceId = await _deviceId();
      final res = await _dio.post(
        '/api/mobile/v1/auth/token/refresh',
        data: {'refreshToken': refresh},
      );
      await _applyEnvelope(res.data as Map<String, dynamic>, deviceId);
    } catch (_) {
      await signOut();
    }
  }

  /// Local / Firestore-linked chamber when the webapp create API is missing.
  Future<WorkspaceInfo?> createLocalChamber(String name) async {
    if (!await GuestGate.allow(null)) return null;
    final user = state.user;
    final trimmed = name.trim();
    if (user == null || trimmed.length < 2) return null;
    final ws = WorkspaceInfo(
      id: const Uuid().v4(),
      name: trimmed,
      kind: 'chamber',
      role: 'owner',
      plan: 'FREE',
    );
    await upsertWorkspace(ws, switchTo: true);
    return ws;
  }

  Future<void> upsertWorkspace(WorkspaceInfo ws, {bool switchTo = false}) async {
    final user = state.user;
    if (user == null) return;
    final rest = user.workspaces.where((w) => w.id != ws.id).toList();
    final next = user.copyWith(
      workspaces: [...rest, ws],
      activeWorkspaceId: switchTo ? ws.id : user.activeWorkspaceId,
    );
    await _writeUserJson(next);
    state = AuthState.authenticated(next);
  }

  Future<void> switchWorkspace(String workspaceId) async {
    final user = state.user;
    if (user == null) return;
    if (!user.workspaces.any((w) => w.id == workspaceId)) return;
    final next = user.copyWith(activeWorkspaceId: workspaceId);
    await _writeUserJson(next);
    state = AuthState.authenticated(next);
  }

  /// Refresh membership list after invite accept / chamber create.
  Future<void> reloadProfile() async {
    final user = state.user;
    if (user == null || user.isLocalBypass) return;
    try {
      final res = await _dio.get(
        '/api/mobile/v1/auth/me',
        options: Options(headers: {'Authorization': 'Bearer ${user.accessToken}'}),
      );
      final next = _userFromEnvelope(res.data as Map<String, dynamic>, user.deviceId);
      final extras = user.workspaces
          .where((w) => !next.workspaces.any((s) => s.id == w.id))
          .toList();
      final mergedWs =
          extras.isEmpty ? next.workspaces : [...next.workspaces, ...extras];
      final merged = next.copyWith(
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        tokenExpiresAt: user.tokenExpiresAt,
        workspaces: mergedWs,
        activeWorkspaceId: mergedWs.any((w) => w.id == user.activeWorkspaceId)
            ? user.activeWorkspaceId
            : next.activeWorkspaceId,
      );
      await _writeUserJson(merged);
      state = AuthState.authenticated(merged);
    } catch (_) {}
  }

  Future<void> signOut() async {
    final wasBypass = state.user?.isLocalBypass == true;
    final access = state.user?.accessToken;
    final refresh = await _storage.read(key: _kRefreshKey);
    try {
      if (!wasBypass) {
        await FcmBridge.revoke?.call(accessToken: access);
      }
    } catch (_) {}
    try {
      if (!wasBypass && refresh != null && refresh.isNotEmpty) {
        await _dio.post(
          '/api/mobile/v1/auth/logout',
          data: {'refreshToken': refresh},
        );
      }
    } catch (_) {}
    await _storage.delete(key: _kTokenKey);
    await _storage.delete(key: _kRefreshKey);
    await _storage.delete(key: _kUserKey);
    await IsolateAuthSnapshot.instance.clear();
    state = const AuthState.unauthenticated();
  }

  Future<String?> deleteAccount(String password) async {
    final user = state.user;
    if (user == null) return AuthCopy.notLoggedIn(_en);
    if (user.isLocalBypass) return AuthCopy.bypassNoDelete(_en);
    try {
      await _dio.delete(
        '/api/mobile/v1/auth/account',
        data: {'password': password},
        options: Options(headers: {'Authorization': 'Bearer ${user.accessToken}'}),
      );
      await signOut();
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map) return '${data['messageBn'] ?? data['error'] ?? AuthCopy.deleteFailed(_en)}';
      return AuthCopy.deleteFailed(_en);
    }
  }

  Future<String?> restoreAccount({
    required String identifier,
    required String password,
  }) async {
    try {
      await _dio.post('/api/mobile/v1/auth/account/restore', data: {
        'identifier': identifier.trim(),
        'password': password,
      });
      return null;
    } on DioException catch (e) {
      final data = e.response?.data;
      if (data is Map) return '${data['messageBn'] ?? data['error'] ?? AuthCopy.restoreFailed(_en)}';
      return AuthCopy.restoreFailed(_en);
    }
  }

  Future<void> _applyEnvelope(Map<String, dynamic> raw, String deviceId) async {
    final user = _userFromEnvelope(raw, deviceId);
    _applyEntitlement(raw['entitlement']);
    state = AuthState.authenticated(user);
    unawaited(_registerFcm());
    try {
      await _persist(user, raw).timeout(const Duration(seconds: 3));
    } catch (_) {}
  }

  Future<void> _registerFcm() async {
    final user = state.user;
    if (user == null || user.isLocalBypass) return;
    if (user.accessToken.isEmpty || user.deviceId.isEmpty) return;
    try {
      await FcmBridge.register?.call(
        accessToken: user.accessToken,
        deviceId: user.deviceId,
        masterEnabled: NotificationService.masterEnabled,
      );
    } catch (_) {}
  }

  void _applyEntitlement(dynamic ent) {
    if (ent is! Map) return;
    final plan = ent['plan'] as String? ?? 'FREE';
    final expires = ent['expiresAt'] as String?;
    final features = ent['features'];
    final active = plan != 'FREE' &&
        (expires == null || DateTime.tryParse(expires)?.isAfter(DateTime.now()) == true);
    _ref.read(entitlementProvider.notifier).applyFromServer(
          active: active,
          planCode: plan,
          endsAt: expires != null ? DateTime.tryParse(expires) : null,
          payOnWebUrl: ent['payOnWebUrl'] as String?,
          accountCreatedAt: DateTime.tryParse('${ent['accountCreatedAt'] ?? ''}'),
          limits: ent['limits'] is Map
              ? Map<String, dynamic>.from(ent['limits'] as Map)
              : null,
          features: features is Map ? Map<String, dynamic>.from(features) : null,
        );
    if (features is Map && features['ads'] == true) {
      // Contract / Phase 1: ads off. Ignore server ads flag if ever true.
    }
  }

  Future<void> _writeUserJson(AuthUser user) async {
    final json = jsonEncode(_toStored(user));
    await _storage.write(key: _kUserKey, value: json);
    await IsolateAuthSnapshot.instance.write(json);
  }

  Future<void> _persist(AuthUser user, Map<String, dynamic> raw) async {
    await _storage.write(key: _kTokenKey, value: user.accessToken);
    await _storage.write(key: _kRefreshKey, value: user.refreshToken);
    await _writeUserJson(user);
  }

  Map<String, dynamic> _toStored(AuthUser u) => {
        'id': u.id,
        'username': u.username,
        'name': u.name,
        'phone': u.phone,
        'email': u.email,
        'activeWorkspaceId': u.activeWorkspaceId,
        'workspaces': u.workspaces
            .map((w) => {
                  'id': w.id,
                  'name': w.name,
                  'kind': w.kind,
                  'role': w.role,
                  'plan': w.plan,
                  'permissions': w.permissions,
                })
            .toList(),
        'accessToken': u.accessToken,
        'refreshToken': u.refreshToken,
        'tokenExpiresAt': u.tokenExpiresAt.toIso8601String(),
        'deviceId': u.deviceId,
        'isLocalBypass': u.isLocalBypass,
        'isGuest': u.isGuest,
      };

  AuthUser _userFromStored(Map<String, dynamic> j) {
    final ws = (j['workspaces'] as List? ?? [])
        .map((e) => WorkspaceInfo.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    return AuthUser(
      id: j['id'] as String,
      username: j['username'] as String? ?? '',
      name: j['name'] as String? ?? '',
      phone: j['phone'] as String? ?? '',
      email: j['email'] as String?,
      activeWorkspaceId: j['activeWorkspaceId'] as String? ??
          (ws.isNotEmpty ? ws.first.id : ''),
      workspaces: ws,
      accessToken: j['accessToken'] as String? ?? '',
      refreshToken: j['refreshToken'] as String? ?? '',
      tokenExpiresAt: DateTime.tryParse(j['tokenExpiresAt'] as String? ?? '') ??
          DateTime.now().add(const Duration(minutes: 15)),
      deviceId: j['deviceId'] as String? ?? '',
      isLocalBypass: j['isLocalBypass'] == true || j['isGuest'] == true,
      isGuest: j['isGuest'] == true,
    );
  }

  AuthUser _userFromEnvelope(Map<String, dynamic> raw, String deviceId) {
    final u = Map<String, dynamic>.from(raw['user'] as Map? ?? raw);
    final list = (raw['workspaces'] as List? ?? [])
        .map((e) => WorkspaceInfo.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
    final personal = list.where((w) => w.kind == 'personal').toList();
    final preferred = state.user?.activeWorkspaceId;
    final activeId = (preferred != null && list.any((w) => w.id == preferred))
        ? preferred
        : (personal.isNotEmpty
            ? personal.first.id
            : (list.isNotEmpty ? list.first.id : ''));
    final expires = raw['accessExpiresAt'] as String? ??
        DateTime.now().add(const Duration(minutes: 15)).toIso8601String();
    return AuthUser(
      id: u['id'] as String,
      username: u['username'] as String? ?? '',
      name: u['name'] as String? ?? '',
      phone: u['phone'] as String? ?? '',
      email: u['email'] as String?,
      activeWorkspaceId: activeId,
      workspaces: list,
      accessToken: raw['accessToken'] as String? ?? '',
      refreshToken: raw['refreshToken'] as String? ?? '',
      tokenExpiresAt: DateTime.tryParse(expires) ??
          DateTime.now().add(const Duration(minutes: 15)),
      deviceId: deviceId,
    );
  }
}
