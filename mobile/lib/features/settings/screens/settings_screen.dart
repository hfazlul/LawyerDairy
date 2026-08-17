import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/utils/notification_service.dart';
import '../../../core/monetization/entitlement.dart';
import '../../../core/monetization/play_billing_service.dart';
import '../../../core/guide/guide_video_service.dart';
import '../../../core/jurisdiction/jurisdiction.dart';
import '../../../core/jurisdiction/locale_provider.dart';

// ── Providers ─────────────────────────────────────────────────────────────────
final _exactAlarmProvider  = StateProvider<bool>((_) => false);
final _eveningHourProvider = StateProvider<int>((_) => 21);
final _morningHourProvider = StateProvider<int>((_) => 7);
final _appLockProvider     = StateProvider<bool>((_) => false);
final _wifiOnlyProvider    = StateProvider<bool>((_) => true);

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user        = ref.watch(currentUserProvider);
    final exactAlarm  = ref.watch(_exactAlarmProvider);
    final eveningHour = ref.watch(_eveningHourProvider);
    final morningHour = ref.watch(_morningHourProvider);
    final appLock     = ref.watch(_appLockProvider);
    final wifiOnly    = ref.watch(_wifiOnlyProvider);
    final top         = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: CustomScrollView(
        slivers: [
          // Header
          SliverToBoxAdapter(child: Container(
            color: AppColors.navy,
            padding: EdgeInsets.fromLTRB(16, top + 12, 16, 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('সেটিংস',
                style: AppTypography.h2.copyWith(color: Colors.white)),
              if (user != null) ...[
                const SizedBox(height: 14),
                _UserCard(user: user),
              ],
            ]),
          )),

          SliverList(delegate: SliverChildListDelegate([
            const SizedBox(height: 8),

            // ── Notifications ──────────────────────────────────────────────
            _GroupHeader('বিজ্ঞপ্তি'),
            _SettingTile(
              icon: Icons.nightlight_round, iconColor: AppColors.navySoft,
              title: 'রাতের বোর্ড সময়',
              subtitle: 'এখন: রাত ${eveningHour}:০০',
              onTap: () => _pickHour(context, ref, eveningHour,
                (h) => ref.read(_eveningHourProvider.notifier).state = h),
            ),
            _SettingTile(
              icon: Icons.wb_sunny_outlined, iconColor: AppColors.warning,
              title: 'সকালের বোর্ড সময়',
              subtitle: 'এখন: সকাল ${morningHour}:০০',
              onTap: () => _pickHour(context, ref, morningHour,
                (h) => ref.read(_morningHourProvider.notifier).state = h),
            ),
            _SwitchTile(
              icon: Icons.alarm, iconColor: AppColors.danger,
              title: 'সঠিক সময়ে বিজ্ঞপ্তি',
              subtitle: 'বন্ধ থাকলে ±১০ মিনিট ব্যবধান (Xiaomi/Oppo-তে নিরাপদ)',
              value: exactAlarm,
              onChanged: (v) {
                ref.read(_exactAlarmProvider.notifier).state = v;
                NotificationService.scheduleDailyReminders(
                  eveningHour: eveningHour,
                  morningHour: morningHour,
                  exactAlarm:  v);
              },
            ),
            const _Divider(),

            // ── Security ───────────────────────────────────────────────────
            _GroupHeader('নিরাপত্তা'),
            _SwitchTile(
              icon: Icons.fingerprint, iconColor: AppColors.success,
              title: 'অ্যাপ লক (PIN / বায়োমেট্রিক)',
              subtitle: 'খোলার সময় পরিচয় যাচাই করবে',
              value: appLock,
              onChanged: (v) =>
                  ref.read(_appLockProvider.notifier).state = v,
            ),
            _SettingTile(
              icon: Icons.lock_reset, iconColor: AppColors.info,
              title: 'PIN পরিবর্তন করুন',
              onTap: () {},
            ),
            const _Divider(),

            // ── Sync & Backup ──────────────────────────────────────────────
            _GroupHeader('সিঙ্ক ও ব্যাকআপ'),
            _SwitchTile(
              icon: Icons.wifi, iconColor: AppColors.info,
              title: 'শুধু WiFi-তে নথি সিঙ্ক',
              subtitle: 'মোবাইল ডেটা বাঁচাবে',
              value: wifiOnly,
              onChanged: (v) =>
                  ref.read(_wifiOnlyProvider.notifier).state = v,
            ),
            _SettingTile(
              icon: Icons.sync, iconColor: AppColors.success,
              title: 'এখনই সিঙ্ক করুন',
              subtitle: 'সার্ভারের সাথে সব পরিবর্তন মেলান',
              onTap: () => _showSyncDialog(context),
            ),
            _SettingTile(
              icon: Icons.backup, iconColor: AppColors.navy,
              title: 'ব্যাকআপ ও রিস্টোর',
              onTap: () => _showBackupDialog(context),
            ),
            const _Divider(),

            // ── Subscription (status only — Play-safe; Play Billing stub IN/PK) ─
            _GroupHeader('সাবস্ক্রিপশন'),
            const _SubscriptionStatusCard(),
            const _PlayBillingStubTile(),
            const _Divider(),

            // ── Jurisdiction ───────────────────────────────────────────────
            _GroupHeader('দেশ / আইন প্যাক'),
            const _JurisdictionTile(),
            const _Divider(),

            // ── Help ───────────────────────────────────────────────────────
            _GroupHeader('সহায়তা'),
            _SettingTile(
              icon: Icons.play_circle_outline, iconColor: AppColors.brass,
              title: 'গাইড ভিডিও',
              subtitle: 'অ্যাপ ব্যবহারের সংক্ষিপ্ত ভিডিও',
              onTap: () {
                final j = ref.read(jurisdictionProvider);
                GuideVideoService.instance.openGuide(jurisdiction: j);
              },
            ),
            const _Divider(),

            // ── Data ───────────────────────────────────────────────────────
            _GroupHeader('ডেটা ও গোপনীয়তা'),
            _SettingTile(
              icon: Icons.download, iconColor: AppColors.info,
              title: 'আমার ডেটা ডাউনলোড করুন',
              subtitle: 'JSON ফরম্যাটে সব তথ্য',
              onTap: () {},
            ),
            _SettingTile(
              icon: Icons.delete_forever, iconColor: AppColors.danger,
              title: 'অ্যাকাউন্ট মুছে ফেলুন',
              subtitle: 'সকল তথ্য স্থায়ীভাবে মুছবে',
              onTap: () => _showDeleteConfirm(context, ref),
            ),
            const _Divider(),

            // ── About ──────────────────────────────────────────────────────
            _GroupHeader('সম্পর্কে'),
            _SettingTile(
              icon: Icons.info_outline, iconColor: AppColors.muted,
              title: 'সংস্করণ',
              subtitle: 'v1.0.0 · আইনজীবী ডায়েরি BD',
              onTap: () {},
            ),
            _SettingTile(
              icon: Icons.privacy_tip_outlined, iconColor: AppColors.muted,
              title: 'গোপনীয়তা নীতি',
              onTap: () {},
            ),
            _SettingTile(
              icon: Icons.logout, iconColor: AppColors.danger,
              title: 'লগ আউট করুন',
              onTap: () => _showLogoutConfirm(context, ref),
            ),
            const SizedBox(height: 80),
          ])),
        ],
      ),
    );
  }

  Future<void> _pickHour(BuildContext ctx, WidgetRef ref, int current,
      ValueChanged<int> onPick) async {
    final result = await showTimePicker(
      context: ctx,
      initialTime: TimeOfDay(hour: current, minute: 0),
      builder: (ctx2, child) => Theme(
        data: Theme.of(ctx2).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.brass, onPrimary: Colors.white)),
        child: child!),
    );
    if (result != null) onPick(result.hour);
  }

  void _showSyncDialog(BuildContext ctx) => showDialog(
    context: ctx,
    builder: (_) => AlertDialog(
      title: Text('সিঙ্ক', style: AppTypography.h2.copyWith(color: AppColors.navy)),
      content: Text('সার্ভারের সাথে সব পরিবর্তন সিঙ্ক হবে।',
        style: AppTypography.body.copyWith(color: AppColors.ink)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx),
          child: Text('বাতিল', style: AppTypography.caption.copyWith(color: AppColors.muted))),
        ElevatedButton(
          onPressed: () { Navigator.pop(ctx); /* TODO: trigger sync */ },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.brass, foregroundColor: Colors.white,
            elevation: 0),
          child: const Text('সিঙ্ক করুন')),
      ],
    ),
  );

  void _showBackupDialog(BuildContext ctx) => showDialog(
    context: ctx,
    builder: (_) => AlertDialog(
      title: Text('ব্যাকআপ', style: AppTypography.h2.copyWith(color: AppColors.navy)),
      content: Text('আপনার সব ডেটা ক্লাউডে সংরক্ষিত আছে। '
        'নতুন ডিভাইসে লগইন করলেই রিস্টোর হবে।',
        style: AppTypography.body.copyWith(color: AppColors.ink)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx),
          child: Text('ঠিক আছে',
            style: AppTypography.caption.copyWith(color: AppColors.brass))),
      ],
    ),
  );

  void _showLogoutConfirm(BuildContext ctx, WidgetRef ref) => showDialog(
    context: ctx,
    builder: (_) => AlertDialog(
      title: Text('লগ আউট?', style: AppTypography.h2.copyWith(color: AppColors.navy)),
      content: Text('লগ আউট করলে ডিভাইস থেকে সেশন মুছে যাবে। '
        'ডেটা সার্ভারে থাকবে।',
        style: AppTypography.body.copyWith(color: AppColors.ink)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx),
          child: Text('বাতিল', style: AppTypography.caption.copyWith(color: AppColors.muted))),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(ctx);
            ref.read(authProvider.notifier).signOut();
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger, foregroundColor: Colors.white,
            elevation: 0),
          child: const Text('লগ আউট')),
      ],
    ),
  );

  void _showDeleteConfirm(BuildContext ctx, WidgetRef ref) => showDialog(
    context: ctx,
    builder: (_) => AlertDialog(
      title: Text('অ্যাকাউন্ট মুছবেন?',
        style: AppTypography.h2.copyWith(color: AppColors.danger)),
      content: Text('এই কাজ পূর্বাবস্থায় ফেরানো যাবে না। '
        'সকল কেস, ক্লায়েন্ট ও নথি স্থায়ীভাবে মুছে যাবে।',
        style: AppTypography.body.copyWith(color: AppColors.ink)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx),
          child: Text('বাতিল',
            style: AppTypography.caption.copyWith(color: AppColors.muted))),
        ElevatedButton(
          onPressed: () => Navigator.pop(ctx), // TODO: implement delete
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.danger, foregroundColor: Colors.white,
            elevation: 0),
          child: const Text('মুছে ফেলুন')),
      ],
    ),
  );
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _UserCard extends StatelessWidget {
  final dynamic user;
  const _UserCard({required this.user});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(
      color: Colors.white.withOpacity(0.08),
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.white.withOpacity(0.1))),
    child: Row(children: [
      Container(
        width: 44, height: 44,
        decoration: const BoxDecoration(
          color: AppColors.brassLighter, shape: BoxShape.circle),
        alignment: Alignment.center,
        child: Text(
          (user.name as String).isNotEmpty ? (user.name as String)[0] : '?',
          style: AppTypography.h2.copyWith(color: AppColors.warning)),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(user.name as String,
          style: AppTypography.bodyMedium.copyWith(
            color: Colors.white, fontWeight: FontWeight.w600)),
        Text(user.phone as String,
          style: AppTypography.caption.copyWith(color: AppColors.muted)),
        Text(user.role as String,
          style: AppTypography.caption.copyWith(color: AppColors.brassLight, fontSize: 11)),
      ])),
    ]),
  );
}

