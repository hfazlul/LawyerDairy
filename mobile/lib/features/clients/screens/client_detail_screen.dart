import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/db/database_provider.dart';
import '../../../core/db/database.dart';

final _clientDetailProvider = StreamProvider.family<Client?, String>((ref, id) {
  return ref.watch(clientDaoProvider).watchClients('').map(
    (list) => list.cast<Client?>().firstWhere((c) => c?.id == id, orElse: () => null));
});

class ClientDetailScreen extends ConsumerWidget {
  final String clientId;
  const ClientDetailScreen({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientAsync = ref.watch(_clientDetailProvider(clientId));
    return clientAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.brass))),
      error: (e, _) => Scaffold(body: Center(child: Text(e.toString()))),
      data: (client) {
        if (client == null) return const Scaffold(
          body: Center(child: Text('ক্লায়েন্ট পাওয়া যায়নি')));
        return Scaffold(
          backgroundColor: AppColors.parchment,
          appBar: AppBar(
            backgroundColor: AppColors.navy,
            foregroundColor: Colors.white,
            title: Text(client.name,
              style: AppTypography.h2.copyWith(color: Colors.white)),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Colors.white),
                onPressed: () {/* TODO: edit */},
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Avatar card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppColors.border)),
                child: Column(children: [
                  Container(
                    width: 72, height: 72,
                    decoration: const BoxDecoration(
                      color: AppColors.brassLighter, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text(client.name[0],
                      style: AppTypography.display.copyWith(color: AppColors.warning)),
                  ),
                  const SizedBox(height: 12),
                  Text(client.name,
                    style: AppTypography.h2.copyWith(color: AppColors.navy)),
                  if (client.fileNo != null) ...[
                    const SizedBox(height: 4),
                    Text('ফাইল নং: ${client.fileNo}',
                      style: AppTypography.caption.copyWith(color: AppColors.muted)),
                  ],
                  const SizedBox(height: 16),
                  // Quick actions
                  Row(children: [
                    if (client.phone != null)
                      Expanded(child: _QuickAction(
                        icon: Icons.phone, label: 'ফোন',
                        color: AppColors.success,
                        onTap: () => launchUrl(Uri.parse('tel:${client.phone}')),
                      )),
                    if (client.phone != null) ...[
                      const SizedBox(width: 8),
                      Expanded(child: _QuickAction(
                        icon: Icons.message, label: 'WhatsApp',
                        color: const Color(0xFF25D366),
                        onTap: () => launchUrl(Uri.parse(
                          'https://wa.me/${client.phone?.replaceAll('+', '')}')),
                      )),
                    ],
                    if (client.email != null) ...[
                      const SizedBox(width: 8),
                      Expanded(child: _QuickAction(
                        icon: Icons.email, label: 'ইমেইল',
                        color: AppColors.info,
                        onTap: () => launchUrl(Uri.parse('mailto:${client.email}')),
                      )),
                    ],
                  ]),
                ]),
              ),
              const SizedBox(height: 16),
              // Details card
              _InfoCard(title: 'যোগাযোগ তথ্য', rows: [
                if (client.phone    != null) ('মোবাইল',    client.phone!),
                if (client.altPhone != null) ('বিকল্প',    client.altPhone!),
                if (client.email    != null) ('ইমেইল',     client.email!),
                if (client.address  != null) ('ঠিকানা',    client.address!),
              ]),
              const SizedBox(height: 12),
              _InfoCard(title: 'পরিচয় তথ্য', rows: [
                if (client.nid    != null) ('NID নম্বর', client.nid!),
                if (client.fileNo != null) ('ফাইল নং',  client.fileNo!),
              ]),
              if (client.note != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border)),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('নোট', style: AppTypography.caption.copyWith(
                      color: AppColors.muted, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(client.note!,
                      style: AppTypography.body.copyWith(color: AppColors.ink)),
                  ]),
                ),
              ],
              const SizedBox(height: 12),
              // Cases section
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('মামলাসমূহ', style: AppTypography.caption.copyWith(
                    color: AppColors.muted, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 12),
                  // TODO: bind to casesByClientProvider
                  Center(child: Text('সকল মামলা এখানে দেখাবে',
                    style: AppTypography.caption.copyWith(color: AppColors.muted))),
                ]),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String   label;
  final Color    color;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label,
    required this.color, required this.onTap});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.2))),
      child: Column(children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 4),
        Text(label, style: AppTypography.chip.copyWith(color: color)),
      ]),
    ),
  );
}

class _InfoCard extends StatelessWidget {
  final String title;
  final List<(String, String)> rows;
  const _InfoCard({required this.title, required this.rows});
  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: AppTypography.caption.copyWith(
          color: AppColors.muted, fontWeight: FontWeight.w600)),
        const SizedBox(height: 10),
        ...rows.map((r) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(width: 90, child: Text(r.$1,
              style: AppTypography.caption.copyWith(color: AppColors.muted))),
            Expanded(child: Text(r.$2,
              style: AppTypography.bodyMedium.copyWith(color: AppColors.ink))),
          ]),
        )),
      ]),
    );
  }
}
