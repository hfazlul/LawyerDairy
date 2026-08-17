import 'package:equatable/equatable.dart';

class ClientModel extends Equatable {
  final String  id;
  final String  chamberId;
  final String  name;
  final String? phone;
  final String? altPhone;
  final String? email;
  final String? nid;
  final String? address;
  final String? fileNo;
  final String? note;
  final DateTime createdAt;
  final DateTime? deletedAt;

  const ClientModel({
    required this.id,
    required this.chamberId,
    required this.name,
    this.phone,
    this.altPhone,
    this.email,
    this.nid,
    this.address,
    this.fileNo,
    this.note,
    required this.createdAt,
    this.deletedAt,
  });

  @override
  List<Object?> get props => [id];
}
