import 'dart:ui' show PlatformDispatcher;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'jurisdiction.dart';
import 'content.dart';

const _kJurisdiction = 'jurisdiction_code';
const _kLanguage = 'ui_language';
const _kConfirmed = 'jurisdiction_confirmed';

class LocalePrefs {
  final JurisdictionCode jurisdiction;
  final UiLanguage language;
  final bool confirmed;

  const LocalePrefs({
    this.jurisdiction = JurisdictionCode.bd,
    this.language = UiLanguage.bn,
    this.confirmed = false,
  });

  JurisdictionContent get content => contentFor(jurisdiction);

  LocalePrefs copyWith({
    JurisdictionCode? jurisdiction,
    UiLanguage? language,
    bool? confirmed,
  }) =>
      LocalePrefs(
        jurisdiction: jurisdiction ?? this.jurisdiction,
        language: language ?? this.language,
        confirmed: confirmed ?? this.confirmed,
      );
}

final localePrefsProvider =
    StateNotifierProvider<LocalePrefsNotifier, LocalePrefs>((ref) {
  return LocalePrefsNotifier();
});

final jurisdictionProvider = Provider<JurisdictionCode>((ref) {
  return ref.watch(localePrefsProvider).jurisdiction;
});

final needsJurisdictionOnboardingProvider = Provider<bool>((ref) {
  return !ref.watch(localePrefsProvider).confirmed;
});

class LocalePrefsNotifier extends StateNotifier<LocalePrefs> {
  LocalePrefsNotifier() : super(const LocalePrefs()) {
    _restore();
  }

  final _storage = const FlutterSecureStorage();

  Future<void> _restore() async {
    final j = await _storage.read(key: _kJurisdiction);
    final lang = await _storage.read(key: _kLanguage);
    final conf = await _storage.read(key: _kConfirmed);
    if (j == null && conf != '1') {
      // Soft suggest only — still unconfirmed until onboarding.
      final suggested = suggestJurisdiction(
        timezone: DateTime.now().timeZoneName,
        localeTag: PlatformDispatcher.instance.locale.toString(),
      );
      state = LocalePrefs(
        jurisdiction: suggested,
        language: uiLanguageFromApi(PlatformDispatcher.instance.locale.languageCode),
        confirmed: false,
      );
      return;
    }
    state = LocalePrefs(
      jurisdiction: jurisdictionFromApi(j),
      language: uiLanguageFromApi(lang),
      confirmed: conf == '1',
    );
  }

  Future<void> setDraft({
    JurisdictionCode? jurisdiction,
    UiLanguage? language,
  }) async {
    state = state.copyWith(
      jurisdiction: jurisdiction,
      language: language,
    );
  }

  /// Persist after explicit user confirm (never silent).
  Future<void> confirm({
    required JurisdictionCode jurisdiction,
    required UiLanguage language,
  }) async {
    state = LocalePrefs(
      jurisdiction: jurisdiction,
      language: language,
      confirmed: true,
    );
    await _storage.write(key: _kJurisdiction, value: jurisdiction.apiCode);
    await _storage.write(key: _kLanguage, value: language.apiCode);
    await _storage.write(key: _kConfirmed, value: '1');
  }

  Future<void> applyFromServer({
    required String jurisdiction,
    required String uiLanguage,
    required bool confirmed,
  }) async {
    // Server can sync after login, but first-open still requires local confirm
    // if never confirmed on device.
    final localConfirmed = state.confirmed || confirmed;
    state = LocalePrefs(
      jurisdiction: jurisdictionFromApi(jurisdiction),
      language: uiLanguageFromApi(uiLanguage),
      confirmed: localConfirmed,
    );
    if (localConfirmed) {
      await _storage.write(key: _kJurisdiction, value: jurisdiction.toUpperCase());
      await _storage.write(key: _kLanguage, value: uiLanguage.toLowerCase());
      await _storage.write(key: _kConfirmed, value: '1');
    }
  }
}
