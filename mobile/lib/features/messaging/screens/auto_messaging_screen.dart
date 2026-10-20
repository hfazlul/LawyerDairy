import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/auth/auth_provider.dart';
import '../../../core/auth/guest_gate.dart';
import '../../../core/config/api_config.dart';
import '../../../core/messaging/auto_messaging_defaults.dart';
import '../../../core/storage/string_store.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../l10n/generated/app_localizations.dart';
import '../../../shared/widgets/diary_header.dart';

class AutoMessagingScreen extends ConsumerStatefulWidget {
  const AutoMessagingScreen({super.key, this.kv});

  /// Tests inject [MemoryStringStore]; production uses secure storage.
  final StringStore? kv;

  @override
  ConsumerState<AutoMessagingScreen> createState() => _AutoMessagingScreenState();
}

class _AutoMessagingScreenState extends ConsumerState<AutoMessagingScreen> {
  late final StringStore _kv;
  final _lawyer = TextEditingController();
  final _chamber = TextEditingController();
  final _time = TextEditingController();
  String _remaining = '…';
  String? _status;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _kv = widget.kv ?? SecureStringStore();
    _load();
  }

  @override
  void dispose() {
    _lawyer.dispose();
    _chamber.dispose();
    _time.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final lawyer = await _kv.read('bulk.lawyer');
      final chamber = await _kv.read('bulk.chamber');
      final time = await _kv.read('bulk.time');
      if (!mounted) return;
      if ((lawyer ?? '').isNotEmpty) _lawyer.text = lawyer!;
      if ((chamber ?? '').isNotEmpty) _chamber.text = chamber!;
      if ((time ?? '').isNotEmpty) _time.text = time!;
    } catch (_) {}
    await _refreshRemaining();
  }

  Future<void> _refreshRemaining() async {
    var line = 'এই প্যাকেজে বাকি এসএমএস: লোড হয়নি';
    try {
      final u = ref.read(currentUserProvider);
      if (u != null && u.accessToken.isNotEmpty) {
        final res = await Dio(BaseOptions(
          baseUrl: ApiConfig.baseUrl,
          headers: {
            'Authorization': 'Bearer ${u.accessToken}',
            'X-Workspace-Id': u.activeWorkspaceId,
          },
          connectTimeout: const Duration(seconds: 8),
        )).get('/api/mobile/v1/communication/credits');
        if (!mounted) return;
        final m = Map<String, dynamic>.from(res.data as Map);
        final left = m['remaining'] ?? m['left'] ?? m['credits'];
        line = 'এই প্যাকেজে বাকি এসএমএস: $left';
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() => _remaining = line);
  }

  String get _preview => AutoMessagingDefaults.hearingReminderSms(
        clientName: AutoMessagingDefaults.demoClientName,
        caseName: AutoMessagingDefaults.demoCaseName,
        courtName: AutoMessagingDefaults.demoCourtName,
        hearingDate: AutoMessagingDefaults.demoHearingDate,
        lawyerName: _lawyer.text,
        chamberName: _chamber.text,
        appearanceTime: _time.text,
      );

  Future<void> _send() async {
    if (!await GuestGate.allow(context)) return;
    if (!mounted) return;
    if (_lawyer.text.trim().isEmpty || _chamber.text.trim().isEmpty || _time.text.trim().isEmpty) {
      setState(() => _status = 'নাম, চেম্বার ও সময় লিখুন।');
      return;
    }
    setState(() {
      _busy = true;
      _status = null;
    });
    try {
      await _kv.write('bulk.lawyer', _lawyer.text.trim());
      await _kv.write('bulk.chamber', _chamber.text.trim());
      await _kv.write('bulk.time', _time.text.trim());
      final u = ref.read(currentUserProvider);
      if (u == null || u.accessToken.isEmpty) {
        if (!mounted) return;
        setState(() => _status = 'লগইন করা নেই।');
        return;
      }
      final res = await Dio(BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        headers: {
          'Authorization': 'Bearer ${u.accessToken}',
          'X-Workspace-Id': u.activeWorkspaceId,
        },
        connectTimeout: const Duration(seconds: 20),
      )).post('/api/mobile/v1/communication/sms/hearings', data: {
        'lawyerName': _lawyer.text.trim(),
        'chamberName': _chamber.text.trim(),
        'appearanceTime': _time.text.trim(),
      });
      if (!mounted) return;
      final m = Map<String, dynamic>.from(res.data as Map);
      final sent = m['sent'] ?? 0;
      final left = m['remaining'];
      setState(() {
        _status = 'পাঠানো হয়েছে: $sent। বাকি: $left';
        if (left != null) _remaining = 'এই প্যাকেজে বাকি এসএমএস: $left';
      });
    } on DioException catch (e) {
      if (!mounted) return;
      final data = e.response?.data;
      final msg = data is Map && data['messageBn'] is String
          ? data['messageBn'] as String
          : 'পাঠানো যায়নি।';
      setState(() => _status = msg);
    } catch (_) {
      if (!mounted) return;
      setState(() => _status = 'পাঠানো যায়নি।');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  InputDecoration _field(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: AppTypography.body,
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.parchment,
      drawer: const DiaryDrawer(),
      appBar: DiaryHeader(showBack: true, subtitle: l10n.drawerMessaging),
      body: ListView(
        padding: EdgeInsets.fromLTRB(
          16,
          16,
          16,
          16 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        children: [
          Text(_remaining, key: const Key('bulk-sms-remaining'), style: AppTypography.body),
          const SizedBox(height: 4),
          Text(
            'ফ্রি ০/মাস · স্টার্টার ০/মাস · প্রো ১৫০/মাস · প্রো অ্যাডভান্স ২৮০/মাস · অ্যাডভান্স ৪০০/মাস',
            style: AppTypography.caption,
          ),
          const SizedBox(height: 16),
          TextField(
            key: const Key('bulk-sms-lawyer'),
            controller: _lawyer,
            style: AppTypography.body,
            decoration: _field('আইনজীবীর নাম'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('bulk-sms-chamber'),
            controller: _chamber,
            style: AppTypography.body,
            decoration: _field('চেম্বারের নাম'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 12),
          TextField(
            key: const Key('bulk-sms-time'),
            controller: _time,
            style: AppTypography.body,
            decoration: _field('উপস্থিতির সময়'),
            onChanged: (_) => setState(() {}),
          ),
          const SizedBox(height: 20),
          Text('ডেমো বার্তা', key: const Key('bulk-sms-demo-title'), style: AppTypography.h2),
          const SizedBox(height: 4),
          Text(
            'এটি ডেমো। এখনো পাঠানো হয়নি। নিচের মামলার তথ্য নমুনা।',
            style: AppTypography.caption,
          ),
          const SizedBox(height: 8),
          Text(
            _preview,
            key: const Key('bulk-sms-demo'),
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: 16),
          FilledButton(
            key: const Key('bulk-sms-send'),
            onPressed: _busy ? null : _send,
            child: Text(_busy ? 'অপেক্ষা' : '১–২ দিনের শুনানিতে পাঠান', style: AppTypography.bodyMedium),
          ),
          if (_status != null) ...[
            const SizedBox(height: 8),
            Text(_status!, style: AppTypography.body),
          ],
        ],
      ),
    );
  }
}
