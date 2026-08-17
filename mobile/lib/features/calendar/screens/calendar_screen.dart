import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/auth/auth_provider.dart';
import '../../cases/providers/cases_providers.dart';
import '../../../core/router/app_router.dart';

// ── Providers ─────────────────────────────────────────────────────────────────

final _selectedDayProvider   = StateProvider<DateTime>((_) {
  final n = DateTime.now(); return DateTime(n.year, n.month, n.day);
});
final _viewingMonthProvider  = StateProvider<DateTime>((_) {
  final n = DateTime.now(); return DateTime(n.year, n.month);
});

class CalendarScreen extends ConsumerWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final month      = ref.watch(_viewingMonthProvider);
    final sel        = ref.watch(_selectedDayProvider);
    final chamberId  = ref.watch(chamberIdProvider);

    final countsAsync = ref.watch(calendarMonthProvider(
      (chamberId: chamberId, year: month.year, month: month.month),
    ));

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: Column(children: [
        _CalendarHeader(month: month, ref: ref),
        _WeekdayLabels(),
        countsAsync.when(
          loading: () => const Expanded(
            child: Center(child: CircularProgressIndicator(color: AppColors.brass))),
          error: (e, _) => Expanded(child: Center(child: Text(e.toString()))),
          data: (counts) => _MonthGrid(
            month: month, selected: sel, counts: counts, ref: ref),
        ),
        const Divider(height: 1),
        _DayHearingsList(day: sel),
      ]),
    );
  }
}

// ── Header (month navigation) ─────────────────────────────────────────────────
class _CalendarHeader extends StatelessWidget {
  final DateTime month;
  final WidgetRef ref;
  const _CalendarHeader({required this.month, required this.ref});

  static const _months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে',
    'জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.of(context).padding.top;
    return Container(
      color: AppColors.navy,
      padding: EdgeInsets.fromLTRB(16, top + 12, 16, 16),
      child: Row(children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('ক্যালেন্ডার',
            style: AppTypography.h2.copyWith(color: Colors.white)),
          Text('রবি–বৃহস্পতি কর্মদিবস',
            style: AppTypography.caption.copyWith(color: AppColors.muted)),
        ]),
        const Spacer(),
        IconButton(
          icon: const Icon(Icons.chevron_left, color: Colors.white),
          onPressed: () => ref.read(_viewingMonthProvider.notifier).update(
            (m) => DateTime(m.year, m.month - 1)),
        ),
        Text('${_months[month.month - 1]} ${month.year}',
          style: AppTypography.bodyMedium.copyWith(
            color: Colors.white, fontWeight: FontWeight.w600)),
        IconButton(
          icon: const Icon(Icons.chevron_right, color: Colors.white),
          onPressed: () => ref.read(_viewingMonthProvider.notifier).update(
            (m) => DateTime(m.year, m.month + 1)),
        ),
      ]),
    );
  }
}

// ── Weekday labels ────────────────────────────────────────────────────────────
class _WeekdayLabels extends StatelessWidget {
  static const _days = ['রবি','সোম','মঙ্গ','বুধ','বৃহ','শুক্র','শনি'];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: _days.asMap().entries.map((e) => Expanded(
          child: Text(e.value, textAlign: TextAlign.center,
            style: AppTypography.chip.copyWith(
              color: e.key >= 5 ? AppColors.danger : AppColors.muted,
              fontWeight: FontWeight.w600)),
        )).toList(),
      ),
    );
  }
}

// ── Month grid ────────────────────────────────────────────────────────────────
class _MonthGrid extends StatelessWidget {
  final DateTime month, selected;
  final Map<DateTime, int> counts;
  final WidgetRef ref;
  const _MonthGrid({required this.month, required this.selected,
    required this.counts, required this.ref});

  bool _isClosed(int weekday) => weekday == DateTime.friday || weekday == DateTime.saturday;

