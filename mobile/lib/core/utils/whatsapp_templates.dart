import 'package:url_launcher/url_launcher.dart';

/// WhatsApp deep-link templates — completely free, no API cost.
/// Uses wa.me/ deep links with pre-filled Bengali messages.
///
/// Bar Council Canon note: these are informational messages to existing
/// clients, not solicitation. Fully compliant.
class WhatsAppTemplates {

  /// পরবর্তী শুনানির তারিখ জানানো
  static String nextHearing({
    required String clientName,
    required String caseNo,
    required String court,
    required String date,
    String? outcome,
  }) {
    final outcomeText = outcome != null ? '\nগত তারিখ: $outcome।' : '';
    return 'আস্সালামুআলাইকুম $clientName ভাই/আপা,\n\n'
        'আপনার মামলা $caseNo-এর পরবর্তী শুনানির তারিখ:\n'
        '📅 $date\n'
        '🏛 $court$outcomeText\n\n'
        'অনুগ্রহ করে সময়মতো উপস্থিত থাকুন।\n\n'
        '— আপনার আইনজীবী';
  }

  /// তারিখ পরিবর্তন
  static String dateChanged({
    required String clientName,
    required String caseNo,
    required String oldDate,
    required String newDate,
    required String reason,
  }) {
    return 'আস্সালামুআলাইকুম $clientName ভাই/আপা,\n\n'
        '⚠️ $caseNo মামলার তারিখ পরিবর্তন হয়েছে।\n\n'
        'আগের তারিখ: $oldDate\n'
        'নতুন তারিখ: 📅 $newDate\n'
        'কারণ: $reason\n\n'
        'যেকোনো প্রশ্নে যোগাযোগ করুন।\n\n'
        '— আপনার আইনজীবী';
  }

  /// ফি বকেয়া স্মরণ
  static String feeReminder({
    required String clientName,
    required String caseNo,
    required String amount,
  }) {
    return 'আস্সালামুআলাইকুম $clientName ভাই/আপা,\n\n'
        '$caseNo মামলায় আপনার বকেয়া ফি:\n'
        '💰 ৳ $amount\n\n'
        'অনুগ্রহ করে দ্রুত পরিশোধ করুন যাতে মামলার কাজ অব্যাহত থাকে।\n\n'
        '— আপনার আইনজীবী';
  }

  /// কাগজপত্র চাওয়া
  static String documentRequest({
    required String clientName,
    required String caseNo,
    required List<String> documents,
  }) {
    final docList = documents.asMap().entries
        .map((e) => '${e.key + 1}. ${e.value}')
        .join('\n');
    return 'আস্সালামুআলাইকুম $clientName ভাই/আপা,\n\n'
        '$caseNo মামলার জন্য নিচের কাগজপত্র দরকার:\n\n'
        '$docList\n\n'
        'যত দ্রুত সম্ভব সরবরাহ করুন।\n\n'
        '— আপনার আইনজীবী';
  }

  /// আদেশ হয়েছে
  static String orderPassed({
    required String clientName,
    required String caseNo,
    required String order,
    required String nextDate,
  }) {
    return 'আস্সালামুআলাইকুম $clientName ভাই/আপা,\n\n'
        'আজ $caseNo মামলায় আদালত আদেশ দিয়েছেন:\n\n'
        '📋 $order\n\n'
        'পরবর্তী তারিখ: 📅 $nextDate\n\n'
        'বিস্তারিত জানতে যোগাযোগ করুন।\n\n'
        '— আপনার আইনজীবী';
  }

  /// মামলা নিষ্পত্তি
  static String caseDisposed({
    required String clientName,
    required String caseNo,
    required String result,
  }) {
    return 'আস্সালামুআলাইকুম $clientName ভাই/আপা,\n\n'
        '✅ $caseNo মামলার চূড়ান্ত নিষ্পত্তি হয়েছে।\n\n'
        'ফলাফল: $result\n\n'
        'বিস্তারিত জানতে যোগাযোগ করুন।\n\n'
        '— আপনার আইনজীবী';
  }

  /// Send via WhatsApp deep-link
  static Future<void> send({
    required String phone,
    required String message,
  }) async {
    final encoded = Uri.encodeComponent(message);
    final clean   = phone.replaceAll(RegExp(r'[^0-9+]'), '');
    final url     = Uri.parse('https://wa.me/$clean?text=$encoded');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    }
  }
}
