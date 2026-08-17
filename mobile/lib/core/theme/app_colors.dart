import 'package:flutter/material.dart';

/// Court Navy & Brass — Lawyer Diary BD design system
///
/// Rule 1: Brass only on primary actions (≤5% of total UI surface)
/// Rule 2: Parchment background — feels like paper, not SaaS
/// Rule 3: Every screen has ONE primary action colored in Brass
abstract final class AppColors {
  // ── Brand ─────────────────────────────────────────────────────────────────
  static const Color ink          = Color(0xFF0E1B2C); // primary text
  static const Color navy         = Color(0xFF12263F); // app bar, headers
  static const Color navySoft     = Color(0xFF1E3A5F); // secondary surfaces
  static const Color brass        = Color(0xFFC6A15B); // accent — PRIMARY ACTION only
  static const Color brassLight   = Color(0xFFE7D3A8); // badge, highlight bg
  static const Color brassLighter = Color(0xFFF5ECD9); // chip bg, input hover

  // ── Surface ───────────────────────────────────────────────────────────────
  static const Color parchment    = Color(0xFFF7F3EA); // scaffold background
  static const Color surface      = Color(0xFFFFFFFF); // cards, sheets
  static const Color border       = Color(0xFFE5DFD2); // dividers, card borders

  // ── Semantic ──────────────────────────────────────────────────────────────
  static const Color success      = Color(0xFF1F7A5A); // নিষ্পত্তি / আদায়
  static const Color successBg    = Color(0xFFE8F5EF);
  static const Color warning      = Color(0xFFB8860B); // মুলতুবি / বকেয়া
  static const Color warningBg    = Color(0xFFFFF3CD);
  static const Color danger       = Color(0xFFA4262C); // deadline / মিস
  static const Color dangerBg     = Color(0xFFFDECEA);
  static const Color info         = Color(0xFF2E5F8A); // নথি / তথ্য
  static const Color infoBg       = Color(0xFFE8F0F8);
  static const Color muted        = Color(0xFF94A3B8); // secondary text

  // ── Dark mode ─────────────────────────────────────────────────────────────
  static const Color darkBg       = Color(0xFF0B1420);
  static const Color darkSurface  = Color(0xFF142434);
  static const Color darkBorder   = Color(0xFF21384B);
}
