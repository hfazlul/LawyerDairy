# Mobile — Flutter (Android)

## Prerequisites (this machine)

Flutter was installed at `C:\flutter` (stable **3.44.9**). Git at `C:\Program Files\Git`.

```powershell
$env:Path = "C:\Program Files\Git\cmd;C:\flutter\bin;" + $env:Path
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
```

Add those permanently via System Environment Variables if you want them every session.

```bash
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
# or sideload:
flutter build apk --debug
# APK → build/app/outputs/flutter-apk/app-debug.apk
```

**Note:** Machine RAM is ~3GB — keep Gradle heap low (`android/gradle.properties` already uses `-Xmx1024m`). Close heavy apps before building.

## Debug API base URL

Config: `lib/core/config/api_config.dart`

| Target | Default (debug) |
|--------|-----------------|
| Android **emulator** | `http://10.0.2.2:3000` |
| iOS simulator | `http://127.0.0.1:3000` |
| **Physical device** | Pass LAN IP (same Wi‑Fi as PC running webapp) |

```bash
# Physical device → PC LAN IP (example)
flutter run --dart-define=API_BASE=http://192.168.0.99:3000
# or force LAN constant in api_config.dart:
flutter run --dart-define=USE_LAN_API=true

# Release still uses https://api.lawyerdiarybd.com unless API_BASE is set
```

Webapp must be running on port **3000**. Cleartext HTTP is allowed for debug via Android network security config.

## Temporarily disabled plugins (debug / AGP 9)

These were commented in `pubspec.yaml` because they break Flutter 3.44 + AGP 9 or OOM this PC:

- `google_mobile_ads` (Gradle `configurations.all`)
- `flutter_doc_scanner` (cross-drive Kotlin incremental)
- `workmanager` 0.5.2 (removed Flutter v1 embedding)
- `firebase_*` (optional; not wired yet)
- `printing` (old compileSdk 30)

Re-enable with newer plugin versions when targeting production.

## Jurisdiction

- First open: soft-suggest country + language → **user confirms** (`/onboarding`).
- Law packs: `BD` | `PK` | `IN` (content). UI: `bn` | `en` | `ur`.
- Home + Settings show **country name + flag**.
- BD-only tools (খতিয়ান) hidden unless jurisdiction == BD.

## Monetization

| Jurisdiction | Settings |
|--------------|----------|
| BD | Active / Inactive only — **no buy CTA** |
| IN / PK | Active / Inactive + **Play Billing stub** when Inactive |

- AdMob stubs: native + rewarded interstitial when Premium Inactive (`lib/core/ads/`).
- Feature gates: `lib/core/monetization/feature_gate.dart`.
- Guide video by jurisdiction: `guide_bd` / `guide_in` / `guide_pk` (`lib/core/guide/`).
- Entitlement: `GET /api/mobile/v1/entitlement` (includes `paymentRail`).

## Firebase (optional)

| Piece | Needed? |
|-------|---------|
| FCM | Recommended for push |
| Remote Config | Recommended for guide video URLs |
| Auth | No — custom JWT from webapp |
