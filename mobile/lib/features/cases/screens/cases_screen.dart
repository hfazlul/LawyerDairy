import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/router/app_router.dart';
import '../providers/cases_providers.dart';
import '../../../core/db/database.dart';
import '../widgets/case_list_tile.dart';
import '../../../shared/widgets/empty_state.dart';

class CasesScreen extends ConsumerStatefulWidget {
  const CasesScreen({super.key});
  @override
  ConsumerState<CasesScreen> createState() => _CasesScreenState();
}

class _CasesScreenState extends ConsumerState<CasesScreen> {
  final _searchCtrl = TextEditingController();
  String? _activeFilter; // null=all, 'active', 'closed'

  static const _filters = [
    (null,     'সব',        48),
    ('active', 'সক্রিয়',   31),
    ('closed', 'নিষ্পত্তি', 17),
  ];

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final casesAsync = ref.watch(casesListProvider);

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: Column(
        children: [
          _buildHeader(),
          _buildFilterBar(),
          Expanded(
            child: casesAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.brass)),
              error: (e, _) => EmptyState(
                emoji: '⚠️',
                title: 'সমস্যা হয়েছে',
                subtitle: e.toString(),
              ),
              data: (cases) => cases.isEmpty
                  ? EmptyState(
                      emoji: '📋',
                      title: 'কোনো মামলা নেই',
                      subtitle: _activeFilter != null
                          ? 'এই ফিল্টারে কোনো মামলা পাওয়া যায়নি'
                          : 'নতুন মামলা যোগ করতে + বোতাম চাপুন',
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                      itemCount: cases.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => CaseListTile(
                        c: cases[i],
                        onTap: () => context.push(
                          Routes.caseDetail.replaceFirst(':id', cases[i].id),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.navy,
      padding: EdgeInsets.fromLTRB(16, top + 12, 16, 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('মামলা তালিকা',
          style: AppTypography.h2.copyWith(color: Colors.white)),
        const SizedBox(height: 12),
        // Search bar
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: TextField(
            controller: _searchCtrl,
            onChanged: (q) => ref.read(casesFilterProvider.notifier).update(
              (f) => f.copyWith(query: q.isEmpty ? null : q),
            ),
            style: AppTypography.bodyMedium.copyWith(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'কেস নম্বর বা ক্লায়েন্টের নাম...',
              hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.muted),
              prefixIcon: const Icon(Icons.search, color: AppColors.muted, size: 20),
              border: InputBorder.none,
              enabledBorder: InputBorder.none,
              focusedBorder: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildFilterBar() {
    return Container(
      color: AppColors.parchment,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
      child: Row(
        children: _filters.map((f) {
          final (id, label, count) = f;
          final isActive = _activeFilter == id;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () {
                setState(() => _activeFilter = id);
                ref.read(casesFilterProvider.notifier).update(
                  (f) => f.copyWith(status: id),
                );
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: isActive ? AppColors.brassLighter : AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isActive ? AppColors.brass : AppColors.border,
                    width: isActive ? 1.5 : 1,
                  ),
                ),
                child: Text('$label ($count)',
                  style: AppTypography.chip.copyWith(
                    color: isActive ? AppColors.warning : AppColors.muted,
                    fontWeight: isActive ? FontWeight.w700 : FontWeight.w400,
                  )),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
