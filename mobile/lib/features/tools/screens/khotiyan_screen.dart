import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// খতিয়ান ও ওয়ারিশ হিসাব Calculator
class KhotiyanScreen extends StatefulWidget {
  const KhotiyanScreen({super.key});
  @override
  State<KhotiyanScreen> createState() => _KhotiyanScreenState();
}

class _KhotiyanScreenState extends State<KhotiyanScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  @override
  void initState() { super.initState(); _tabs = TabController(length: 2, vsync: this); }
  @override
  void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: const Text('খতিয়ান Calculator'),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: AppColors.brass,
          labelColor: AppColors.brass,
          unselectedLabelColor: AppColors.muted,
          tabs: const [Tab(text: 'জমির ভাগ'), Tab(text: 'ওয়ারিশ')],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [_LandShareCalc(), _WarisonCalc()],
      ),
    );
  }
}

class _LandShareCalc extends StatefulWidget {
  const _LandShareCalc();
  @override
  State<_LandShareCalc> createState() => _LandShareCalcState();
}

class _LandShareCalcState extends State<_LandShareCalc> {
  final _totalCtrl = TextEditingController();
  final _numCtrl   = TextEditingController();
  final _denCtrl   = TextEditingController();
  String? _result;

  @override
  void dispose() {
    _totalCtrl.dispose(); _numCtrl.dispose(); _denCtrl.dispose();
    super.dispose();
  }

  void _calc() {
    final total = double.tryParse(_totalCtrl.text);
    final num   = double.tryParse(_numCtrl.text);
    final den   = double.tryParse(_denCtrl.text);
    if (total == null || num == null || den == null || den == 0) return;
    final share    = (total * num) / den;
    final katha    = share / 1.65;  // 1 katha ≈ 1.65 decimal
    final shotangsho = share;
    setState(() => _result =
      'ভাগের পরিমাণ: ${shotangsho.toStringAsFixed(2)} শতাংশ\n'
      '= ${katha.toStringAsFixed(2)} কাঠা (আনুমানিক)\n'
      '= ${(katha / 20).toStringAsFixed(3)} বিঘা');
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('মোট জমি (শতাংশে)',
          style: AppTypography.caption.copyWith(
            color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: _totalCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(hintText: '১০০'),
        ),
        const SizedBox(height: 16),
        Text('অংশ (যেমন: ১/৩ হলে লব=১, হর=৩)',
          style: AppTypography.caption.copyWith(
            color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Row(children: [
          Expanded(child: TextField(
            controller: _numCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(hintText: 'লব (১)'),
          )),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text('/',
              style: AppTypography.h1.copyWith(color: AppColors.muted)),
          ),
          Expanded(child: TextField(
            controller: _denCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(hintText: 'হর (৩)'),
          )),
        ]),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _calc,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brass, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0),
            child: Text('হিসাব করুন',
              style: AppTypography.body.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ),
        if (_result != null) ...[
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.successBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.success.withOpacity(0.2))),
            child: Text(_result!,
              style: AppTypography.body.copyWith(
                color: AppColors.success, fontWeight: FontWeight.w600)),
          ),
        ],
      ]),
    );
  }
}

class _WarisonCalc extends StatefulWidget {
  const _WarisonCalc();
  @override
  State<_WarisonCalc> createState() => _WarisonCalcState();
}

class _WarisonCalcState extends State<_WarisonCalc> {
  final _estateCtrl = TextEditingController();
  int _sons = 0, _daughters = 0;
  bool _wifeAlive = false, _motherAlive = false, _fatherAlive = false;
  List<Map<String, dynamic>> _shares = [];

  @override
  void dispose() { _estateCtrl.dispose(); super.dispose(); }

