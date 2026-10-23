import 'package:equatable/equatable.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class WorkspaceInfo extends Equatable {
  final String id;
  final String name;
  final String kind; // personal | chamber
  final String role;
  final String plan;
  final List<String> permissions;
  const WorkspaceInfo({
    required this.id,
    required this.name,
    required this.kind,
    required this.role,
    required this.plan,
    this.permissions = const [],
  });

  factory WorkspaceInfo.fromJson(Map<String, dynamic> j) => WorkspaceInfo(
        id: j['id'] as String,
        name: j['name'] as String? ?? 'আমার ডায়েরি',
        kind: (j['kind'] as String? ?? 'personal').toLowerCase(),
        role: (j['role'] as String? ?? 'owner').toLowerCase(),
        plan: j['plan'] as String? ?? 'FREE',
        permissions: (j['permissions'] as List? ?? []).map((e) => '$e').toList(),
      );

  bool get isOwner => role == 'owner';

  bool can(String key) {
    if (isOwner) return true;
    if (permissions.isEmpty) return isOwner;
    return permissions.contains(key);
  }

  /// P1-28: dashboard is owner / reports.view — juniors do not get হিসাব.
  bool get canViewDashboard => isOwner || can('reports.view');

  @override
  List<Object?> get props => [id, kind, role];
}

class AuthUser extends Equatable {
  final String id;
  final String username;
  final String name;
  final String phone;
  final String? email;
  final String activeWorkspaceId;
  final List<WorkspaceInfo> workspaces;
  final String accessToken;
  final String refreshToken;
  final DateTime tokenExpiresAt;
  final String deviceId;

  /// Debug/`dev` local session — not a server user. Never sync or call auth APIs.
  final bool isLocalBypass;

  /// Explore-only session stored in the same user snapshot. Actions ask to sign up.
  final bool isGuest;

  const AuthUser({
    required this.id,
    required this.username,
    required this.name,
    required this.phone,
    this.email,
    required this.activeWorkspaceId,
    required this.workspaces,
    required this.accessToken,
    required this.refreshToken,
    required this.tokenExpiresAt,
    required this.deviceId,
    this.isLocalBypass = false,
    this.isGuest = false,
  });

  WorkspaceInfo? get activeWorkspace {
    for (final w in workspaces) {
      if (w.id == activeWorkspaceId) return w;
    }
    return workspaces.isEmpty ? null : workspaces.first;
  }

  bool get isExpired => DateTime.now().isAfter(tokenExpiresAt);

  AuthUser copyWith({
    String? activeWorkspaceId,
    String? accessToken,
    String? refreshToken,
    DateTime? tokenExpiresAt,
    List<WorkspaceInfo>? workspaces,
  }) =>
      AuthUser(
        id: id,
        username: username,
        name: name,
        phone: phone,
        email: email,
        activeWorkspaceId: activeWorkspaceId ?? this.activeWorkspaceId,
        workspaces: workspaces ?? this.workspaces,
        accessToken: accessToken ?? this.accessToken,
        refreshToken: refreshToken ?? this.refreshToken,
        tokenExpiresAt: tokenExpiresAt ?? this.tokenExpiresAt,
        deviceId: deviceId,
        isLocalBypass: isLocalBypass,
        isGuest: isGuest,
      );

  @override
  List<Object?> get props => [id, activeWorkspaceId, accessToken, isLocalBypass, isGuest];
}

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUser? user;
  final String? error;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
  });

  const AuthState.unknown() : this();
  const AuthState.unauthenticated() : this(status: AuthStatus.unauthenticated);
  AuthState.authenticated(AuthUser u)
      : this(status: AuthStatus.authenticated, user: u);
  AuthState.error(String msg)
      : this(status: AuthStatus.unauthenticated, error: msg);

  @override
  List<Object?> get props => [status, user, error];
}
