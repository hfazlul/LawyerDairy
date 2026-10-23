import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';

/// Thrown after the signup sheet when a guest write must not continue.
class GuestActionBlocked implements Exception {
  const GuestActionBlocked();
}

/// One guard for guest actions. Navigation and reading stay open.
class GuestGate {
  GuestGate._();

  static bool Function()? readIsGuest;
  static GlobalKey<NavigatorState>? navigatorKey;

  static bool _sheetOpen = false;

  static bool get isGuest => readIsGuest?.call() ?? false;

  /// True when the action may run. Guests get the signup sheet and false.
  static Future<bool> allow([BuildContext? context]) async {
    if (!isGuest) return true;
    await prompt(context);
    return false;
  }

  static Future<void> prompt([BuildContext? context]) async {
    if (_sheetOpen) return;
    final ctx = _live(context);
    if (ctx == null) return;
    _sheetOpen = true;
    try {
      await showModalBottomSheet<void>(
        context: ctx,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (sheetCtx) => const GuestSignupSheet(),
      );
    } finally {
      _sheetOpen = false;
    }
  }

  static BuildContext? _live(BuildContext? context) {
    if (context != null && context.mounted) return context;
    final nav = navigatorKey?.currentContext;
    if (nav != null && nav.mounted) return nav;
    return null;
  }

  static Future<void> shareText(
    String text, {
    String? subject,
    BuildContext? context,
  }) async {
    if (!await allow(context)) return;
    await Share.share(text, subject: subject);
  }

  static Future<void> shareFiles(
    List<XFile> files, {
    String? text,
    BuildContext? context,
  }) async {
    if (!await allow(context)) return;
    await Share.shareXFiles(files, text: text);
  }
}

class GuestSignupSheet extends StatelessWidget {
  const GuestSignupSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.viewPaddingOf(context).bottom;
    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + bottom),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.brassLight),
          boxShadow: const [
            BoxShadow(
              color: Color(0x3312263F),
              blurRadius: 24,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(22, 18, 22, 18),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.brassLight,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'এই কাজের জন্য সাইন আপ করুন',
                key: const Key('guest-signup-ask'),
                style: AppTypography.h1.copyWith(color: AppColors.navy),
              ),
              const SizedBox(height: 8),
              Text(
                'অতিথি হিসেবে সব পাতা দেখা যায়। সেভ, যোগ, সম্পাদনা, মুছে ফেলা, কল, বার্তা, শেয়ার বা ব্যাকআপ করতে অ্যাকাউন্ট লাগে।',
                style: AppTypography.body.copyWith(color: AppColors.ink, height: 1.5),
              ),
              const SizedBox(height: 18),
              ElevatedButton(
                key: const Key('guest-signup-go'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.navy,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  Navigator.pop(context);
                  final host = GuestGate.navigatorKey?.currentContext ?? context;
                  if (host.mounted) GoRouter.of(host).push('/signup');
                },
                child: Text('সাইন আপ করুন', style: AppTypography.bodyMedium.copyWith(color: Colors.white)),
              ),
              TextButton(
                key: const Key('guest-stay'),
                onPressed: () => Navigator.pop(context),
                child: Text(
                  'অতিথিই থাকুন',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.muted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