class _GroupHeader extends StatelessWidget {
  final String title;
  const _GroupHeader(this.title);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 6),
    child: Text(title, style: AppTypography.caption.copyWith(
      color: AppColors.muted, fontWeight: FontWeight.w700,
      letterSpacing: 0.8, fontSize: 11)),
  );
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final Color    iconColor;
  final String   title;
  final String?  subtitle;
  final VoidCallback? onTap;
  const _SettingTile({required this.icon, required this.iconColor,
    required this.title, this.subtitle, this.onTap});
  @override
  Widget build(BuildContext context) => ListTile(
    tileColor: AppColors.surface,
    leading: Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        color: iconColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(9)),
      alignment: Alignment.center,
      child: Icon(icon, color: iconColor, size: 19)),
    title: Text(title,
      style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
    subtitle: subtitle != null
        ? Text(subtitle!, style: AppTypography.caption.copyWith(color: AppColors.muted))
        : null,
    trailing: const Icon(Icons.chevron_right, color: AppColors.muted, size: 20),
    onTap: onTap,
  );
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final Color    iconColor;
  final String   title;
  final String?  subtitle;
  final bool     value;
  final ValueChanged<bool> onChanged;
  const _SwitchTile({required this.icon, required this.iconColor,
    required this.title, this.subtitle, required this.value, required this.onChanged});
  @override
  Widget build(BuildContext context) => ListTile(
    tileColor: AppColors.surface,
    leading: Container(
      width: 36, height: 36,
      decoration: BoxDecoration(
        color: iconColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(9)),
      alignment: Alignment.center,
      child: Icon(icon, color: iconColor, size: 19)),
    title: Text(title,
      style: AppTypography.bodyMedium.copyWith(color: AppColors.ink)),
    subtitle: subtitle != null
        ? Text(subtitle!, style: AppTypography.caption.copyWith(color: AppColors.muted))
        : null,
    trailing: Switch(value: value, onChanged: onChanged, activeColor: AppColors.brass),
  );
}

