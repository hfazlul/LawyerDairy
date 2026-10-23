import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// App-documents copy of the session JSON so Workmanager isolates can restore
/// when [FlutterSecureStorage] is empty in the background process.
/// Career packs do not need this; SMS / diary sync do.
class IsolateAuthSnapshot {
  IsolateAuthSnapshot({Future<Directory> Function()? documents})
      : _documents = documents ?? getApplicationDocumentsDirectory;

  static const fileName = 'isolate_auth_snapshot.json';

  final Future<Directory> Function() _documents;

  static IsolateAuthSnapshot instance = IsolateAuthSnapshot();

  Future<File> _file() async {
    final dir = await _documents();
    if (!await dir.exists()) {
      await dir.create(recursive: true);
    }
    return File('${dir.path}/$fileName');
  }

  Future<void> write(String userJson) async {
    if (userJson.isEmpty) return;
    final f = await _file();
    await f.writeAsString(userJson, flush: true);
  }

  Future<String?> read() async {
    try {
      final f = await _file();
      if (!await f.exists()) return null;
      final raw = await f.readAsString();
      return raw.isEmpty ? null : raw;
    } catch (_) {
      return null;
    }
  }

  Future<void> clear() async {
    try {
      final f = await _file();
      if (await f.exists()) await f.delete();
    } catch (_) {}
  }
}
