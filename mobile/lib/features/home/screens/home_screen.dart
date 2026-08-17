import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/models/case_model.dart';
import '../../../core/guide/guide_video_service.dart';
import '../../../core/ads/admob_service.dart';
import '../../../core/monetization/entitlement.dart';
import '../../../core/monetization/feature_gate.dart';
import '../../../core/jurisdiction/locale_provider.dart';
import '../../../core/jurisdiction/jurisdiction.dart';

/// আজকের বোর্ড — THE signature screen
///
/// Design decisions (DO NOT CHANGE without good reason):
/// - Court-grouped cards: mirrors lawyer's physical movement plan
/// - Works 100% offline — no spinner on load
/// - Limitation badge (red) appears when ≤7 days left
/// - 3 chip actions per card — outcome, WhatsApp, documents
/// - "Tomorrow's preview" at bottom — reduces morning anxiety
class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _maybeShowGuidePrompt());
  }

  Future<void> _maybeShowGuidePrompt() async {
    final guide = GuideVideoService.instance;
    if (!await guide.shouldShowHomePrompt()) return;
    if (!mounted) return;
    await guide.recordHomePromptShown();
    if (!mounted) return;
    final j = ref.read(jurisdictionProvider);
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('গাইড ভিডিও',
            style: AppTypography.h2.copyWith(color: AppColors.navy)),
        content: Text(
          'অ্যাপ ব্যবহারের সংক্ষিপ্ত ভিডিও দেখতে চান? (${j.guideVideoKey})',
          style: AppTypography.body.copyWith(color: AppColors.ink),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('পরে',
                style: AppTypography.caption.copyWith(color: AppColors.muted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              guide.openGuide(jurisdiction: j);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brass,
              foregroundColor: Colors.white,
              elevation: 0,
            ),
            child: const Text('দেখুন'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // TODO: bind these to Riverpod providers backed by Drift DAOs
    final todayCases = _mockTodayCases();
    final urgentDeadlines = todayCases.where((c) => c.isUrgentDeadline).toList();
    final courtGroups = _groupByCourt(todayCases);
    final premium = ref.watch(isPremiumActiveProvider);
    final showAds = FeatureGate.showNativeAds(isPremiumActive: premium);

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: CustomScrollView(
        slivers: [
          _HomeHeader(
            caseCount: todayCases.length,
            courtCount: courtGroups.length,
            jurisdiction: ref.watch(jurisdictionProvider),
          ),
          if (urgentDeadlines.isNotEmpty)
            SliverToBoxAdapter(child: _DeadlineAlert(cases: urgentDeadlines)),
          for (final entry in courtGroups.entries)
            SliverToBoxAdapter(
              child: _CourtGroup(courtName: entry.key, cases: entry.value),
            ),
          if (showAds)
            SliverToBoxAdapter(
              child: _NativeAdPlaceholder(
                onLoad: () => ref.read(adMobServiceProvider).loadNativeAd(),
              ),
            ),
          const SliverToBoxAdapter(child: _TomorrowPreview()),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }

  Map<String, List<CaseModel>> _groupByCourt(List<CaseModel> cases) {
    final result = <String, List<CaseModel>>{};
    for (final c in cases) {
      (result[c.courtName ?? 'অজানা আদালত'] ??= []).add(c);
    }
    return result;
  }

  List<CaseModel> _mockTodayCases() => [
    CaseModel(id: '1', chamberId: 'ch1', caseNo: 'দেওয়ানী ১২৩/২০২৩', caseType: 'দেওয়ানী', court: CourtType.judgesCourt, courtName: 'যুগ্ম জেলা জজ, ১ম আদালত', courtRoom: 'কক্ষ ৩', onBehalf: OnBehalf.plaintiff, priority: Priority.high, deadlineDaysRemaining: 3, updatedAt: DateTime.now()),
    CaseModel(id: '2', chamberId: 'ch1', caseNo: 'ফৌজদারী ৩৪৫/২০২৪', caseType: 'ফৌজদারী', court: CourtType.judgesCourt, courtName: 'যুগ্ম জেলা জজ, ১ম আদালত', courtRoom: 'কক্ষ ৩', onBehalf: OnBehalf.defendant, priority: Priority.medium, updatedAt: DateTime.now()),
    CaseModel(id: '3', chamberId: 'ch1', caseNo: 'রিট পিটিশন ৭৮/২০২৪', caseType: 'রিট', court: CourtType.highCourt, courtName: 'হাইকোর্ট বিভাগ', courtRoom: 'কক্ষ ১২', onBehalf: OnBehalf.petitioner, priority: Priority.high, updatedAt: DateTime.now()),
  ];
}

/// Native ad slot for free users on dashboard/visualization pages.
class _NativeAdPlaceholder extends StatefulWidget {
  final Future<bool> Function() onLoad;
  const _NativeAdPlaceholder({required this.onLoad});

  @override
  State<_NativeAdPlaceholder> createState() => _NativeAdPlaceholderState();
}

class _NativeAdPlaceholderState extends State<_NativeAdPlaceholder> {
  @override
  void initState() {
    super.initState();
    widget.onLoad();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Container(
        height: 72,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        // TODO: replace with google_mobile_ads NativeAd widget
        child: Text('Ad · native (stub)',
            style: AppTypography.caption.copyWith(color: AppColors.muted)),
      ),
    );
  }
}

// ── Header ─────────────────────────────────────────────────────────────────────
class _HomeHeader extends StatelessWidget {
  final int caseCount, courtCount;
  final JurisdictionCode jurisdiction;
  const _HomeHeader({
    required this.caseCount,
    required this.courtCount,
    required this.jurisdiction,
  });

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return SliverToBoxAdapter(
      child: Container(
        padding: EdgeInsets.fromLTRB(20, top + 16, 20, 20),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [AppColors.navy, AppColors.navySoft],
          ),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(
                '${jurisdiction.flag} ${jurisdiction.nameEn}',
                style: AppTypography.caption.copyWith(
                  color: AppColors.brassLight, letterSpacing: 0.4),
              ),
              const SizedBox(height: 4),
              Text('বুধবার, ৫ আগস্ট ২০২৬',
                style: AppTypography.caption.copyWith(color: AppColors.brassLight, letterSpacing: 0.8)),
              const SizedBox(height: 4),
              Text('আজকের বোর্ড',
                style: AppTypography.h1.copyWith(color: Colors.white)),
              const SizedBox(height: 4),
              Text('$caseCountটি শুনানি · $courtCountটি আদালত',
                style: AppTypography.caption.copyWith(color: AppColors.muted)),
            ])),
            _NotificationBell(),
          ]),
          const SizedBox(height: 16),
          Row(children: [
            _StatChip('48', 'মোট মামলা', AppColors.brass),
            const SizedBox(width: 8),
            _StatChip('31', 'সক্রিয়',    AppColors.success),
            const SizedBox(width: 8),
            _StatChip('17', 'নিষ্পত্তি', AppColors.muted),
          ]),
        ]),
      ),
    );
  }
}

