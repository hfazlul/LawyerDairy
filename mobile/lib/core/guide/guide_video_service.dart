import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:url_launcher/url_launcher.dart';
import '../jurisdiction/jurisdiction.dart';
import '../jurisdiction/locale_provider.dart';

/// Guide videos are jurisdiction-specific: guide_bd | guide_in | guide_pk.
/// BD video may soft-mention web pay; IN/PK must NOT push web pay (content rule).
class GuideVideoConfig {
  static const maxHomePromptShows = 2;

  static const _countKey = 'guide_video_prompt_count';
  static const _urlCachePrefix = 'guide_video_url_';

  /// Compile-time / --dart-define fallbacks (replace with real IDs).
  static String fallbackUrlFor(JurisdictionCode code) {
    switch (code) {
      case JurisdictionCode.bd:
        return const String.fromEnvironment(
          'GUIDE_BD_URL',
          defaultValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        );
      case JurisdictionCode.in_:
        return const String.fromEnvironment(
          'GUIDE_IN_URL',
          defaultValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        );
      case JurisdictionCode.pk:
        return const String.fromEnvironment(
          'GUIDE_PK_URL',
          defaultValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        );
    }
  }
}

final guideVideoUrlProvider = FutureProvider<String>((ref) async {
  final j = ref.watch(jurisdictionProvider);
  return GuideVideoService.instance.resolveUrl(j);
});

class GuideVideoService {
  GuideVideoService._();
  static final instance = GuideVideoService._();

  final _storage = const FlutterSecureStorage();

  Future<String> resolveUrl(JurisdictionCode jurisdiction) async {
    final key = jurisdiction.guideVideoKey;
    // TODO(firebase Remote Config): fetch key `guide_bd` / `guide_in` / `guide_pk`
    final cached =
        await _storage.read(key: '${GuideVideoConfig._urlCachePrefix}$key');
    if (cached != null && cached.isNotEmpty) return cached;
    return GuideVideoConfig.fallbackUrlFor(jurisdiction);
  }

  Future<int> promptShowCount() async {
    final raw = await _storage.read(key: GuideVideoConfig._countKey);
    return int.tryParse(raw ?? '0') ?? 0;
  }

  Future<bool> shouldShowHomePrompt() async {
    final count = await promptShowCount();
    return count < GuideVideoConfig.maxHomePromptShows;
  }

  Future<void> recordHomePromptShown() async {
    final next = (await promptShowCount()) + 1;
    await _storage.write(
        key: GuideVideoConfig._countKey, value: next.toString());
  }

  Future<void> openGuide({required JurisdictionCode jurisdiction, String? url}) async {
    final target = Uri.parse(url ?? await resolveUrl(jurisdiction));
    if (!await canLaunchUrl(target)) {
      debugPrint('[GuideVideo] cannot launch $target (${jurisdiction.guideVideoKey})');
      return;
    }
    await launchUrl(target, mode: LaunchMode.externalApplication);
  }
}
