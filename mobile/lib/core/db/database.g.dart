// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'database.dart';

// ignore_for_file: type=lint
class $CasesTable extends Cases with TableInfo<$CasesTable, Case> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CasesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chamberIdMeta =
      const VerificationMeta('chamberId');
  @override
  late final GeneratedColumn<String> chamberId = GeneratedColumn<String>(
      'chamber_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _caseNoMeta = const VerificationMeta('caseNo');
  @override
  late final GeneratedColumn<String> caseNo = GeneratedColumn<String>(
      'case_no', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _caseYearMeta =
      const VerificationMeta('caseYear');
  @override
  late final GeneratedColumn<int> caseYear = GeneratedColumn<int>(
      'case_year', aliasedName, true,
      type: DriftSqlType.int, requiredDuringInsert: false);
  static const VerificationMeta _courtMeta = const VerificationMeta('court');
  @override
  late final GeneratedColumn<String> court = GeneratedColumn<String>(
      'court', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _courtNameMeta =
      const VerificationMeta('courtName');
  @override
  late final GeneratedColumn<String> courtName = GeneratedColumn<String>(
      'court_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _courtRoomMeta =
      const VerificationMeta('courtRoom');
  @override
  late final GeneratedColumn<String> courtRoom = GeneratedColumn<String>(
      'court_room', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _judgeNameMeta =
      const VerificationMeta('judgeName');
  @override
  late final GeneratedColumn<String> judgeName = GeneratedColumn<String>(
      'judge_name', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _caseTypeMeta =
      const VerificationMeta('caseType');
  @override
  late final GeneratedColumn<String> caseType = GeneratedColumn<String>(
      'case_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _actsSectionsMeta =
      const VerificationMeta('actsSections');
  @override
  late final GeneratedColumn<String> actsSections = GeneratedColumn<String>(
      'acts_sections', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _policeStationMeta =
      const VerificationMeta('policeStation');
  @override
  late final GeneratedColumn<String> policeStation = GeneratedColumn<String>(
      'police_station', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _onBehalfMeta =
      const VerificationMeta('onBehalf');
  @override
  late final GeneratedColumn<String> onBehalf = GeneratedColumn<String>(
      'on_behalf', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _stageMeta = const VerificationMeta('stage');
  @override
  late final GeneratedColumn<String> stage = GeneratedColumn<String>(
      'stage', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _priorityMeta =
      const VerificationMeta('priority');
  @override
  late final GeneratedColumn<String> priority = GeneratedColumn<String>(
      'priority', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('medium'));
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
      'status', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('active'));
  static const VerificationMeta _clientIdMeta =
      const VerificationMeta('clientId');
  @override
  late final GeneratedColumn<String> clientId = GeneratedColumn<String>(
      'client_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _filingDateMeta =
      const VerificationMeta('filingDate');
  @override
  late final GeneratedColumn<DateTime> filingDate = GeneratedColumn<DateTime>(
      'filing_date', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _nextDateMeta =
      const VerificationMeta('nextDate');
  @override
  late final GeneratedColumn<DateTime> nextDate = GeneratedColumn<DateTime>(
      'next_date', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  static const VerificationMeta _lastOutcomeMeta =
      const VerificationMeta('lastOutcome');
  @override
  late final GeneratedColumn<String> lastOutcome = GeneratedColumn<String>(
      'last_outcome', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _revMeta = const VerificationMeta('rev');
  @override
  late final GeneratedColumn<int> rev = GeneratedColumn<int>(
      'rev', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _deletedAtMeta =
      const VerificationMeta('deletedAt');
  @override
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
      'deleted_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        chamberId,
        caseNo,
        caseYear,
        court,
        courtName,
        courtRoom,
        judgeName,
        caseType,
        actsSections,
        policeStation,
        onBehalf,
        stage,
        priority,
        status,
        clientId,
        filingDate,
        nextDate,
        lastOutcome,
        rev,
        updatedAt,
        deletedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cases';
  @override
  VerificationContext validateIntegrity(Insertable<Case> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('chamber_id')) {
      context.handle(_chamberIdMeta,
          chamberId.isAcceptableOrUnknown(data['chamber_id']!, _chamberIdMeta));
    } else if (isInserting) {
      context.missing(_chamberIdMeta);
    }
    if (data.containsKey('case_no')) {
      context.handle(_caseNoMeta,
          caseNo.isAcceptableOrUnknown(data['case_no']!, _caseNoMeta));
    } else if (isInserting) {
      context.missing(_caseNoMeta);
    }
    if (data.containsKey('case_year')) {
      context.handle(_caseYearMeta,
          caseYear.isAcceptableOrUnknown(data['case_year']!, _caseYearMeta));
    }
    if (data.containsKey('court')) {
      context.handle(
          _courtMeta, court.isAcceptableOrUnknown(data['court']!, _courtMeta));
    } else if (isInserting) {
      context.missing(_courtMeta);
    }
    if (data.containsKey('court_name')) {
      context.handle(_courtNameMeta,
          courtName.isAcceptableOrUnknown(data['court_name']!, _courtNameMeta));
    }
    if (data.containsKey('court_room')) {
      context.handle(_courtRoomMeta,
          courtRoom.isAcceptableOrUnknown(data['court_room']!, _courtRoomMeta));
    }
    if (data.containsKey('judge_name')) {
      context.handle(_judgeNameMeta,
          judgeName.isAcceptableOrUnknown(data['judge_name']!, _judgeNameMeta));
    }
    if (data.containsKey('case_type')) {
      context.handle(_caseTypeMeta,
          caseType.isAcceptableOrUnknown(data['case_type']!, _caseTypeMeta));
    } else if (isInserting) {
      context.missing(_caseTypeMeta);
    }
    if (data.containsKey('acts_sections')) {
      context.handle(
          _actsSectionsMeta,
          actsSections.isAcceptableOrUnknown(
              data['acts_sections']!, _actsSectionsMeta));
    }
    if (data.containsKey('police_station')) {
      context.handle(
          _policeStationMeta,
          policeStation.isAcceptableOrUnknown(
              data['police_station']!, _policeStationMeta));
    }
    if (data.containsKey('on_behalf')) {
      context.handle(_onBehalfMeta,
          onBehalf.isAcceptableOrUnknown(data['on_behalf']!, _onBehalfMeta));
    } else if (isInserting) {
      context.missing(_onBehalfMeta);
    }
    if (data.containsKey('stage')) {
      context.handle(
          _stageMeta, stage.isAcceptableOrUnknown(data['stage']!, _stageMeta));
    }
    if (data.containsKey('priority')) {
      context.handle(_priorityMeta,
          priority.isAcceptableOrUnknown(data['priority']!, _priorityMeta));
    }
    if (data.containsKey('status')) {
      context.handle(_statusMeta,
          status.isAcceptableOrUnknown(data['status']!, _statusMeta));
    }
    if (data.containsKey('client_id')) {
      context.handle(_clientIdMeta,
          clientId.isAcceptableOrUnknown(data['client_id']!, _clientIdMeta));
    }
    if (data.containsKey('filing_date')) {
      context.handle(
          _filingDateMeta,
          filingDate.isAcceptableOrUnknown(
              data['filing_date']!, _filingDateMeta));
    }
    if (data.containsKey('next_date')) {
      context.handle(_nextDateMeta,
          nextDate.isAcceptableOrUnknown(data['next_date']!, _nextDateMeta));
    }
    if (data.containsKey('last_outcome')) {
      context.handle(
          _lastOutcomeMeta,
          lastOutcome.isAcceptableOrUnknown(
              data['last_outcome']!, _lastOutcomeMeta));
    }
    if (data.containsKey('rev')) {
      context.handle(
          _revMeta, rev.isAcceptableOrUnknown(data['rev']!, _revMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Case map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Case(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      chamberId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chamber_id'])!,
      caseNo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}case_no'])!,
      caseYear: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}case_year']),
      court: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}court'])!,
      courtName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}court_name']),
      courtRoom: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}court_room']),
      judgeName: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}judge_name']),
      caseType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}case_type'])!,
      actsSections: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}acts_sections']),
      policeStation: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}police_station']),
      onBehalf: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}on_behalf'])!,
      stage: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}stage']),
      priority: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}priority'])!,
      status: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!,
      clientId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}client_id']),
      filingDate: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}filing_date']),
      nextDate: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}next_date']),
      lastOutcome: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}last_outcome']),
      rev: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}rev'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      deletedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
    );
  }

  @override
  $CasesTable createAlias(String alias) {
    return $CasesTable(attachedDatabase, alias);
  }
}

class Case extends DataClass implements Insertable<Case> {
  final String id;
  final String chamberId;
  final String caseNo;
  final int? caseYear;
  final String court;
  final String? courtName;
  final String? courtRoom;
  final String? judgeName;
  final String caseType;
  final String? actsSections;
  final String? policeStation;
  final String onBehalf;
  final String? stage;
  final String priority;
  final String status;
  final String? clientId;
  final DateTime? filingDate;
  final DateTime? nextDate;
  final String? lastOutcome;
  final int rev;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  const Case(
      {required this.id,
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
      required this.priority,
      required this.status,
      this.clientId,
      this.filingDate,
      this.nextDate,
      this.lastOutcome,
      required this.rev,
      required this.updatedAt,
      this.deletedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['chamber_id'] = Variable<String>(chamberId);
    map['case_no'] = Variable<String>(caseNo);
    if (!nullToAbsent || caseYear != null) {
      map['case_year'] = Variable<int>(caseYear);
    }
    map['court'] = Variable<String>(court);
    if (!nullToAbsent || courtName != null) {
      map['court_name'] = Variable<String>(courtName);
    }
    if (!nullToAbsent || courtRoom != null) {
      map['court_room'] = Variable<String>(courtRoom);
    }
    if (!nullToAbsent || judgeName != null) {
      map['judge_name'] = Variable<String>(judgeName);
    }
    map['case_type'] = Variable<String>(caseType);
    if (!nullToAbsent || actsSections != null) {
      map['acts_sections'] = Variable<String>(actsSections);
    }
    if (!nullToAbsent || policeStation != null) {
      map['police_station'] = Variable<String>(policeStation);
    }
    map['on_behalf'] = Variable<String>(onBehalf);
    if (!nullToAbsent || stage != null) {
      map['stage'] = Variable<String>(stage);
    }
    map['priority'] = Variable<String>(priority);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || clientId != null) {
      map['client_id'] = Variable<String>(clientId);
    }
    if (!nullToAbsent || filingDate != null) {
      map['filing_date'] = Variable<DateTime>(filingDate);
    }
    if (!nullToAbsent || nextDate != null) {
      map['next_date'] = Variable<DateTime>(nextDate);
    }
    if (!nullToAbsent || lastOutcome != null) {
      map['last_outcome'] = Variable<String>(lastOutcome);
    }
    map['rev'] = Variable<int>(rev);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    return map;
  }

  CasesCompanion toCompanion(bool nullToAbsent) {
    return CasesCompanion(
      id: Value(id),
      chamberId: Value(chamberId),
      caseNo: Value(caseNo),
      caseYear: caseYear == null && nullToAbsent
          ? const Value.absent()
          : Value(caseYear),
      court: Value(court),
      courtName: courtName == null && nullToAbsent
          ? const Value.absent()
          : Value(courtName),
      courtRoom: courtRoom == null && nullToAbsent
          ? const Value.absent()
          : Value(courtRoom),
      judgeName: judgeName == null && nullToAbsent
          ? const Value.absent()
          : Value(judgeName),
      caseType: Value(caseType),
      actsSections: actsSections == null && nullToAbsent
          ? const Value.absent()
          : Value(actsSections),
      policeStation: policeStation == null && nullToAbsent
          ? const Value.absent()
          : Value(policeStation),
      onBehalf: Value(onBehalf),
      stage:
          stage == null && nullToAbsent ? const Value.absent() : Value(stage),
      priority: Value(priority),
      status: Value(status),
      clientId: clientId == null && nullToAbsent
          ? const Value.absent()
          : Value(clientId),
      filingDate: filingDate == null && nullToAbsent
          ? const Value.absent()
          : Value(filingDate),
      nextDate: nextDate == null && nullToAbsent
          ? const Value.absent()
          : Value(nextDate),
      lastOutcome: lastOutcome == null && nullToAbsent
          ? const Value.absent()
          : Value(lastOutcome),
      rev: Value(rev),
      updatedAt: Value(updatedAt),
      deletedAt: deletedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(deletedAt),
    );
  }

  factory Case.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Case(
      id: serializer.fromJson<String>(json['id']),
      chamberId: serializer.fromJson<String>(json['chamberId']),
      caseNo: serializer.fromJson<String>(json['caseNo']),
      caseYear: serializer.fromJson<int?>(json['caseYear']),
      court: serializer.fromJson<String>(json['court']),
      courtName: serializer.fromJson<String?>(json['courtName']),
      courtRoom: serializer.fromJson<String?>(json['courtRoom']),
      judgeName: serializer.fromJson<String?>(json['judgeName']),
      caseType: serializer.fromJson<String>(json['caseType']),
      actsSections: serializer.fromJson<String?>(json['actsSections']),
      policeStation: serializer.fromJson<String?>(json['policeStation']),
      onBehalf: serializer.fromJson<String>(json['onBehalf']),
      stage: serializer.fromJson<String?>(json['stage']),
      priority: serializer.fromJson<String>(json['priority']),
      status: serializer.fromJson<String>(json['status']),
      clientId: serializer.fromJson<String?>(json['clientId']),
      filingDate: serializer.fromJson<DateTime?>(json['filingDate']),
      nextDate: serializer.fromJson<DateTime?>(json['nextDate']),
      lastOutcome: serializer.fromJson<String?>(json['lastOutcome']),
      rev: serializer.fromJson<int>(json['rev']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'chamberId': serializer.toJson<String>(chamberId),
      'caseNo': serializer.toJson<String>(caseNo),
      'caseYear': serializer.toJson<int?>(caseYear),
      'court': serializer.toJson<String>(court),
      'courtName': serializer.toJson<String?>(courtName),
      'courtRoom': serializer.toJson<String?>(courtRoom),
      'judgeName': serializer.toJson<String?>(judgeName),
      'caseType': serializer.toJson<String>(caseType),
      'actsSections': serializer.toJson<String?>(actsSections),
      'policeStation': serializer.toJson<String?>(policeStation),
      'onBehalf': serializer.toJson<String>(onBehalf),
      'stage': serializer.toJson<String?>(stage),
      'priority': serializer.toJson<String>(priority),
      'status': serializer.toJson<String>(status),
      'clientId': serializer.toJson<String?>(clientId),
      'filingDate': serializer.toJson<DateTime?>(filingDate),
      'nextDate': serializer.toJson<DateTime?>(nextDate),
      'lastOutcome': serializer.toJson<String?>(lastOutcome),
      'rev': serializer.toJson<int>(rev),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
    };
  }

