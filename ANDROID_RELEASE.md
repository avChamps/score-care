# Android Play Release

Use an upload keystore for Play releases and keep the keystore plus passwords out of git.

Expected keystore location:

```txt
android/app/scorecare-upload-key.jks
```

Add signing values to `android/local.properties`, `android/gradle.properties`, or your shell environment:

```properties
SCORECARE_UPLOAD_STORE_FILE=scorecare-upload-key.jks
SCORECARE_UPLOAD_KEY_ALIAS=scorecare
SCORECARE_UPLOAD_STORE_PASSWORD=change-this-locally
SCORECARE_UPLOAD_KEY_PASSWORD=change-this-locally
```

Build the signed Android App Bundle:

```bash
npm run build
npx cap sync android
cd android
./gradlew clean
./gradlew bundleRelease
```

On Windows PowerShell you can use:

```powershell
npm run android:aab
```

Output:

```txt
android/app/build/outputs/bundle/release/app-release.aab
```

Release notes:

- Production builds use `https://scorecareapp.com/api`.
- Development builds may override the API URL with `NEXT_PUBLIC_API_BASE_URL`.
- Release builds fail fast when signing properties are missing.
- `POST_NOTIFICATIONS` is intentionally kept because native Android push notifications are implemented.
- `android:usesCleartextTraffic` is disabled for release safety; all release API and asset URLs must be HTTPS.

## Firebase Analytics and Crashlytics

Firebase Console setup:

1. Create or open the Firebase project for ScoreCare.
2. Add an Android app with package name `in.scorecare.app`.
3. Download `google-services.json`.
4. Place it at `android/app/google-services.json`.
5. Do not place Firebase config files in `public/` or any Next.js web asset directory.

Debug verification:

```bash
npm run build
npx cap sync android
cd android
./gradlew clean
./gradlew assembleDebug
```

Analytics DebugView:

```bash
adb shell setprop debug.firebase.analytics.app in.scorecare.app
```

Open the app and check Firebase Console > Analytics > DebugView.

Crashlytics test:

1. Import `triggerTestCrash` from `src/lib/analytics` in a local-only/dev-only debug path.
2. Call it only when `process.env.NODE_ENV !== "production"`.
3. Install the debug app, trigger the crash, reopen the app, and check Firebase Console > Crashlytics.

Production release builds use Crashlytics automatic crash/ANR reporting. Mapping file upload is wired through the Crashlytics Gradle plugin; no mapping file is uploaded while `minifyEnabled false`.
