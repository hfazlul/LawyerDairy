import 'package:flutter/material.dart';

/// Typography — Hind Siliguri for Bangla, Roboto Mono for case numbers
///
/// CRITICAL: Minimum body 16sp — many users are 50+ years old.
/// CRITICAL: Bangla line-height 1.6× (Latin needs ~1.3×; Bangla is denser).
/// CRITICAL: Case numbers in tabular monospace so columns align in cause list.
abstract final class AppTypography {
  static const String _bangla = 'HindSiliguri';
  static const String _mono   = 'RobotoMono';

  static const TextStyle display = TextStyle(
    fontFamily: _bangla, fontSize: 28,
    fontWeight: FontWeight.w700, height: 1.25, letterSpacing: -0.3,
  );
  static const TextStyle h1 = TextStyle(
    fontFamily: _bangla, fontSize: 22,
    fontWeight: FontWeight.w700, height: 1.3,
  );
  static const TextStyle h2 = TextStyle(
    fontFamily: _bangla, fontSize: 18,
    fontWeight: FontWeight.w600, height: 1.35,
  );
  static const TextStyle body = TextStyle(
    fontFamily: _bangla, fontSize: 16,
    fontWeight: FontWeight.w400, height: 1.6, // Bangla needs extra breathing room
  );
  static const TextStyle bodyMedium = TextStyle(
    fontFamily: _bangla, fontSize: 15,
    fontWeight: FontWeight.w500, height: 1.55,
  );
  static const TextStyle caption = TextStyle(
    fontFamily: _bangla, fontSize: 13,
    fontWeight: FontWeight.w400, height: 1.5,
  );
  static const TextStyle chip = TextStyle(
    fontFamily: _bangla, fontSize: 12,
    fontWeight: FontWeight.w600, height: 1.0,
  );
  // Case numbers, fee amounts — tabular figures, monospace
  static const TextStyle mono = TextStyle(
    fontFamily: _mono, fontSize: 13,
    fontWeight: FontWeight.w600, letterSpacing: 0.3, height: 1.4,
  );
  static const TextStyle monoLarge = TextStyle(
    fontFamily: _mono, fontSize: 20,
    fontWeight: FontWeight.w700, letterSpacing: 0.3, height: 1.2,
  );
}
