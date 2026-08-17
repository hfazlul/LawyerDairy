import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/db/database_provider.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/db/database.dart';
import '../../../shared/widgets/empty_state.dart';
import 'client_detail_screen.dart';
import 'client_add_screen.dart';

final _clientSearchProvider = StateProvider<String>((_) => '');

final clientsListProvider = StreamProvider<List<Client>>((ref) {
  final dao    = ref.watch(clientDaoProvider);
  final chamId = ref.watch(chamberIdProvider);
  final q      = ref.watch(_clientSearchProvider);
  if (chamId.isEmpty) return const Stream.empty();
  return dao.watchClients(chamId, query: q.isEmpty ? null : q);
});

class ClientsScreen extends ConsumerStatefulWidget {
  const ClientsScreen({super.key});
  @override
  ConsumerState<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends ConsumerState<ClientsScreen> {
  final _ctrl = TextEditingController();

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(clientsListProvider);
    final top = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: AppColors.parchment,
      body: Column(children: [
        // Header
        Container(
          color: AppColors.navy,
          padding: EdgeInsets.fromLTRB(16, top + 12, 16, 14),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('ক্লায়েন্ট তালিকা',
              style: AppTypography.h2.copyWith(color: Colors.white)),
            const SizedBox(height: 10),
            Container(
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10)),
              child: TextField(
                controller: _ctrl,
                onChanged: (v) =>
                    ref.read(_clientSearchProvider.notifier).state = v,
                style: AppTypography.bodyMedium.copyWith(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'নাম বা ফোন নম্বর দিয়ে খুঁজুন...',
                  hintStyle: AppTypography.bodyMedium.copyWith(color: AppColors.muted),
                  prefixIcon: const Icon(Icons.search, color: AppColors.muted, size: 20),
                  border: InputBorder.none, enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12)),
              ),
            ),
          ]),
        ),
        // List
        Expanded(
          child: clientsAsync.when(
            loading: () => const Center(
              child: CircularProgressIndicator(color: AppColors.brass)),
            error: (e, _) => Center(child: Text(e.toString())),
            data: (clients) => clients.isEmpty
                ? EmptyState(
                    emoji: '👤',
                    title: 'কোনো ক্লায়েন্ট নেই',
                    subtitle: 'নতুন ক্লায়েন্ট যোগ করতে + বোতাম চাপুন',
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
                    itemCount: clients.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _ClientTile(
                      client: clients[i],
                      onTap: () => Navigator.push(context, MaterialPageRoute(
                        builder: (_) => ClientDetailScreen(clientId: clients[i].id))),
                    ),
                  ),
          ),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(
          fullscreenDialog: true, builder: (_) => const ClientAddScreen())),
        backgroundColor: AppColors.brass,
        label: Text('+ নতুন ক্লায়েন্ট',
          style: AppTypography.bodyMedium.copyWith(
            color: Colors.white, fontWeight: FontWeight.w600)),
        icon: const Icon(Icons.person_add, color: Colors.white),
      ),
    );
  }
}

class _ClientTile extends StatelessWidget {
  final Client client;
  final VoidCallback onTap;
  const _ClientTile({required this.client, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface, borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border)),
      child: Row(children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: AppColors.brassLighter, shape: BoxShape.circle),
          alignment: Alignment.center,
          child: Text(
            client.name.isNotEmpty ? client.name[0] : '?',
            style: AppTypography.h2.copyWith(color: AppColors.warning)),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(client.name,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.navy, fontWeight: FontWeight.w600)),
          if (client.phone != null) ...[
            const SizedBox(height: 2),
            Text(client.phone!,
              style: AppTypography.caption.copyWith(color: AppColors.muted)),
          ],
          if (client.fileNo != null) ...[
            const SizedBox(height: 2),
            Text('ফাইল নং: ${client.fileNo}',
              style: AppTypography.caption.copyWith(
                color: AppColors.info, fontSize: 11)),
          ],
        ])),
        const Icon(Icons.chevron_right, color: AppColors.muted, size: 20),
      ]),
    ),
  );
}
