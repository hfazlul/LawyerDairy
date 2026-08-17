import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

/// Red badge shown when a limitation deadline is approaching.
/// Appears on case cards and in the home screen alert bar.
class DeadlineBadge extends StatelessWidget {
  final int  days;
  final bool small;

  const DeadlineBadge({super.key, required this.days, this.small = false});

  Color get _bg   => days <= 3 ? AppColors.dangerBg  : AppColors.warningBg;
  Color get _fg   => days <= 3 ? AppColors.danger     : AppColors.warning;
  String get _label {
    if (days <= 0) return 'মেয়াদ শেষ';
    if (days == 1) return '⏰ ১ দিন';
    return '⏰ $days দিন';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: small ? 7 : 10,
        vertical:   small ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color:  _bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _fg.withOpacity(0.25)),
      ),
      child: Text(_label,
        style: AppTypography.chip.copyWith(
          color: _fg,
          fontSize: small ? 10 : 12,
          fontWeight: FontWeight.w700,
        )),
    );
  }
}
