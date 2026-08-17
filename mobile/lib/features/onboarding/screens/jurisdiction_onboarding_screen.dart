import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/jurisdiction/jurisdiction.dart';
import '../../../core/jurisdiction/locale_provider.dart';
import '../../../core/router/app_router.dart';

/// First-open: soft-suggested country + language; user must confirm (no silent switch).
class JurisdictionOnboardingScreen extends ConsumerStatefulWidget {
  const JurisdictionOnboardingScreen({super.key});

  @override
  ConsumerState<JurisdictionOnboardingScreen> createState() =>
      _JurisdictionOnboardingScreenState();
}

class _JurisdictionOnboardingScreenState
    extends ConsumerState<JurisdictionOnboardingScreen> {
  late JurisdictionCode _j;
  late UiLanguage _lang;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prefs = ref.read(localePrefsProvider);
      setState(() {
        _j = prefs.jurisdiction;
        _lang = prefs.language;
        _ready = true;
      });
    });
  }

  Future<void> _confirm() async {
    await ref.read(localePrefsProvider.notifier).confirm(
          jurisdiction: _j,
          language: _lang,
        );
    if (!mounted) return;
    context.go(Routes.home);
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return const Scaffold(
        backgroundColor: AppColors.parchment,
        body: Center(child: CircularProgressIndicator(color: AppColors.brass)),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Lawyer Diary',
                  style: AppTypography.h1.copyWith(color: AppColors.navy)),
              const SizedBox(height: 8),
              Text(
                'Confirm your country (law pack) and app language. '
                'Content follows country — not language. '
                '(Suggested from device signals; you choose.)',
                style: AppTypography.body.copyWith(color: AppColors.muted),
              ),
              const SizedBox(height: 24),
              Text('Country / law pack',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
              const SizedBox(height: 8),
              for (final code in JurisdictionCode.values)
                RadioListTile<JurisdictionCode>(
                  value: code,
                  groupValue: _j,
                  activeColor: AppColors.brass,
                  title: Text('${code.flag} ${code.nameEn}',
                      style: AppTypography.body.copyWith(color: AppColors.ink)),
                  subtitle: Text(
                    code.paymentRail == PaymentRail.sslcommerzWeb
                        ? 'Pay on web (SSLCommerz) · ads on free'
                        : 'Play Billing on phone · ads on free',
                    style: AppTypography.caption.copyWith(color: AppColors.muted),
                  ),
                  onChanged: (v) => setState(() => _j = v!),
                ),
              const SizedBox(height: 12),
              Text('UI language',
                  style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  for (final lang in UiLanguage.values)
                    ChoiceChip(
                      label: Text(lang.label),
                      selected: _lang == lang,
                      selectedColor: AppColors.brassLighter,
                      onSelected: (_) => setState(() => _lang = lang),
                    ),
                ],
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _confirm,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brass,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                ),
                child: const Text('Confirm & continue'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
