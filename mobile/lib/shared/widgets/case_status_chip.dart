import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

class CaseStatusChip extends StatelessWidget {
  final String status; // 'active' | 'closed'
  const CaseStatusChip({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final isActive = status == 'active';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color:  isActive ? AppColors.successBg : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        isActive ? '● সক্রিয়' : '✓ নিষ্পত্তি',
        style: AppTypography.chip.copyWith(
          color: isActive ? AppColors.success : AppColors.muted,
        ),
      ),
    );
  }
}
