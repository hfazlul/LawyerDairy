import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../providers/cases_providers.dart';
import '../../../core/db/database.dart';
import '../../../core/models/case_model.dart';

class CaseDetailScreen extends ConsumerStatefulWidget {
  final String caseId;
  const CaseDetailScreen({super.key, required this.caseId});
  @override
  ConsumerState<CaseDetailScreen> createState() => _CaseDetailScreenState();
}

class _CaseDetailScreenState extends ConsumerState<CaseDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  static const _tabLabels = ['তথ্য', 'টাইমলাইন', 'নথি', 'ফি'];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _tabLabels.length, vsync: this);
  }

  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final caseAsync = ref.watch(caseDetailProvider(widget.caseId));

    return caseAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.brass))),
      error:   (e, _) => Scaffold(body: Center(child: Text(e.toString()))),
      data: (c) {
        if (c == null) return const Scaffold(body: Center(child: Text('পাওয়া যায়নি')));
        return Scaffold(
          backgroundColor: AppColors.parchment,
          body: NestedScrollView(
            headerSliverBuilder: (_, __) => [_buildHeader(c)],
            body: TabBarView(
              controller: _tabs,
              children: [
                _InfoTab(c: c),
                _TimelineTab(caseId: c.id),
                _DocumentsTab(caseId: c.id),
                _FeesTab(caseId: c.id),
              ],
            ),
          ),
        );
      },
    );
  }

  SliverAppBar _buildHeader(Case c) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: AppColors.navy,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.white),
        onPressed: () => Navigator.pop(context),
      ),
      flexibleSpace: FlexibleSpaceBar(
        background: _CaseHeader(c: c, onOutcome: () => _showOutcome(c)),
      ),
      bottom: TabBar(
        controller: _tabs,
        indicatorColor: AppColors.brass,
        indicatorWeight: 2,
        labelColor: AppColors.brass,
        unselectedLabelColor: AppColors.muted,
        labelStyle: AppTypography.chip.copyWith(fontWeight: FontWeight.w700),
        unselectedLabelStyle: AppTypography.chip,
        tabs: _tabLabels.map((t) => Tab(text: t)).toList(),
      ),
    );
  }

  void _showOutcome(Case c) {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _OutcomeSheet(c: c, ref: ref),
    );
  }
}

// ── Case Header ───────────────────────────────────────────────────────────────
class _CaseHeader extends StatelessWidget {
  final Case c;
  final VoidCallback onOutcome;
  const _CaseHeader({required this.c, required this.onOutcome});

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, top + 56, 20, 0),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.navy, AppColors.navySoft],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(c.caseNo,
          style: AppTypography.mono.copyWith(color: Colors.white, fontSize: 15)),
        const SizedBox(height: 4),
        Text(c.clientId ?? '—',
          style: AppTypography.h2.copyWith(color: AppColors.brassLight)),
        const SizedBox(height: 4),
        Text(c.courtName ?? c.court,
          style: AppTypography.caption.copyWith(color: AppColors.muted)),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(
            child: _HeaderBtn(
              label: '✓ ফলাফল দিন',
              bg: AppColors.brass,
              fg: Colors.white,
              onTap: onOutcome,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _HeaderBtn(
              label: '📱 WhatsApp',
              bg: Colors.white.withOpacity(0.12),
              fg: Colors.white,
              border: Colors.white.withOpacity(0.2),
              onTap: () {},
            ),
          ),
        ]),
        const SizedBox(height: 4),
      ]),
    );
  }
}

class _HeaderBtn extends StatelessWidget {
  final String label;
  final Color bg, fg;
  final Color? border;
  final VoidCallback onTap;
  const _HeaderBtn({required this.label, required this.bg, required this.fg,
    this.border, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: bg, borderRadius: BorderRadius.circular(10),
        border: border != null ? Border.all(color: border!) : null,
      ),
      alignment: Alignment.center,
      child: Text(label, style: AppTypography.bodyMedium.copyWith(
        color: fg, fontWeight: FontWeight.w600)),
    ),
  );
}

