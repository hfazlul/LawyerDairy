/// P5-27 factory: D-1 on, D-2/D-3 off. No per-send confirm for scheduled jobs.
class AutoMessagingDefaults {
  static const d1On = true;
  static const d2On = false;
  static const d3On = false;

  /// Missing KV must not disable D-1.
  static bool parseD1(String? raw) => raw != '0';
  static bool parseD2(String? raw) => raw == '1';
  static bool parseD3(String? raw) => raw == '1';

  static bool parseEnabled(String? raw) => raw == '1';

  /// Day chips only — SMS quota must not hide lawyer WABA.
  static bool dayChipOn({
    required bool d1,
    bool d2 = false,
    bool d3 = false,
    required int daysUntilHearing,
  }) {
    switch (daysUntilHearing) {
      case 1:
        return d1;
      case 2:
        return d2;
      case 3:
        return d3;
      default:
        return false;
    }
  }

  static bool shouldSendScheduled({
    required bool masterAlarmOn,
    required bool autoMessagingOn,
    required bool d1,
    bool d2 = false,
    bool d3 = false,
    required int daysUntilHearing,
    required int quota,
  }) {
    if (!masterAlarmOn || !autoMessagingOn) return false;
    if (quota <= 0) return false;
    return dayChipOn(d1: d1, d2: d2, d3: d3, daysUntilHearing: daysUntilHearing);
  }

  /// Quiet hours 21:00–08:00 Asia/Dhaka — delay, do not drop.
  static bool inQuietHours(DateTime dhakaNow) {
    final h = dhakaNow.hour;
    return h >= 21 || h < 8;
  }

  /// Auto job fires from 10:00 Dhaka; earlier ticks wait.
  static bool afterSendWindowStart(DateTime dhakaNow) => dhakaNow.hour >= 10;

  static const mamlaqPublicSite = 'https://mamlaq.com';

  /// Preview-only case data. Not a real client.
  static const demoClientName = 'করিম উদ্দিন (নমুনা)';
  static const demoCaseName = 'দেওয়ানি ১২৩/২০২৬ (নমুনা)';
  static const demoCourtName = 'ঢাকা জজ আদালত (নমুনা)';
  static const demoHearingDate = '২২/১০/২০২৬ (নমুনা)';

  static String hearingReminderSms({
    required String clientName,
    required String caseName,
    required String courtName,
    required String hearingDate,
    required String lawyerName,
    required String chamberName,
    required String appearanceTime,
  }) {
    final client = clientName.trim().isEmpty ? 'মক্কেল' : clientName.trim();
    final matter = caseName.trim().isEmpty ? 'মামলা' : caseName.trim();
    final court = courtName.trim().isEmpty ? 'আদালত' : courtName.trim();
    final line =
        'মক্কেল: $client। মামলা: $matter। আদালত: $court। শুনানি: ${hearingDate.trim()}। আইনজীবী: ${lawyerName.trim()}। চেম্বার: ${chamberName.trim()}। সময়: ${appearanceTime.trim()}।';
    return '$line\nMAMLAQ\n$mamlaqPublicSite';
  }

  static String hearingSmsBody({
    required String caseNo,
    required DateTime hearingDate,
    String name = 'মক্কেল',
    String courtName = '',
    String lawyerName = '',
    String chamberName = '',
    String appearanceTime = '',
  }) {
    final d = hearingDate;
    final dd = d.day.toString().padLeft(2, '0');
    final mm = d.month.toString().padLeft(2, '0');
    return hearingReminderSms(
      clientName: name,
      caseName: caseNo,
      courtName: courtName,
      hearingDate: '$dd/$mm/${d.year}',
      lawyerName: lawyerName,
      chamberName: chamberName,
      appearanceTime: appearanceTime,
    );
  }
}