class _NotificationBell extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Stack(children: [
    Container(
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(10),
      child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 20),
    ),
    Positioned(top: 8, right: 8, child: Container(
      width: 8, height: 8,
      decoration: BoxDecoration(
        color: AppColors.danger, shape: BoxShape.circle,
        border: Border.all(color: AppColors.navy, width: 1.5),
      ),
    )),
  ]);
}

class _StatChip extends StatelessWidget {
  final String value, label;
  final Color color;
  const _StatChip(this.value, this.label, this.color);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.07), borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(value, style: AppTypography.monoLarge.copyWith(color: color, height: 1.0)),
        const SizedBox(height: 3),
        Text(label, style: AppTypography.caption.copyWith(color: AppColors.muted, fontSize: 10)),
      ]),
    ),
  );
}

// ── Deadline Alert ─────────────────────────────────────────────────────────────
class _DeadlineAlert extends StatelessWidget {
  final List<CaseModel> cases;
  const _DeadlineAlert({required this.cases});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.dangerBg, borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.danger.withOpacity(0.2)),
      ),
      child: Row(children: [
        const Text('⏰', style: TextStyle(fontSize: 16)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Limitation সতর্কতা',
            style: AppTypography.caption.copyWith(color: AppColors.danger, fontWeight: FontWeight.w700)),
          const SizedBox(height: 2),
          Text('${cases[0].caseNo} — আপিলের মেয়াদ মাত্র ${cases[0].deadlineDaysRemaining} দিন বাকি',
            style: AppTypography.caption.copyWith(color: AppColors.danger, fontSize: 11)),
        ])),
        Text('দেখুন →', style: AppTypography.caption.copyWith(color: AppColors.danger, fontWeight: FontWeight.w700)),
      ]),
    ),
  );
}

// ── Court Group ────────────────────────────────────────────────────────────────
class _CourtGroup extends StatelessWidget {
  final String courtName;
  final List<CaseModel> cases;
  const _CourtGroup({required this.courtName, required this.cases});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(width: 3, height: 30, decoration: BoxDecoration(color: AppColors.brass, borderRadius: BorderRadius.circular(2))),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(courtName, style: AppTypography.bodyMedium.copyWith(color: AppColors.navy, fontWeight: FontWeight.w600)),
          Text('${cases[0].courtRoom ?? ''} · ${cases.length}টি মামলা',
            style: AppTypography.caption.copyWith(color: AppColors.muted, fontSize: 11)),
        ]),
      ]),
      const SizedBox(height: 10),
      ...cases.map((c) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: _CaseCard(c),
      )),
    ]),
  );
}

// ── Case Card ──────────────────────────────────────────────────────────────────
class _CaseCard extends StatelessWidget {
  final CaseModel c;
  const _CaseCard(this.c);

