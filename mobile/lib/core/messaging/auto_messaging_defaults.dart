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

  static String formatHearingDate(DateTime date) {
    return _formatHearingDay(date.day, date.month);
  }

  static String hearingTitle(String? gender) {
    final value = (gender ?? '').trim().toLowerCase();
    if (value == 'female' ||
        value == 'f' ||
        value == 'woman' ||
        value == 'জনাবা' ||
        value == 'মহিলা' ||
        value == 'নারী') {
      return 'জনাবা';
    }
    return 'জনাব';
  }

  /// One hearing SMS, at most 70 Unicode code points.
  /// Client rows have no gender; unknown uses জনাব.
  static String hearingSms({
    String? gender,
    required String client,
    required String date,
    required String court,
    required String lawyer,
  }) {
    return _composeHearingSms(
      title: hearingTitle(gender),
      client: client,
      date: date,
      court: court,
      lawyer: lawyer,
    );
  }

  static String hearingReminderSms({
    required String clientName,
    required String caseName,
    required String courtName,
    required String hearingDate,
    required String lawyerName,
    required String chamberName,
    required String appearanceTime,
  }) {
    return hearingSms(
      client: clientName,
      date: hearingDate,
      court: courtName,
      lawyer: lawyerName,
    );
  }

  static String hearingSmsBody({
    required String caseNo,
    required DateTime hearingDate,
    String name = 'মক্কেল',
    String courtName = '',
    String lawyerName = '',
    String chamberName = '',
    String appearanceTime = '',
    String? gender,
  }) {
    return hearingSms(
      gender: gender,
      client: name,
      date: formatHearingDate(hearingDate),
      court: courtName,
      lawyer: lawyerName,
    );
  }
}

const _hearingMonths = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রি',
  'মে',
  'জুন',
  'জুলা',
  'আগ',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];
const _bnDigits = '০১২৩৪৫৬৭৮৯';
const _honorifics = {'মোঃ', 'মো.', 'মো', 'মোহাম্মদ', 'মোছাঃ', 'মোছা', 'মোসাঃ', 'মোছঃ'};

int _codePoints(String value) => value.runes.length;

String _bnNumber(int value) {
  return '$value'.replaceAllMapped(RegExp(r'\d'), (m) => _bnDigits[int.parse(m.group(0)!)]);
}

String _formatHearingDay(int day, int month) {
  final label = month >= 1 && month <= 12 ? _hearingMonths[month - 1] : '';
  return '${_bnNumber(day)} $label'.trim();
}

List<String> _nameTokens(String name) {
  return name.trim().split(RegExp(r'\s+')).where((t) => t.isNotEmpty).toList();
}

bool _isHonorific(String token) {
  final bare = token.replaceAll(RegExp(r'[।.]+$'), '');
  return _honorifics.contains(token) || _honorifics.contains(bare);
}

String _longerName(List<String> client, List<String> lawyer) {
  final clientLen = _codePoints(client.join(' '));
  final lawyerLen = _codePoints(lawyer.join(' '));
  if (clientLen != lawyerLen) return clientLen > lawyerLen ? 'client' : 'lawyer';
  return client.length >= lawyer.length ? 'client' : 'lawyer';
}

List<String> _dropMiddle(List<String> tokens) {
  if (tokens.length <= 2) return tokens;
  return [tokens.first, ...tokens.sublist(2)];
}

List<String> _toOneToken(List<String> tokens) {
  if (tokens.length <= 1) return tokens;
  final plain = tokens.where((token) => !_isHonorific(token)).toList();
  final pool = plain.isEmpty ? tokens : plain;
  var best = pool.first;
  for (final token in pool) {
    if (_codePoints(token) > _codePoints(best)) best = token;
  }
  return [best];
}

String _line(String title, String client, String date, String court, String? lawyer) {
  final courtName = court.trim();
  final courtText = courtName.isEmpty ? '' : '$courtName ';
  final head = '$title ${client.trim()}, কেসের শুনানি ${date.trim()}, ${courtText}আদালত। উকিল';
  if (lawyer == null || lawyer.trim().isEmpty) return '$head।';
  return '$head ${lawyer.trim()}।';
}

String _composeHearingSms({
  required String title,
  required String client,
  required String date,
  required String court,
  required String lawyer,
}) {
  var clientTokens = _nameTokens(client);
  var lawyerTokens = _nameTokens(lawyer);
  if (clientTokens.isEmpty) clientTokens = ['মক্কেল'];
  String text() => _line(title, clientTokens.join(' '), date, court, lawyerTokens.join(' '));
  String bare() => _line(title, clientTokens.join(' '), date, court, null);

  if (_codePoints(text()) <= 70) return text();

  while (_codePoints(text()) > 70 && (clientTokens.length > 2 || lawyerTokens.length > 2)) {
    final which = _longerName(clientTokens, lawyerTokens);
    if (which == 'client' && clientTokens.length > 2) {
      clientTokens = _dropMiddle(clientTokens);
    } else if (lawyerTokens.length > 2) {
      lawyerTokens = _dropMiddle(lawyerTokens);
    } else if (clientTokens.length > 2) {
      clientTokens = _dropMiddle(clientTokens);
    } else {
      break;
    }
  }
  if (_codePoints(text()) <= 70) return text();

  final first = _longerName(clientTokens, lawyerTokens);
  final second = first == 'client' ? 'lawyer' : 'client';
  if (first == 'client' && clientTokens.length > 1) clientTokens = _toOneToken(clientTokens);
  if (first == 'lawyer' && lawyerTokens.length > 1) lawyerTokens = _toOneToken(lawyerTokens);
  if (_codePoints(text()) <= 70) return text();
  if (second == 'client' && clientTokens.length > 1) clientTokens = _toOneToken(clientTokens);
  if (second == 'lawyer' && lawyerTokens.length > 1) lawyerTokens = _toOneToken(lawyerTokens);
  if (_codePoints(text()) <= 70) return text();

  if (_codePoints(bare()) <= 70) return bare();
  if (clientTokens.length > 1) clientTokens = _toOneToken(clientTokens);
  return bare();
}
