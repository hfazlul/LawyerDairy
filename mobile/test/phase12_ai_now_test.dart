import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lawyer_diary_bd/core/db/database.dart';
import 'package:lawyer_diary_bd/core/fees/practice_dashboard.dart';
import 'package:lawyer_diary_bd/core/law/law_directory.dart';
import 'package:lawyer_diary_bd/core/law/practice_laws.dart';
import 'package:lawyer_diary_bd/core/messaging/hearing_sms_engine.dart';
import 'package:lawyer_diary_bd/core/messaging/messaging_prefs.dart';
import 'package:lawyer_diary_bd/core/messaging/sms_phone.dart';
import 'package:lawyer_diary_bd/core/messaging/sms_vendor_adapter.dart';
import 'package:lawyer_diary_bd/core/messaging/sms_vendor_config.dart';
import 'package:lawyer_diary_bd/core/messaging/waba_client.dart';
import 'package:lawyer_diary_bd/core/storage/string_store.dart';
import 'package:lawyer_diary_bd/core/utils/whatsapp_templates.dart';
import 'package:lawyer_diary_bd/core/theme/app_spacing.dart';
import 'package:lawyer_diary_bd/features/communication/screens/communication_screen.dart';
import 'package:lawyer_diary_bd/features/dashboard/widgets/practice_dashboard_panel.dart';
import 'package:lawyer_diary_bd/features/law_daily/screens/law_daily_screen.dart';
import 'package:lawyer_diary_bd/features/messaging/screens/auto_messaging_screen.dart';
import 'package:lawyer_diary_bd/features/tools/screens/extra_calcs_screen.dart';
import 'package:lawyer_diary_bd/l10n/generated/app_localizations_bn.dart';
import 'package:lawyer_diary_bd/l10n/generated/app_localizations_en.dart';
import 'package:lawyer_diary_bd/shared/widgets/in_app_webview.dart';

import 'phase1_harness.dart';

Client _client(String id, String name) {
  final now = DateTime(2026, 9, 8);
  return Client(
    id: id,
    workspaceId: 'ws',
    name: name,
    version: 1,
    dirty: true,
    createdAt: now,
    updatedAt: now,
  );
}

Case _case({required String id, required String clientId, required String caseNo}) {
  final now = DateTime(2026, 9, 8);
  return Case(
    id: id,
    workspaceId: 'ws',
    courtLevelId: 'dj',
    courtTypeId: 'dj',
    court: 'dj',
    caseType: 'দেওয়ানি',
    caseNo: caseNo,
    caseNoNormalized: caseNo,
    onBehalf: 'client_side',
    priority: 'normal',
    status: 'active',
    clientId: clientId,
    version: 1,
    dirty: true,
    createdAt: now,
    updatedAt: now,
  );
}

FeeEntry _fee({
  required String id,
  required String type,
  required double amount,
  String? caseId,
  DateTime? date,
}) {
  final d = date ?? DateTime(2026, 9, 8);
  return FeeEntry(
    id: id,
    caseId: caseId,
    workspaceId: 'ws',
    type: type,
    amount: amount,
    amountPaisa: (amount * 100).round(),
    date: d,
    version: 1,
    dirty: true,
    createdAt: d,
  );
}

HearingSmsEngine _engine({
  required MemoryStringStore store,
  required int Function() smsHits,
}) {
  return HearingSmsEngine(
    sms: SmsVendorAdapter(
      config: const SmsVendorConfig(apiUrl: 'https://example.test/s', apiKey: 'k'),
      transport: (_) async {
        smsHits();
        return const SmsHttpResponse(status: 200, body: 'ok');
      },
    ),
    waba: WabaClient(
      config: const WabaConfig(token: '', phoneNumberId: ''),
      transport: ({required to, required config}) async =>
          const WabaSendOutcome(ok: true, reason: 'sent'),
    ),
    idem: KvIdempotencyStore(store),
    lawyerPhone: '01812345678',
  );
}

