import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// While true, an authenticated user may stay on the welcome screen.
/// Set when they press the hub back arrow. Cleared on the next successful
/// login. A new process starts this at false, so a cold start still opens
/// the diary.
final welcomeHoldProvider = Provider<ValueNotifier<bool>>((ref) {
  final hold = ValueNotifier<bool>(false);
  ref.onDispose(hold.dispose);
  return hold;
});
