import 'package:equatable/equatable.dart';

/// A Hearing is the core entity — not a derived view.
/// Each court appearance = one Hearing row.
class HearingModel extends Equatable {
  final String  id;
  final String  caseId;
  final String  chamberId;
  final DateTime date;
  final String? purpose;          // "সাক্ষ্য গ্রহণ"
  final String? outcome;          // chip value from kOutcomeChips
  final String? note;             // বাংলা নোট (append-only → no sync conflict)
  final String? voiceNotePath;    // local path to audio note
  final bool    attended;
  final String? appearingUserId;  // who appeared (for chamber/clerk scenario)
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final int     rev;

  const HearingModel({
    required this.id,
    required this.caseId,
    required this.chamberId,
    required this.date,
    this.purpose,
    this.outcome,
    this.note,
    this.voiceNotePath,
    this.attended = false,
    this.appearingUserId,
    required this.updatedAt,
    this.deletedAt,
    this.rev = 0,
  });

  @override
  List<Object?> get props => [id, rev];
}