// ── Info Tab ──────────────────────────────────────────────────────────────────
class _InfoTab extends StatelessWidget {
  final Case c;
  const _InfoTab({required this.c});

  @override
  Widget build(BuildContext context) {
    final rows = [
      ('কেস নম্বর',    c.caseNo),
      ('আদালত',        c.courtName ?? c.court),
      ('কক্ষ নং',      c.courtRoom ?? '—'),
      ('বিচারক',       c.judgeName ?? '—'),
      ('মামলার ধরন',   c.caseType),
      ('ধারা/আইন',     c.actsSections ?? '—'),
      ('পুলিশ স্টেশন', c.policeStation ?? '—'),
      ('পক্ষ',         c.onBehalf),
      ('গত ফলাফল',     c.lastOutcome ?? '—'),
      ('ফাইলিং তারিখ', _fmtDate(c.filingDate)),
      ('পরবর্তী তারিখ', _fmtDate(c.nextDate)),
      ('অগ্রাধিকার',   _priority(c.priority)),
      ('অবস্থা',       c.status == 'active' ? '● সক্রিয়' : '✓ নিষ্পত্তি'),
    ];
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      children: rows.map((row) => _InfoRow(k: row.$1, v: row.$2)).toList(),
    );
  }

  String _fmtDate(DateTime? d) {
    if (d == null) return '—';
    const m = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    return '${d.day} ${m[d.month - 1]} ${d.year}';
  }

  String _priority(String p) => switch (p) {
    'high'   => '🔴 উচ্চ',
    'medium' => '🟡 মাঝারি',
    _        => '🟢 কম',
  };
}

class _InfoRow extends StatelessWidget {
  final String k, v;
  const _InfoRow({required this.k, required this.v});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(vertical: 12),
    decoration: const BoxDecoration(
      border: Border(bottom: BorderSide(color: AppColors.border))),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 110,
        child: Text(k, style: AppTypography.caption.copyWith(color: AppColors.muted))),
      Expanded(
        child: Text(v, style: AppTypography.bodyMedium.copyWith(color: AppColors.ink))),
    ]),
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────────
class _TimelineTab extends ConsumerWidget {
  final String caseId;
  const _TimelineTab({required this.caseId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hearings = ref.watch(caseHearingsProvider(caseId));
    return hearings.when(
      loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brass)),
      error: (e, _) => Center(child: Text(e.toString())),
      data: (list) => list.isEmpty
          ? const _EmptyTimeline()
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
              itemCount: list.length,
              itemBuilder: (_, i) => _HearingTimelineItem(h: list[i], isFirst: i == 0),
            ),
    );
  }
}

class _EmptyTimeline extends StatelessWidget {
  const _EmptyTimeline();
  @override
  Widget build(BuildContext context) => const Center(
    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text('📅', style: TextStyle(fontSize: 48)),
      SizedBox(height: 12),
      Text('কোনো হিয়ারিং রেকর্ড নেই',
        style: TextStyle(fontFamily: 'HindSiliguri', fontSize: 14,
          color: AppColors.muted)),
    ]),
  );
}

class _HearingTimelineItem extends StatelessWidget {
  final Hearing h;
  final bool isFirst;
  const _HearingTimelineItem({required this.h, required this.isFirst});

  @override
  Widget build(BuildContext context) {
    const m = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    final dateStr = '${h.date.day} ${m[h.date.month-1]} ${h.date.year}';

    return IntrinsicHeight(
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Timeline spine
        Column(children: [
          Container(
            width: 10, height: 10,
            decoration: BoxDecoration(
              color: isFirst ? AppColors.brass : AppColors.border,
              shape: BoxShape.circle,
            ),
          ),
          Expanded(child: Container(width: 2, color: AppColors.border)),
        ]),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 18),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(dateStr,
                style: AppTypography.caption.copyWith(color: AppColors.muted, fontSize: 11)),
              const SizedBox(height: 3),
              Text(h.outcome ?? h.purpose ?? 'হিয়ারিং',
                style: AppTypography.bodyMedium.copyWith(color: AppColors.ink,
                  fontWeight: FontWeight.w600)),
              if (h.note != null && h.note!.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(h.note!,
                  style: AppTypography.caption.copyWith(color: AppColors.muted)),
              ],
            ]),
          ),
        ),
      ]),
    );
  }
}

