import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'core/utils/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Portrait only — lawyers use phones one-handed in court
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Transparent status bar — app bar bleeds into it
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor:       Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));

  // Init notifications (channels + timezone)
  await NotificationService.init();

  // AdMob init is deferred until first frame via AdMobService (premium-aware).
  // TODO: MobileAds.instance.initialize() after flutterfire / consent if needed.

  runApp(
    const ProviderScope(
      child: LawyerDiaryApp(),
    ),
  );
}