void main() {
  test('ARB leftover chrome keys exist in EN and BN', () {
    final en = AppLocalizationsEn();
    final bn = AppLocalizationsBn();
    expect(en.causeEmptyTitle, contains('No cases'));
    expect(bn.causeEmptyTitle, contains('মামলা'));
    expect(en.messagingClientSms, contains('SMS'));
    expect(bn.messagingOwnerWa, contains('হোয়াটসঅ্যাপ'));
    expect(en.commSectionClient, 'Client SMS');
    expect(bn.commSectionOwner, contains('হোয়াটসঅ্যাপ'));
    expect(en.dashTodayLine('1', '2'), contains('Today'));
    expect(en.onboardingStart, 'Get started');
    expect(bn.onboardingStart, 'শুরু করুন');
    expect(en.aiTitle, 'AI assistant');
    expect(en.hybridReload, 'Reload');
    expect(en.hybridForward, 'Forward');
    expect(en.whatsAppLabel, 'WhatsApp');
    expect(en.messagingWabaEmpty, contains('wa.me'));
    expect(bn.templatePendingReview, contains('খসড়া'));
    expect(en.appointmentsEmpty.toLowerCase(), contains('appointment'));
    expect(en.calcPctXPercent, 'X %');
    expect(en.lawDailyEmptySearch, contains('No act'));
  });

  test('fetched bdlaws TOC acts are PENDING heading-only cards', () {
    expect(kPracticeActs.length, greaterThanOrEqualTo(14));
    expect(findAct('contract'), isNotNull);
    expect(findSection('contract', '৭৩')!.status, LawStatus.pendingReview);
    expect(findSection('contract', '৭৩')!.sourceUrl, contains('act-26'));
    expect(findSection('contract', '৭৩')!.retrievedDate, '2026-09-13');
    expect(findSection('tpa', '৫৪')!.titleBn.toLowerCase(), contains('sale'));
    expect(findSection('reg', '৪৯')!.sourceUrl, contains('act-90'));
    expect(findSection('sra', '১২')!.sourceUrl, contains('act-36'));
    expect(findSection('mflo', '৭')!.titleBn.toLowerCase(), contains('talaq'));
    expect(findSection('artha', '৮')!.titleBn, contains('আরজি'));
    expect(findSection('pc', '৪১১')!.sourceUrl, contains('act-11'));
    expect(matchLawForCase(caseType: 'অর্থঋণ', actsSections: '')!.act.id, 'artha');
  });

  test('Law Daily directory gained official sites and papers', () {
    expect(kLawSites.any((e) => e.id == 'efamily'), isTrue);
    expect(kLawSites.any((e) => e.id == 'police'), isTrue);
    expect(kNewsSites.any((e) => e.id == 'tbs'), isTrue);
    expect(kNewsSites.any((e) => e.id == 'unb'), isTrue);
    expect(hostIsAllowlisted('efamilycourt.judiciary.gov.bd'), isTrue);
    expect(hostIsAllowlisted('www.tbsnews.net'), isTrue);
  });

  test('dashboard today KPIs come from the same local ledger', () {
    final dash = buildPracticeDashboard(
      clients: [_client('c1', 'রহিম')],
      cases: [_case(id: 'k1', clientId: 'c1', caseNo: '111/24')],
      fees: [
        _fee(id: 'f1', type: 'received', amount: 200, caseId: 'k1', date: DateTime(2026, 9, 8)),
        _fee(id: 'f2', type: 'expenseCourtFee', amount: 40, caseId: 'k1', date: DateTime(2026, 9, 8)),
        _fee(id: 'f3', type: 'received', amount: 90, caseId: 'k1', date: DateTime(2026, 9, 7)),
      ],
      now: DateTime(2026, 9, 8, 12),
    );
    expect(dash.today.received, 200);
    expect(dash.today.expense, 40);
    expect(dash.thisMonth.received, 290);
  });

  test('D-1 engine still sends client SMS by default', () async {
    final store = MemoryStringStore();
    var smsHits = 0;
    final engine = _engine(store: store, smsHits: () => smsHits++);
    final on = await engine.run(
      dhakaNow: DateTime(2026, 9, 12, 10, 5),
      hearings: [
        HearingCandidate(
          caseId: 'c1',
          caseNo: '111/24',
          hearingDate: DateTime(2026, 9, 13),
          daysUntil: 1,
          clientPhone: '01712345678',
        ),
      ],
      policy: const MessagingPolicy(
        masterAlarmOn: true,
        autoMessagingOn: true,
        d1: true,
        d2: false,
        d3: false,
      ),
      quota: SmsQuotaBook(remaining: 10, ym: '202609'),
    );
    expect(on.smsSent, 1);
    expect(smsHits, 1);
  });

  test('D-1 engine skips client SMS when the messaging toggle is off', () async {
    final store = MemoryStringStore();
    var smsHits = 0;
    final engine = _engine(store: store, smsHits: () => smsHits++);
    final off = await engine.run(
      dhakaNow: DateTime(2026, 9, 12, 10, 5),
      hearings: [
        HearingCandidate(
          caseId: 'c1',
          caseNo: '111/24',
          hearingDate: DateTime(2026, 9, 13),
          daysUntil: 1,
          clientPhone: '01712345678',
        ),
      ],
      policy: const MessagingPolicy(
        masterAlarmOn: true,
        autoMessagingOn: true,
        d1: true,
        d2: false,
        d3: false,
        clientSmsOn: false,
      ),
      quota: SmsQuotaBook(remaining: 10, ym: '202609'),
    );
    expect(off.smsSent, 0);
    expect(smsHits, 0);
  });

  test('wa.me URI is E.164 and never doubles 88', () {
    expect(SmsPhone.waMeUri('01712345678')!.toString(), 'https://wa.me/8801712345678');
    expect(SmsPhone.waMeUri('8801712345678')!.toString(), 'https://wa.me/8801712345678');
    expect(SmsPhone.waMeUri('abc'), isNull);
    expect(SmsPhone.smsUri('01712345678')!.scheme, 'sms');
    expect(SmsPhone.smsUri('01712345678')!.toString(), contains('1712345678'));
    expect(SmsPhone.smsUri('8801712345678')!.toString(), contains('1712345678'));
    expect(WhatsAppTemplates.digitsForWa('01712345678'), '8801712345678');
    expect(WhatsAppTemplates.digitsForWa('8801712345678'), '8801712345678');
  });

  test('missing SMS key does not auto-send WhatsApp', () async {
    final store = MemoryStringStore();
    var smsHits = 0;
    var wabaHits = 0;
    final engine = HearingSmsEngine(
      sms: SmsVendorAdapter(
        config: const SmsVendorConfig(apiUrl: '', apiKey: ''),
        transport: (_) async {
          smsHits++;
          return const SmsHttpResponse(status: 200, body: 'no');
        },
      ),
      waba: WabaClient(
        config: const WabaConfig(token: 't', phoneNumberId: '1'),
        transport: ({required to, required config}) async {
          wabaHits++;
          return const WabaSendOutcome(ok: true, reason: 'sent');
        },
      ),
      idem: KvIdempotencyStore(store),
      lawyerPhone: '01812345678',
    );
    final noKey = await engine.run(
      dhakaNow: DateTime(2026, 9, 12, 10, 5),
      hearings: [
        HearingCandidate(
          caseId: 'c1',
          caseNo: '111/24',
          hearingDate: DateTime(2026, 9, 13),
          daysUntil: 1,
          clientPhone: '01712345678',
        ),
      ],
      policy: const MessagingPolicy(
        masterAlarmOn: true,
        autoMessagingOn: true,
        d1: true,
        d2: false,
        d3: false,
      ),
      quota: SmsQuotaBook(remaining: 10, ym: '202609'),
    );
    expect(noKey.smsSent, 0);
    expect(smsHits, 0);
    expect(noKey.stoppedReason, 'sms_unconfigured');
    expect(noKey.wabaSent, 0);
    expect(wabaHits, 0);
  });

  test('zero SMS quota does not auto-send WhatsApp', () async {
    final store = MemoryStringStore();
    var smsHits = 0;
    var wabaHits = 0;
    final engine = HearingSmsEngine(
      sms: SmsVendorAdapter(
        config: const SmsVendorConfig(apiUrl: 'https://example.test/s', apiKey: 'k'),
        transport: (_) async {
          smsHits++;
          return const SmsHttpResponse(status: 200, body: 'ok');
        },
      ),
      waba: WabaClient(
        config: const WabaConfig(token: 't', phoneNumberId: '1'),
        transport: ({required to, required config}) async {
          wabaHits++;
          return const WabaSendOutcome(ok: true, reason: 'sent');
        },
      ),
      idem: KvIdempotencyStore(store),
      lawyerPhone: '01812345678',
    );
    final zero = await engine.run(
      dhakaNow: DateTime(2026, 9, 12, 10, 5),
      hearings: [
        HearingCandidate(
          caseId: 'c1',
          caseNo: '111/24',
          hearingDate: DateTime(2026, 9, 13),
          daysUntil: 1,
          clientPhone: '01712345678',
        ),
      ],
      policy: const MessagingPolicy(
        masterAlarmOn: true,
        autoMessagingOn: true,
        d1: true,
        d2: false,
        d3: false,
      ),
      quota: SmsQuotaBook(remaining: 0, ym: '202609'),
    );
    expect(zero.smsSent, 0);
    expect(smsHits, 0);
    expect(zero.stoppedReason, 'quota_zero');
    expect(zero.wabaSent, 0);
    expect(wabaHits, 0);
  });

  testWidgets('Auto Messaging page splits client SMS and owner WhatsApp', (tester) async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('lawyer_diary_bd/firebase'),
      (call) async {
        if (call.method == 'fetchRemoteConfig') return <String, dynamic>{};
        if (call.method == 'isConfigured') return false;
        return null;
      },
    );
    addTearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(const MethodChannel('lawyer_diary_bd/firebase'), null);
    });
    await tester.binding.setSurfaceSize(const Size(400, 1800));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(phase1App(
      home: AutoMessagingScreen(kv: MemoryStringStore()),
    ));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.text('ডেমো বার্তা'), findsOneWidget);
    expect(find.byKey(const Key('bulk-sms-demo')), findsOneWidget);
    expect(find.textContaining('করিম উদ্দিন (নমুনা)'), findsOneWidget);
    expect(find.textContaining('https://mamlaq.com'), findsWidgets);
    await tester.enterText(find.byKey(const Key('bulk-sms-lawyer')), 'রহিম উকিল');
    await tester.pump();
    expect(find.textContaining('আইনজীবী: রহিম উকিল'), findsOneWidget);
  });

  testWidgets('Communication advanced page has client SMS then owner WA sections', (tester) async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('lawyer_diary_bd/firebase'),
      (call) async {
        if (call.method == 'fetchRemoteConfig') return <String, dynamic>{};
        if (call.method == 'isConfigured') return false;
        return null;
      },
    );
    addTearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(const MethodChannel('lawyer_diary_bd/firebase'), null);
    });
    await tester.binding.setSurfaceSize(const Size(400, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(phase1App(home: const CommunicationScreen()));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
    expect(find.byKey(const Key('comm-section-client')), findsOneWidget);
    expect(find.byKey(const Key('comm-section-owner')), findsOneWidget);
    expect(find.byKey(const Key('comm-manual-only')), findsOneWidget);
    expect(find.byKey(const Key('comm-no-key')), findsOneWidget);
  });

  testWidgets('Law Daily lists fetched Contract TOC act', (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 2400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(phase1App(home: const LawDailyScreen()));
    await tester.pumpAndSettle();
    final list = find.byType(ListView).first;
    await tester.dragUntilVisible(
      find.text('চুক্তি আইন, ১৮৭২'),
      list,
      const Offset(0, -240),
    );
    expect(find.text('চুক্তি আইন, ১৮৭২'), findsWidgets);
    await tester.dragUntilVisible(
      find.text('অর্থ ঋণ আদালত আইন, ২০০৩'),
      list,
      const Offset(0, -240),
    );
    expect(find.text('অর্থ ঋণ আদালত আইন, ২০০৩'), findsWidgets);
  });

  testWidgets('Percentage X/Y labels are ARB; stamp uses tool page padding', (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(phase1App(locale: const Locale('en'), home: const PercentageCalcScreen()));
    await tester.pumpAndSettle();
    expect(find.text('X %'), findsOneWidget);
    expect(find.text('Y'), findsOneWidget);
  });

  testWidgets('hybrid chrome bar exposes back and forward', (tester) async {
    await tester.pumpWidget(phase1App(
      home: Scaffold(
        body: HybridChromeBar(
          canBack: true,
          canForward: false,
          host: 'bdlaws.minlaw.gov.bd',
          currentUrl: 'https://bdlaws.minlaw.gov.bd/',
          onBack: () {},
          onForward: () {},
          onReload: () {},
        ),
      ),
    ));
    expect(find.byKey(const Key('hybrid-back')), findsOneWidget);
    expect(find.byKey(const Key('hybrid-forward')), findsOneWidget);
    expect(find.byKey(const Key('hybrid-reload')), findsOneWidget);
  });

  testWidgets('dashboard panel shows today line', (tester) async {
    await tester.binding.setSurfaceSize(const Size(400, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final data = buildPracticeDashboard(
      clients: [_client('c1', 'রহিম')],
      cases: [_case(id: 'k1', clientId: 'c1', caseNo: '111/24')],
      fees: [_fee(id: 'f1', type: 'received', amount: 200, caseId: 'k1')],
      now: DateTime(2026, 9, 8),
    );
    await tester.pumpWidget(phase1App(home: Scaffold(body: PracticeDashboardPanel(data: data))));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('dash-today')), findsOneWidget);
  });

  test('tool page padding stays 16', () {
    expect(AppSpacing.toolPage, 16);
    expect(AppSpacing.toolField, 12);
  });
}
