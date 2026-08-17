import 'package:equatable/equatable.dart';

enum FeeType {
  feeAgreed,       // ওকালতনামা ফি (চুক্তি)
  received,        // আদায়
  expenseCourtFee, // কোর্ট ফি (খরচ)
  expenseStamp,    // স্ট্যাম্প খরচ
  expenseOther,    // অন্যান্য খরচ
}

class FeeModel extends Equatable {
  final String   id;
  final String   caseId;
  final String   chamberId;
  final FeeType  type;
  final double   amount;
  final DateTime date;
  final String?  method;     // নগদ / bKash / ব্যাংক
  final String?  note;
  final String?  receiptNo;
  final DateTime createdAt;

  const FeeModel({
    required this.id,
    required this.caseId,
    required this.chamberId,
    required this.type,
    required this.amount,
    required this.date,
    this.method,
    this.note,
    this.receiptNo,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id];
}
