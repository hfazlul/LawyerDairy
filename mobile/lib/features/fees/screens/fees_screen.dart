import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/auth/auth_provider.dart';
import '../../cases/providers/cases_providers.dart';

class FeesScreen extends ConsumerStatefulWidget {
  const FeesScreen({super.key});
  @override
  ConsumerState<FeesScreen> createState() => _FeesScreenState();
}

class _FeesScreenState extends ConsumerState<FeesScreen> {
  int _month = DateTime.now().month;
  int _year  = DateTime.now().year;

  static const _months = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে','জুন',
    'জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];

  // Mock summary — replace with real DAO query
  final _summary = {'agreed': 120000.0, 'received': 75000.0, 'expense': 8500.0};
  double get _outstanding => (_summary['agreed'] ?? 0) - (_summary['received'] ?? 0);

  final _entries = [
    {'type':'feeAgreed',  'case':'দেওয়ানী ১২৩/২০২৩','client':'মোঃ রফিকুল','amt':50000.0,'date':'১২ জুন','method':'চুক্তি'},
    {'type':'received',   'case':'দেওয়ানী ১২৩/২০২৩','client':'মোঃ রফিকুল','amt':25000.0,'date':'১৫ জুন','method':'নগদ'},
    {'type':'feeAgreed',  'case':'ফৌজদারী ৩৪৫/২০২৪','client':'আব্দুল করিম','amt':70000.0,'date':'১ জুলাই','method':'চুক্তি'},
    {'type':'received',   'case':'ফৌজদারী ৩৪৫/২০২৪','client':'আব্দুল করিম','amt':50000.0,'date':'৫ জুলাই','method':'bKash'},
    {'type':'expenseCourtFee','case':'রিট ৭৮/২০২৪','client':'সুমাইয়া খানম','amt':8500.0,'date':'২০ জুলাই','method':'কোর্ট'},
  ];

  static const _typeLabel = {
    'feeAgreed':'ওকালতনামা ফি','received':'আদায়',
    'expenseCourtFee':'কোর্ট ফি','expenseStamp':'স্ট্যাম্প','expenseOther':'খরচ'};
  static const _typeColor = {
    'feeAgreed':AppColors.info,'received':AppColors.success,
    'expenseCourtFee':AppColors.warning,'expenseStamp':AppColors.warning,'expenseOther':AppColors.warning};

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(child: _buildHeader(top)),
          SliverToBoxAdapter(child: _buildSummary()),
          SliverToBoxAdapter(child: _buildMonthPicker()),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => Padding(
                padding: EdgeInsets.fromLTRB(16, i == 0 ? 8 : 0, 16, 8),
                child: _FeeEntryTile(entry: _entries[i])),
              childCount: _entries.length,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddFee,
        backgroundColor: AppColors.brass,
        label: Text('+ ফি যোগ করুন',
          style: AppTypography.bodyMedium.copyWith(color: Colors.white, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildHeader(double top) => Container(
    color: AppColors.navy,
    padding: EdgeInsets.fromLTRB(16, top + 12, 16, 16),
    child: Row(children: [
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('ফি ও হিসাব',
          style: AppTypography.h2.copyWith(color: Colors.white)),
        Text('সকল মামলার ফি তালিকা',
          style: AppTypography.caption.copyWith(color: AppColors.muted)),
      ]),
    ]),
  );

  Widget _buildSummary() => Padding(
    padding: const EdgeInsets.all(16),
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.navySoft, borderRadius: BorderRadius.circular(14)),
      child: Column(children: [
        Row(children: [
          _SummaryChip('চুক্তি', '৳ ${(_summary['agreed']!/1000).toStringAsFixed(0)}K', AppColors.info),
          const SizedBox(width: 8),
          _SummaryChip('আদায়', '৳ ${(_summary['received']!/1000).toStringAsFixed(0)}K', AppColors.success),
          const SizedBox(width: 8),
          _SummaryChip('খরচ',  '৳ ${(_summary['expense']!/1000).toStringAsFixed(0)}K', AppColors.warning),
        ]),
        const SizedBox(height: 14),
        const Divider(color: Colors.white12),
        const SizedBox(height: 10),
        Row(children: [
          Text('মোট বকেয়া',
            style: AppTypography.bodyMedium.copyWith(color: AppColors.muted)),
          const Spacer(),
          Text('৳ ${_outstanding.toStringAsFixed(0)}',
            style: AppTypography.monoLarge.copyWith(color: AppColors.brass)),
        ]),
      ]),
    ),
  );

  Widget _buildMonthPicker() => Padding(
    padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
    child: Row(children: [
      Text('${_months[_month - 1]} $_year',
        style: AppTypography.bodyMedium.copyWith(
          color: AppColors.navy, fontWeight: FontWeight.w600)),
      const Spacer(),
      IconButton(
        icon: const Icon(Icons.chevron_left, color: AppColors.muted),
        onPressed: () => setState(() {
          _month--; if (_month < 1) { _month = 12; _year--; }})),
      IconButton(
        icon: const Icon(Icons.chevron_right, color: AppColors.muted),
        onPressed: () => setState(() {
          _month++; if (_month > 12) { _month = 1; _year++; }})),
    ]),
  );

  void _showAddFee() {
    showModalBottomSheet(
      context: context, isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => const _AddFeeSheet(),
    );
  }
}