// ── Documents Tab ─────────────────────────────────────────────────────────────
class _DocumentsTab extends StatelessWidget {
  final String caseId;
  const _DocumentsTab({required this.caseId});

  @override
  Widget build(BuildContext context) {
    // TODO: bind to documentsProvider once implemented
    final docs = [
      ('আরজি_২০২৩.pdf',     '245 KB', '📄', '১২ জুন ২০২৩'),
      ('আদেশ_২১জুলাই.pdf',  '120 KB', '📋', '২১ জুলাই ২০২৬'),
    ];
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
      children: [
        ...docs.map((d) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: _DocTile(name: d.$1, size: d.$2, icon: d.$3, date: d.$4),
        )),
        const SizedBox(height: 12),
        _AddDocButton(),
      ],
    );
  }
}

class _DocTile extends StatelessWidget {
  final String name, size, icon, date;
  const _DocTile({required this.name, required this.size, required this.icon, required this.date});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppColors.surface, borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(children: [
      Text(icon, style: const TextStyle(fontSize: 24)),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(name, style: AppTypography.mono.copyWith(color: AppColors.navy)),
        Text('$size · $date',
          style: AppTypography.caption.copyWith(color: AppColors.muted)),
      ])),
      TextButton(
        onPressed: () {},
        child: Text('দেখুন',
          style: AppTypography.caption.copyWith(color: AppColors.info)),
      ),
    ]),
  );
}

class _AddDocButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: () {},
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.brassLighter,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.brass.withOpacity(0.4),
          style: BorderStyle.solid, width: 1.5),
      ),
      alignment: Alignment.center,
      child: Text('+ স্ক্যান করে নথি যোগ করুন',
        style: AppTypography.bodyMedium.copyWith(
          color: AppColors.warning, fontWeight: FontWeight.w600)),
    ),
  );
}

// ── Fees Tab ──────────────────────────────────────────────────────────────────
class _FeesTab extends ConsumerWidget {
  final String caseId;
  const _FeesTab({required this.caseId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feesAsync    = ref.watch(caseFeesProvider(caseId));
    final balanceAsync = ref.watch(caseBalanceProvider(caseId));

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
      children: [
        // Balance card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.navySoft, borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('মোট বকেয়া',
                style: AppTypography.caption.copyWith(color: AppColors.muted)),
              const SizedBox(height: 4),
              balanceAsync.when(
                loading: () => const CircularProgressIndicator(color: AppColors.brass, strokeWidth: 2),
                error: (_, __) => const Text('—'),
                data: (bal) => Text('৳ ${bal.toStringAsFixed(0)}',
                  style: AppTypography.monoLarge.copyWith(color: AppColors.brass)),
              ),
            ])),
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brass, foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                elevation: 0,
              ),
              child: Text('+ আদায়',
                style: AppTypography.caption.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        feesAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.brass)),
          error: (e, _) => Text(e.toString()),
          data: (fees) => Column(
            children: fees.map((f) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: _FeeTile(f: f),
            )).toList(),
          ),
        ),
      ],
    );
  }
}

class _FeeTile extends StatelessWidget {
  final FeeEntry f;
  const _FeeTile({required this.f});

  static const _typeLabel = {
    'feeAgreed':       'ওকালতনামা ফি',
    'received':        'আদায়',
    'expenseCourtFee': 'কোর্ট ফি',
    'expenseStamp':    'স্ট্যাম্প',
    'expenseOther':    'অন্যান্য খরচ',
  };

