import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_colors.dart';
import 'app_typography.dart';

class AppTheme {
  // ── Light ──────────────────────────────────────────────────────────────────
  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brass,
      primary: AppColors.navy,
      secondary: AppColors.brass,
      surface: AppColors.surface,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      brightness: Brightness.light,
    ).copyWith(
      surfaceContainerLowest: AppColors.parchment,
      surfaceContainer: AppColors.surface,
      outline: AppColors.border,
    ),
    scaffoldBackgroundColor: AppColors.parchment,

    // ── AppBar ─────────────────────────────────────────────────────────────
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: AppTypography.h2.copyWith(color: Colors.white),
      systemOverlayStyle: SystemUiOverlayStyle.light,
    ),

    // ── Cards ──────────────────────────────────────────────────────────────
    cardTheme: const CardThemeData(
      color: AppColors.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        side: BorderSide(color: AppColors.border),
      ),
    ),

    // ── Bottom Nav ─────────────────────────────────────────────────────────
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.surface,
      selectedItemColor: AppColors.brass,
      unselectedItemColor: AppColors.muted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      showUnselectedLabels: true,
    ),

    // ── FAB ────────────────────────────────────────────────────────────────
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.brass,
      foregroundColor: Colors.white,
      elevation: 4,
      shape: CircleBorder(),
    ),

    // ── Chips ──────────────────────────────────────────────────────────────
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.brassLighter,
      selectedColor: AppColors.brass,
      labelStyle: AppTypography.chip.copyWith(color: AppColors.warning),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      shape: const StadiumBorder(),
      side: const BorderSide(color: AppColors.border),
    ),

    // ── Input ──────────────────────────────────────────────────────────────
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surface,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppColors.brass, width: 1.5),
      ),
      hintStyle: AppTypography.body.copyWith(color: AppColors.muted),
      labelStyle: AppTypography.caption.copyWith(color: AppColors.muted),
    ),

    // ── Divider ────────────────────────────────────────────────────────────
    dividerTheme: const DividerThemeData(
      color: AppColors.border, thickness: 1, space: 0,
    ),

    // ── Bottom Sheet ───────────────────────────────────────────────────────
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      elevation: 8,
    ),

    // ── Typography ─────────────────────────────────────────────────────────
    textTheme: TextTheme(
      displayLarge:  AppTypography.display,
      headlineLarge: AppTypography.h1,
      headlineMedium:AppTypography.h2,
      bodyLarge:     AppTypography.body,
      bodyMedium:    AppTypography.bodyMedium,
      bodySmall:     AppTypography.caption,
      labelSmall:    AppTypography.chip,
    ).apply(bodyColor: AppColors.ink, displayColor: AppColors.ink),
  );

  // ── Dark ───────────────────────────────────────────────────────────────────
  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.brass,
      primary: AppColors.brass,
      secondary: AppColors.navySoft,
      surface: AppColors.darkSurface,
      brightness: Brightness.dark,
    ).copyWith(
      surfaceContainerLowest: AppColors.darkBg,
      surfaceContainer: AppColors.darkSurface,
      outline: AppColors.darkBorder,
    ),
    scaffoldBackgroundColor: AppColors.darkBg,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.darkSurface,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: AppTypography.h2.copyWith(color: Colors.white),
      systemOverlayStyle: SystemUiOverlayStyle.light,
    ),
    cardTheme: const CardThemeData(
      color: AppColors.darkSurface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(12)),
        side: BorderSide(color: AppColors.darkBorder),
      ),
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.darkSurface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
    ),
  );
}
