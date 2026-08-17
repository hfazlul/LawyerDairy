import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../auth/auth_provider.dart';
import '../auth/auth_state.dart';
import '../jurisdiction/locale_provider.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/onboarding/screens/jurisdiction_onboarding_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/cases/screens/cases_screen.dart';
import '../../features/cases/screens/case_detail_screen.dart';
import '../../features/cases/screens/case_add_screen.dart';
import '../../features/calendar/screens/calendar_screen.dart';
import '../../features/tools/screens/tools_screen.dart';
import '../../features/clients/screens/clients_screen.dart';
import '../../features/clients/screens/client_detail_screen.dart';
import '../../features/clients/screens/client_add_screen.dart';
import '../../features/fees/screens/fees_screen.dart';
import '../../features/settings/screens/settings_screen.dart';
import '../../features/documents/screens/documents_screen.dart';

abstract class Routes {
  static const onboarding     = '/onboarding';
  static const login          = '/login';
  static const home           = '/home';
  static const cases          = '/cases';
  static const caseAdd        = '/cases/add';
  static const caseDetail     = '/cases/:id';
  static const calendar       = '/calendar';
  static const tools          = '/tools';
  static const clients        = '/clients';
  static const clientAdd      = '/clients/add';
  static const clientDetail   = '/clients/:id';
  static const fees           = '/fees';
  static const settings       = '/settings';
  static const documents      = '/cases/:id/documents';

  static String caseDetailPath(String id)  => '/cases/$id';
  static String clientDetailPath(String id) => '/clients/$id';
  static String documentsPath(String caseId, String caseNo) =>
      '/cases/$caseId/documents?caseNo=${Uri.encodeComponent(caseNo)}';
}

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);
  final needsOnboarding = ref.watch(needsJurisdictionOnboardingProvider);

  return GoRouter(
    initialLocation: Routes.home,
    debugLogDiagnostics: false,
    redirect: (context, state) {
      final loc = state.matchedLocation;
      final isLogin = loc == Routes.login;
      final isOnboarding = loc == Routes.onboarding;

      if (auth.status == AuthStatus.unknown) return null;

      if (auth.status == AuthStatus.unauthenticated && !isLogin) {
        return Routes.login;
      }
      if (auth.status == AuthStatus.authenticated && isLogin) {
        return needsOnboarding ? Routes.onboarding : Routes.home;
      }
      if (auth.status == AuthStatus.authenticated &&
          needsOnboarding &&
          !isOnboarding) {
        return Routes.onboarding;
      }
      if (auth.status == AuthStatus.authenticated &&
          !needsOnboarding &&
          isOnboarding) {
        return Routes.home;
      }
      return null;
    },
    routes: [
      GoRoute(path: Routes.login, builder: (_, __) => const LoginScreen()),
      GoRoute(
        path: Routes.onboarding,
        builder: (_, __) => const JurisdictionOnboardingScreen(),
      ),

      ShellRoute(
        builder: (context, state, child) =>
            _AppShell(child: child, location: state.matchedLocation),
        routes: [
          GoRoute(path: Routes.home,     builder: (_, __) => const HomeScreen()),
          GoRoute(path: Routes.cases,    builder: (_, __) => const CasesScreen()),
          GoRoute(path: Routes.calendar, builder: (_, __) => const CalendarScreen()),
          GoRoute(path: Routes.tools,    builder: (_, __) => const ToolsScreen()),
          GoRoute(
            path: Routes.caseAdd,
            pageBuilder: (_, __) => const MaterialPage(
              fullscreenDialog: true, child: CaseAddScreen())),
          GoRoute(
            path: Routes.caseDetail,
            builder: (_, state) => CaseDetailScreen(
              caseId: state.pathParameters['id']!)),
          GoRoute(
            path: Routes.documents,
            builder: (_, state) => DocumentsScreen(
              caseId: state.pathParameters['id']!,
              caseNo: state.uri.queryParameters['caseNo'] ?? '')),
          GoRoute(path: Routes.clients, builder: (_, __) => const ClientsScreen()),
          GoRoute(
            path: Routes.clientAdd,
            pageBuilder: (_, __) => const MaterialPage(
              fullscreenDialog: true, child: ClientAddScreen())),
          GoRoute(
            path: Routes.clientDetail,
            builder: (_, state) => ClientDetailScreen(
              clientId: state.pathParameters['id']!)),
          GoRoute(path: Routes.fees,     builder: (_, __) => const FeesScreen()),
          GoRoute(path: Routes.settings, builder: (_, __) => const SettingsScreen()),
        ],
      ),
    ],
  );
});

class _AppShell extends ConsumerWidget {
  final Widget child;
  final String location;
  const _AppShell({required this.child, required this.location});

  static const _tabs = [
    Routes.home, Routes.cases, Routes.calendar, Routes.tools,
  ];

  int get _currentIdx {
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i])) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: child,
      floatingActionButton: FloatingActionButton(
        heroTag: 'global_fab',
        onPressed: () => context.push(Routes.caseAdd),
        backgroundColor: const Color(0xFFC6A15B),
        child: const Icon(Icons.add, color: Colors.white),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        color: Colors.white,
        elevation: 8,
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(children: [
          _NavBtn(0, Icons.home_outlined,         Icons.home,          'বোর্ড',       Routes.home,     _currentIdx),
          _NavBtn(1, Icons.work_outline,           Icons.work,          'মামলা',       Routes.cases,    _currentIdx),
          const Expanded(child: SizedBox()),
          _NavBtn(2, Icons.calendar_today_outlined,Icons.calendar_today,'ক্যালেন্ডার',Routes.calendar, _currentIdx),
          _NavBtn(3, Icons.build_outlined,         Icons.build,         'সরঞ্জাম',    Routes.tools,    _currentIdx),
        ]),
      ),
    );
  }
}

class _NavBtn extends StatelessWidget {
  final int idx, current;
  final IconData icon, activeIcon;
  final String label, route;
  const _NavBtn(this.idx, this.icon, this.activeIcon,
    this.label, this.route, this.current);

  @override
  Widget build(BuildContext context) {
    final on = idx == current;
    const brass  = Color(0xFFC6A15B);
    const muted  = Color(0xFF94A3B8);
    return Expanded(
      child: InkWell(
        onTap: () => context.go(route),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(on ? activeIcon : icon, color: on ? brass : muted, size: 22),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(
              fontFamily: 'HindSiliguri', fontSize: 10,
              color: on ? brass : muted,
              fontWeight: on ? FontWeight.w700 : FontWeight.w400)),
          ],
        ),
      ),
    );
  }
}
