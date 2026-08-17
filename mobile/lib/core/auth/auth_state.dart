import 'package:equatable/equatable.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthUser extends Equatable {
  final String id;
  final String chamberId;
  final String name;
  final String phone;
  final String role;         // OWNER | ASSOCIATE | CLERK | READONLY
  final String? barRegNo;
  final String accessToken;
  final String refreshToken;
  final DateTime tokenExpiresAt;

  const AuthUser({
    required this.id,
    required this.chamberId,
    required this.name,
    required this.phone,
    required this.role,
    this.barRegNo,
    required this.accessToken,
    required this.refreshToken,
    required this.tokenExpiresAt,
  });

  bool get isOwner     => role == 'OWNER';
  bool get canEdit     => role == 'OWNER' || role == 'ASSOCIATE';
  bool get isExpired   => DateTime.now().isAfter(tokenExpiresAt);

  @override
  List<Object?> get props => [id, accessToken];
}

class AuthState extends Equatable {
  final AuthStatus status;
  final AuthUser?  user;
  final String?    error;

  const AuthState({
    this.status = AuthStatus.unknown,
    this.user,
    this.error,
  });

  const AuthState.unknown()        : this();
  const AuthState.unauthenticated(): this(status: AuthStatus.unauthenticated);
  AuthState.authenticated(AuthUser u)
      : this(status: AuthStatus.authenticated, user: u);
  AuthState.error(String msg)
      : this(status: AuthStatus.unauthenticated, error: msg);

  @override
  List<Object?> get props => [status, user, error];
}
