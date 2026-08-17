import 'package:equatable/equatable.dart';

enum CaseStatus  { active, closed }
enum CourtType   { judgesCourt, highCourt, supremeCourt, tribunal, districtCourt }
enum OnBehalf    { plaintiff, defendant, petitioner, respondent, appellant }
enum CaseStage   { filing, summons, writtenStatement, issue, preliminary, evidence, argument, judgment, execution, appeal }
enum Priority    { high, medium, low }

/// All possible hearing outcome values (used in OutcomeSheet chip grid)
const List<String> kOutcomeChips = [
  'হাজিরা', 'সময়ের আরজি', 'সাক্ষ্য গ্রহণ', 'জেরা',
  'যুক্তিতর্ক', 'আদেশ', 'নথি তলব', 'স্থগিত', 'নিষ্পত্তি',
];

/// Domain model — persistence-agnostic, used across UI and sync
class CaseModel extends Equatable {
  final String   id;
  final String   chamberId;         // multi-tenancy (MUST exist from day 1)
  final String   caseNo;
  final int?     caseYear;
  final CourtType court;
  final String?  courtName;         // "যুগ্ম জেলা জজ ২য় আদালত, বগুড়া"
  final String?  courtRoom;
  final String?  judgeName;
  final String   caseType;          // দেওয়ানী / ফৌজদারী / রিট / আপিল
  final String?  actsSections;      // "দ.বি. ৩০২ / N.I. Act ১৩৮"
  final String?  policeStation;     // for GR/CR cases
  final OnBehalf onBehalf;
  final CaseStage? stage;
  final Priority priority;
  final CaseStatus status;
  final String?  clientId;
  final DateTime? filingDate;
  final DateTime? nextDate;
  final String?  lastOutcome;
  final int?     deadlineDaysRemaining; // computed by LimitationEngine
  final DateTime updatedAt;
  final DateTime? deletedAt;        // SOFT DELETE ONLY — never hard delete
  final int      rev;               // monotonic revision for sync

  const CaseModel({
    required this.id,
    required this.chamberId,
    required this.caseNo,
    this.caseYear,
    required this.court,
    this.courtName,
    this.courtRoom,
    this.judgeName,
    required this.caseType,
    this.actsSections,
    this.policeStation,
    required this.onBehalf,
    this.stage,
    this.priority = Priority.medium,
    this.status = CaseStatus.active,
    this.clientId,
    this.filingDate,
    this.nextDate,
    this.lastOutcome,
    this.deadlineDaysRemaining,
    required this.updatedAt,
    this.deletedAt,
    this.rev = 0,
  });

  bool get isActive         => status == CaseStatus.active && deletedAt == null;
  bool get isUrgentDeadline => deadlineDaysRemaining != null && deadlineDaysRemaining! <= 7;
  bool get isToday {
    if (nextDate == null) return false;
    final now = DateTime.now();
    return nextDate!.year == now.year &&
           nextDate!.month == now.month &&
           nextDate!.day == now.day;
  }

  @override
  List<Object?> get props => [id, rev, updatedAt];
}
