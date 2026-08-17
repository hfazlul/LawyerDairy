import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/brass_button.dart';

/// Monthly diary PDF — generated SERVER-SIDE (never on device, Bangla font issue)
class DiaryPrintScreen extends StatefulWidget {
  const DiaryPrintScreen({super.key});
  @override
  State<DiaryPrintScreen> createState() => _DiaryPrintScreenState();
}

class _DiaryPrintScreenState extends State<DiaryPrintScreen> {
  int  _month = DateTime.now().month;
  int  _year  = DateTime.now().year;
  bool _loading = false;

  static const _months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে',
    'জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

  Future<void> _generatePdf() async {
    setState(() => _loading = true);
    try {
      // Call server-side PDF endpoint
      // Server generates Bangla PDF correctly (avoids flutter dart_pdf font bug)
      final url = Uri.parse(
        'https://api.lawyerdiarybd.com/api/mobile/v1/reports/diary-pdf'
        '?month=$_month&year=$_year');
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('সমস্যা হয়েছে: $e',
          style: AppTypography.caption.copyWith(color: Colors.white)),
        backgroundColor: AppColors.danger));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: const Text('ডায়েরি প্রিন্ট'),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.brassLighter,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.brass.withOpacity(0.3)),
            ),
            child: Row(children: [
              const Text('🖨️', style: TextStyle(fontSize: 32)),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('মাসিক ডায়েরি PDF',
                  style: AppTypography.h2.copyWith(color: AppColors.navy)),
                Text('কাগজের ডায়েরির লেআউটে — প্রবীণ আইনজীবীদের পরিচিত ফরম্যাট',
                  style: AppTypography.caption.copyWith(color: AppColors.muted)),
              ])),
            ]),
          ),
          const SizedBox(height: 28),
          Text('মাস বেছে নিন',
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 14),
          Row(children: [
            Expanded(
              child: DropdownButtonFormField<int>(
                value: _month,
                decoration: const InputDecoration(labelText: 'মাস'),
                items: List.generate(12, (i) => DropdownMenuItem(
                  value: i + 1,
                  child: Text(_months[i],
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
                )),
                onChanged: (v) => setState(() => _month = v!),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: DropdownButtonFormField<int>(
                value: _year,
                decoration: const InputDecoration(labelText: 'সাল'),
                items: List.generate(3, (i) => DropdownMenuItem(
                  value: DateTime.now().year - 1 + i,
                  child: Text('${DateTime.now().year - 1 + i}',
                    style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
                )),
                onChanged: (v) => setState(() => _year = v!),
              ),
            ),
          ]),
          const SizedBox(height: 28),
          BrassButton(
            label: '📥 ${_months[_month - 1]} $_year — PDF ডাউনলোড করুন',
            loading: _loading,
            onPressed: _generatePdf,
          ),
          const SizedBox(height: 20),
          Text(
            'PDF সার্ভার থেকে তৈরি হয় — বাংলা যুক্তাক্ষর সঠিকভাবে দেখাবে।',
            style: AppTypography.caption.copyWith(
              color: AppColors.muted, fontSize: 11, fontStyle: FontStyle.italic),
            textAlign: TextAlign.center,
          ),
        ]),
      ),
    );
  }
}