class _Divider extends StatelessWidget {
  const _Divider();
  @override
  Widget build(BuildContext context) =>
      const SizedBox(height: 8);
}

/// Play-safe: Active / Inactive only — no Buy, Renew, or website checkout CTAs.
class _SubscriptionStatusCard extends ConsumerWidget {
  const _SubscriptionStatusCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ent = ref.watch(entitlementProvider);
    final active = ent.isPremiumActive;
    final planLabel = ent.planCode ?? 'FREE';
    final ends = ent.endsAt;
    final statusBn = active ? 'Active' : 'Inactive';
    final subtitle = active
        ? (ends != null
            ? 'মেয়াদ: ${ends.day}/${ends.month}/${ends.year}'
            : 'প্রিমিয়াম সক্রিয়')
        : 'প্রিমিয়াম নিষ্ক্রিয়';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.navy, AppColors.navySoft],
            begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(planLabel,
                    style: AppTypography.bodyMedium.copyWith(
                      color: AppColors.brassLight,
                      fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(subtitle,
                    style: AppTypography.caption
                        .copyWith(color: AppColors.muted)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: active
                  ? AppColors.success.withOpacity(0.2)
                  : AppColors.muted.withOpacity(0.2),
              borderRadius: BorderRadius.circular(8)),
            child: Text(statusBn,
                style: AppTypography.chip.copyWith(
                  color: active ? AppColors.success : AppColors.muted,
                  fontWeight: FontWeight.w700)),
          ),
        ]),
      ),
    );
  }
}

