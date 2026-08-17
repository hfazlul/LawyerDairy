import 'package:flutter/material.dart';
import '../../../core/db/database.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/deadline_badge.dart';

const _typeIcon = <String, String>{
  'দেওয়ানী': '⚖️', 'ফৌজদারী': '🔒', 'রিট': '📜',
  'আপিল': '↗', 'পারিবারিক': '👨‍👩‍👧',
};

class CaseListTile extends StatelessWidget {
  final Case c;
  final VoidCallback onTap;
  const CaseListTile({super.key, required this.c, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isActive = c.status == 'active';
    final nextDate = c.nextDate;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(14, 13, 14, 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Type icon
          Text(_typeIcon[c.caseType] ?? '⚖️',
            style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 12),

          // Content
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(c.caseNo,
                  style: AppTypography.mono.copyWith(color: AppColors.navy)),
              ),
              _StatusBadge(isActive: isActive),
            ]),
            const SizedBox(height: 3),
            Text(c.clientId ?? '—',
              style: AppTypography.bodyMedium.copyWith(color: AppColors.ink),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(c.courtName ?? c.court,
              style: AppTypography.caption.copyWith(color: AppColors.muted),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            Row(children: [
              if (nextDate != null)
                Row(children: [
                  const Icon(Icons.calendar_today, size: 12, color: AppColors.info),
                  const SizedBox(width: 4),
                  Text(_formatDate(nextDate),
                    style: AppTypography.caption.copyWith(
                      color: AppColors.info, fontSize: 11)),
                ]),
              const Spacer(),
              // Show deadline badge if nextDate within 7 days
              if (nextDate != null &&
                  isActive &&
                  nextDate.difference(DateTime.now()).inDays <= 7 &&
                  nextDate.isAfter(DateTime.now()))
                DeadlineBadge(
                  days: nextDate.difference(DateTime.now()).inDays,
                  small: true,
                ),
            ]),
          ])),
        ]),
      ),
    );
  }

  String _formatDate(DateTime d) {
    const months = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                    'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
    return '${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

class _StatusBadge extends StatelessWidget {
  final bool isActive;
  const _StatusBadge({required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isActive ? AppColors.successBg : const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        isActive ? '● সক্রিয়' : '✓ নিষ্পত্তি',
        style: AppTypography.chip.copyWith(
          color: isActive ? AppColors.success : AppColors.muted,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