  Case copyWith(
          {String? id,
          String? chamberId,
          String? caseNo,
          Value<int?> caseYear = const Value.absent(),
          String? court,
          Value<String?> courtName = const Value.absent(),
          Value<String?> courtRoom = const Value.absent(),
          Value<String?> judgeName = const Value.absent(),
          String? caseType,
          Value<String?> actsSections = const Value.absent(),
          Value<String?> policeStation = const Value.absent(),
          String? onBehalf,
          Value<String?> stage = const Value.absent(),
          String? priority,
          String? status,
          Value<String?> clientId = const Value.absent(),
          Value<DateTime?> filingDate = const Value.absent(),
          Value<DateTime?> nextDate = const Value.absent(),
          Value<String?> lastOutcome = const Value.absent(),
          int? rev,
          DateTime? updatedAt,
          Value<DateTime?> deletedAt = const Value.absent()}) =>
      Case(
        id: id ?? this.id,
        chamberId: chamberId ?? this.chamberId,
        caseNo: caseNo ?? this.caseNo,
        caseYear: caseYear.present ? caseYear.value : this.caseYear,
        court: court ?? this.court,
        courtName: courtName.present ? courtName.value : this.courtName,
        courtRoom: courtRoom.present ? courtRoom.value : this.courtRoom,
        judgeName: judgeName.present ? judgeName.value : this.judgeName,
        caseType: caseType ?? this.caseType,
        actsSections:
            actsSections.present ? actsSections.value : this.actsSections,
        policeStation:
            policeStation.present ? policeStation.value : this.policeStation,
        onBehalf: onBehalf ?? this.onBehalf,
        stage: stage.present ? stage.value : this.stage,
        priority: priority ?? this.priority,
        status: status ?? this.status,
        clientId: clientId.present ? clientId.value : this.clientId,
        filingDate: filingDate.present ? filingDate.value : this.filingDate,
        nextDate: nextDate.present ? nextDate.value : this.nextDate,
        lastOutcome: lastOutcome.present ? lastOutcome.value : this.lastOutcome,
        rev: rev ?? this.rev,
        updatedAt: updatedAt ?? this.updatedAt,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
      );
  Case copyWithCompanion(CasesCompanion data) {
    return Case(
      id: data.id.present ? data.id.value : this.id,
      chamberId: data.chamberId.present ? data.chamberId.value : this.chamberId,
      caseNo: data.caseNo.present ? data.caseNo.value : this.caseNo,
      caseYear: data.caseYear.present ? data.caseYear.value : this.caseYear,
      court: data.court.present ? data.court.value : this.court,
      courtName: data.courtName.present ? data.courtName.value : this.courtName,
      courtRoom: data.courtRoom.present ? data.courtRoom.value : this.courtRoom,
      judgeName: data.judgeName.present ? data.judgeName.value : this.judgeName,
      caseType: data.caseType.present ? data.caseType.value : this.caseType,
      actsSections: data.actsSections.present
          ? data.actsSections.value
          : this.actsSections,
      policeStation: data.policeStation.present
          ? data.policeStation.value
          : this.policeStation,
      onBehalf: data.onBehalf.present ? data.onBehalf.value : this.onBehalf,
      stage: data.stage.present ? data.stage.value : this.stage,
      priority: data.priority.present ? data.priority.value : this.priority,
      status: data.status.present ? data.status.value : this.status,
      clientId: data.clientId.present ? data.clientId.value : this.clientId,
      filingDate:
          data.filingDate.present ? data.filingDate.value : this.filingDate,
      nextDate: data.nextDate.present ? data.nextDate.value : this.nextDate,
      lastOutcome:
          data.lastOutcome.present ? data.lastOutcome.value : this.lastOutcome,
      rev: data.rev.present ? data.rev.value : this.rev,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Case(')
          ..write('id: $id, ')
          ..write('chamberId: $chamberId, ')
          ..write('caseNo: $caseNo, ')
          ..write('caseYear: $caseYear, ')
          ..write('court: $court, ')
          ..write('courtName: $courtName, ')
          ..write('courtRoom: $courtRoom, ')
          ..write('judgeName: $judgeName, ')
          ..write('caseType: $caseType, ')
          ..write('actsSections: $actsSections, ')
          ..write('policeStation: $policeStation, ')
          ..write('onBehalf: $onBehalf, ')
          ..write('stage: $stage, ')
          ..write('priority: $priority, ')
          ..write('status: $status, ')
          ..write('clientId: $clientId, ')
          ..write('filingDate: $filingDate, ')
          ..write('nextDate: $nextDate, ')
          ..write('lastOutcome: $lastOutcome, ')
          ..write('rev: $rev, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hashAll([
        id,
        chamberId,
        caseNo,
        caseYear,
        court,
        courtName,
        courtRoom,
        judgeName,
        caseType,
        actsSections,
        policeStation,
        onBehalf,
        stage,
        priority,
        status,
        clientId,
        filingDate,
        nextDate,
        lastOutcome,
        rev,
        updatedAt,
        deletedAt
      ]);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Case &&
          other.id == this.id &&
          other.chamberId == this.chamberId &&
          other.caseNo == this.caseNo &&
          other.caseYear == this.caseYear &&
          other.court == this.court &&
          other.courtName == this.courtName &&
          other.courtRoom == this.courtRoom &&
          other.judgeName == this.judgeName &&
          other.caseType == this.caseType &&
          other.actsSections == this.actsSections &&
          other.policeStation == this.policeStation &&
          other.onBehalf == this.onBehalf &&
          other.stage == this.stage &&
          other.priority == this.priority &&
          other.status == this.status &&
          other.clientId == this.clientId &&
          other.filingDate == this.filingDate &&
          other.nextDate == this.nextDate &&
          other.lastOutcome == this.lastOutcome &&
          other.rev == this.rev &&
          other.updatedAt == this.updatedAt &&
          other.deletedAt == this.deletedAt);
}

class CasesCompanion extends UpdateCompanion<Case> {
  final Value<String> id;
  final Value<String> chamberId;
  final Value<String> caseNo;
  final Value<int?> caseYear;
  final Value<String> court;
  final Value<String?> courtName;
  final Value<String?> courtRoom;
  final Value<String?> judgeName;
  final Value<String> caseType;
  final Value<String?> actsSections;
  final Value<String?> policeStation;
  final Value<String> onBehalf;
  final Value<String?> stage;
  final Value<String> priority;
  final Value<String> status;
  final Value<String?> clientId;
  final Value<DateTime?> filingDate;
  final Value<DateTime?> nextDate;
  final Value<String?> lastOutcome;
  final Value<int> rev;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> deletedAt;
  final Value<int> rowid;
  const CasesCompanion({
    this.id = const Value.absent(),
    this.chamberId = const Value.absent(),
    this.caseNo = const Value.absent(),
    this.caseYear = const Value.absent(),
    this.court = const Value.absent(),
    this.courtName = const Value.absent(),
    this.courtRoom = const Value.absent(),
    this.judgeName = const Value.absent(),
    this.caseType = const Value.absent(),
    this.actsSections = const Value.absent(),
    this.policeStation = const Value.absent(),
    this.onBehalf = const Value.absent(),
    this.stage = const Value.absent(),
    this.priority = const Value.absent(),
    this.status = const Value.absent(),
    this.clientId = const Value.absent(),
    this.filingDate = const Value.absent(),
    this.nextDate = const Value.absent(),
    this.lastOutcome = const Value.absent(),
    this.rev = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CasesCompanion.insert({
    required String id,
    required String chamberId,
    required String caseNo,
    this.caseYear = const Value.absent(),
    required String court,
    this.courtName = const Value.absent(),
    this.courtRoom = const Value.absent(),
    this.judgeName = const Value.absent(),
    required String caseType,
    this.actsSections = const Value.absent(),
    this.policeStation = const Value.absent(),
    required String onBehalf,
    this.stage = const Value.absent(),
    this.priority = const Value.absent(),
    this.status = const Value.absent(),
    this.clientId = const Value.absent(),
    this.filingDate = const Value.absent(),
    this.nextDate = const Value.absent(),
    this.lastOutcome = const Value.absent(),
    this.rev = const Value.absent(),
    required DateTime updatedAt,
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        chamberId = Value(chamberId),
        caseNo = Value(caseNo),
        court = Value(court),
        caseType = Value(caseType),
        onBehalf = Value(onBehalf),
        updatedAt = Value(updatedAt);
  static Insertable<Case> custom({
    Expression<String>? id,
    Expression<String>? chamberId,
    Expression<String>? caseNo,
    Expression<int>? caseYear,
    Expression<String>? court,
    Expression<String>? courtName,
    Expression<String>? courtRoom,
    Expression<String>? judgeName,
    Expression<String>? caseType,
    Expression<String>? actsSections,
    Expression<String>? policeStation,
    Expression<String>? onBehalf,
    Expression<String>? stage,
    Expression<String>? priority,
    Expression<String>? status,
    Expression<String>? clientId,
    Expression<DateTime>? filingDate,
    Expression<DateTime>? nextDate,
    Expression<String>? lastOutcome,
    Expression<int>? rev,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? deletedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (chamberId != null) 'chamber_id': chamberId,
      if (caseNo != null) 'case_no': caseNo,
      if (caseYear != null) 'case_year': caseYear,
      if (court != null) 'court': court,
      if (courtName != null) 'court_name': courtName,
      if (courtRoom != null) 'court_room': courtRoom,
      if (judgeName != null) 'judge_name': judgeName,
      if (caseType != null) 'case_type': caseType,
      if (actsSections != null) 'acts_sections': actsSections,
      if (policeStation != null) 'police_station': policeStation,
      if (onBehalf != null) 'on_behalf': onBehalf,
      if (stage != null) 'stage': stage,
      if (priority != null) 'priority': priority,
      if (status != null) 'status': status,
      if (clientId != null) 'client_id': clientId,
      if (filingDate != null) 'filing_date': filingDate,
      if (nextDate != null) 'next_date': nextDate,
      if (lastOutcome != null) 'last_outcome': lastOutcome,
      if (rev != null) 'rev': rev,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CasesCompanion copyWith(
      {Value<String>? id,
      Value<String>? chamberId,
      Value<String>? caseNo,
      Value<int?>? caseYear,
      Value<String>? court,
      Value<String?>? courtName,
      Value<String?>? courtRoom,
      Value<String?>? judgeName,
      Value<String>? caseType,
      Value<String?>? actsSections,
      Value<String?>? policeStation,
      Value<String>? onBehalf,
      Value<String?>? stage,
      Value<String>? priority,
      Value<String>? status,
      Value<String?>? clientId,
      Value<DateTime?>? filingDate,
      Value<DateTime?>? nextDate,
      Value<String?>? lastOutcome,
      Value<int>? rev,
      Value<DateTime>? updatedAt,
      Value<DateTime?>? deletedAt,
      Value<int>? rowid}) {
    return CasesCompanion(
      id: id ?? this.id,
      chamberId: chamberId ?? this.chamberId,
      caseNo: caseNo ?? this.caseNo,
      caseYear: caseYear ?? this.caseYear,
      court: court ?? this.court,
      courtName: courtName ?? this.courtName,
      courtRoom: courtRoom ?? this.courtRoom,
      judgeName: judgeName ?? this.judgeName,
      caseType: caseType ?? this.caseType,
      actsSections: actsSections ?? this.actsSections,
      policeStation: policeStation ?? this.policeStation,
      onBehalf: onBehalf ?? this.onBehalf,
      stage: stage ?? this.stage,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      clientId: clientId ?? this.clientId,
      filingDate: filingDate ?? this.filingDate,
      nextDate: nextDate ?? this.nextDate,
      lastOutcome: lastOutcome ?? this.lastOutcome,
      rev: rev ?? this.rev,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (chamberId.present) {
      map['chamber_id'] = Variable<String>(chamberId.value);
    }
    if (caseNo.present) {
      map['case_no'] = Variable<String>(caseNo.value);
    }
    if (caseYear.present) {
      map['case_year'] = Variable<int>(caseYear.value);
    }
    if (court.present) {
      map['court'] = Variable<String>(court.value);
    }
    if (courtName.present) {
      map['court_name'] = Variable<String>(courtName.value);
    }
    if (courtRoom.present) {
      map['court_room'] = Variable<String>(courtRoom.value);
    }
    if (judgeName.present) {
      map['judge_name'] = Variable<String>(judgeName.value);
    }
    if (caseType.present) {
      map['case_type'] = Variable<String>(caseType.value);
    }
    if (actsSections.present) {
      map['acts_sections'] = Variable<String>(actsSections.value);
    }
    if (policeStation.present) {
      map['police_station'] = Variable<String>(policeStation.value);
    }
    if (onBehalf.present) {
      map['on_behalf'] = Variable<String>(onBehalf.value);
    }
    if (stage.present) {
      map['stage'] = Variable<String>(stage.value);
    }
    if (priority.present) {
      map['priority'] = Variable<String>(priority.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (clientId.present) {
      map['client_id'] = Variable<String>(clientId.value);
    }
    if (filingDate.present) {
      map['filing_date'] = Variable<DateTime>(filingDate.value);
    }
    if (nextDate.present) {
      map['next_date'] = Variable<DateTime>(nextDate.value);
    }
    if (lastOutcome.present) {
      map['last_outcome'] = Variable<String>(lastOutcome.value);
    }
    if (rev.present) {
      map['rev'] = Variable<int>(rev.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CasesCompanion(')
          ..write('id: $id, ')
          ..write('chamberId: $chamberId, ')
          ..write('caseNo: $caseNo, ')
          ..write('caseYear: $caseYear, ')
          ..write('court: $court, ')
          ..write('courtName: $courtName, ')
          ..write('courtRoom: $courtRoom, ')
          ..write('judgeName: $judgeName, ')
          ..write('caseType: $caseType, ')
          ..write('actsSections: $actsSections, ')
          ..write('policeStation: $policeStation, ')
          ..write('onBehalf: $onBehalf, ')
          ..write('stage: $stage, ')
          ..write('priority: $priority, ')
          ..write('status: $status, ')
          ..write('clientId: $clientId, ')
          ..write('filingDate: $filingDate, ')
          ..write('nextDate: $nextDate, ')
          ..write('lastOutcome: $lastOutcome, ')
          ..write('rev: $rev, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $HearingsTable extends Hearings with TableInfo<$HearingsTable, Hearing> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $HearingsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _caseIdMeta = const VerificationMeta('caseId');
  @override
  late final GeneratedColumn<String> caseId = GeneratedColumn<String>(
      'case_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chamberIdMeta =
      const VerificationMeta('chamberId');
  @override
  late final GeneratedColumn<String> chamberId = GeneratedColumn<String>(
      'chamber_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _dateMeta = const VerificationMeta('date');
  @override
  late final GeneratedColumn<DateTime> date = GeneratedColumn<DateTime>(
      'date', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _purposeMeta =
      const VerificationMeta('purpose');
  @override
  late final GeneratedColumn<String> purpose = GeneratedColumn<String>(
      'purpose', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _outcomeMeta =
      const VerificationMeta('outcome');
  @override
  late final GeneratedColumn<String> outcome = GeneratedColumn<String>(
      'outcome', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _noteMeta = const VerificationMeta('note');
  @override
  late final GeneratedColumn<String> note = GeneratedColumn<String>(
      'note', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _voiceNotePathMeta =
      const VerificationMeta('voiceNotePath');
  @override
  late final GeneratedColumn<String> voiceNotePath = GeneratedColumn<String>(
      'voice_note_path', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _attendedMeta =
      const VerificationMeta('attended');
  @override
  late final GeneratedColumn<bool> attended = GeneratedColumn<bool>(
      'attended', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("attended" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _appearingUserIdMeta =
      const VerificationMeta('appearingUserId');
  @override
  late final GeneratedColumn<String> appearingUserId = GeneratedColumn<String>(
      'appearing_user_id', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _revMeta = const VerificationMeta('rev');
  @override
  late final GeneratedColumn<int> rev = GeneratedColumn<int>(
      'rev', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _updatedAtMeta =
      const VerificationMeta('updatedAt');
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
      'updated_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _deletedAtMeta =
      const VerificationMeta('deletedAt');
  @override
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
      'deleted_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        caseId,
        chamberId,
        date,
        purpose,
        outcome,
        note,
        voiceNotePath,
        attended,
        appearingUserId,
        rev,
        updatedAt,
        deletedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'hearings';
  @override
  VerificationContext validateIntegrity(Insertable<Hearing> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('case_id')) {
      context.handle(_caseIdMeta,
          caseId.isAcceptableOrUnknown(data['case_id']!, _caseIdMeta));
    } else if (isInserting) {
      context.missing(_caseIdMeta);
    }
    if (data.containsKey('chamber_id')) {
      context.handle(_chamberIdMeta,
          chamberId.isAcceptableOrUnknown(data['chamber_id']!, _chamberIdMeta));
    } else if (isInserting) {
      context.missing(_chamberIdMeta);
    }
    if (data.containsKey('date')) {
      context.handle(
          _dateMeta, date.isAcceptableOrUnknown(data['date']!, _dateMeta));
    } else if (isInserting) {
      context.missing(_dateMeta);
    }
    if (data.containsKey('purpose')) {
      context.handle(_purposeMeta,
          purpose.isAcceptableOrUnknown(data['purpose']!, _purposeMeta));
    }
    if (data.containsKey('outcome')) {
      context.handle(_outcomeMeta,
          outcome.isAcceptableOrUnknown(data['outcome']!, _outcomeMeta));
    }
    if (data.containsKey('note')) {
      context.handle(
          _noteMeta, note.isAcceptableOrUnknown(data['note']!, _noteMeta));
    }
    if (data.containsKey('voice_note_path')) {
      context.handle(
          _voiceNotePathMeta,
          voiceNotePath.isAcceptableOrUnknown(
              data['voice_note_path']!, _voiceNotePathMeta));
    }
    if (data.containsKey('attended')) {
      context.handle(_attendedMeta,
          attended.isAcceptableOrUnknown(data['attended']!, _attendedMeta));
    }
    if (data.containsKey('appearing_user_id')) {
      context.handle(
          _appearingUserIdMeta,
          appearingUserId.isAcceptableOrUnknown(
              data['appearing_user_id']!, _appearingUserIdMeta));
    }
    if (data.containsKey('rev')) {
      context.handle(
          _revMeta, rev.isAcceptableOrUnknown(data['rev']!, _revMeta));
    }
    if (data.containsKey('updated_at')) {
      context.handle(_updatedAtMeta,
          updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta));
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Hearing map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Hearing(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      caseId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}case_id'])!,
      chamberId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chamber_id'])!,
      date: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}date'])!,
      purpose: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}purpose']),
      outcome: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}outcome']),
      note: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}note']),
      voiceNotePath: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}voice_note_path']),
      attended: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}attended'])!,
      appearingUserId: attachedDatabase.typeMapping.read(
          DriftSqlType.string, data['${effectivePrefix}appearing_user_id']),
      rev: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}rev'])!,
      updatedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}updated_at'])!,
      deletedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
    );
  }

  @override
  $HearingsTable createAlias(String alias) {
    return $HearingsTable(attachedDatabase, alias);
  }
}

class Hearing extends DataClass implements Insertable<Hearing> {
  final String id;
  final String caseId;
  final String chamberId;
  final DateTime date;
  final String? purpose;
  final String? outcome;
  final String? note;
  final String? voiceNotePath;
  final bool attended;
  final String? appearingUserId;
  final int rev;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  const Hearing(
      {required this.id,
      required this.caseId,
      required this.chamberId,
      required this.date,
      this.purpose,
      this.outcome,
      this.note,
      this.voiceNotePath,
      required this.attended,
      this.appearingUserId,
      required this.rev,
      required this.updatedAt,
      this.deletedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['case_id'] = Variable<String>(caseId);
    map['chamber_id'] = Variable<String>(chamberId);
    map['date'] = Variable<DateTime>(date);
    if (!nullToAbsent || purpose != null) {
      map['purpose'] = Variable<String>(purpose);
    }
    if (!nullToAbsent || outcome != null) {
      map['outcome'] = Variable<String>(outcome);
    }
    if (!nullToAbsent || note != null) {
      map['note'] = Variable<String>(note);
    }
    if (!nullToAbsent || voiceNotePath != null) {
      map['voice_note_path'] = Variable<String>(voiceNotePath);
    }
    map['attended'] = Variable<bool>(attended);
    if (!nullToAbsent || appearingUserId != null) {
      map['appearing_user_id'] = Variable<String>(appearingUserId);
    }
    map['rev'] = Variable<int>(rev);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    return map;
  }

  HearingsCompanion toCompanion(bool nullToAbsent) {
    return HearingsCompanion(
      id: Value(id),
      caseId: Value(caseId),
      chamberId: Value(chamberId),
      date: Value(date),
      purpose: purpose == null && nullToAbsent
          ? const Value.absent()
          : Value(purpose),
      outcome: outcome == null && nullToAbsent
          ? const Value.absent()
          : Value(outcome),
      note: note == null && nullToAbsent ? const Value.absent() : Value(note),
      voiceNotePath: voiceNotePath == null && nullToAbsent
          ? const Value.absent()
          : Value(voiceNotePath),
      attended: Value(attended),
      appearingUserId: appearingUserId == null && nullToAbsent
          ? const Value.absent()
          : Value(appearingUserId),
      rev: Value(rev),
      updatedAt: Value(updatedAt),
      deletedAt: deletedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(deletedAt),
    );
  }

  factory Hearing.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Hearing(
      id: serializer.fromJson<String>(json['id']),
      caseId: serializer.fromJson<String>(json['caseId']),
      chamberId: serializer.fromJson<String>(json['chamberId']),
      date: serializer.fromJson<DateTime>(json['date']),
      purpose: serializer.fromJson<String?>(json['purpose']),
      outcome: serializer.fromJson<String?>(json['outcome']),
      note: serializer.fromJson<String?>(json['note']),
      voiceNotePath: serializer.fromJson<String?>(json['voiceNotePath']),
      attended: serializer.fromJson<bool>(json['attended']),
      appearingUserId: serializer.fromJson<String?>(json['appearingUserId']),
      rev: serializer.fromJson<int>(json['rev']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'caseId': serializer.toJson<String>(caseId),
      'chamberId': serializer.toJson<String>(chamberId),
      'date': serializer.toJson<DateTime>(date),
      'purpose': serializer.toJson<String?>(purpose),
      'outcome': serializer.toJson<String?>(outcome),
      'note': serializer.toJson<String?>(note),
      'voiceNotePath': serializer.toJson<String?>(voiceNotePath),
      'attended': serializer.toJson<bool>(attended),
      'appearingUserId': serializer.toJson<String?>(appearingUserId),
      'rev': serializer.toJson<int>(rev),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
    };
  }

  Hearing copyWith(
          {String? id,
          String? caseId,
          String? chamberId,
          DateTime? date,
          Value<String?> purpose = const Value.absent(),
          Value<String?> outcome = const Value.absent(),
          Value<String?> note = const Value.absent(),
          Value<String?> voiceNotePath = const Value.absent(),
          bool? attended,
          Value<String?> appearingUserId = const Value.absent(),
          int? rev,
          DateTime? updatedAt,
          Value<DateTime?> deletedAt = const Value.absent()}) =>
      Hearing(
        id: id ?? this.id,
        caseId: caseId ?? this.caseId,
        chamberId: chamberId ?? this.chamberId,
        date: date ?? this.date,
        purpose: purpose.present ? purpose.value : this.purpose,
        outcome: outcome.present ? outcome.value : this.outcome,
        note: note.present ? note.value : this.note,
        voiceNotePath:
            voiceNotePath.present ? voiceNotePath.value : this.voiceNotePath,
        attended: attended ?? this.attended,
        appearingUserId: appearingUserId.present
            ? appearingUserId.value
            : this.appearingUserId,
        rev: rev ?? this.rev,
        updatedAt: updatedAt ?? this.updatedAt,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
      );
  Hearing copyWithCompanion(HearingsCompanion data) {
    return Hearing(
      id: data.id.present ? data.id.value : this.id,
      caseId: data.caseId.present ? data.caseId.value : this.caseId,
      chamberId: data.chamberId.present ? data.chamberId.value : this.chamberId,
      date: data.date.present ? data.date.value : this.date,
      purpose: data.purpose.present ? data.purpose.value : this.purpose,
      outcome: data.outcome.present ? data.outcome.value : this.outcome,
      note: data.note.present ? data.note.value : this.note,
      voiceNotePath: data.voiceNotePath.present
          ? data.voiceNotePath.value
          : this.voiceNotePath,
      attended: data.attended.present ? data.attended.value : this.attended,
      appearingUserId: data.appearingUserId.present
          ? data.appearingUserId.value
          : this.appearingUserId,
      rev: data.rev.present ? data.rev.value : this.rev,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Hearing(')
          ..write('id: $id, ')
          ..write('caseId: $caseId, ')
          ..write('chamberId: $chamberId, ')
          ..write('date: $date, ')
          ..write('purpose: $purpose, ')
          ..write('outcome: $outcome, ')
          ..write('note: $note, ')
          ..write('voiceNotePath: $voiceNotePath, ')
          ..write('attended: $attended, ')
          ..write('appearingUserId: $appearingUserId, ')
          ..write('rev: $rev, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      caseId,
      chamberId,
      date,
      purpose,
      outcome,
      note,
      voiceNotePath,
      attended,
      appearingUserId,
      rev,
      updatedAt,
      deletedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Hearing &&
          other.id == this.id &&
          other.caseId == this.caseId &&
          other.chamberId == this.chamberId &&
          other.date == this.date &&
          other.purpose == this.purpose &&
          other.outcome == this.outcome &&
          other.note == this.note &&
          other.voiceNotePath == this.voiceNotePath &&
          other.attended == this.attended &&
          other.appearingUserId == this.appearingUserId &&
          other.rev == this.rev &&
          other.updatedAt == this.updatedAt &&
          other.deletedAt == this.deletedAt);
}

class HearingsCompanion extends UpdateCompanion<Hearing> {
  final Value<String> id;
  final Value<String> caseId;
  final Value<String> chamberId;
  final Value<DateTime> date;
  final Value<String?> purpose;
  final Value<String?> outcome;
  final Value<String?> note;
  final Value<String?> voiceNotePath;
  final Value<bool> attended;
  final Value<String?> appearingUserId;
  final Value<int> rev;
  final Value<DateTime> updatedAt;
  final Value<DateTime?> deletedAt;
  final Value<int> rowid;
  const HearingsCompanion({
    this.id = const Value.absent(),
    this.caseId = const Value.absent(),
    this.chamberId = const Value.absent(),
    this.date = const Value.absent(),
    this.purpose = const Value.absent(),
    this.outcome = const Value.absent(),
    this.note = const Value.absent(),
    this.voiceNotePath = const Value.absent(),
    this.attended = const Value.absent(),
    this.appearingUserId = const Value.absent(),
    this.rev = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  HearingsCompanion.insert({
    required String id,
    required String caseId,
    required String chamberId,
    required DateTime date,
    this.purpose = const Value.absent(),
    this.outcome = const Value.absent(),
    this.note = const Value.absent(),
    this.voiceNotePath = const Value.absent(),
    this.attended = const Value.absent(),
    this.appearingUserId = const Value.absent(),
    this.rev = const Value.absent(),
    required DateTime updatedAt,
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        caseId = Value(caseId),
        chamberId = Value(chamberId),
        date = Value(date),
        updatedAt = Value(updatedAt);
  static Insertable<Hearing> custom({
    Expression<String>? id,
    Expression<String>? caseId,
    Expression<String>? chamberId,
    Expression<DateTime>? date,
    Expression<String>? purpose,
    Expression<String>? outcome,
    Expression<String>? note,
    Expression<String>? voiceNotePath,
    Expression<bool>? attended,
    Expression<String>? appearingUserId,
    Expression<int>? rev,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? deletedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (caseId != null) 'case_id': caseId,
      if (chamberId != null) 'chamber_id': chamberId,
      if (date != null) 'date': date,
      if (purpose != null) 'purpose': purpose,
      if (outcome != null) 'outcome': outcome,
      if (note != null) 'note': note,
      if (voiceNotePath != null) 'voice_note_path': voiceNotePath,
      if (attended != null) 'attended': attended,
      if (appearingUserId != null) 'appearing_user_id': appearingUserId,
      if (rev != null) 'rev': rev,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  HearingsCompanion copyWith(
      {Value<String>? id,
      Value<String>? caseId,
      Value<String>? chamberId,
      Value<DateTime>? date,
      Value<String?>? purpose,
      Value<String?>? outcome,
      Value<String?>? note,
      Value<String?>? voiceNotePath,
      Value<bool>? attended,
      Value<String?>? appearingUserId,
      Value<int>? rev,
      Value<DateTime>? updatedAt,
      Value<DateTime?>? deletedAt,
      Value<int>? rowid}) {
    return HearingsCompanion(
      id: id ?? this.id,
      caseId: caseId ?? this.caseId,
      chamberId: chamberId ?? this.chamberId,
      date: date ?? this.date,
      purpose: purpose ?? this.purpose,
      outcome: outcome ?? this.outcome,
      note: note ?? this.note,
      voiceNotePath: voiceNotePath ?? this.voiceNotePath,
      attended: attended ?? this.attended,
      appearingUserId: appearingUserId ?? this.appearingUserId,
      rev: rev ?? this.rev,
      updatedAt: updatedAt ?? this.updatedAt,
      deletedAt: deletedAt ?? this.deletedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (caseId.present) {
      map['case_id'] = Variable<String>(caseId.value);
    }
    if (chamberId.present) {
      map['chamber_id'] = Variable<String>(chamberId.value);
    }
    if (date.present) {
      map['date'] = Variable<DateTime>(date.value);
    }
    if (purpose.present) {
      map['purpose'] = Variable<String>(purpose.value);
    }
    if (outcome.present) {
      map['outcome'] = Variable<String>(outcome.value);
    }
    if (note.present) {
      map['note'] = Variable<String>(note.value);
    }
    if (voiceNotePath.present) {
      map['voice_note_path'] = Variable<String>(voiceNotePath.value);
    }
    if (attended.present) {
      map['attended'] = Variable<bool>(attended.value);
    }
    if (appearingUserId.present) {
      map['appearing_user_id'] = Variable<String>(appearingUserId.value);
    }
    if (rev.present) {
      map['rev'] = Variable<int>(rev.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('HearingsCompanion(')
          ..write('id: $id, ')
          ..write('caseId: $caseId, ')
          ..write('chamberId: $chamberId, ')
          ..write('date: $date, ')
          ..write('purpose: $purpose, ')
          ..write('outcome: $outcome, ')
          ..write('note: $note, ')
          ..write('voiceNotePath: $voiceNotePath, ')
          ..write('attended: $attended, ')
          ..write('appearingUserId: $appearingUserId, ')
          ..write('rev: $rev, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ClientsTable extends Clients with TableInfo<$ClientsTable, Client> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ClientsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chamberIdMeta =
      const VerificationMeta('chamberId');
  @override
  late final GeneratedColumn<String> chamberId = GeneratedColumn<String>(
      'chamber_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
      'name', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
      'phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _altPhoneMeta =
      const VerificationMeta('altPhone');
  @override
  late final GeneratedColumn<String> altPhone = GeneratedColumn<String>(
      'alt_phone', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _emailMeta = const VerificationMeta('email');
  @override
  late final GeneratedColumn<String> email = GeneratedColumn<String>(
      'email', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _nidMeta = const VerificationMeta('nid');
  @override
  late final GeneratedColumn<String> nid = GeneratedColumn<String>(
      'nid', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _addressMeta =
      const VerificationMeta('address');
  @override
  late final GeneratedColumn<String> address = GeneratedColumn<String>(
      'address', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _fileNoMeta = const VerificationMeta('fileNo');
  @override
  late final GeneratedColumn<String> fileNo = GeneratedColumn<String>(
      'file_no', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _noteMeta = const VerificationMeta('note');
  @override
  late final GeneratedColumn<String> note = GeneratedColumn<String>(
      'note', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _deletedAtMeta =
      const VerificationMeta('deletedAt');
  @override
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
      'deleted_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        chamberId,
        name,
        phone,
        altPhone,
        email,
        nid,
        address,
        fileNo,
        note,
        createdAt,
        deletedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'clients';
  @override
  VerificationContext validateIntegrity(Insertable<Client> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('chamber_id')) {
      context.handle(_chamberIdMeta,
          chamberId.isAcceptableOrUnknown(data['chamber_id']!, _chamberIdMeta));
    } else if (isInserting) {
      context.missing(_chamberIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
          _nameMeta, name.isAcceptableOrUnknown(data['name']!, _nameMeta));
    } else if (isInserting) {
      context.missing(_nameMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
          _phoneMeta, phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta));
    }
    if (data.containsKey('alt_phone')) {
      context.handle(_altPhoneMeta,
          altPhone.isAcceptableOrUnknown(data['alt_phone']!, _altPhoneMeta));
    }
    if (data.containsKey('email')) {
      context.handle(
          _emailMeta, email.isAcceptableOrUnknown(data['email']!, _emailMeta));
    }
    if (data.containsKey('nid')) {
      context.handle(
          _nidMeta, nid.isAcceptableOrUnknown(data['nid']!, _nidMeta));
    }
    if (data.containsKey('address')) {
      context.handle(_addressMeta,
          address.isAcceptableOrUnknown(data['address']!, _addressMeta));
    }
    if (data.containsKey('file_no')) {
      context.handle(_fileNoMeta,
          fileNo.isAcceptableOrUnknown(data['file_no']!, _fileNoMeta));
    }
    if (data.containsKey('note')) {
      context.handle(
          _noteMeta, note.isAcceptableOrUnknown(data['note']!, _noteMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Client map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Client(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      chamberId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chamber_id'])!,
      name: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}name'])!,
      phone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}phone']),
      altPhone: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}alt_phone']),
      email: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}email']),
      nid: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}nid']),
      address: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}address']),
      fileNo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}file_no']),
      note: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}note']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      deletedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
    );
  }

  @override
  $ClientsTable createAlias(String alias) {
    return $ClientsTable(attachedDatabase, alias);
  }
}

class Client extends DataClass implements Insertable<Client> {
  final String id;
  final String chamberId;
  final String name;
  final String? phone;
  final String? altPhone;
  final String? email;
  final String? nid;
  final String? address;
  final String? fileNo;
  final String? note;
  final DateTime createdAt;
  final DateTime? deletedAt;
  const Client(
      {required this.id,
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
      this.deletedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['chamber_id'] = Variable<String>(chamberId);
    map['name'] = Variable<String>(name);
    if (!nullToAbsent || phone != null) {
      map['phone'] = Variable<String>(phone);
    }
    if (!nullToAbsent || altPhone != null) {
      map['alt_phone'] = Variable<String>(altPhone);
    }
    if (!nullToAbsent || email != null) {
      map['email'] = Variable<String>(email);
    }
    if (!nullToAbsent || nid != null) {
      map['nid'] = Variable<String>(nid);
    }
    if (!nullToAbsent || address != null) {
      map['address'] = Variable<String>(address);
    }
    if (!nullToAbsent || fileNo != null) {
      map['file_no'] = Variable<String>(fileNo);
    }
    if (!nullToAbsent || note != null) {
      map['note'] = Variable<String>(note);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    return map;
  }

  ClientsCompanion toCompanion(bool nullToAbsent) {
    return ClientsCompanion(
      id: Value(id),
      chamberId: Value(chamberId),
      name: Value(name),
      phone:
          phone == null && nullToAbsent ? const Value.absent() : Value(phone),
      altPhone: altPhone == null && nullToAbsent
          ? const Value.absent()
          : Value(altPhone),
      email:
          email == null && nullToAbsent ? const Value.absent() : Value(email),
      nid: nid == null && nullToAbsent ? const Value.absent() : Value(nid),
      address: address == null && nullToAbsent
          ? const Value.absent()
          : Value(address),
      fileNo:
          fileNo == null && nullToAbsent ? const Value.absent() : Value(fileNo),
      note: note == null && nullToAbsent ? const Value.absent() : Value(note),
      createdAt: Value(createdAt),
      deletedAt: deletedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(deletedAt),
    );
  }

  factory Client.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Client(
      id: serializer.fromJson<String>(json['id']),
      chamberId: serializer.fromJson<String>(json['chamberId']),
      name: serializer.fromJson<String>(json['name']),
      phone: serializer.fromJson<String?>(json['phone']),
      altPhone: serializer.fromJson<String?>(json['altPhone']),
      email: serializer.fromJson<String?>(json['email']),
      nid: serializer.fromJson<String?>(json['nid']),
      address: serializer.fromJson<String?>(json['address']),
      fileNo: serializer.fromJson<String?>(json['fileNo']),
      note: serializer.fromJson<String?>(json['note']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'chamberId': serializer.toJson<String>(chamberId),
      'name': serializer.toJson<String>(name),
      'phone': serializer.toJson<String?>(phone),
      'altPhone': serializer.toJson<String?>(altPhone),
      'email': serializer.toJson<String?>(email),
      'nid': serializer.toJson<String?>(nid),
      'address': serializer.toJson<String?>(address),
      'fileNo': serializer.toJson<String?>(fileNo),
      'note': serializer.toJson<String?>(note),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
    };
  }

  Client copyWith(
          {String? id,
          String? chamberId,
          String? name,
          Value<String?> phone = const Value.absent(),
          Value<String?> altPhone = const Value.absent(),
          Value<String?> email = const Value.absent(),
          Value<String?> nid = const Value.absent(),
          Value<String?> address = const Value.absent(),
          Value<String?> fileNo = const Value.absent(),
          Value<String?> note = const Value.absent(),
          DateTime? createdAt,
          Value<DateTime?> deletedAt = const Value.absent()}) =>
      Client(
        id: id ?? this.id,
        chamberId: chamberId ?? this.chamberId,
        name: name ?? this.name,
        phone: phone.present ? phone.value : this.phone,
        altPhone: altPhone.present ? altPhone.value : this.altPhone,
        email: email.present ? email.value : this.email,
        nid: nid.present ? nid.value : this.nid,
        address: address.present ? address.value : this.address,
        fileNo: fileNo.present ? fileNo.value : this.fileNo,
        note: note.present ? note.value : this.note,
        createdAt: createdAt ?? this.createdAt,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
      );
  Client copyWithCompanion(ClientsCompanion data) {
    return Client(
      id: data.id.present ? data.id.value : this.id,
      chamberId: data.chamberId.present ? data.chamberId.value : this.chamberId,
      name: data.name.present ? data.name.value : this.name,
      phone: data.phone.present ? data.phone.value : this.phone,
      altPhone: data.altPhone.present ? data.altPhone.value : this.altPhone,
      email: data.email.present ? data.email.value : this.email,
      nid: data.nid.present ? data.nid.value : this.nid,
      address: data.address.present ? data.address.value : this.address,
      fileNo: data.fileNo.present ? data.fileNo.value : this.fileNo,
      note: data.note.present ? data.note.value : this.note,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Client(')
          ..write('id: $id, ')
          ..write('chamberId: $chamberId, ')
          ..write('name: $name, ')
          ..write('phone: $phone, ')
          ..write('altPhone: $altPhone, ')
          ..write('email: $email, ')
          ..write('nid: $nid, ')
          ..write('address: $address, ')
          ..write('fileNo: $fileNo, ')
          ..write('note: $note, ')
          ..write('createdAt: $createdAt, ')
          ..write('deletedAt: $deletedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, chamberId, name, phone, altPhone, email,
      nid, address, fileNo, note, createdAt, deletedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Client &&
          other.id == this.id &&
          other.chamberId == this.chamberId &&
          other.name == this.name &&
          other.phone == this.phone &&
          other.altPhone == this.altPhone &&
          other.email == this.email &&
          other.nid == this.nid &&
          other.address == this.address &&
          other.fileNo == this.fileNo &&
          other.note == this.note &&
          other.createdAt == this.createdAt &&
          other.deletedAt == this.deletedAt);
}

class ClientsCompanion extends UpdateCompanion<Client> {
  final Value<String> id;
  final Value<String> chamberId;
  final Value<String> name;
  final Value<String?> phone;
  final Value<String?> altPhone;
  final Value<String?> email;
  final Value<String?> nid;
  final Value<String?> address;
  final Value<String?> fileNo;
  final Value<String?> note;
  final Value<DateTime> createdAt;
  final Value<DateTime?> deletedAt;
  final Value<int> rowid;
  const ClientsCompanion({
    this.id = const Value.absent(),
    this.chamberId = const Value.absent(),
    this.name = const Value.absent(),
    this.phone = const Value.absent(),
    this.altPhone = const Value.absent(),
    this.email = const Value.absent(),
    this.nid = const Value.absent(),
    this.address = const Value.absent(),
    this.fileNo = const Value.absent(),
    this.note = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ClientsCompanion.insert({
    required String id,
    required String chamberId,
    required String name,
    this.phone = const Value.absent(),
    this.altPhone = const Value.absent(),
    this.email = const Value.absent(),
    this.nid = const Value.absent(),
    this.address = const Value.absent(),
    this.fileNo = const Value.absent(),
    this.note = const Value.absent(),
    required DateTime createdAt,
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        chamberId = Value(chamberId),
        name = Value(name),
        createdAt = Value(createdAt);
  static Insertable<Client> custom({
    Expression<String>? id,
    Expression<String>? chamberId,
    Expression<String>? name,
    Expression<String>? phone,
    Expression<String>? altPhone,
    Expression<String>? email,
    Expression<String>? nid,
    Expression<String>? address,
    Expression<String>? fileNo,
    Expression<String>? note,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? deletedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (chamberId != null) 'chamber_id': chamberId,
      if (name != null) 'name': name,
      if (phone != null) 'phone': phone,
      if (altPhone != null) 'alt_phone': altPhone,
      if (email != null) 'email': email,
      if (nid != null) 'nid': nid,
      if (address != null) 'address': address,
      if (fileNo != null) 'file_no': fileNo,
      if (note != null) 'note': note,
      if (createdAt != null) 'created_at': createdAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ClientsCompanion copyWith(
      {Value<String>? id,
      Value<String>? chamberId,
      Value<String>? name,
      Value<String?>? phone,
      Value<String?>? altPhone,
      Value<String?>? email,
      Value<String?>? nid,
      Value<String?>? address,
      Value<String?>? fileNo,
      Value<String?>? note,
      Value<DateTime>? createdAt,
      Value<DateTime?>? deletedAt,
      Value<int>? rowid}) {
    return ClientsCompanion(
      id: id ?? this.id,
      chamberId: chamberId ?? this.chamberId,
      name: name ?? this.name,
      phone: phone ?? this.phone,
      altPhone: altPhone ?? this.altPhone,
      email: email ?? this.email,
      nid: nid ?? this.nid,
      address: address ?? this.address,
      fileNo: fileNo ?? this.fileNo,
      note: note ?? this.note,
      createdAt: createdAt ?? this.createdAt,
      deletedAt: deletedAt ?? this.deletedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (chamberId.present) {
      map['chamber_id'] = Variable<String>(chamberId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (altPhone.present) {
      map['alt_phone'] = Variable<String>(altPhone.value);
    }
    if (email.present) {
      map['email'] = Variable<String>(email.value);
    }
    if (nid.present) {
      map['nid'] = Variable<String>(nid.value);
    }
    if (address.present) {
      map['address'] = Variable<String>(address.value);
    }
    if (fileNo.present) {
      map['file_no'] = Variable<String>(fileNo.value);
    }
    if (note.present) {
      map['note'] = Variable<String>(note.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ClientsCompanion(')
          ..write('id: $id, ')
          ..write('chamberId: $chamberId, ')
          ..write('name: $name, ')
          ..write('phone: $phone, ')
          ..write('altPhone: $altPhone, ')
          ..write('email: $email, ')
          ..write('nid: $nid, ')
          ..write('address: $address, ')
          ..write('fileNo: $fileNo, ')
          ..write('note: $note, ')
          ..write('createdAt: $createdAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $FeeEntriesTable extends FeeEntries
    with TableInfo<$FeeEntriesTable, FeeEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $FeeEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _caseIdMeta = const VerificationMeta('caseId');
  @override
  late final GeneratedColumn<String> caseId = GeneratedColumn<String>(
      'case_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chamberIdMeta =
      const VerificationMeta('chamberId');
  @override
  late final GeneratedColumn<String> chamberId = GeneratedColumn<String>(
      'chamber_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _typeMeta = const VerificationMeta('type');
  @override
  late final GeneratedColumn<String> type = GeneratedColumn<String>(
      'type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _amountMeta = const VerificationMeta('amount');
  @override
  late final GeneratedColumn<double> amount = GeneratedColumn<double>(
      'amount', aliasedName, false,
      type: DriftSqlType.double, requiredDuringInsert: true);
  static const VerificationMeta _dateMeta = const VerificationMeta('date');
  @override
  late final GeneratedColumn<DateTime> date = GeneratedColumn<DateTime>(
      'date', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _methodMeta = const VerificationMeta('method');
  @override
  late final GeneratedColumn<String> method = GeneratedColumn<String>(
      'method', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _noteMeta = const VerificationMeta('note');
  @override
  late final GeneratedColumn<String> note = GeneratedColumn<String>(
      'note', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _receiptNoMeta =
      const VerificationMeta('receiptNo');
  @override
  late final GeneratedColumn<String> receiptNo = GeneratedColumn<String>(
      'receipt_no', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        caseId,
        chamberId,
        type,
        amount,
        date,
        method,
        note,
        receiptNo,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'fee_entries';
  @override
  VerificationContext validateIntegrity(Insertable<FeeEntry> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('case_id')) {
      context.handle(_caseIdMeta,
          caseId.isAcceptableOrUnknown(data['case_id']!, _caseIdMeta));
    } else if (isInserting) {
      context.missing(_caseIdMeta);
    }
    if (data.containsKey('chamber_id')) {
      context.handle(_chamberIdMeta,
          chamberId.isAcceptableOrUnknown(data['chamber_id']!, _chamberIdMeta));
    } else if (isInserting) {
      context.missing(_chamberIdMeta);
    }
    if (data.containsKey('type')) {
      context.handle(
          _typeMeta, type.isAcceptableOrUnknown(data['type']!, _typeMeta));
    } else if (isInserting) {
      context.missing(_typeMeta);
    }
    if (data.containsKey('amount')) {
      context.handle(_amountMeta,
          amount.isAcceptableOrUnknown(data['amount']!, _amountMeta));
    } else if (isInserting) {
      context.missing(_amountMeta);
    }
    if (data.containsKey('date')) {
      context.handle(
          _dateMeta, date.isAcceptableOrUnknown(data['date']!, _dateMeta));
    } else if (isInserting) {
      context.missing(_dateMeta);
    }
    if (data.containsKey('method')) {
      context.handle(_methodMeta,
          method.isAcceptableOrUnknown(data['method']!, _methodMeta));
    }
    if (data.containsKey('note')) {
      context.handle(
          _noteMeta, note.isAcceptableOrUnknown(data['note']!, _noteMeta));
    }
    if (data.containsKey('receipt_no')) {
      context.handle(_receiptNoMeta,
          receiptNo.isAcceptableOrUnknown(data['receipt_no']!, _receiptNoMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  FeeEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return FeeEntry(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      caseId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}case_id'])!,
      chamberId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chamber_id'])!,
      type: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}type'])!,
      amount: attachedDatabase.typeMapping
          .read(DriftSqlType.double, data['${effectivePrefix}amount'])!,
      date: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}date'])!,
      method: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}method']),
      note: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}note']),
      receiptNo: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}receipt_no']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $FeeEntriesTable createAlias(String alias) {
    return $FeeEntriesTable(attachedDatabase, alias);
  }
}

class FeeEntry extends DataClass implements Insertable<FeeEntry> {
  final String id;
  final String caseId;
  final String chamberId;
  final String type;
  final double amount;
  final DateTime date;
  final String? method;
  final String? note;
  final String? receiptNo;
  final DateTime createdAt;
  const FeeEntry(
      {required this.id,
      required this.caseId,
      required this.chamberId,
      required this.type,
      required this.amount,
      required this.date,
      this.method,
      this.note,
      this.receiptNo,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['case_id'] = Variable<String>(caseId);
    map['chamber_id'] = Variable<String>(chamberId);
    map['type'] = Variable<String>(type);
    map['amount'] = Variable<double>(amount);
    map['date'] = Variable<DateTime>(date);
    if (!nullToAbsent || method != null) {
      map['method'] = Variable<String>(method);
    }
    if (!nullToAbsent || note != null) {
      map['note'] = Variable<String>(note);
    }
    if (!nullToAbsent || receiptNo != null) {
      map['receipt_no'] = Variable<String>(receiptNo);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  FeeEntriesCompanion toCompanion(bool nullToAbsent) {
    return FeeEntriesCompanion(
      id: Value(id),
      caseId: Value(caseId),
      chamberId: Value(chamberId),
      type: Value(type),
      amount: Value(amount),
      date: Value(date),
      method:
          method == null && nullToAbsent ? const Value.absent() : Value(method),
      note: note == null && nullToAbsent ? const Value.absent() : Value(note),
      receiptNo: receiptNo == null && nullToAbsent
          ? const Value.absent()
          : Value(receiptNo),
      createdAt: Value(createdAt),
    );
  }

  factory FeeEntry.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return FeeEntry(
      id: serializer.fromJson<String>(json['id']),
      caseId: serializer.fromJson<String>(json['caseId']),
      chamberId: serializer.fromJson<String>(json['chamberId']),
      type: serializer.fromJson<String>(json['type']),
      amount: serializer.fromJson<double>(json['amount']),
      date: serializer.fromJson<DateTime>(json['date']),
      method: serializer.fromJson<String?>(json['method']),
      note: serializer.fromJson<String?>(json['note']),
      receiptNo: serializer.fromJson<String?>(json['receiptNo']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'caseId': serializer.toJson<String>(caseId),
      'chamberId': serializer.toJson<String>(chamberId),
      'type': serializer.toJson<String>(type),
      'amount': serializer.toJson<double>(amount),
      'date': serializer.toJson<DateTime>(date),
      'method': serializer.toJson<String?>(method),
      'note': serializer.toJson<String?>(note),
      'receiptNo': serializer.toJson<String?>(receiptNo),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  FeeEntry copyWith(
          {String? id,
          String? caseId,
          String? chamberId,
          String? type,
          double? amount,
          DateTime? date,
          Value<String?> method = const Value.absent(),
          Value<String?> note = const Value.absent(),
          Value<String?> receiptNo = const Value.absent(),
          DateTime? createdAt}) =>
      FeeEntry(
        id: id ?? this.id,
        caseId: caseId ?? this.caseId,
        chamberId: chamberId ?? this.chamberId,
        type: type ?? this.type,
        amount: amount ?? this.amount,
        date: date ?? this.date,
        method: method.present ? method.value : this.method,
        note: note.present ? note.value : this.note,
        receiptNo: receiptNo.present ? receiptNo.value : this.receiptNo,
        createdAt: createdAt ?? this.createdAt,
      );
  FeeEntry copyWithCompanion(FeeEntriesCompanion data) {
    return FeeEntry(
      id: data.id.present ? data.id.value : this.id,
      caseId: data.caseId.present ? data.caseId.value : this.caseId,
      chamberId: data.chamberId.present ? data.chamberId.value : this.chamberId,
      type: data.type.present ? data.type.value : this.type,
      amount: data.amount.present ? data.amount.value : this.amount,
      date: data.date.present ? data.date.value : this.date,
      method: data.method.present ? data.method.value : this.method,
      note: data.note.present ? data.note.value : this.note,
      receiptNo: data.receiptNo.present ? data.receiptNo.value : this.receiptNo,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('FeeEntry(')
          ..write('id: $id, ')
          ..write('caseId: $caseId, ')
          ..write('chamberId: $chamberId, ')
          ..write('type: $type, ')
          ..write('amount: $amount, ')
          ..write('date: $date, ')
          ..write('method: $method, ')
          ..write('note: $note, ')
          ..write('receiptNo: $receiptNo, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, caseId, chamberId, type, amount, date,
      method, note, receiptNo, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is FeeEntry &&
          other.id == this.id &&
          other.caseId == this.caseId &&
          other.chamberId == this.chamberId &&
          other.type == this.type &&
          other.amount == this.amount &&
          other.date == this.date &&
          other.method == this.method &&
          other.note == this.note &&
          other.receiptNo == this.receiptNo &&
          other.createdAt == this.createdAt);
}

class FeeEntriesCompanion extends UpdateCompanion<FeeEntry> {
  final Value<String> id;
  final Value<String> caseId;
  final Value<String> chamberId;
  final Value<String> type;
  final Value<double> amount;
  final Value<DateTime> date;
  final Value<String?> method;
  final Value<String?> note;
  final Value<String?> receiptNo;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const FeeEntriesCompanion({
    this.id = const Value.absent(),
    this.caseId = const Value.absent(),
    this.chamberId = const Value.absent(),
    this.type = const Value.absent(),
    this.amount = const Value.absent(),
    this.date = const Value.absent(),
    this.method = const Value.absent(),
    this.note = const Value.absent(),
    this.receiptNo = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  FeeEntriesCompanion.insert({
    required String id,
    required String caseId,
    required String chamberId,
    required String type,
    required double amount,
    required DateTime date,
    this.method = const Value.absent(),
    this.note = const Value.absent(),
    this.receiptNo = const Value.absent(),
    required DateTime createdAt,
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        caseId = Value(caseId),
        chamberId = Value(chamberId),
        type = Value(type),
        amount = Value(amount),
        date = Value(date),
        createdAt = Value(createdAt);
  static Insertable<FeeEntry> custom({
    Expression<String>? id,
    Expression<String>? caseId,
    Expression<String>? chamberId,
    Expression<String>? type,
    Expression<double>? amount,
    Expression<DateTime>? date,
    Expression<String>? method,
    Expression<String>? note,
    Expression<String>? receiptNo,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (caseId != null) 'case_id': caseId,
      if (chamberId != null) 'chamber_id': chamberId,
      if (type != null) 'type': type,
      if (amount != null) 'amount': amount,
      if (date != null) 'date': date,
      if (method != null) 'method': method,
      if (note != null) 'note': note,
      if (receiptNo != null) 'receipt_no': receiptNo,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  FeeEntriesCompanion copyWith(
      {Value<String>? id,
      Value<String>? caseId,
      Value<String>? chamberId,
      Value<String>? type,
      Value<double>? amount,
      Value<DateTime>? date,
      Value<String?>? method,
      Value<String?>? note,
      Value<String?>? receiptNo,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return FeeEntriesCompanion(
      id: id ?? this.id,
      caseId: caseId ?? this.caseId,
      chamberId: chamberId ?? this.chamberId,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      date: date ?? this.date,
      method: method ?? this.method,
      note: note ?? this.note,
      receiptNo: receiptNo ?? this.receiptNo,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (caseId.present) {
      map['case_id'] = Variable<String>(caseId.value);
    }
    if (chamberId.present) {
      map['chamber_id'] = Variable<String>(chamberId.value);
    }
    if (type.present) {
      map['type'] = Variable<String>(type.value);
    }
    if (amount.present) {
      map['amount'] = Variable<double>(amount.value);
    }
    if (date.present) {
      map['date'] = Variable<DateTime>(date.value);
    }
    if (method.present) {
      map['method'] = Variable<String>(method.value);
    }
    if (note.present) {
      map['note'] = Variable<String>(note.value);
    }
    if (receiptNo.present) {
      map['receipt_no'] = Variable<String>(receiptNo.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('FeeEntriesCompanion(')
          ..write('id: $id, ')
          ..write('caseId: $caseId, ')
          ..write('chamberId: $chamberId, ')
          ..write('type: $type, ')
          ..write('amount: $amount, ')
          ..write('date: $date, ')
          ..write('method: $method, ')
          ..write('note: $note, ')
          ..write('receiptNo: $receiptNo, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $DocumentsTable extends Documents
    with TableInfo<$DocumentsTable, Document> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DocumentsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _caseIdMeta = const VerificationMeta('caseId');
  @override
  late final GeneratedColumn<String> caseId = GeneratedColumn<String>(
      'case_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _chamberIdMeta =
      const VerificationMeta('chamberId');
  @override
  late final GeneratedColumn<String> chamberId = GeneratedColumn<String>(
      'chamber_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _kindMeta = const VerificationMeta('kind');
  @override
  late final GeneratedColumn<String> kind = GeneratedColumn<String>(
      'kind', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
      'title', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _storageKeyMeta =
      const VerificationMeta('storageKey');
  @override
  late final GeneratedColumn<String> storageKey = GeneratedColumn<String>(
      'storage_key', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _pageCountMeta =
      const VerificationMeta('pageCount');
  @override
  late final GeneratedColumn<int> pageCount = GeneratedColumn<int>(
      'page_count', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _sizeBytesMeta =
      const VerificationMeta('sizeBytes');
  @override
  late final GeneratedColumn<int> sizeBytes = GeneratedColumn<int>(
      'size_bytes', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _ocrTextMeta =
      const VerificationMeta('ocrText');
  @override
  late final GeneratedColumn<String> ocrText = GeneratedColumn<String>(
      'ocr_text', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _localOnlyMeta =
      const VerificationMeta('localOnly');
  @override
  late final GeneratedColumn<bool> localOnly = GeneratedColumn<bool>(
      'local_only', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("local_only" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _deletedAtMeta =
      const VerificationMeta('deletedAt');
  @override
  late final GeneratedColumn<DateTime> deletedAt = GeneratedColumn<DateTime>(
      'deleted_at', aliasedName, true,
      type: DriftSqlType.dateTime, requiredDuringInsert: false);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        caseId,
        chamberId,
        kind,
        title,
        storageKey,
        pageCount,
        sizeBytes,
        ocrText,
        localOnly,
        createdAt,
        deletedAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'documents';
  @override
  VerificationContext validateIntegrity(Insertable<Document> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('case_id')) {
      context.handle(_caseIdMeta,
          caseId.isAcceptableOrUnknown(data['case_id']!, _caseIdMeta));
    } else if (isInserting) {
      context.missing(_caseIdMeta);
    }
    if (data.containsKey('chamber_id')) {
      context.handle(_chamberIdMeta,
          chamberId.isAcceptableOrUnknown(data['chamber_id']!, _chamberIdMeta));
    } else if (isInserting) {
      context.missing(_chamberIdMeta);
    }
    if (data.containsKey('kind')) {
      context.handle(
          _kindMeta, kind.isAcceptableOrUnknown(data['kind']!, _kindMeta));
    } else if (isInserting) {
      context.missing(_kindMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
          _titleMeta, title.isAcceptableOrUnknown(data['title']!, _titleMeta));
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('storage_key')) {
      context.handle(
          _storageKeyMeta,
          storageKey.isAcceptableOrUnknown(
              data['storage_key']!, _storageKeyMeta));
    } else if (isInserting) {
      context.missing(_storageKeyMeta);
    }
    if (data.containsKey('page_count')) {
      context.handle(_pageCountMeta,
          pageCount.isAcceptableOrUnknown(data['page_count']!, _pageCountMeta));
    } else if (isInserting) {
      context.missing(_pageCountMeta);
    }
    if (data.containsKey('size_bytes')) {
      context.handle(_sizeBytesMeta,
          sizeBytes.isAcceptableOrUnknown(data['size_bytes']!, _sizeBytesMeta));
    } else if (isInserting) {
      context.missing(_sizeBytesMeta);
    }
    if (data.containsKey('ocr_text')) {
      context.handle(_ocrTextMeta,
          ocrText.isAcceptableOrUnknown(data['ocr_text']!, _ocrTextMeta));
    }
    if (data.containsKey('local_only')) {
      context.handle(_localOnlyMeta,
          localOnly.isAcceptableOrUnknown(data['local_only']!, _localOnlyMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('deleted_at')) {
      context.handle(_deletedAtMeta,
          deletedAt.isAcceptableOrUnknown(data['deleted_at']!, _deletedAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  Document map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return Document(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      caseId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}case_id'])!,
      chamberId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}chamber_id'])!,
      kind: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}kind'])!,
      title: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}title'])!,
      storageKey: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}storage_key'])!,
      pageCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}page_count'])!,
      sizeBytes: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}size_bytes'])!,
      ocrText: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}ocr_text']),
      localOnly: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}local_only'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      deletedAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}deleted_at']),
    );
  }

  @override
  $DocumentsTable createAlias(String alias) {
    return $DocumentsTable(attachedDatabase, alias);
  }
}

class Document extends DataClass implements Insertable<Document> {
  final String id;
  final String caseId;
  final String chamberId;
  final String kind;
  final String title;
  final String storageKey;
  final int pageCount;
  final int sizeBytes;
  final String? ocrText;
  final bool localOnly;
  final DateTime createdAt;
  final DateTime? deletedAt;
  const Document(
      {required this.id,
      required this.caseId,
      required this.chamberId,
      required this.kind,
      required this.title,
      required this.storageKey,
      required this.pageCount,
      required this.sizeBytes,
      this.ocrText,
      required this.localOnly,
      required this.createdAt,
      this.deletedAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['case_id'] = Variable<String>(caseId);
    map['chamber_id'] = Variable<String>(chamberId);
    map['kind'] = Variable<String>(kind);
    map['title'] = Variable<String>(title);
    map['storage_key'] = Variable<String>(storageKey);
    map['page_count'] = Variable<int>(pageCount);
    map['size_bytes'] = Variable<int>(sizeBytes);
    if (!nullToAbsent || ocrText != null) {
      map['ocr_text'] = Variable<String>(ocrText);
    }
    map['local_only'] = Variable<bool>(localOnly);
    map['created_at'] = Variable<DateTime>(createdAt);
    if (!nullToAbsent || deletedAt != null) {
      map['deleted_at'] = Variable<DateTime>(deletedAt);
    }
    return map;
  }

  DocumentsCompanion toCompanion(bool nullToAbsent) {
    return DocumentsCompanion(
      id: Value(id),
      caseId: Value(caseId),
      chamberId: Value(chamberId),
      kind: Value(kind),
      title: Value(title),
      storageKey: Value(storageKey),
      pageCount: Value(pageCount),
      sizeBytes: Value(sizeBytes),
      ocrText: ocrText == null && nullToAbsent
          ? const Value.absent()
          : Value(ocrText),
      localOnly: Value(localOnly),
      createdAt: Value(createdAt),
      deletedAt: deletedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(deletedAt),
    );
  }

  factory Document.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return Document(
      id: serializer.fromJson<String>(json['id']),
      caseId: serializer.fromJson<String>(json['caseId']),
      chamberId: serializer.fromJson<String>(json['chamberId']),
      kind: serializer.fromJson<String>(json['kind']),
      title: serializer.fromJson<String>(json['title']),
      storageKey: serializer.fromJson<String>(json['storageKey']),
      pageCount: serializer.fromJson<int>(json['pageCount']),
      sizeBytes: serializer.fromJson<int>(json['sizeBytes']),
      ocrText: serializer.fromJson<String?>(json['ocrText']),
      localOnly: serializer.fromJson<bool>(json['localOnly']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      deletedAt: serializer.fromJson<DateTime?>(json['deletedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'caseId': serializer.toJson<String>(caseId),
      'chamberId': serializer.toJson<String>(chamberId),
      'kind': serializer.toJson<String>(kind),
      'title': serializer.toJson<String>(title),
      'storageKey': serializer.toJson<String>(storageKey),
      'pageCount': serializer.toJson<int>(pageCount),
      'sizeBytes': serializer.toJson<int>(sizeBytes),
      'ocrText': serializer.toJson<String?>(ocrText),
      'localOnly': serializer.toJson<bool>(localOnly),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'deletedAt': serializer.toJson<DateTime?>(deletedAt),
    };
  }

  Document copyWith(
          {String? id,
          String? caseId,
          String? chamberId,
          String? kind,
          String? title,
          String? storageKey,
          int? pageCount,
          int? sizeBytes,
          Value<String?> ocrText = const Value.absent(),
          bool? localOnly,
          DateTime? createdAt,
          Value<DateTime?> deletedAt = const Value.absent()}) =>
      Document(
        id: id ?? this.id,
        caseId: caseId ?? this.caseId,
        chamberId: chamberId ?? this.chamberId,
        kind: kind ?? this.kind,
        title: title ?? this.title,
        storageKey: storageKey ?? this.storageKey,
        pageCount: pageCount ?? this.pageCount,
        sizeBytes: sizeBytes ?? this.sizeBytes,
        ocrText: ocrText.present ? ocrText.value : this.ocrText,
        localOnly: localOnly ?? this.localOnly,
        createdAt: createdAt ?? this.createdAt,
        deletedAt: deletedAt.present ? deletedAt.value : this.deletedAt,
      );
  Document copyWithCompanion(DocumentsCompanion data) {
    return Document(
      id: data.id.present ? data.id.value : this.id,
      caseId: data.caseId.present ? data.caseId.value : this.caseId,
      chamberId: data.chamberId.present ? data.chamberId.value : this.chamberId,
      kind: data.kind.present ? data.kind.value : this.kind,
      title: data.title.present ? data.title.value : this.title,
      storageKey:
          data.storageKey.present ? data.storageKey.value : this.storageKey,
      pageCount: data.pageCount.present ? data.pageCount.value : this.pageCount,
      sizeBytes: data.sizeBytes.present ? data.sizeBytes.value : this.sizeBytes,
      ocrText: data.ocrText.present ? data.ocrText.value : this.ocrText,
      localOnly: data.localOnly.present ? data.localOnly.value : this.localOnly,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      deletedAt: data.deletedAt.present ? data.deletedAt.value : this.deletedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('Document(')
          ..write('id: $id, ')
          ..write('caseId: $caseId, ')
          ..write('chamberId: $chamberId, ')
          ..write('kind: $kind, ')
          ..write('title: $title, ')
          ..write('storageKey: $storageKey, ')
          ..write('pageCount: $pageCount, ')
          ..write('sizeBytes: $sizeBytes, ')
          ..write('ocrText: $ocrText, ')
          ..write('localOnly: $localOnly, ')
          ..write('createdAt: $createdAt, ')
          ..write('deletedAt: $deletedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
      id,
      caseId,
      chamberId,
      kind,
      title,
      storageKey,
      pageCount,
      sizeBytes,
      ocrText,
      localOnly,
      createdAt,
      deletedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Document &&
          other.id == this.id &&
          other.caseId == this.caseId &&
          other.chamberId == this.chamberId &&
          other.kind == this.kind &&
          other.title == this.title &&
          other.storageKey == this.storageKey &&
          other.pageCount == this.pageCount &&
          other.sizeBytes == this.sizeBytes &&
          other.ocrText == this.ocrText &&
          other.localOnly == this.localOnly &&
          other.createdAt == this.createdAt &&
          other.deletedAt == this.deletedAt);
}

class DocumentsCompanion extends UpdateCompanion<Document> {
  final Value<String> id;
  final Value<String> caseId;
  final Value<String> chamberId;
  final Value<String> kind;
  final Value<String> title;
  final Value<String> storageKey;
  final Value<int> pageCount;
  final Value<int> sizeBytes;
  final Value<String?> ocrText;
  final Value<bool> localOnly;
  final Value<DateTime> createdAt;
  final Value<DateTime?> deletedAt;
  final Value<int> rowid;
  const DocumentsCompanion({
    this.id = const Value.absent(),
    this.caseId = const Value.absent(),
    this.chamberId = const Value.absent(),
    this.kind = const Value.absent(),
    this.title = const Value.absent(),
    this.storageKey = const Value.absent(),
    this.pageCount = const Value.absent(),
    this.sizeBytes = const Value.absent(),
    this.ocrText = const Value.absent(),
    this.localOnly = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DocumentsCompanion.insert({
    required String id,
    required String caseId,
    required String chamberId,
    required String kind,
    required String title,
    required String storageKey,
    required int pageCount,
    required int sizeBytes,
    this.ocrText = const Value.absent(),
    this.localOnly = const Value.absent(),
    required DateTime createdAt,
    this.deletedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        caseId = Value(caseId),
        chamberId = Value(chamberId),
        kind = Value(kind),
        title = Value(title),
        storageKey = Value(storageKey),
        pageCount = Value(pageCount),
        sizeBytes = Value(sizeBytes),
        createdAt = Value(createdAt);
  static Insertable<Document> custom({
    Expression<String>? id,
    Expression<String>? caseId,
    Expression<String>? chamberId,
    Expression<String>? kind,
    Expression<String>? title,
    Expression<String>? storageKey,
    Expression<int>? pageCount,
    Expression<int>? sizeBytes,
    Expression<String>? ocrText,
    Expression<bool>? localOnly,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? deletedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (caseId != null) 'case_id': caseId,
      if (chamberId != null) 'chamber_id': chamberId,
      if (kind != null) 'kind': kind,
      if (title != null) 'title': title,
      if (storageKey != null) 'storage_key': storageKey,
      if (pageCount != null) 'page_count': pageCount,
      if (sizeBytes != null) 'size_bytes': sizeBytes,
      if (ocrText != null) 'ocr_text': ocrText,
      if (localOnly != null) 'local_only': localOnly,
      if (createdAt != null) 'created_at': createdAt,
      if (deletedAt != null) 'deleted_at': deletedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DocumentsCompanion copyWith(
      {Value<String>? id,
      Value<String>? caseId,
      Value<String>? chamberId,
      Value<String>? kind,
      Value<String>? title,
      Value<String>? storageKey,
      Value<int>? pageCount,
      Value<int>? sizeBytes,
      Value<String?>? ocrText,
      Value<bool>? localOnly,
      Value<DateTime>? createdAt,
      Value<DateTime?>? deletedAt,
      Value<int>? rowid}) {
    return DocumentsCompanion(
      id: id ?? this.id,
      caseId: caseId ?? this.caseId,
      chamberId: chamberId ?? this.chamberId,
      kind: kind ?? this.kind,
      title: title ?? this.title,
      storageKey: storageKey ?? this.storageKey,
      pageCount: pageCount ?? this.pageCount,
      sizeBytes: sizeBytes ?? this.sizeBytes,
      ocrText: ocrText ?? this.ocrText,
      localOnly: localOnly ?? this.localOnly,
      createdAt: createdAt ?? this.createdAt,
      deletedAt: deletedAt ?? this.deletedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (caseId.present) {
      map['case_id'] = Variable<String>(caseId.value);
    }
    if (chamberId.present) {
      map['chamber_id'] = Variable<String>(chamberId.value);
    }
    if (kind.present) {
      map['kind'] = Variable<String>(kind.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (storageKey.present) {
      map['storage_key'] = Variable<String>(storageKey.value);
    }
    if (pageCount.present) {
      map['page_count'] = Variable<int>(pageCount.value);
    }
    if (sizeBytes.present) {
      map['size_bytes'] = Variable<int>(sizeBytes.value);
    }
    if (ocrText.present) {
      map['ocr_text'] = Variable<String>(ocrText.value);
    }
    if (localOnly.present) {
      map['local_only'] = Variable<bool>(localOnly.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (deletedAt.present) {
      map['deleted_at'] = Variable<DateTime>(deletedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DocumentsCompanion(')
          ..write('id: $id, ')
          ..write('caseId: $caseId, ')
          ..write('chamberId: $chamberId, ')
          ..write('kind: $kind, ')
          ..write('title: $title, ')
          ..write('storageKey: $storageKey, ')
          ..write('pageCount: $pageCount, ')
          ..write('sizeBytes: $sizeBytes, ')
          ..write('ocrText: $ocrText, ')
          ..write('localOnly: $localOnly, ')
          ..write('createdAt: $createdAt, ')
          ..write('deletedAt: $deletedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncOutboxEntriesTable extends SyncOutboxEntries
    with TableInfo<$SyncOutboxEntriesTable, SyncOutboxEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncOutboxEntriesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _opIdMeta = const VerificationMeta('opId');
  @override
  late final GeneratedColumn<String> opId = GeneratedColumn<String>(
      'op_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityMeta = const VerificationMeta('entity');
  @override
  late final GeneratedColumn<String> entity = GeneratedColumn<String>(
      'entity', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityIdMeta =
      const VerificationMeta('entityId');
  @override
  late final GeneratedColumn<String> entityId = GeneratedColumn<String>(
      'entity_id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _opTypeMeta = const VerificationMeta('opType');
  @override
  late final GeneratedColumn<String> opType = GeneratedColumn<String>(
      'op_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _revMeta = const VerificationMeta('rev');
  @override
  late final GeneratedColumn<int> rev = GeneratedColumn<int>(
      'rev', aliasedName, false,
      type: DriftSqlType.int, requiredDuringInsert: true);
  static const VerificationMeta _dataJsonMeta =
      const VerificationMeta('dataJson');
  @override
  late final GeneratedColumn<String> dataJson = GeneratedColumn<String>(
      'data_json', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime, requiredDuringInsert: true);
  static const VerificationMeta _appliedMeta =
      const VerificationMeta('applied');
  @override
  late final GeneratedColumn<bool> applied = GeneratedColumn<bool>(
      'applied', aliasedName, false,
      type: DriftSqlType.bool,
      requiredDuringInsert: false,
      defaultConstraints:
          GeneratedColumn.constraintIsAlways('CHECK ("applied" IN (0, 1))'),
      defaultValue: const Constant(false));
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  @override
  List<GeneratedColumn> get $columns => [
        opId,
        entity,
        entityId,
        opType,
        rev,
        dataJson,
        createdAt,
        applied,
        retryCount
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_outbox_entries';
  @override
  VerificationContext validateIntegrity(Insertable<SyncOutboxEntry> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('op_id')) {
      context.handle(
          _opIdMeta, opId.isAcceptableOrUnknown(data['op_id']!, _opIdMeta));
    } else if (isInserting) {
      context.missing(_opIdMeta);
    }
    if (data.containsKey('entity')) {
      context.handle(_entityMeta,
          entity.isAcceptableOrUnknown(data['entity']!, _entityMeta));
    } else if (isInserting) {
      context.missing(_entityMeta);
    }
    if (data.containsKey('entity_id')) {
      context.handle(_entityIdMeta,
          entityId.isAcceptableOrUnknown(data['entity_id']!, _entityIdMeta));
    } else if (isInserting) {
      context.missing(_entityIdMeta);
    }
    if (data.containsKey('op_type')) {
      context.handle(_opTypeMeta,
          opType.isAcceptableOrUnknown(data['op_type']!, _opTypeMeta));
    } else if (isInserting) {
      context.missing(_opTypeMeta);
    }
    if (data.containsKey('rev')) {
      context.handle(
          _revMeta, rev.isAcceptableOrUnknown(data['rev']!, _revMeta));
    } else if (isInserting) {
      context.missing(_revMeta);
    }
    if (data.containsKey('data_json')) {
      context.handle(_dataJsonMeta,
          dataJson.isAcceptableOrUnknown(data['data_json']!, _dataJsonMeta));
    } else if (isInserting) {
      context.missing(_dataJsonMeta);
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('applied')) {
      context.handle(_appliedMeta,
          applied.isAcceptableOrUnknown(data['applied']!, _appliedMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {opId};
  @override
  SyncOutboxEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncOutboxEntry(
      opId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}op_id'])!,
      entity: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity'])!,
      entityId: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_id'])!,
      opType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}op_type'])!,
      rev: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}rev'])!,
      dataJson: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}data_json'])!,
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
      applied: attachedDatabase.typeMapping
          .read(DriftSqlType.bool, data['${effectivePrefix}applied'])!,
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
    );
  }

  @override
  $SyncOutboxEntriesTable createAlias(String alias) {
    return $SyncOutboxEntriesTable(attachedDatabase, alias);
  }
}

class SyncOutboxEntry extends DataClass implements Insertable<SyncOutboxEntry> {
  final String opId;
  final String entity;
  final String entityId;
  final String opType;
  final int rev;
  final String dataJson;
  final DateTime createdAt;
  final bool applied;
  final int retryCount;
  const SyncOutboxEntry(
      {required this.opId,
      required this.entity,
      required this.entityId,
      required this.opType,
      required this.rev,
      required this.dataJson,
      required this.createdAt,
      required this.applied,
      required this.retryCount});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['op_id'] = Variable<String>(opId);
    map['entity'] = Variable<String>(entity);
    map['entity_id'] = Variable<String>(entityId);
    map['op_type'] = Variable<String>(opType);
    map['rev'] = Variable<int>(rev);
    map['data_json'] = Variable<String>(dataJson);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['applied'] = Variable<bool>(applied);
    map['retry_count'] = Variable<int>(retryCount);
    return map;
  }

  SyncOutboxEntriesCompanion toCompanion(bool nullToAbsent) {
    return SyncOutboxEntriesCompanion(
      opId: Value(opId),
      entity: Value(entity),
      entityId: Value(entityId),
      opType: Value(opType),
      rev: Value(rev),
      dataJson: Value(dataJson),
      createdAt: Value(createdAt),
      applied: Value(applied),
      retryCount: Value(retryCount),
    );
  }

  factory SyncOutboxEntry.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncOutboxEntry(
      opId: serializer.fromJson<String>(json['opId']),
      entity: serializer.fromJson<String>(json['entity']),
      entityId: serializer.fromJson<String>(json['entityId']),
      opType: serializer.fromJson<String>(json['opType']),
      rev: serializer.fromJson<int>(json['rev']),
      dataJson: serializer.fromJson<String>(json['dataJson']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      applied: serializer.fromJson<bool>(json['applied']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'opId': serializer.toJson<String>(opId),
      'entity': serializer.toJson<String>(entity),
      'entityId': serializer.toJson<String>(entityId),
      'opType': serializer.toJson<String>(opType),
      'rev': serializer.toJson<int>(rev),
      'dataJson': serializer.toJson<String>(dataJson),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'applied': serializer.toJson<bool>(applied),
      'retryCount': serializer.toJson<int>(retryCount),
    };
  }

  SyncOutboxEntry copyWith(
          {String? opId,
          String? entity,
          String? entityId,
          String? opType,
          int? rev,
          String? dataJson,
          DateTime? createdAt,
          bool? applied,
          int? retryCount}) =>
      SyncOutboxEntry(
        opId: opId ?? this.opId,
        entity: entity ?? this.entity,
        entityId: entityId ?? this.entityId,
        opType: opType ?? this.opType,
        rev: rev ?? this.rev,
        dataJson: dataJson ?? this.dataJson,
        createdAt: createdAt ?? this.createdAt,
        applied: applied ?? this.applied,
        retryCount: retryCount ?? this.retryCount,
      );
  SyncOutboxEntry copyWithCompanion(SyncOutboxEntriesCompanion data) {
    return SyncOutboxEntry(
      opId: data.opId.present ? data.opId.value : this.opId,
      entity: data.entity.present ? data.entity.value : this.entity,
      entityId: data.entityId.present ? data.entityId.value : this.entityId,
      opType: data.opType.present ? data.opType.value : this.opType,
      rev: data.rev.present ? data.rev.value : this.rev,
      dataJson: data.dataJson.present ? data.dataJson.value : this.dataJson,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      applied: data.applied.present ? data.applied.value : this.applied,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncOutboxEntry(')
          ..write('opId: $opId, ')
          ..write('entity: $entity, ')
          ..write('entityId: $entityId, ')
          ..write('opType: $opType, ')
          ..write('rev: $rev, ')
          ..write('dataJson: $dataJson, ')
          ..write('createdAt: $createdAt, ')
          ..write('applied: $applied, ')
          ..write('retryCount: $retryCount')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(opId, entity, entityId, opType, rev, dataJson,
      createdAt, applied, retryCount);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncOutboxEntry &&
          other.opId == this.opId &&
          other.entity == this.entity &&
          other.entityId == this.entityId &&
          other.opType == this.opType &&
          other.rev == this.rev &&
          other.dataJson == this.dataJson &&
          other.createdAt == this.createdAt &&
          other.applied == this.applied &&
          other.retryCount == this.retryCount);
}

class SyncOutboxEntriesCompanion extends UpdateCompanion<SyncOutboxEntry> {
  final Value<String> opId;
  final Value<String> entity;
  final Value<String> entityId;
  final Value<String> opType;
  final Value<int> rev;
  final Value<String> dataJson;
  final Value<DateTime> createdAt;
  final Value<bool> applied;
  final Value<int> retryCount;
  final Value<int> rowid;
  const SyncOutboxEntriesCompanion({
    this.opId = const Value.absent(),
    this.entity = const Value.absent(),
    this.entityId = const Value.absent(),
    this.opType = const Value.absent(),
    this.rev = const Value.absent(),
    this.dataJson = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.applied = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncOutboxEntriesCompanion.insert({
    required String opId,
    required String entity,
    required String entityId,
    required String opType,
    required int rev,
    required String dataJson,
    required DateTime createdAt,
    this.applied = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : opId = Value(opId),
        entity = Value(entity),
        entityId = Value(entityId),
        opType = Value(opType),
        rev = Value(rev),
        dataJson = Value(dataJson),
        createdAt = Value(createdAt);
  static Insertable<SyncOutboxEntry> custom({
    Expression<String>? opId,
    Expression<String>? entity,
    Expression<String>? entityId,
    Expression<String>? opType,
    Expression<int>? rev,
    Expression<String>? dataJson,
    Expression<DateTime>? createdAt,
    Expression<bool>? applied,
    Expression<int>? retryCount,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (opId != null) 'op_id': opId,
      if (entity != null) 'entity': entity,
      if (entityId != null) 'entity_id': entityId,
      if (opType != null) 'op_type': opType,
      if (rev != null) 'rev': rev,
      if (dataJson != null) 'data_json': dataJson,
      if (createdAt != null) 'created_at': createdAt,
      if (applied != null) 'applied': applied,
      if (retryCount != null) 'retry_count': retryCount,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncOutboxEntriesCompanion copyWith(
      {Value<String>? opId,
      Value<String>? entity,
      Value<String>? entityId,
      Value<String>? opType,
      Value<int>? rev,
      Value<String>? dataJson,
      Value<DateTime>? createdAt,
      Value<bool>? applied,
      Value<int>? retryCount,
      Value<int>? rowid}) {
    return SyncOutboxEntriesCompanion(
      opId: opId ?? this.opId,
      entity: entity ?? this.entity,
      entityId: entityId ?? this.entityId,
      opType: opType ?? this.opType,
      rev: rev ?? this.rev,
      dataJson: dataJson ?? this.dataJson,
      createdAt: createdAt ?? this.createdAt,
      applied: applied ?? this.applied,
      retryCount: retryCount ?? this.retryCount,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (opId.present) {
      map['op_id'] = Variable<String>(opId.value);
    }
    if (entity.present) {
      map['entity'] = Variable<String>(entity.value);
    }
    if (entityId.present) {
      map['entity_id'] = Variable<String>(entityId.value);
    }
    if (opType.present) {
      map['op_type'] = Variable<String>(opType.value);
    }
    if (rev.present) {
      map['rev'] = Variable<int>(rev.value);
    }
    if (dataJson.present) {
      map['data_json'] = Variable<String>(dataJson.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (applied.present) {
      map['applied'] = Variable<bool>(applied.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncOutboxEntriesCompanion(')
          ..write('opId: $opId, ')
          ..write('entity: $entity, ')
          ..write('entityId: $entityId, ')
          ..write('opType: $opType, ')
          ..write('rev: $rev, ')
          ..write('dataJson: $dataJson, ')
          ..write('createdAt: $createdAt, ')
          ..write('applied: $applied, ')
          ..write('retryCount: $retryCount, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CasesTable cases = $CasesTable(this);
  late final $HearingsTable hearings = $HearingsTable(this);
  late final $ClientsTable clients = $ClientsTable(this);
  late final $FeeEntriesTable feeEntries = $FeeEntriesTable(this);
  late final $DocumentsTable documents = $DocumentsTable(this);
  late final $SyncOutboxEntriesTable syncOutboxEntries =
      $SyncOutboxEntriesTable(this);
  late final CaseDao caseDao = CaseDao(this as AppDatabase);
  late final HearingDao hearingDao = HearingDao(this as AppDatabase);
  late final ClientDao clientDao = ClientDao(this as AppDatabase);
  late final FeeDao feeDao = FeeDao(this as AppDatabase);
  late final OutboxDao outboxDao = OutboxDao(this as AppDatabase);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities =>
      [cases, hearings, clients, feeEntries, documents, syncOutboxEntries];
}

typedef $$CasesTableCreateCompanionBuilder = CasesCompanion Function({
  required String id,
  required String chamberId,
  required String caseNo,
  Value<int?> caseYear,
  required String court,
  Value<String?> courtName,
  Value<String?> courtRoom,
  Value<String?> judgeName,
  required String caseType,
  Value<String?> actsSections,
  Value<String?> policeStation,
  required String onBehalf,
  Value<String?> stage,
  Value<String> priority,
  Value<String> status,
  Value<String?> clientId,
  Value<DateTime?> filingDate,
  Value<DateTime?> nextDate,
  Value<String?> lastOutcome,
  Value<int> rev,
  required DateTime updatedAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});
typedef $$CasesTableUpdateCompanionBuilder = CasesCompanion Function({
  Value<String> id,
  Value<String> chamberId,
  Value<String> caseNo,
  Value<int?> caseYear,
  Value<String> court,
  Value<String?> courtName,
  Value<String?> courtRoom,
  Value<String?> judgeName,
  Value<String> caseType,
  Value<String?> actsSections,
  Value<String?> policeStation,
  Value<String> onBehalf,
  Value<String?> stage,
  Value<String> priority,
  Value<String> status,
  Value<String?> clientId,
  Value<DateTime?> filingDate,
  Value<DateTime?> nextDate,
  Value<String?> lastOutcome,
  Value<int> rev,
  Value<DateTime> updatedAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});

class $$CasesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $CasesTable,
    Case,
    $$CasesTableFilterComposer,
    $$CasesTableOrderingComposer,
    $$CasesTableCreateCompanionBuilder,
    $$CasesTableUpdateCompanionBuilder> {
  $$CasesTableTableManager(_$AppDatabase db, $CasesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          filteringComposer:
              $$CasesTableFilterComposer(ComposerState(db, table)),
          orderingComposer:
              $$CasesTableOrderingComposer(ComposerState(db, table)),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> chamberId = const Value.absent(),
            Value<String> caseNo = const Value.absent(),
            Value<int?> caseYear = const Value.absent(),
            Value<String> court = const Value.absent(),
            Value<String?> courtName = const Value.absent(),
            Value<String?> courtRoom = const Value.absent(),
            Value<String?> judgeName = const Value.absent(),
            Value<String> caseType = const Value.absent(),
            Value<String?> actsSections = const Value.absent(),
            Value<String?> policeStation = const Value.absent(),
            Value<String> onBehalf = const Value.absent(),
            Value<String?> stage = const Value.absent(),
            Value<String> priority = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String?> clientId = const Value.absent(),
            Value<DateTime?> filingDate = const Value.absent(),
            Value<DateTime?> nextDate = const Value.absent(),
            Value<String?> lastOutcome = const Value.absent(),
            Value<int> rev = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CasesCompanion(
            id: id,
            chamberId: chamberId,
            caseNo: caseNo,
            caseYear: caseYear,
            court: court,
            courtName: courtName,
            courtRoom: courtRoom,
            judgeName: judgeName,
            caseType: caseType,
            actsSections: actsSections,
            policeStation: policeStation,
            onBehalf: onBehalf,
            stage: stage,
            priority: priority,
            status: status,
            clientId: clientId,
            filingDate: filingDate,
            nextDate: nextDate,
            lastOutcome: lastOutcome,
            rev: rev,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String chamberId,
            required String caseNo,
            Value<int?> caseYear = const Value.absent(),
            required String court,
            Value<String?> courtName = const Value.absent(),
            Value<String?> courtRoom = const Value.absent(),
            Value<String?> judgeName = const Value.absent(),
            required String caseType,
            Value<String?> actsSections = const Value.absent(),
            Value<String?> policeStation = const Value.absent(),
            required String onBehalf,
            Value<String?> stage = const Value.absent(),
            Value<String> priority = const Value.absent(),
            Value<String> status = const Value.absent(),
            Value<String?> clientId = const Value.absent(),
            Value<DateTime?> filingDate = const Value.absent(),
            Value<DateTime?> nextDate = const Value.absent(),
            Value<String?> lastOutcome = const Value.absent(),
            Value<int> rev = const Value.absent(),
            required DateTime updatedAt,
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              CasesCompanion.insert(
            id: id,
            chamberId: chamberId,
            caseNo: caseNo,
            caseYear: caseYear,
            court: court,
            courtName: courtName,
            courtRoom: courtRoom,
            judgeName: judgeName,
            caseType: caseType,
            actsSections: actsSections,
            policeStation: policeStation,
            onBehalf: onBehalf,
            stage: stage,
            priority: priority,
            status: status,
            clientId: clientId,
            filingDate: filingDate,
            nextDate: nextDate,
            lastOutcome: lastOutcome,
            rev: rev,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
        ));
}

class $$CasesTableFilterComposer
    extends FilterComposer<_$AppDatabase, $CasesTable> {
  $$CasesTableFilterComposer(super.$state);
  ColumnFilters<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get caseNo => $state.composableBuilder(
      column: $state.table.caseNo,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get caseYear => $state.composableBuilder(
      column: $state.table.caseYear,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get court => $state.composableBuilder(
      column: $state.table.court,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get courtName => $state.composableBuilder(
      column: $state.table.courtName,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get courtRoom => $state.composableBuilder(
      column: $state.table.courtRoom,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get judgeName => $state.composableBuilder(
      column: $state.table.judgeName,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get caseType => $state.composableBuilder(
      column: $state.table.caseType,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get actsSections => $state.composableBuilder(
      column: $state.table.actsSections,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get policeStation => $state.composableBuilder(
      column: $state.table.policeStation,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get onBehalf => $state.composableBuilder(
      column: $state.table.onBehalf,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get stage => $state.composableBuilder(
      column: $state.table.stage,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get priority => $state.composableBuilder(
      column: $state.table.priority,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get status => $state.composableBuilder(
      column: $state.table.status,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get clientId => $state.composableBuilder(
      column: $state.table.clientId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get filingDate => $state.composableBuilder(
      column: $state.table.filingDate,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get nextDate => $state.composableBuilder(
      column: $state.table.nextDate,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get lastOutcome => $state.composableBuilder(
      column: $state.table.lastOutcome,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get rev => $state.composableBuilder(
      column: $state.table.rev,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get updatedAt => $state.composableBuilder(
      column: $state.table.updatedAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));
}

class $$CasesTableOrderingComposer
    extends OrderingComposer<_$AppDatabase, $CasesTable> {
  $$CasesTableOrderingComposer(super.$state);
  ColumnOrderings<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get caseNo => $state.composableBuilder(
      column: $state.table.caseNo,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get caseYear => $state.composableBuilder(
      column: $state.table.caseYear,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get court => $state.composableBuilder(
      column: $state.table.court,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get courtName => $state.composableBuilder(
      column: $state.table.courtName,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get courtRoom => $state.composableBuilder(
      column: $state.table.courtRoom,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get judgeName => $state.composableBuilder(
      column: $state.table.judgeName,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get caseType => $state.composableBuilder(
      column: $state.table.caseType,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get actsSections => $state.composableBuilder(
      column: $state.table.actsSections,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get policeStation => $state.composableBuilder(
      column: $state.table.policeStation,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get onBehalf => $state.composableBuilder(
      column: $state.table.onBehalf,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get stage => $state.composableBuilder(
      column: $state.table.stage,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get priority => $state.composableBuilder(
      column: $state.table.priority,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get status => $state.composableBuilder(
      column: $state.table.status,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get clientId => $state.composableBuilder(
      column: $state.table.clientId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get filingDate => $state.composableBuilder(
      column: $state.table.filingDate,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get nextDate => $state.composableBuilder(
      column: $state.table.nextDate,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get lastOutcome => $state.composableBuilder(
      column: $state.table.lastOutcome,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get rev => $state.composableBuilder(
      column: $state.table.rev,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get updatedAt => $state.composableBuilder(
      column: $state.table.updatedAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));
}

typedef $$HearingsTableCreateCompanionBuilder = HearingsCompanion Function({
  required String id,
  required String caseId,
  required String chamberId,
  required DateTime date,
  Value<String?> purpose,
  Value<String?> outcome,
  Value<String?> note,
  Value<String?> voiceNotePath,
  Value<bool> attended,
  Value<String?> appearingUserId,
  Value<int> rev,
  required DateTime updatedAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});
typedef $$HearingsTableUpdateCompanionBuilder = HearingsCompanion Function({
  Value<String> id,
  Value<String> caseId,
  Value<String> chamberId,
  Value<DateTime> date,
  Value<String?> purpose,
  Value<String?> outcome,
  Value<String?> note,
  Value<String?> voiceNotePath,
  Value<bool> attended,
  Value<String?> appearingUserId,
  Value<int> rev,
  Value<DateTime> updatedAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});

class $$HearingsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $HearingsTable,
    Hearing,
    $$HearingsTableFilterComposer,
    $$HearingsTableOrderingComposer,
    $$HearingsTableCreateCompanionBuilder,
    $$HearingsTableUpdateCompanionBuilder> {
  $$HearingsTableTableManager(_$AppDatabase db, $HearingsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          filteringComposer:
              $$HearingsTableFilterComposer(ComposerState(db, table)),
          orderingComposer:
              $$HearingsTableOrderingComposer(ComposerState(db, table)),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> caseId = const Value.absent(),
            Value<String> chamberId = const Value.absent(),
            Value<DateTime> date = const Value.absent(),
            Value<String?> purpose = const Value.absent(),
            Value<String?> outcome = const Value.absent(),
            Value<String?> note = const Value.absent(),
            Value<String?> voiceNotePath = const Value.absent(),
            Value<bool> attended = const Value.absent(),
            Value<String?> appearingUserId = const Value.absent(),
            Value<int> rev = const Value.absent(),
            Value<DateTime> updatedAt = const Value.absent(),
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              HearingsCompanion(
            id: id,
            caseId: caseId,
            chamberId: chamberId,
            date: date,
            purpose: purpose,
            outcome: outcome,
            note: note,
            voiceNotePath: voiceNotePath,
            attended: attended,
            appearingUserId: appearingUserId,
            rev: rev,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String caseId,
            required String chamberId,
            required DateTime date,
            Value<String?> purpose = const Value.absent(),
            Value<String?> outcome = const Value.absent(),
            Value<String?> note = const Value.absent(),
            Value<String?> voiceNotePath = const Value.absent(),
            Value<bool> attended = const Value.absent(),
            Value<String?> appearingUserId = const Value.absent(),
            Value<int> rev = const Value.absent(),
            required DateTime updatedAt,
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              HearingsCompanion.insert(
            id: id,
            caseId: caseId,
            chamberId: chamberId,
            date: date,
            purpose: purpose,
            outcome: outcome,
            note: note,
            voiceNotePath: voiceNotePath,
            attended: attended,
            appearingUserId: appearingUserId,
            rev: rev,
            updatedAt: updatedAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
        ));
}

class $$HearingsTableFilterComposer
    extends FilterComposer<_$AppDatabase, $HearingsTable> {
  $$HearingsTableFilterComposer(super.$state);
  ColumnFilters<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get caseId => $state.composableBuilder(
      column: $state.table.caseId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get date => $state.composableBuilder(
      column: $state.table.date,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get purpose => $state.composableBuilder(
      column: $state.table.purpose,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get outcome => $state.composableBuilder(
      column: $state.table.outcome,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get note => $state.composableBuilder(
      column: $state.table.note,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get voiceNotePath => $state.composableBuilder(
      column: $state.table.voiceNotePath,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<bool> get attended => $state.composableBuilder(
      column: $state.table.attended,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get appearingUserId => $state.composableBuilder(
      column: $state.table.appearingUserId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get rev => $state.composableBuilder(
      column: $state.table.rev,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get updatedAt => $state.composableBuilder(
      column: $state.table.updatedAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));
}

class $$HearingsTableOrderingComposer
    extends OrderingComposer<_$AppDatabase, $HearingsTable> {
  $$HearingsTableOrderingComposer(super.$state);
  ColumnOrderings<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get caseId => $state.composableBuilder(
      column: $state.table.caseId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get date => $state.composableBuilder(
      column: $state.table.date,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get purpose => $state.composableBuilder(
      column: $state.table.purpose,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get outcome => $state.composableBuilder(
      column: $state.table.outcome,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get note => $state.composableBuilder(
      column: $state.table.note,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get voiceNotePath => $state.composableBuilder(
      column: $state.table.voiceNotePath,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<bool> get attended => $state.composableBuilder(
      column: $state.table.attended,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get appearingUserId => $state.composableBuilder(
      column: $state.table.appearingUserId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get rev => $state.composableBuilder(
      column: $state.table.rev,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get updatedAt => $state.composableBuilder(
      column: $state.table.updatedAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));
}

typedef $$ClientsTableCreateCompanionBuilder = ClientsCompanion Function({
  required String id,
  required String chamberId,
  required String name,
  Value<String?> phone,
  Value<String?> altPhone,
  Value<String?> email,
  Value<String?> nid,
  Value<String?> address,
  Value<String?> fileNo,
  Value<String?> note,
  required DateTime createdAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});
typedef $$ClientsTableUpdateCompanionBuilder = ClientsCompanion Function({
  Value<String> id,
  Value<String> chamberId,
  Value<String> name,
  Value<String?> phone,
  Value<String?> altPhone,
  Value<String?> email,
  Value<String?> nid,
  Value<String?> address,
  Value<String?> fileNo,
  Value<String?> note,
  Value<DateTime> createdAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});

class $$ClientsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $ClientsTable,
    Client,
    $$ClientsTableFilterComposer,
    $$ClientsTableOrderingComposer,
    $$ClientsTableCreateCompanionBuilder,
    $$ClientsTableUpdateCompanionBuilder> {
  $$ClientsTableTableManager(_$AppDatabase db, $ClientsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          filteringComposer:
              $$ClientsTableFilterComposer(ComposerState(db, table)),
          orderingComposer:
              $$ClientsTableOrderingComposer(ComposerState(db, table)),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> chamberId = const Value.absent(),
            Value<String> name = const Value.absent(),
            Value<String?> phone = const Value.absent(),
            Value<String?> altPhone = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String?> nid = const Value.absent(),
            Value<String?> address = const Value.absent(),
            Value<String?> fileNo = const Value.absent(),
            Value<String?> note = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ClientsCompanion(
            id: id,
            chamberId: chamberId,
            name: name,
            phone: phone,
            altPhone: altPhone,
            email: email,
            nid: nid,
            address: address,
            fileNo: fileNo,
            note: note,
            createdAt: createdAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String chamberId,
            required String name,
            Value<String?> phone = const Value.absent(),
            Value<String?> altPhone = const Value.absent(),
            Value<String?> email = const Value.absent(),
            Value<String?> nid = const Value.absent(),
            Value<String?> address = const Value.absent(),
            Value<String?> fileNo = const Value.absent(),
            Value<String?> note = const Value.absent(),
            required DateTime createdAt,
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              ClientsCompanion.insert(
            id: id,
            chamberId: chamberId,
            name: name,
            phone: phone,
            altPhone: altPhone,
            email: email,
            nid: nid,
            address: address,
            fileNo: fileNo,
            note: note,
            createdAt: createdAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
        ));
}

class $$ClientsTableFilterComposer
    extends FilterComposer<_$AppDatabase, $ClientsTable> {
  $$ClientsTableFilterComposer(super.$state);
  ColumnFilters<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get name => $state.composableBuilder(
      column: $state.table.name,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get phone => $state.composableBuilder(
      column: $state.table.phone,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get altPhone => $state.composableBuilder(
      column: $state.table.altPhone,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get email => $state.composableBuilder(
      column: $state.table.email,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get nid => $state.composableBuilder(
      column: $state.table.nid,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get address => $state.composableBuilder(
      column: $state.table.address,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get fileNo => $state.composableBuilder(
      column: $state.table.fileNo,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get note => $state.composableBuilder(
      column: $state.table.note,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));
}

class $$ClientsTableOrderingComposer
    extends OrderingComposer<_$AppDatabase, $ClientsTable> {
  $$ClientsTableOrderingComposer(super.$state);
  ColumnOrderings<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get name => $state.composableBuilder(
      column: $state.table.name,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get phone => $state.composableBuilder(
      column: $state.table.phone,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get altPhone => $state.composableBuilder(
      column: $state.table.altPhone,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get email => $state.composableBuilder(
      column: $state.table.email,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get nid => $state.composableBuilder(
      column: $state.table.nid,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get address => $state.composableBuilder(
      column: $state.table.address,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get fileNo => $state.composableBuilder(
      column: $state.table.fileNo,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get note => $state.composableBuilder(
      column: $state.table.note,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));
}

typedef $$FeeEntriesTableCreateCompanionBuilder = FeeEntriesCompanion Function({
  required String id,
  required String caseId,
  required String chamberId,
  required String type,
  required double amount,
  required DateTime date,
  Value<String?> method,
  Value<String?> note,
  Value<String?> receiptNo,
  required DateTime createdAt,
  Value<int> rowid,
});
typedef $$FeeEntriesTableUpdateCompanionBuilder = FeeEntriesCompanion Function({
  Value<String> id,
  Value<String> caseId,
  Value<String> chamberId,
  Value<String> type,
  Value<double> amount,
  Value<DateTime> date,
  Value<String?> method,
  Value<String?> note,
  Value<String?> receiptNo,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$FeeEntriesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $FeeEntriesTable,
    FeeEntry,
    $$FeeEntriesTableFilterComposer,
    $$FeeEntriesTableOrderingComposer,
    $$FeeEntriesTableCreateCompanionBuilder,
    $$FeeEntriesTableUpdateCompanionBuilder> {
  $$FeeEntriesTableTableManager(_$AppDatabase db, $FeeEntriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          filteringComposer:
              $$FeeEntriesTableFilterComposer(ComposerState(db, table)),
          orderingComposer:
              $$FeeEntriesTableOrderingComposer(ComposerState(db, table)),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> caseId = const Value.absent(),
            Value<String> chamberId = const Value.absent(),
            Value<String> type = const Value.absent(),
            Value<double> amount = const Value.absent(),
            Value<DateTime> date = const Value.absent(),
            Value<String?> method = const Value.absent(),
            Value<String?> note = const Value.absent(),
            Value<String?> receiptNo = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              FeeEntriesCompanion(
            id: id,
            caseId: caseId,
            chamberId: chamberId,
            type: type,
            amount: amount,
            date: date,
            method: method,
            note: note,
            receiptNo: receiptNo,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String caseId,
            required String chamberId,
            required String type,
            required double amount,
            required DateTime date,
            Value<String?> method = const Value.absent(),
            Value<String?> note = const Value.absent(),
            Value<String?> receiptNo = const Value.absent(),
            required DateTime createdAt,
            Value<int> rowid = const Value.absent(),
          }) =>
              FeeEntriesCompanion.insert(
            id: id,
            caseId: caseId,
            chamberId: chamberId,
            type: type,
            amount: amount,
            date: date,
            method: method,
            note: note,
            receiptNo: receiptNo,
            createdAt: createdAt,
            rowid: rowid,
          ),
        ));
}

class $$FeeEntriesTableFilterComposer
    extends FilterComposer<_$AppDatabase, $FeeEntriesTable> {
  $$FeeEntriesTableFilterComposer(super.$state);
  ColumnFilters<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get caseId => $state.composableBuilder(
      column: $state.table.caseId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get type => $state.composableBuilder(
      column: $state.table.type,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<double> get amount => $state.composableBuilder(
      column: $state.table.amount,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get date => $state.composableBuilder(
      column: $state.table.date,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get method => $state.composableBuilder(
      column: $state.table.method,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get note => $state.composableBuilder(
      column: $state.table.note,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get receiptNo => $state.composableBuilder(
      column: $state.table.receiptNo,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));
}

class $$FeeEntriesTableOrderingComposer
    extends OrderingComposer<_$AppDatabase, $FeeEntriesTable> {
  $$FeeEntriesTableOrderingComposer(super.$state);
  ColumnOrderings<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get caseId => $state.composableBuilder(
      column: $state.table.caseId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get type => $state.composableBuilder(
      column: $state.table.type,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<double> get amount => $state.composableBuilder(
      column: $state.table.amount,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get date => $state.composableBuilder(
      column: $state.table.date,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get method => $state.composableBuilder(
      column: $state.table.method,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get note => $state.composableBuilder(
      column: $state.table.note,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get receiptNo => $state.composableBuilder(
      column: $state.table.receiptNo,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));
}

typedef $$DocumentsTableCreateCompanionBuilder = DocumentsCompanion Function({
  required String id,
  required String caseId,
  required String chamberId,
  required String kind,
  required String title,
  required String storageKey,
  required int pageCount,
  required int sizeBytes,
  Value<String?> ocrText,
  Value<bool> localOnly,
  required DateTime createdAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});
typedef $$DocumentsTableUpdateCompanionBuilder = DocumentsCompanion Function({
  Value<String> id,
  Value<String> caseId,
  Value<String> chamberId,
  Value<String> kind,
  Value<String> title,
  Value<String> storageKey,
  Value<int> pageCount,
  Value<int> sizeBytes,
  Value<String?> ocrText,
  Value<bool> localOnly,
  Value<DateTime> createdAt,
  Value<DateTime?> deletedAt,
  Value<int> rowid,
});

class $$DocumentsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $DocumentsTable,
    Document,
    $$DocumentsTableFilterComposer,
    $$DocumentsTableOrderingComposer,
    $$DocumentsTableCreateCompanionBuilder,
    $$DocumentsTableUpdateCompanionBuilder> {
  $$DocumentsTableTableManager(_$AppDatabase db, $DocumentsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          filteringComposer:
              $$DocumentsTableFilterComposer(ComposerState(db, table)),
          orderingComposer:
              $$DocumentsTableOrderingComposer(ComposerState(db, table)),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> caseId = const Value.absent(),
            Value<String> chamberId = const Value.absent(),
            Value<String> kind = const Value.absent(),
            Value<String> title = const Value.absent(),
            Value<String> storageKey = const Value.absent(),
            Value<int> pageCount = const Value.absent(),
            Value<int> sizeBytes = const Value.absent(),
            Value<String?> ocrText = const Value.absent(),
            Value<bool> localOnly = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              DocumentsCompanion(
            id: id,
            caseId: caseId,
            chamberId: chamberId,
            kind: kind,
            title: title,
            storageKey: storageKey,
            pageCount: pageCount,
            sizeBytes: sizeBytes,
            ocrText: ocrText,
            localOnly: localOnly,
            createdAt: createdAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String caseId,
            required String chamberId,
            required String kind,
            required String title,
            required String storageKey,
            required int pageCount,
            required int sizeBytes,
            Value<String?> ocrText = const Value.absent(),
            Value<bool> localOnly = const Value.absent(),
            required DateTime createdAt,
            Value<DateTime?> deletedAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              DocumentsCompanion.insert(
            id: id,
            caseId: caseId,
            chamberId: chamberId,
            kind: kind,
            title: title,
            storageKey: storageKey,
            pageCount: pageCount,
            sizeBytes: sizeBytes,
            ocrText: ocrText,
            localOnly: localOnly,
            createdAt: createdAt,
            deletedAt: deletedAt,
            rowid: rowid,
          ),
        ));
}

class $$DocumentsTableFilterComposer
    extends FilterComposer<_$AppDatabase, $DocumentsTable> {
  $$DocumentsTableFilterComposer(super.$state);
  ColumnFilters<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get caseId => $state.composableBuilder(
      column: $state.table.caseId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get kind => $state.composableBuilder(
      column: $state.table.kind,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get title => $state.composableBuilder(
      column: $state.table.title,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get storageKey => $state.composableBuilder(
      column: $state.table.storageKey,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get pageCount => $state.composableBuilder(
      column: $state.table.pageCount,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get sizeBytes => $state.composableBuilder(
      column: $state.table.sizeBytes,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get ocrText => $state.composableBuilder(
      column: $state.table.ocrText,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<bool> get localOnly => $state.composableBuilder(
      column: $state.table.localOnly,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));
}

class $$DocumentsTableOrderingComposer
    extends OrderingComposer<_$AppDatabase, $DocumentsTable> {
  $$DocumentsTableOrderingComposer(super.$state);
  ColumnOrderings<String> get id => $state.composableBuilder(
      column: $state.table.id,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get caseId => $state.composableBuilder(
      column: $state.table.caseId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get chamberId => $state.composableBuilder(
      column: $state.table.chamberId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get kind => $state.composableBuilder(
      column: $state.table.kind,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get title => $state.composableBuilder(
      column: $state.table.title,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get storageKey => $state.composableBuilder(
      column: $state.table.storageKey,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get pageCount => $state.composableBuilder(
      column: $state.table.pageCount,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get sizeBytes => $state.composableBuilder(
      column: $state.table.sizeBytes,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get ocrText => $state.composableBuilder(
      column: $state.table.ocrText,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<bool> get localOnly => $state.composableBuilder(
      column: $state.table.localOnly,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get deletedAt => $state.composableBuilder(
      column: $state.table.deletedAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));
}

typedef $$SyncOutboxEntriesTableCreateCompanionBuilder
    = SyncOutboxEntriesCompanion Function({
  required String opId,
  required String entity,
  required String entityId,
  required String opType,
  required int rev,
  required String dataJson,
  required DateTime createdAt,
  Value<bool> applied,
  Value<int> retryCount,
  Value<int> rowid,
});
typedef $$SyncOutboxEntriesTableUpdateCompanionBuilder
    = SyncOutboxEntriesCompanion Function({
  Value<String> opId,
  Value<String> entity,
  Value<String> entityId,
  Value<String> opType,
  Value<int> rev,
  Value<String> dataJson,
  Value<DateTime> createdAt,
  Value<bool> applied,
  Value<int> retryCount,
  Value<int> rowid,
});

class $$SyncOutboxEntriesTableTableManager extends RootTableManager<
    _$AppDatabase,
    $SyncOutboxEntriesTable,
    SyncOutboxEntry,
    $$SyncOutboxEntriesTableFilterComposer,
    $$SyncOutboxEntriesTableOrderingComposer,
    $$SyncOutboxEntriesTableCreateCompanionBuilder,
    $$SyncOutboxEntriesTableUpdateCompanionBuilder> {
  $$SyncOutboxEntriesTableTableManager(
      _$AppDatabase db, $SyncOutboxEntriesTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          filteringComposer:
              $$SyncOutboxEntriesTableFilterComposer(ComposerState(db, table)),
          orderingComposer: $$SyncOutboxEntriesTableOrderingComposer(
              ComposerState(db, table)),
          updateCompanionCallback: ({
            Value<String> opId = const Value.absent(),
            Value<String> entity = const Value.absent(),
            Value<String> entityId = const Value.absent(),
            Value<String> opType = const Value.absent(),
            Value<int> rev = const Value.absent(),
            Value<String> dataJson = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<bool> applied = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncOutboxEntriesCompanion(
            opId: opId,
            entity: entity,
            entityId: entityId,
            opType: opType,
            rev: rev,
            dataJson: dataJson,
            createdAt: createdAt,
            applied: applied,
            retryCount: retryCount,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String opId,
            required String entity,
            required String entityId,
            required String opType,
            required int rev,
            required String dataJson,
            required DateTime createdAt,
            Value<bool> applied = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              SyncOutboxEntriesCompanion.insert(
            opId: opId,
            entity: entity,
            entityId: entityId,
            opType: opType,
            rev: rev,
            dataJson: dataJson,
            createdAt: createdAt,
            applied: applied,
            retryCount: retryCount,
            rowid: rowid,
          ),
        ));
}

class $$SyncOutboxEntriesTableFilterComposer
    extends FilterComposer<_$AppDatabase, $SyncOutboxEntriesTable> {
  $$SyncOutboxEntriesTableFilterComposer(super.$state);
  ColumnFilters<String> get opId => $state.composableBuilder(
      column: $state.table.opId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get entity => $state.composableBuilder(
      column: $state.table.entity,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get entityId => $state.composableBuilder(
      column: $state.table.entityId,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get opType => $state.composableBuilder(
      column: $state.table.opType,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get rev => $state.composableBuilder(
      column: $state.table.rev,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<String> get dataJson => $state.composableBuilder(
      column: $state.table.dataJson,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<bool> get applied => $state.composableBuilder(
      column: $state.table.applied,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));

  ColumnFilters<int> get retryCount => $state.composableBuilder(
      column: $state.table.retryCount,
      builder: (column, joinBuilders) =>
          ColumnFilters(column, joinBuilders: joinBuilders));
}

class $$SyncOutboxEntriesTableOrderingComposer
    extends OrderingComposer<_$AppDatabase, $SyncOutboxEntriesTable> {
  $$SyncOutboxEntriesTableOrderingComposer(super.$state);
  ColumnOrderings<String> get opId => $state.composableBuilder(
      column: $state.table.opId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get entity => $state.composableBuilder(
      column: $state.table.entity,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get entityId => $state.composableBuilder(
      column: $state.table.entityId,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get opType => $state.composableBuilder(
      column: $state.table.opType,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get rev => $state.composableBuilder(
      column: $state.table.rev,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<String> get dataJson => $state.composableBuilder(
      column: $state.table.dataJson,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<DateTime> get createdAt => $state.composableBuilder(
      column: $state.table.createdAt,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<bool> get applied => $state.composableBuilder(
      column: $state.table.applied,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));

  ColumnOrderings<int> get retryCount => $state.composableBuilder(
      column: $state.table.retryCount,
      builder: (column, joinBuilders) =>
          ColumnOrderings(column, joinBuilders: joinBuilders));
}

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CasesTableTableManager get cases =>
      $$CasesTableTableManager(_db, _db.cases);
  $$HearingsTableTableManager get hearings =>
      $$HearingsTableTableManager(_db, _db.hearings);
  $$ClientsTableTableManager get clients =>
      $$ClientsTableTableManager(_db, _db.clients);
  $$FeeEntriesTableTableManager get feeEntries =>
      $$FeeEntriesTableTableManager(_db, _db.feeEntries);
  $$DocumentsTableTableManager get documents =>
      $$DocumentsTableTableManager(_db, _db.documents);
  $$SyncOutboxEntriesTableTableManager get syncOutboxEntries =>
      $$SyncOutboxEntriesTableTableManager(_db, _db.syncOutboxEntries);
}