  void _calc() {
    final estate = double.tryParse(_estateCtrl.text.replaceAll(',', '')) ?? 0;
    final result = <Map<String, dynamic>>[];
    double remaining = estate;

    // Fixed shares (Farz) per Hanafi law (simplified)
    if (_fatherAlive) {
      final share = estate / 6;
      result.add({'name': 'পিতা', 'share': '১/৬', 'amount': share});
      remaining -= share;
    }
    if (_motherAlive) {
      final frac  = (_sons > 0 || _daughters > 0) ? 1/6 : 1/3;
      final share = estate * frac;
      result.add({'name': 'মাতা', 'share': frac == 1/6 ? '১/৬' : '১/৩', 'amount': share});
      remaining -= share;
    }
    if (_wifeAlive) {
      final frac  = (_sons > 0 || _daughters > 0) ? 1/8 : 1/4;
      final share = estate * frac;
      result.add({'name': 'স্ত্রী', 'share': frac == 1/8 ? '১/৮' : '১/৪', 'amount': share});
      remaining -= share;
    }
    // Residue to children (sons get 2x daughters)
    if (_sons > 0 || _daughters > 0) {
      final units = (_sons * 2 + _daughters).toDouble();
      final perUnit = remaining / units;
      if (_sons > 0) result.add({
        'name': '$_sons জন পুত্র', 'share': 'আসাবা',
        'amount': perUnit * 2 * _sons, 'each': perUnit * 2});
      if (_daughters > 0) result.add({
        'name': '$_daughters জন কন্যা', 'share': 'আসাবা',
        'amount': perUnit * _daughters, 'each': perUnit});
    }
    setState(() => _shares = result);
  }

  Widget _counter(String label, int val, Function(int) onChange) => Row(children: [
    Expanded(child: Text(label, style: AppTypography.bodyMedium.copyWith(color: AppColors.ink))),
    IconButton(
      onPressed: val > 0 ? () => onChange(val - 1) : null,
      icon: const Icon(Icons.remove_circle_outline, color: AppColors.muted)),
    Text('$val', style: AppTypography.mono.copyWith(color: AppColors.navy, fontSize: 16)),
    IconButton(
      onPressed: () => onChange(val + 1),
      icon: const Icon(Icons.add_circle_outline, color: AppColors.brass)),
  ]);

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('মোট সম্পদ (৳)',
          style: AppTypography.caption.copyWith(color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        TextField(
          controller: _estateCtrl,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          decoration: const InputDecoration(hintText: '১০,০০,০০০', prefixText: '৳ '),
        ),
        const SizedBox(height: 20),
        Text('ওয়ারিশ তালিকা',
          style: AppTypography.caption.copyWith(color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        _counter('পুত্র সংখ্যা', _sons, (v) => setState(() => _sons = v)),
        _counter('কন্যা সংখ্যা', _daughters, (v) => setState(() => _daughters = v)),
        SwitchListTile(
          value: _wifeAlive, activeColor: AppColors.brass,
          title: Text('স্ত্রী জীবিত', style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
          onChanged: (v) => setState(() => _wifeAlive = v),
          contentPadding: EdgeInsets.zero,
        ),
        SwitchListTile(
          value: _fatherAlive, activeColor: AppColors.brass,
          title: Text('পিতা জীবিত', style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
          onChanged: (v) => setState(() => _fatherAlive = v),
          contentPadding: EdgeInsets.zero,
        ),
        SwitchListTile(
          value: _motherAlive, activeColor: AppColors.brass,
          title: Text('মাতা জীবিত', style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
          onChanged: (v) => setState(() => _motherAlive = v),
          contentPadding: EdgeInsets.zero,
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _calc,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.brass, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0),
            child: Text('ওয়ারিশ হিসাব করুন',
              style: AppTypography.body.copyWith(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ),
        if (_shares.isNotEmpty) ...[
          const SizedBox(height: 20),
          ..._shares.map((s) => Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.surface, borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.border)),
            child: Row(children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(s['name'], style: AppTypography.bodyMedium.copyWith(
                  color: AppColors.navy, fontWeight: FontWeight.w600)),
                Text('অংশ: ${s['share']}',
                  style: AppTypography.caption.copyWith(color: AppColors.muted)),
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Text('৳ ${(s['amount'] as double).toStringAsFixed(0)}',
                  style: AppTypography.mono.copyWith(
                    color: AppColors.success, fontSize: 15, fontWeight: FontWeight.w700)),
                if (s['each'] != null)
                  Text('প্রতিজন: ৳ ${(s['each'] as double).toStringAsFixed(0)}',
                    style: AppTypography.caption.copyWith(color: AppColors.muted)),
              ]),
            ]),
          )),
          const SizedBox(height: 8),
          Text('* সরলীকৃত হানাফি পদ্ধতি। আইনজীবীর মতামত নিন।',
            style: AppTypography.caption.copyWith(
              color: AppColors.muted, fontSize: 10, fontStyle: FontStyle.italic)),
        ],
      ]),
    );
  }
}
