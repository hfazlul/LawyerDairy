import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';

/// Primary action button — always Brass colored.
/// Rule: maximum one BrassButton per screen.
class BrassButton extends StatelessWidget {
  final String    label;
  final VoidCallback? onPressed;
  final bool      loading;
  final IconData? icon;

  const BrassButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: loading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.brass,
          foregroundColor: Colors.white,
          disabledBackgroundColor: AppColors.border,
          padding: const EdgeInsets.symmetric(vertical: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          elevation: 0,
        ),
        child: loading
            ? const SizedBox(
                width: 20, height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white, strokeWidth: 2.5))
            : Row(mainAxisSize: MainAxisSize.min, children: [
                if (icon != null) ...[
                  Icon(icon, size: 18),
                  const SizedBox(width: 8),
                ],
                Text(label,
                  style: AppTypography.body.copyWith(
                    color: Colors.white, fontWeight: FontWeight.w700)),
              ]),
      ),
    );
  }
}
