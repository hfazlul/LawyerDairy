import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/models/limitation_engine.dart';
import '../../../core/models/limitation_packs.dart';
import '../../../core/jurisdiction/jurisdiction.dart';
import '../../../core/jurisdiction/locale_provider.dart';
import '../../../core/jurisdiction/content.dart';
import '../../../shared/widgets/brass_button.dart';

class LimitationCalcScreen extends ConsumerStatefulWidget {
  const LimitationCalcScreen({super.key});
  @override
  ConsumerState<LimitationCalcScreen> createState() =>
      _LimitationCalcScreenState();
}

class _LimitationCalcScreenState extends ConsumerState<LimitationCalcScreen> {
  String? _kind;
  DateTime? _baseDate;
  LimitationResult? _result;

  static const _months = [
    'জানু',
    'ফেব্রু',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টে',
    'অক্টো',
    'নভে',
    'ডিসে'
  ];

  String _fmt(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}';

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _baseDate ?? DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.brass,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
    );
    if (d != null) {
      setState(() {
        _baseDate = d;
        _result = null;
      });
    }
  }

  void _compute() {
    if (_kind == null || _baseDate == null) return;
    final j = ref.read(jurisdictionProvider);
    setState(() {
      _result = LimitationPacks.compute(j, _kind!, _baseDate!);
    });
  }

  @override
  Widget build(BuildContext context) {
    final j = ref.watch(jurisdictionProvider);
    final content = contentFor(j);
    final labels = LimitationPacks.kindLabelsFor(j);
    final scaffold = LimitationPacks.isScaffold(j);

    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: Text('Limitation · ${j.flag} ${j.apiCode}'),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: scaffold ? AppColors.warningBg : AppColors.infoBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: (scaffold ? AppColors.warning : AppColors.info)
                      .withOpacity(0.2),
                ),
              ),
              child: Row(
                children: [
                  Text(scaffold ? '🚧' : 'ℹ️',
                      style: const TextStyle(fontSize: 16)),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      scaffold
                          ? '${content.limitationLabel} — scaffold only. '
                              '${content.limitationActNote}'
                          : '${content.limitationLabel} তফসিল অনুযায়ী হিসাব। '
                              'শুক্র-শনি ও ছুটির দিন স্বয়ংক্রিয়ভাবে বাদ (ধারা ৪)।',
                      style: AppTypography.caption.copyWith(
                        color:
                            scaffold ? AppColors.warning : AppColors.info,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'মামলার ধরন বেছে নিন',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.muted,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            ...labels.entries.map((e) {
              final active = _kind == e.key;
              return GestureDetector(
                onTap: () => setState(() {
                  _kind = e.key;
                  _result = null;
                }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 120),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color:
                        active ? AppColors.brassLighter : AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: active ? AppColors.brass : AppColors.border,
                      width: active ? 1.5 : 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          e.value,
                          style: AppTypography.bodyMedium.copyWith(
                            color: active
                                ? AppColors.warning
                                : AppColors.ink,
                            fontWeight: active
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                      ),
                      if (active)
                        const Icon(Icons.check_circle,
                            color: AppColors.brass, size: 18),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),
            Text(
              'আদেশ / ডিক্রির তারিখ',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.muted,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            GestureDetector(
              onTap: _pickDate,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color:
                        _baseDate != null ? AppColors.brass : AppColors.border,
                    width: _baseDate != null ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.calendar_today,
                      color: _baseDate != null
                          ? AppColors.brass
                          : AppColors.muted,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      _baseDate != null ? _fmt(_baseDate!) : 'তারিখ বেছে নিন',
                      style: AppTypography.body.copyWith(
                        color: _baseDate != null
                            ? AppColors.navy
                            : AppColors.muted,
                        fontWeight: _baseDate != null
                            ? FontWeight.w600
                            : FontWeight.w400,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            BrassButton(
              label: scaffold ? 'Scaffold হিসাব (নন-প্রোড)' : 'মেয়াদ হিসাব করুন',
              onPressed:
                  (_kind != null && _baseDate != null) ? _compute : null,
            ),
            if (_result != null) ...[
              const SizedBox(height: 28),
              _ResultCard(r: _result!),
            ],
          ],
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  final LimitationResult r;
  const _ResultCard({required this.r});

  static const _months = [
    'জানু',
    'ফেব্রু',
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টে',
    'অক্টো',
    'নভে',
    'ডিসে'
  ];

  String _fmt(DateTime d) => '${d.day} ${_months[d.month - 1]} ${d.year}';

  @override
  Widget build(BuildContext context) {
    final expired = r.isExpired;
    final urgent = !expired && r.daysRemaining <= 7;
    final bg = expired
        ? AppColors.dangerBg
        : urgent
            ? AppColors.warningBg
            : AppColors.successBg;
    final fg = expired
        ? AppColors.danger
        : urgent
            ? AppColors.warning
            : AppColors.success;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: fg.withOpacity(0.25)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(expired ? '❌' : urgent ? '⚠️' : '✅',
                  style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  expired
                      ? 'মেয়াদ শেষ হয়ে গেছে'
                      : urgent
                          ? '${r.daysRemaining} দিন বাকি — জরুরি!'
                          : '${r.daysRemaining} দিন বাকি',
                  style: AppTypography.h2.copyWith(color: fg),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _kv('সময়সীমা', '${r.days} দিন'),
          _kv('শেষ তারিখ', _fmt(r.dueDate)),
          _kv('ভিত্তি তারিখ', _fmt(r.baseDate)),
          _kv('আইনি সূত্র', r.ruleRef),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.6),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              r.disclaimer,
              style: AppTypography.caption.copyWith(
                color: AppColors.muted,
                fontSize: 11,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _kv(String k, String v) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 100,
              child: Text(k,
                  style:
                      AppTypography.caption.copyWith(color: AppColors.muted)),
            ),
            Expanded(
              child: Text(
                v,
                style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.ink,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      );
}
