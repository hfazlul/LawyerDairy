import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/jurisdiction/jurisdiction.dart';
import '../../../core/jurisdiction/locale_provider.dart';
import '../../../core/jurisdiction/content.dart';
import 'limitation_calc_screen.dart';
import 'court_fee_screen.dart';
import 'khotiyan_screen.dart';
import 'checklist_screen.dart';
import 'bare_acts_screen.dart';
import 'diary_print_screen.dart';

class ToolsScreen extends ConsumerWidget {
  const ToolsScreen({super.key});

  static const _allTools = [
    (
      emoji: '⏳',
      label: 'Limitation Calculator',
      desc: 'আপিল ও রিভিশনের মেয়াদ',
      hot: true,
      tag: 'limitation',
      bdOnly: false,
    ),
    (
      emoji: '🧾',
      label: 'Court Fee Calculator',
      desc: 'কোর্ট ফি তফসিল অনুযায়ী',
      hot: false,
      tag: 'courtfee',
      bdOnly: false,
    ),
    (
      emoji: '📖',
      label: 'Bare Acts Library',
      desc: 'Jurisdiction resource links',
      hot: false,
      tag: 'bareacts',
      bdOnly: false,
    ),
    (
      emoji: '🌾',
      label: 'খতিয়ান Calculator',
      desc: 'জমির ভাগ ও ওয়ারিশ হিসাব',
      hot: false,
      tag: 'khotiyan',
      bdOnly: true,
    ),
    (
      emoji: '✅',
      label: 'Hearing Checklist',
      desc: 'হিয়ারিং প্রস্তুতির তালিকা',
      hot: false,
      tag: 'checklist',
      bdOnly: false,
    ),
    (
      emoji: '🖨️',
      label: 'ডায়েরি প্রিন্ট',
      desc: 'মাসিক PDF রিপোর্ট',
      hot: false,
      tag: 'print',
      bdOnly: false,
    ),
  ];

  void _open(BuildContext ctx, String tag) {
    final screen = switch (tag) {
      'limitation' => const LimitationCalcScreen(),
      'courtfee' => const CourtFeeScreen(),
      'bareacts' => const BareActsScreen(),
      'khotiyan' => const KhotiyanScreen(),
      'checklist' => const ChecklistScreen(),
      'print' => const DiaryPrintScreen(),
      _ => null,
    };
    if (screen != null) {
      Navigator.push(ctx, MaterialPageRoute(builder: (_) => screen));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(localePrefsProvider);
    final j = prefs.jurisdiction;
    final content = contentFor(j);
    final tools = _allTools.where((t) => !t.bdOnly || j.bdOnlyTools).toList();
    final top = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: Column(children: [
        Container(
          color: AppColors.navy,
          padding: EdgeInsets.fromLTRB(16, top + 12, 16, 18),
          child: Row(children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('সরঞ্জাম',
                  style: AppTypography.h2.copyWith(color: Colors.white)),
              Text(
                '${j.flag} ${content.limitationLabel}',
                style: AppTypography.caption.copyWith(color: AppColors.muted),
              ),
            ]),
          ]),
        ),
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 0.95,
            ),
            itemCount: tools.length,
            itemBuilder: (ctx, i) {
              final t = tools[i];
              return GestureDetector(
                onTap: () => _open(ctx, t.tag),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: t.hot ? AppColors.brassLighter : AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: t.hot
                          ? AppColors.brass.withOpacity(0.4)
                          : AppColors.border,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.emoji, style: const TextStyle(fontSize: 28)),
                      const Spacer(),
                      Text(t.label,
                          style: AppTypography.bodyMedium
                              .copyWith(color: AppColors.ink)),
                      const SizedBox(height: 4),
                      Text(t.desc,
                          style: AppTypography.caption
                              .copyWith(color: AppColors.muted)),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ]),
    );
  }
}
