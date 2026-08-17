import 'package:drift/drift.dart';
import '../database.dart';

part 'client_dao.g.dart';

@DriftAccessor(tables: [Clients])
class ClientDao extends DatabaseAccessor<AppDatabase> with _$ClientDaoMixin {
  ClientDao(super.db);

  Stream<List<Client>> watchClients(String chamberId, {String? query}) {
    return (select(clients)
      ..where((c) {
        Expression<bool> expr =
            c.chamberId.equals(chamberId) & c.deletedAt.isNull();
        if (query != null && query.trim().isNotEmpty) {
          final q = '%${query.trim()}%';
          expr = expr & (c.name.like(q) | c.phone.like(q));
        }
        return expr;
      })
      ..orderBy([(c) => OrderingTerm.asc(c.name)]))
      .watch();
  }

  Future<Client?> getClient(String id) =>
      (select(clients)..where((c) => c.id.equals(id))).getSingleOrNull();

  Future<void> upsertClient(ClientsCompanion c) =>
      into(clients).insertOnConflictUpdate(c);

  Future<void> softDelete(String id) =>
      (update(clients)..where((c) => c.id.equals(id))).write(
        ClientsCompanion(deletedAt: Value(DateTime.now())),
      );
}