class _SummaryChip extends StatelessWidget {
  final String label, value;
  final Color color;
  const _SummaryChip(this.label, this.value, this.color);
  @override
  Widget build(BuildContext context) => Expanded(child: Container(
    padding: const EdgeInsets.symmetric(vertical: 10),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.06),
      borderRadius: BorderRadius.circular(10)),
    child: Column(children: [
      Text(value, style: AppTypography.mono.copyWith(
        color: color, fontSize: 16, fontWeight: FontWeight.w700)),
      const SizedBox(height: 3),
      Text(label, style: AppTypography.caption.copyWith(color: AppColors.muted, fontSize: 11)),
    ]),
  ));
}

class _FeeEntryTile extends StatelessWidget {
  final Map<String, dynamic> entry;
  const _FeeEntryTile({required this.entry});
  static const _typeLabel = {
    'feeAgreed':'ওকালতনামা','received':'আদায়',
    'expenseCourtFee':'কোর্ট ফি','expenseStamp':'স্ট্যাম্প','expenseOther':'খরচ'};
  static const _typeColor = {
    'feeAgreed':AppColors.info,'received':AppColors.success,
    'expenseCourtFee':AppColors.warning,'expenseStamp':AppColors.warning,'expenseOther':AppColors.warning};
  @override
  Widget build(BuildContext context) {
    final type  = entry['type'] as String;
    final color = _typeColor[type] ?? AppColors.muted;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface, borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border)),
      child: Row(children: [
        Container(
          width: 42, height: 42,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10)),
          alignment: Alignment.center,
          child: Text(type == 'received' ? '✓' : type.startsWith('expense') ? '↓' : '📝',
            style: TextStyle(fontSize: 18, color: color)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_typeLabel[type] ?? type,
            style: AppTypography.bodyMedium.copyWith(color: AppColors.ink, fontWeight: FontWeight.w500)),
          Text('${entry['client']} · ${entry['date']}',
            style: AppTypography.caption.copyWith(color: AppColors.muted)),
          Text(entry['case'],
            style: AppTypography.caption.copyWith(color: AppColors.muted, fontSize: 11)),
        ])),
        Text(
          '${type == 'received' ? '-' : '+'}৳ ${(entry['amt'] as double).toStringAsFixed(0)}',
          style: AppTypography.mono.copyWith(
            color: type == 'received' ? AppColors.success : color,
            fontSize: 14, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _AddFeeSheet extends StatefulWidget {
  const _AddFeeSheet();
  @override
  State<_AddFeeSheet> createState() => _AddFeeSheetState();
}

class _AddFeeSheetState extends State<_AddFeeSheet> {
  String _type = 'received';
  final _amtCtrl  = TextEditingController();
  final _noteCtrl = TextEditingController();

  @override
  void dispose() { _amtCtrl.dispose(); _noteCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Padding(
    padding: EdgeInsets.fromLTRB(20, 16, 20,
      MediaQuery.of(context).viewInsets.bottom + 36),
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Container(width: 36, height: 4,
        decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
      const SizedBox(height: 14),
      Text('ফি যোগ করুন', style: AppTypography.h2.copyWith(color: AppColors.navy)),
      const SizedBox(height: 16),
      Wrap(spacing: 8, runSpacing: 8,
        children: [
          ('received', '✓ আদায়'), ('feeAgreed', '📝 চুক্তি'),
          ('expenseCourtFee', '🧾 কোর্ট ফি'), ('expenseOther', '↓ খরচ'),
        ].map((t) {
          final active = _type == t.$1;
          return GestureDetector(
            onTap: () => setState(() => _type = t.$1),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: active ? AppColors.brassLighter : AppColors.parchment,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: active ? AppColors.brass : AppColors.border,
                  width: active ? 1.5 : 1)),
              child: Text(t.$2, style: AppTypography.chip.copyWith(
                color: active ? AppColors.warning : AppColors.ink,
                fontWeight: active ? FontWeight.w700 : FontWeight.w400)),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 14),
      TextField(
        controller: _amtCtrl,
        keyboardType: TextInputType.number,
        decoration: const InputDecoration(labelText: 'পরিমাণ (৳)', hintText: '৫,০০০'),
      ),
      const SizedBox(height: 12),
      TextField(
        controller: _noteCtrl,
        decoration: const InputDecoration(labelText: 'নোট (ঐচ্ছিক)'),
      ),
      const SizedBox(height: 20),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: () { /* TODO: save fee */ Navigator.pop(context); },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brass, foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 0),
          child: Text('সংরক্ষণ করুন',
            style: AppTypography.body.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
        ),
      ),
    ]),
  );
}
