import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/jurisdiction/locale_provider.dart';
import '../../../core/jurisdiction/content.dart';
import '../../../core/jurisdiction/jurisdiction.dart';

/// Bare Acts — jurisdiction content map (BD = bdlaws; IN/PK = portal scaffolds).
class BareActsScreen extends ConsumerStatefulWidget {
  const BareActsScreen({super.key});
  @override
  ConsumerState<BareActsScreen> createState() => _BareActsScreenState();
}

class _BareActsScreenState extends ConsumerState<BareActsScreen> {
  final _searchCtrl = TextEditingController();
  String _q = '';

  /// Full BD library kept for BD only.
  static const _bdActs = [
    ('Code of Civil Procedure 1908 (CPC)', 'https://bdlaws.minlaw.gov.bd/act-86.html', '⚖️'),
    ('Code of Criminal Procedure 1898 (CrPC)', 'https://bdlaws.minlaw.gov.bd/act-75.html', '🔒'),
    ('Penal Code 1860', 'https://bdlaws.minlaw.gov.bd/act-11.html', '📜'),
    ('Evidence Act 1872', 'https://bdlaws.minlaw.gov.bd/act-24.html', '📋'),
    ('Limitation Act 1908', 'https://bdlaws.minlaw.gov.bd/act-98.html', '⏳'),
    ('Negotiable Instruments Act 1881', 'https://bdlaws.minlaw.gov.bd/act-44.html', '💰'),
    ('Contract Act 1872', 'https://bdlaws.minlaw.gov.bd/act-26.html', '📝'),
    ('Transfer of Property Act 1882', 'https://bdlaws.minlaw.gov.bd/act-47.html', '🏠'),
    ('Registration Act 1908', 'https://bdlaws.minlaw.gov.bd/act-90.html', '📌'),
    ('Muslim Family Laws Ordinance 1961', 'https://bdlaws.minlaw.gov.bd/act-297.html', '👨‍👩‍👧'),
    ('Family Courts Ordinance 1985', 'https://bdlaws.minlaw.gov.bd/act-555.html', '⚖️'),
    ('Specific Relief Act 1877', 'https://bdlaws.minlaw.gov.bd/act-33.html', '🎯'),
    ('Court Fees Act 1870', 'https://bdlaws.minlaw.gov.bd/act-20.html', '🧾'),
    ('Civil Courts Act 1887', 'https://bdlaws.minlaw.gov.bd/act-55.html', '🏛️'),
    ('Constitution of Bangladesh 1972', 'https://bdlaws.minlaw.gov.bd/act-367.html', '🇧🇩'),
    ('Artha Rin Adalat Ain 2003', 'https://bdlaws.minlaw.gov.bd/act-874.html', '💳'),
    ('Labor Act 2006', 'https://bdlaws.minlaw.gov.bd/act-952.html', '👷'),
    ('All Laws (bdlaws.minlaw.gov.bd)', 'https://bdlaws.minlaw.gov.bd', '📚'),
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<(String, String, String)> _actsFor(JurisdictionCode j) {
    if (j == JurisdictionCode.bd) return _bdActs;
    final seed = contentFor(j).bareActSeed;
    return seed.map((r) => (r.title, r.url, '📜')).toList();
  }

  List<(String, String, String)> _filtered(JurisdictionCode j) {
    final acts = _actsFor(j);
    if (_q.isEmpty) return acts;
    return acts
        .where((a) => a.$1.toLowerCase().contains(_q.toLowerCase()))
        .toList();
  }

  Future<void> _open(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final j = ref.watch(jurisdictionProvider);
    final content = contentFor(j);
    final filtered = _filtered(j);
    final top = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: Column(
        children: [
          Container(
            color: AppColors.navy,
            padding: EdgeInsets.fromLTRB(16, top + 12, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    Expanded(
                      child: Text(
                        'Bare Acts · ${j.flag}',
                        style:
                            AppTypography.h2.copyWith(color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => setState(() => _q = v),
                    style:
                        AppTypography.bodyMedium.copyWith(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Search acts...',
                      hintStyle: AppTypography.bodyMedium
                          .copyWith(color: AppColors.muted),
                      prefixIcon: const Icon(Icons.search,
                          color: AppColors.muted, size: 20),
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding:
                          const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
            child: Row(
              children: [
                const Text('🔗', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Source: ${content.resourcePortal.title}',
                    style: AppTypography.caption
                        .copyWith(color: AppColors.muted, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
          if (j != JurisdictionCode.bd)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(
                'Scaffold links for ${j.nameEn} — full library TODO.',
                style: AppTypography.caption
                    .copyWith(color: AppColors.warning, fontSize: 11),
              ),
            ),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
              itemCount: filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (_, i) {
                final (name, url, emoji) = filtered[i];
                return GestureDetector(
                  onTap: () => _open(url),
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        Text(emoji, style: const TextStyle(fontSize: 20)),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            name,
                            style: AppTypography.bodyMedium
                                .copyWith(color: AppColors.ink),
                          ),
                        ),
                        const Icon(Icons.open_in_new,
                            size: 16, color: AppColors.muted),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