  @override
  Widget build(BuildContext context) {
    // First day of month weekday (Sun=0)
    final firstDay   = DateTime(month.year, month.month, 1);
    final startOffset = firstDay.weekday % 7; // Sun=0
    final daysInMonth = DateUtils.getDaysInMonth(month.year, month.month);

    return Container(
      color: AppColors.surface,
      padding: const EdgeInsets.fromLTRB(8, 4, 8, 12),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 7, childAspectRatio: 1.0, mainAxisSpacing: 4),
        itemCount: startOffset + daysInMonth,
        itemBuilder: (_, i) {
          if (i < startOffset) return const SizedBox.shrink();
          final day     = i - startOffset + 1;
          final date    = DateTime(month.year, month.month, day);
          final isSel   = date == selected;
          final isToday = date == DateTime(DateTime.now().year,
              DateTime.now().month, DateTime.now().day);
          final isClosed = _isClosed(date.weekday);
          final count   = counts[date] ?? 0;

          return GestureDetector(
            onTap: isClosed ? null : () {
              ref.read(_selectedDayProvider.notifier).state = date;
            },
            child: Opacity(
              opacity: isClosed ? 0.3 : 1.0,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: isSel ? AppColors.brass
                      : isToday ? AppColors.brassLighter
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('$day',
                      style: AppTypography.mono.copyWith(
                        color: isSel ? Colors.white
                            : isToday ? AppColors.warning
                            : AppColors.ink,
                        fontWeight: isSel || isToday
                            ? FontWeight.w700 : FontWeight.w400,
                        fontSize: 13,
                      )),
                    if (count > 0) ...[
                      const SizedBox(height: 2),
                      Container(
                        width: 18, height: 14,
                        decoration: BoxDecoration(
                          color: isSel
                              ? Colors.white.withOpacity(0.3)
                              : AppColors.brassLighter,
                          borderRadius: BorderRadius.circular(7),
                        ),
                        alignment: Alignment.center,
                        child: Text('$count',
                          style: AppTypography.chip.copyWith(
                            fontSize: 9, fontWeight: FontWeight.w700,
                            color: isSel ? Colors.white : AppColors.warning)),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Selected day hearings ─────────────────────────────────────────────────────
class _DayHearingsList extends ConsumerWidget {
  final DateTime day;
  const _DayHearingsList({required this.day});

  static const _months = ['জানু','ফেব্রু','মার্চ','এপ্রিল','মে',
    'জুন','জুলাই','আগস্ট','সেপ্টে','অক্টো','নভে','ডিসে'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chamberId  = ref.watch(chamberIdProvider);
    final hearingsAsync = ref.watch(
      calendarDayHearingsProvider((chamberId: chamberId, date: day)));

    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
            child: Text(
              '${day.day} ${_months[day.month - 1]} ${day.year} — শুনানি',
              style: AppTypography.bodyMedium.copyWith(
                color: AppColors.navy, fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: hearingsAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(color: AppColors.brass)),
              error: (e, _) => Center(child: Text(e.toString())),
              data: (cases) => cases.isEmpty
                  ? Center(child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('📅', style: TextStyle(fontSize: 36)),
                        const SizedBox(height: 8),
                        Text('এই দিনে কোনো শুনানি নেই',
                          style: AppTypography.body.copyWith(color: AppColors.muted)),
                      ]))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: cases.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (_, i) => _DayCase(c: cases[i]),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DayCase extends StatelessWidget {
  final dynamic c;
  const _DayCase({required this.c});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(children: [
      Container(
        width: 3, height: 40,
        decoration: BoxDecoration(
          color: AppColors.brass, borderRadius: BorderRadius.circular(2)),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(c.caseNo,
          style: AppTypography.mono.copyWith(color: AppColors.navy)),
        Text(c.clientId ?? '—',
          style: AppTypography.caption.copyWith(color: AppColors.muted)),
      ])),
      Text(c.courtName?.split(',').first ?? c.court,
        style: AppTypography.caption.copyWith(
          color: AppColors.info, fontSize: 11),
        textAlign: TextAlign.right),
    ]),
  );
}
