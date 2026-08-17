import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'daos/case_dao.dart';
import 'daos/hearing_dao.dart';
import 'daos/client_dao.dart';
import 'daos/fee_dao.dart';
import 'daos/outbox_dao.dart';

part 'database.g.dart';

// ── Table definitions ─────────────────────────────────────────────────────────

class Cases extends Table {
  TextColumn    get id            => text()();
  TextColumn    get chamberId     => text()();
  TextColumn    get caseNo        => text()();
  IntColumn     get caseYear      => integer().nullable()();
  TextColumn    get court         => text()();
  TextColumn    get courtName     => text().nullable()();
  TextColumn    get courtRoom     => text().nullable()();
  TextColumn    get judgeName     => text().nullable()();
  TextColumn    get caseType      => text()();
  TextColumn    get actsSections  => text().nullable()();
  TextColumn    get policeStation => text().nullable()();
  TextColumn    get onBehalf      => text()();
  TextColumn    get stage         => text().nullable()();
  TextColumn    get priority      => text().withDefault(const Constant('medium'))();
  TextColumn    get status        => text().withDefault(const Constant('active'))();
  TextColumn    get clientId      => text().nullable()();
  DateTimeColumn get filingDate   => dateTime().nullable()();
  DateTimeColumn get nextDate     => dateTime().nullable()();
  TextColumn    get lastOutcome   => text().nullable()();
  IntColumn     get rev           => integer().withDefault(const Constant(0))();
  DateTimeColumn get updatedAt    => dateTime()();
  DateTimeColumn get deletedAt    => dateTime().nullable()();
  @override Set<Column> get primaryKey => {id};
}

class Hearings extends Table {
  TextColumn    get id              => text()();
  TextColumn    get caseId          => text()();
  TextColumn    get chamberId       => text()();
  DateTimeColumn get date           => dateTime()();
  TextColumn    get purpose         => text().nullable()();
  TextColumn    get outcome         => text().nullable()();
  TextColumn    get note            => text().nullable()();
  TextColumn    get voiceNotePath   => text().nullable()();
  BoolColumn    get attended        => boolean().withDefault(const Constant(false))();
  TextColumn    get appearingUserId => text().nullable()();
  IntColumn     get rev             => integer().withDefault(const Constant(0))();
  DateTimeColumn get updatedAt      => dateTime()();
  DateTimeColumn get deletedAt      => dateTime().nullable()();
  @override Set<Column> get primaryKey => {id};
}

class Clients extends Table {
  TextColumn    get id         => text()();
  TextColumn    get chamberId  => text()();
  TextColumn    get name       => text()();
  TextColumn    get phone      => text().nullable()();
  TextColumn    get altPhone   => text().nullable()();
  TextColumn    get email      => text().nullable()();
  TextColumn    get nid        => text().nullable()();
  TextColumn    get address    => text().nullable()();
  TextColumn    get fileNo     => text().nullable()();
  TextColumn    get note       => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  @override Set<Column> get primaryKey => {id};
}

class FeeEntries extends Table {
  TextColumn    get id         => text()();
  TextColumn    get caseId     => text()();
  TextColumn    get chamberId  => text()();
  TextColumn    get type       => text()();
  RealColumn    get amount     => real()();
  DateTimeColumn get date      => dateTime()();
  TextColumn    get method     => text().nullable()();
  TextColumn    get note       => text().nullable()();
  TextColumn    get receiptNo  => text().nullable()();
  DateTimeColumn get createdAt => dateTime()();
  @override Set<Column> get primaryKey => {id};
}

class Documents extends Table {
  TextColumn    get id          => text()();
  TextColumn    get caseId      => text()();
  TextColumn    get chamberId   => text()();
  TextColumn    get kind        => text()();
  TextColumn    get title       => text()();
  TextColumn    get storageKey  => text()();
  IntColumn     get pageCount   => integer()();
  IntColumn     get sizeBytes   => integer()();
  TextColumn    get ocrText     => text().nullable()();
  BoolColumn    get localOnly   => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt  => dateTime()();
  DateTimeColumn get deletedAt  => dateTime().nullable()();
  @override Set<Column> get primaryKey => {id};
}

class SyncOutboxEntries extends Table {
  TextColumn    get opId       => text()();
  TextColumn    get entity     => text()();
  TextColumn    get entityId   => text()();
  TextColumn    get opType     => text()();
  IntColumn     get rev        => integer()();
  TextColumn    get dataJson   => text()();
  DateTimeColumn get createdAt => dateTime()();
  BoolColumn    get applied    => boolean().withDefault(const Constant(false))();
  IntColumn     get retryCount => integer().withDefault(const Constant(0))();
  @override Set<Column> get primaryKey => {opId};
}

// ── Database ──────────────────────────────────────────────────────────────────

@DriftDatabase(tables: [
  Cases, Hearings, Clients, FeeEntries, Documents, SyncOutboxEntries
], daos: [
  CaseDao, HearingDao, ClientDao, FeeDao, OutboxDao
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      // Add migration steps here as schema evolves
    },
  );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'lawyer_diary_v1.sqlite'));
    return NativeDatabase.createInBackground(file, logStatements: false);
  });
}