  Color get _priorityColor => switch (c.priority) {
    Priority.high   => AppColors.danger,
    Priority.medium => AppColors.warning,
    Priority.low    => AppColors.success,
  };

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {}, // TODO: push CaseDetailScreen
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        clipBehavior: Clip.hardEdge,
        child: IntrinsicHeight(
          child: Row(children: [
            // Priority stripe
            Container(width: 3, color: _priorityColor),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 10),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(c.caseNo, style: AppTypography.mono.copyWith(color: AppColors.navy)),
                      const SizedBox(height: 3),
                      Text(c.clientId ?? 'ক্লায়েন্টের নাম',
                        style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
                    ])),
                    if (c.isUrgentDeadline)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.dangerBg, borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.danger.withOpacity(0.2)),
                        ),
                        child: Text('⏰ ${c.deadlineDaysRemaining} দিন',
                          style: AppTypography.chip.copyWith(color: AppColors.danger)),
                      ),
                  ]),
                  const SizedBox(height: 4),
                  Text('গত ফলাফল: ${c.lastOutcome ?? 'অজানা'}',
                    style: AppTypography.caption.copyWith(color: AppColors.muted)),
                  const SizedBox(height: 10),
                  // Action chips row
                  Row(children: [
                    _ActionChip('✓ ফলাফল', AppColors.brassLighter, AppColors.warning,
                      borderColor: AppColors.brass.withOpacity(0.3),
                      onTap: () => _showOutcomeSheet(context)),
                    const SizedBox(width: 7),
                    _ActionChip('WA জানান', AppColors.successBg, AppColors.success,
                      borderColor: AppColors.success.withOpacity(0.2),
                      onTap: () {}),
                    const SizedBox(width: 7),
                    _ActionChip('📋 নথি', AppColors.infoBg, AppColors.info,
                      borderColor: AppColors.info.withOpacity(0.2),
                      onTap: () {}),
                  ]),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  void _showOutcomeSheet(BuildContext context) {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OutcomeSheet(c),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final String label;
  final Color bg, fg, borderColor;
  final VoidCallback onTap;
  const _ActionChip(this.label, this.bg, this.fg, {required this.borderColor, required this.onTap});
  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 7),
        decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(8),
          border: Border.all(color: borderColor),
        ),
        alignment: Alignment.center,
        child: Text(label, style: AppTypography.chip.copyWith(color: fg), textAlign: TextAlign.center),
      ),
    ),
  );
}

// ── Outcome Sheet ──────────────────────────────────────────────────────────────
class _OutcomeSheet extends StatefulWidget {
  final CaseModel c;
  const _OutcomeSheet(this.c);
  @override
  State<_OutcomeSheet> createState() => _OutcomeSheetState();
}

class _OutcomeSheetState extends State<_OutcomeSheet> {
  String? _selected;
  DateTime _nextDate = DateTime.now().add(const Duration(days: 30));

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 36),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 14),
        Text('আজকের ফলাফল', style: AppTypography.h2.copyWith(color: AppColors.navy)),
        Text(widget.c.caseNo, style: AppTypography.mono.copyWith(color: AppColors.muted)),
        const SizedBox(height: 18),
        // Outcome chips
        Text('কী হলো?', style: AppTypography.caption.copyWith(color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: kOutcomeChips.map((o) => GestureDetector(
          onTap: () => setState(() => _selected = _selected == o ? null : o),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: _selected == o ? AppColors.brassLighter : AppColors.parchment,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: _selected == o ? AppColors.brass : AppColors.border,
                width: _selected == o ? 1.5 : 1),
            ),
            child: Text(o, style: AppTypography.chip.copyWith(
              color: _selected == o ? AppColors.warning : AppColors.ink,
              fontWeight: _selected == o ? FontWeight.w700 : FontWeight.w400,
            )),
          ),
        )).toList()),
        const SizedBox(height: 18),
        // Save button
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _selected != null ? () => Navigator.pop(context) : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: _selected != null ? AppColors.brass : AppColors.border,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(
              _selected != null ? '"$_selected" — সংরক্ষণ করুন' : 'প্রথমে ফলাফল বেছে নিন',
              style: AppTypography.body.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ]),
    );
  }
}

// ── Tomorrow Preview ───────────────────────────────────────────────────────────
class _TomorrowPreview extends StatelessWidget {
  const _TomorrowPreview();
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('কালকের ঝলক — ৬ আগস্ট',
          style: AppTypography.caption.copyWith(color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        ...['আপিল ৫৬/২০২৩ — নূর মোহাম্মদ', 'পারিবারিক ৯১/২০২৩ — রাহেলা বেগম']
          .asMap().entries.map((e) => Padding(
            padding: EdgeInsets.only(top: e.key > 0 ? 8 : 0,
              bottom: e.key > 0 ? 0 : 0),
            child: Column(children: [
              if (e.key > 0) const Divider(height: 16),
              Row(children: [
                Container(width: 6, height: 6, decoration: BoxDecoration(color: AppColors.brass, shape: BoxShape.circle)),
                const SizedBox(width: 10),
                Text(e.value, style: AppTypography.caption.copyWith(color: AppColors.ink)),
              ]),
            ]),
          )),
      ]),
    ),
  );
}