/// IN/PK only — BD never shows a buy CTA on mobile.
class _PlayBillingStubTile extends ConsumerWidget {
  const _PlayBillingStubTile();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final j = ref.watch(jurisdictionProvider);
    final active = ref.watch(isPremiumActiveProvider);
    if (!j.showPlayBillingCta || active) return const SizedBox.shrink();

    return _SettingTile(
      icon: Icons.shop_outlined,
      iconColor: AppColors.brass,
      title: 'Upgrade via Play Billing',
      subtitle: 'IN/PK scaffold — product IDs TODO',
      onTap: () async {
        final ok = await PlayBillingService.instance.startPurchase(
          PlayBillingService.productIds.first,
        );
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              ok
                  ? 'Purchase started'
                  : 'Play Billing not wired yet (stub)',
              style: AppTypography.body.copyWith(color: Colors.white),
            ),
          ),
        );
      },
    );
  }
}

class _JurisdictionTile extends ConsumerWidget {
  const _JurisdictionTile();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(localePrefsProvider);
    final j = prefs.jurisdiction;
    return _SettingTile(
      icon: Icons.public,
      iconColor: AppColors.info,
      title: '${j.flag} ${j.nameEn}',
      subtitle: 'UI: ${prefs.language.label} · rail: ${j.paymentRail.name}',
      onTap: () => _showChangeSheet(context, ref),
    );
  }

  void _showChangeSheet(BuildContext context, WidgetRef ref) {
    var j = ref.read(jurisdictionProvider);
    var lang = ref.read(localePrefsProvider).language;
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: AppColors.surface,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setLocal) => Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Confirm country & language',
                  style: AppTypography.h2.copyWith(color: AppColors.navy)),
              const SizedBox(height: 8),
              for (final code in JurisdictionCode.values)
                RadioListTile<JurisdictionCode>(
                  value: code,
                  groupValue: j,
                  title: Text('${code.flag} ${code.nameEn}'),
                  onChanged: (v) => setLocal(() => j = v!),
                ),
              Wrap(
                spacing: 8,
                children: [
                  for (final l in UiLanguage.values)
                    ChoiceChip(
                      label: Text(l.label),
                      selected: lang == l,
                      onSelected: (_) => setLocal(() => lang = l),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () async {
                  await ref.read(localePrefsProvider.notifier).confirm(
                        jurisdiction: j,
                        language: lang,
                      );
                  if (ctx.mounted) Navigator.pop(ctx);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.brass,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Confirm'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
