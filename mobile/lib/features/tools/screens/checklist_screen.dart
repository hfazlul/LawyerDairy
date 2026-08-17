import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';

class ChecklistScreen extends StatefulWidget {
  const ChecklistScreen({super.key});
  @override
  State<ChecklistScreen> createState() => _ChecklistScreenState();
}

class _ChecklistScreenState extends State<ChecklistScreen> {
  String _active = 'hearing';

  static const _checklists = {
    'hearing': (
      title: 'হিয়ারিং প্রস্তুতি',
      emoji: '⚖️',
      items: [
        'মক্কেলের সাথে যোগাযোগ করেছি',
        'গত তারিখের আদেশ পড়েছি',
        'সাক্ষীর নাম ও ঠিকানা প্রস্তুত',
        'প্রয়োজনীয় দলিলপত্র সাজানো',
        'বিপক্ষ আইনজীবীর তর্ক আগেই পড়েছি',
        'যুক্তিতর্কের পয়েন্টগুলো নোট করেছি',
        'কোর্ট ফি ও স্ট্যাম্প সংগ্রহ করেছি',
        'ওকালতনামা সংগ্রহ করেছি',
      ],
    ),
    'filing': (
      title: 'মামলা দায়ের',
      emoji: '📝',
      items: [
        'আরজি খসড়া চূড়ান্ত',
        'তামাদি মেয়াদ যাচাই করেছি',
        'কোর্ট ফি হিসাব সঠিক',
        'বর্ণনামূলক দলিল সংলগ্ন',
        'প্রতিটি পৃষ্ঠায় সই দিয়েছি',
        'ওকালতনামা নেওয়া হয়েছে',
        'ফাইল নম্বর ও রেজিস্ট্রি বই উল্লেখ',
        'নকল চেয়েছি',
      ],
    ),
    'bail': (
      title: 'জামিন শুনানি',
      emoji: '🔓',
      items: [
        'FIR / এজাহারের কপি সংগ্রহ',
        'আসামির আগের রেকর্ড চেক করেছি',
        'পুলিশ রিপোর্ট পড়েছি',
        'জামিনদারের তথ্য ও সম্পত্তি যাচাই',
        'জামিন আবেদনপত্র তৈরি',
        'সরকারি আইনজীবীর বক্তব্য আন্দাজ করেছি',
        'আসামির ব্যক্তিগত বিবরণ জানি',
        'আদালতের রেকর্ড চেক করেছি',
      ],
    ),
    'appeal': (
      title: 'আপিল দায়ের',
      emoji: '↗️',
      items: [
        'তামাদি মেয়াদ গণনা করেছি (Limitation Engine)',
        'নিম্ন আদালতের রায় সংগ্রহ',
        'ডিক্রির কপি সংগ্রহ',
        'আপিলের মাটি (Grounds) চিহ্নিত',
        'আইনগত ভুল পয়েন্ট লিখেছি',
        'তথ্যগত ভুল পয়েন্ট লিখেছি',
        'আপিল কোর্ট ফি হিসাব',
        'রায়ের সত্যায়িত কপি সংলগ্ন',
      ],
    ),
  };

  Map<String, Set<int>> _checked = {};

  @override
  Widget build(BuildContext context) {
    final list   = _checklists[_active]!;
    final checked = _checked[_active] ?? {};
    final done   = checked.length;
    final total  = list.items.length;

    return Scaffold(
      backgroundColor: AppColors.parchment,
      appBar: AppBar(
        title: const Text('Hearing Checklists'),
        backgroundColor: AppColors.navy,
        foregroundColor: Colors.white,
      ),
      body: Column(children: [
        // Category tabs
        Container(
          color: AppColors.surface,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _checklists.entries.map((e) {
                final active = _active == e.key;
                return GestureDetector(
                  onTap: () => setState(() => _active = e.key),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: active ? AppColors.brassLighter : AppColors.parchment,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: active ? AppColors.brass : AppColors.border,
                        width: active ? 1.5 : 1)),
                    child: Text('${e.value.emoji} ${e.value.title}',
                      style: AppTypography.chip.copyWith(
                        color: active ? AppColors.warning : AppColors.muted,
                        fontWeight: active ? FontWeight.w700 : FontWeight.w400)),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        // Progress
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
          child: Row(children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: total > 0 ? done / total : 0,
                  backgroundColor: AppColors.border,
                  color: done == total ? AppColors.success : AppColors.brass,
                  minHeight: 6,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Text('$done/$total',
              style: AppTypography.mono.copyWith(
                color: done == total ? AppColors.success : AppColors.warning,
                fontWeight: FontWeight.w700)),
          ]),
        ),
        // Items
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 40),
            itemCount: list.items.length,
            itemBuilder: (_, i) {
              final done_ = checked.contains(i);
              return GestureDetector(
                onTap: () => setState(() {
                  final s = _checked[_active] ?? {};
                  done_ ? s.remove(i) : s.add(i);
                  _checked = {..._checked, _active: s};
                }),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: done_ ? AppColors.successBg : AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: done_ ? AppColors.success.withOpacity(0.3) : AppColors.border,
                      width: done_ ? 1.5 : 1)),
                  child: Row(children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      width: 22, height: 22,
                      decoration: BoxDecoration(
                        color: done_ ? AppColors.success : Colors.transparent,
                        border: Border.all(
                          color: done_ ? AppColors.success : AppColors.muted,
                          width: 1.5),
                        borderRadius: BorderRadius.circular(6)),
                      child: done_
                          ? const Icon(Icons.check, size: 14, color: Colors.white)
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(list.items[i],
                      style: AppTypography.bodyMedium.copyWith(
                        color: done_ ? AppColors.success : AppColors.ink,
                        decoration: done_ ? TextDecoration.lineThrough : null))),
                  ]),
                ),
              );
            },
          ),
        ),
        // Reset button
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
          child: TextButton(
            onPressed: () => setState(() => _checked = {..._checked, _active: {}}),
            child: Text('সব রিসেট করুন',
              style: AppTypography.caption.copyWith(color: AppColors.muted)),
          ),
        ),
      ]),
    );
  }
}
