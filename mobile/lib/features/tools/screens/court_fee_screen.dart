import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

/// Court Fees Act 1870 — Tafshil-based calculator
/// Ad-valorem fee for civil suits
class CourtFeeScreen extends StatefulWidget {
  const CourtFeeScreen({super.key});
  @override
  State<CourtFeeScreen> createState() => _CourtFeeScreenState();
}

class _CourtFeeScreenState extends State<CourtFeeScreen> {
  final _amtCtrl = TextEditingController();
  String  _type   = 'adValorem';
  double? _fee;
  String? _breakdown;

  static const _types = [
    ('adValorem',  'Ad Valorem (দেওয়ানী মোকদ্দমা)'),
    ('fixed50',    'Fixed ৳৫০ (নালিশি দরখাস্ত)'),
    ('fixed20',    'Fixed ৳২০ (সাধারণ দরখাস্ত)'),
    ('execution',  'ডিক্রি জারির আরজি'),
    ('appeal',     'আপিল দরখাস্ত'),
  ];

  @override
  void dispose() { _amtCtrl.dispose(); super.dispose(); }

  void _calc() {
    final amt = double.tryParse(_amtCtrl.text.replaceAll(',', ''));
    setState(() {
      switch (_type) {
        case 'adValorem':
          if (amt == null) { _fee = null; _breakdown = null; return; }
          _fee = _adValorem(amt);
          _breakdown = _adValoremBreakdown(amt);
        case 'fixed50':
          _fee = 50; _breakdown = 'নির্ধারিত ফি — ৳৫০';
        case 'fixed20':
          _fee = 20; _breakdown = 'নির্ধারিত ফি — ৳২০';
        case 'execution':
          if (amt == null) { _fee = null; _breakdown = null; return; }
          _fee = (amt * 0.005).clamp(25, 500);
          _breakdown = 'ডিক্রি পরিমাণের ০.৫% (সর্বনিম্ন ৳২৫, সর্বোচ্চ ৳৫০০)';
        case 'appeal':
          if (amt == null) { _fee = null; _breakdown = null; return; }
          _fee = (_adValorem(amt) * 1.5).clamp(0, double.infinity);
          _breakdown = 'Ad valorem-এর দেড়গুণ';
      }
    });
  }

  double _adValorem(double v) {
    if (v <= 1000)     return 20;
    if (v <= 5000)     return 40 + (v - 1000) * 0.01;
    if (v <= 10000)    return 80 + (v - 5000) * 0.015;
    if (v <= 50000)    return 155 + (v - 10000) * 0.02;
    if (v <= 100000)   return 955 + (v - 50000) * 0.025;
    if (v <= 500000)   return 2205 + (v - 100000) * 0.03;
    return 14205 + (v - 500000) * 0.035;
  }

  String _adValoremBreakdown(double v) {
    if (v <= 1000)   return '৳১,০০০ পর্যন্ত — নির্ধারিত ৳২০';
    if (v <= 5000)   return '৳১,০০০–৫,০০০ — ১% হারে';
    if (v <= 10000)  return '৳৫,০০০–১০,০০০ — ১.৫% হারে';
    if (v <= 50000)  return '৳১০,০০০–৫০,০০০ — ২% হারে';
    if (v <= 100000) return '৳৫০,০০০–১,০০,০০০ — ২.৫% হারে';
    if (v <= 500000) return '৳১,০০,০০০–৫,০০,০০০ — ৩% হারে';
    return '৳৫,০০,০০০-এর বেশি — ৩.৫% হারে';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: const Text('Court Fee Calculator'),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          Text('মামলার ধরন',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 10),
          ...(_types).map((t) {
            final (id, label) = t;
            final active = _type == id;
            return GestureDetector(
              onTap: () => setState(() { _type = id; _fee = null; }),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 120),
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
                decoration: BoxDecoration(
                  color: active ? AppColors.brassLighter : AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: active ? AppColors.brass : AppColors.border,
                    width: active ? 1.5 : 1)),
                child: Row(children: [
                  Expanded(child: Text(label,
                    style: AppTypography.bodyMedium.copyWith(
                      color: active ? AppColors.warning : AppColors.ink,
                      fontWeight: active ? FontWeight.w600 : FontWeight.w400))),
                  if (active) const Icon(Icons.check_circle,
                    color: AppColors.brass, size: 16),
                ]),
              ),
            );
          }),

          const SizedBox(height: 20),

          if (_type == 'adValorem' || _type == 'execution' || _type == 'appeal') ...[
            Text('দাবির পরিমাণ (৳)',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            TextField(
              controller: _amtCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              decoration: const InputDecoration(
                hintText: '১,০০,০০০',
                prefixText: '৳ ',
              ),
              style: AppTypography.body.copyWith(color: AppColors.navy),
            ),
            const SizedBox(height: 20),
          ],

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _calc,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.brass,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: Text('কোর্ট ফি হিসাব করুন',
                style: AppTypography.body.copyWith(
                  color: Colors.white, fontWeight: FontWeight.w700)),
            ),
          ),

          if (_fee != null) ...[
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.successBg,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.success.withOpacity(0.2)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('কোর্ট ফি',
                  style: AppTypography.caption.copyWith(color: AppColors.muted)),
                const SizedBox(height: 6),
                Text('৳ ${_fee!.toStringAsFixed(0)}',
                  style: AppTypography.display.copyWith(
                    color: AppColors.success, fontFamily: 'RobotoMono')),
                if (_breakdown != null) ...[
                  const SizedBox(height: 10),
                  Text(_breakdown!,
                    style: AppTypography.caption.copyWith(color: AppColors.muted)),
                ],
                const SizedBox(height: 12),
                Text('* এই হিসাব নির্দেশক। Court Fees Act 1870 ও সর্বশেষ সংশোধনী অনুযায়ী নিজে যাচাই করুন।',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.muted, fontSize: 10,
                    fontStyle: FontStyle.italic)),
              ]),
            ),
          ],
        ]),
      ),
    );
  }
}
