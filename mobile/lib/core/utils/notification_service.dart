import 'dart:io';
import 'package:flutter/material.dart' show Color;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz;

/// Notification schedule:
/// - 21:00 previous night → tomorrow's cause list
/// - 07:00 morning        → today's cause list
/// - D-7, D-3, D-1        → limitation deadline warnings
/// - Weekly               → fee due reminder (opt-in)
///
/// IMPORTANT: Use inexactAllowWhileIdle by default.
/// BD users mostly have Xiaomi/Oppo/Realme — aggressive battery killers.
/// Only request SCHEDULE_EXACT_ALARM if user explicitly enables it in Settings.
class NotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;

  // ── Channel IDs ───────────────────────────────────────────────────────────
  static const _chCauseList = 'cause_list';   // daily board
  static const _chDeadline  = 'deadline';     // limitation alerts
  static const _chFee       = 'fee_due';      // fee reminders (opt-in)
  static const _chSync      = 'sync';         // chamber sync alerts

  // ── Notification IDs (deterministic from date) ───────────────────────────
  static int _dailyId(int hour) => 1000 + hour;
  static int _deadlineId(String caseId) =>
      caseId.hashCode.abs() % 900000 + 100000;

  static Future<void> init() async {
    if (_initialized) return;
    tz.initializeTimeZones();
    tz.setLocalLocation(tz.getLocation('Asia/Dhaka'));

    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios     = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    await _plugin.initialize(
      const InitializationSettings(android: android, iOS: ios),
      onDidReceiveNotificationResponse: _onTap,
    );

    await _createChannels();
    _initialized = true;
  }

  // ── Permission request (Android 13+) ─────────────────────────────────────

  static Future<bool> requestPermission() async {
    if (Platform.isAndroid) {
      final android = _plugin
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
      return await android?.requestNotificationsPermission() ?? false;
    }
    if (Platform.isIOS) {
      final ios = _plugin
          .resolvePlatformSpecificImplementation<
              IOSFlutterLocalNotificationsPlugin>();
      return await ios?.requestPermissions(alert: true, badge: true, sound: true)
          ?? false;
    }
    return false;
  }

  // ── Schedule daily cause list notifications ───────────────────────────────

  static Future<void> scheduleDailyReminders({
    required int eveningHour,   // default 21
    required int morningHour,   // default 7
    required bool exactAlarm,   // user setting — default false
  }) async {
    await _plugin.cancelAll();

    final mode = exactAlarm
        ? AndroidScheduleMode.exactAllowWhileIdle
        : AndroidScheduleMode.inexactAllowWhileIdle;

    // Evening: 9 PM — tomorrow's cause list
    await _scheduleDaily(
      id:       _dailyId(eveningHour),
      title:    'আগামীকালের বোর্ড',
      body:     'আগামীকালের শুনানির তালিকা দেখুন ও প্রস্তুতি নিন।',
      hour:     eveningHour,
      minute:   0,
      channel:  _chCauseList,
      mode:     mode,
    );

    // Morning: 7 AM — today's cause list
    await _scheduleDaily(
      id:       _dailyId(morningHour),
      title:    'আজকের বোর্ড',
      body:     'আজকের শুনানির তালিকা দেখুন।',
      hour:     morningHour,
      minute:   0,
      channel:  _chCauseList,
      mode:     mode,
    );
  }

  static Future<void> _scheduleDaily({
    required int              id,
    required String           title,
    required String           body,
    required int              hour,
    required int              minute,
    required String           channel,
    required AndroidScheduleMode mode,
  }) async {
    final now  = tz.TZDateTime.now(tz.local);
    var sched  = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    if (sched.isBefore(now)) sched = sched.add(const Duration(days: 1));

    await _plugin.zonedSchedule(
      id, title, body, sched,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channel, channel,
          importance: Importance.high,
          priority:   Priority.high,
          styleInformation: const BigTextStyleInformation(''),
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      androidScheduleMode: mode,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time, // repeat daily
    );
  }

  // ── Limitation deadline alerts ────────────────────────────────────────────

  /// Schedule D-7, D-3, D-1 alerts for a limitation deadline
  static Future<void> scheduleDeadlineAlert({
    required String   caseId,
    required String   caseNo,
    required DateTime dueDate,
    required String   ruleRef,
  }) async {
    for (final daysBefore in [7, 3, 1]) {
      final alertDate = dueDate.subtract(Duration(days: daysBefore));
      if (alertDate.isBefore(DateTime.now())) continue;

      final id = _deadlineId(caseId) + daysBefore;
      await _plugin.zonedSchedule(
        id,
        'Limitation সতর্কতা — $caseNo',
        '$daysBefore দিন বাকি: $ruleRef',
        tz.TZDateTime.from(
          DateTime(alertDate.year, alertDate.month, alertDate.day, 8),
          tz.local,
        ),
        NotificationDetails(
          android: AndroidNotificationDetails(
            _chDeadline, 'Limitation সতর্কতা',
            importance:   Importance.max,
            priority:     Priority.max,
            color:        const Color(0xFFA4262C),
          ),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation:
            UILocalNotificationDateInterpretation.absoluteTime,
      );
    }
  }

  static Future<void> cancelDeadlineAlerts(String caseId) async {
    for (final daysBefore in [7, 3, 1]) {
      await _plugin.cancel(_deadlineId(caseId) + daysBefore);
    }
  }

  // ── Instant notification (chamber sync alert) ─────────────────────────────

  static Future<void> showInstant({
    required int    id,
    required String title,
    required String body,
    String channel = _chSync,
  }) async {
    await _plugin.show(
      id, title, body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          channel, channel,
          importance: Importance.defaultImportance,
          priority:   Priority.defaultPriority,
        ),
      ),
    );
  }

  // ── Channel setup ─────────────────────────────────────────────────────────

  static Future<void> _createChannels() async {
    if (!Platform.isAndroid) return;
    final android = _plugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()!;

    const channels = [
      AndroidNotificationChannel(
        _chCauseList, 'দৈনিক বোর্ড',
        description: 'সকাল ও রাতের শুনানির তালিকা',
        importance: Importance.high,
      ),
      AndroidNotificationChannel(
        _chDeadline, 'Limitation সতর্কতা',
        description: 'আপিল ও অন্যান্য মেয়াদের সতর্কতা',
        importance: Importance.max,
      ),
      AndroidNotificationChannel(
        _chFee, 'ফি স্মরণ',
        description: 'বকেয়া ফি সাপ্তাহিক স্মরণ',
        importance: Importance.defaultImportance,
      ),
      AndroidNotificationChannel(
        _chSync, 'চেম্বার আপডেট',
        description: 'চেম্বারের সিঙ্ক ও পরিবর্তন',
        importance: Importance.defaultImportance,
      ),
    ];
    for (final channel in channels) {
      await android.createNotificationChannel(channel);
    }
  }

  static void _onTap(NotificationResponse r) {
    // TODO: navigate to relevant screen using go_router
    // RouteContext.push('/cases/${r.payload}')
  }
}