  @override
  Widget build(BuildContext context) {
    final isIncome = f.type == 'received' || f.type == 'feeAgreed';
    const m = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন',
               'জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface, borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_typeLabel[f.type] ?? f.type,
            style: AppTypography.bodyMedium.copyWith(color: AppColors.ink, fontWeight: FontWeight.w500)),
          Text('${f.date.day} ${m[f.date.month-1]} ${f.date.year}${f.method != null ? ' · ${f.method}' : ''}',
            style: AppTypography.caption.copyWith(color: AppColors.muted)),
        ])),
        Text(
          '${f.type == 'received' ? '-' : ''}৳ ${f.amount.toStringAsFixed(0)}',
          style: AppTypography.mono.copyWith(
            color: f.type == 'received' ? AppColors.success : AppColors.info,
            fontSize: 15, fontWeight: FontWeight.w700,
          ),
        ),
      ]),
    );
  }
}

// ── Outcome Bottom Sheet ──────────────────────────────────────────────────────
class _OutcomeSheet extends StatefulWidget {
  final Case c;
  final WidgetRef ref;
  const _OutcomeSheet({required this.c, required this.ref});
  @override
  State<_OutcomeSheet> createState() => _OutcomeSheetState();
}

class _OutcomeSheetState extends State<_OutcomeSheet> {
  String? _sel;
  DateTime _next = DateTime.now().add(const Duration(days: 30));
  final _noteCtrl = TextEditingController();

  @override
  void dispose() { _noteCtrl.dispose(); super.dispose(); }

  static const _chips = [
    'হাজিরা', 'সময়ের আরজি', 'সাক্ষ্য গ্রহণ', 'জেরা',
    'যুক্তিতর্ক', 'আদেশ', 'নথি তলব', 'স্থগিত', 'নিষ্পত্তি',
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(20, 16, 20, MediaQuery.of(context).viewInsets.bottom + 36),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 36, height: 4,
          decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 14),
        Text('আজকের ফলাফল',
          style: AppTypography.h2.copyWith(color: AppColors.navy)),
        Text(widget.c.caseNo,
          style: AppTypography.mono.copyWith(color: AppColors.muted)),
        const SizedBox(height: 18),
        // Chips
        Align(alignment: Alignment.centerLeft,
          child: Text('কী হলো?',
            style: AppTypography.caption.copyWith(color: AppColors.muted, fontWeight: FontWeight.w600))),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: _chips.map((o) => GestureDetector(
          onTap: () => setState(() => _sel = _sel == o ? null : o),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 120),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: _sel == o ? AppColors.brassLighter : AppColors.parchment,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _sel == o ? AppColors.brass : AppColors.border,
                width: _sel == o ? 1.5 : 1,
              ),
            ),
            child: Text(o, style: AppTypography.chip.copyWith(
              color: _sel == o ? AppColors.warning : AppColors.ink,
              fontWeight: _sel == o ? FontWeight.w700 : FontWeight.w400,
            )),
          ),
        )).toList()),
        const SizedBox(height: 16),
        // Note
        TextField(
          controller: _noteCtrl,
          maxLines: 2,
          decoration: const InputDecoration(hintText: 'সংক্ষিপ্ত নোট (ঐচ্ছিক)...'),
        ),
        const SizedBox(height: 16),
        // Save
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _sel != null ? _save : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: _sel != null ? AppColors.brass : AppColors.border,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
            child: Text(
              _sel != null ? '"$_sel" — সংরক্ষণ করুন' : 'প্রথমে ফলাফল বেছে নিন',
              style: AppTypography.body.copyWith(color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
        ),
      ]),
    );
  }

  Future<void> _save() async {
    // TODO: write hearing + update case.lastOutcome + enqueue sync op
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('"$_sel" সংরক্ষিত হয়েছে',
          style: AppTypography.caption.copyWith(color: Colors.white)),
        backgroundColor: AppColors.success,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
