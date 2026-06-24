# iOS Deployment

## App metadata

- App Name: ScoreCare
- Bundle Identifier: com.scorecareapp.scorecare
- Version: 1.0
- Build Number: 1
- Web Directory: out
- Capacitor: 7
- iOS Deployment Target: 14.0

## Required environment variables

```bash
NEXT_PUBLIC_API_BASE_URL=https://scorecareapp.com/api
```

## Build commands

```bash
npm run ios:sync
```

## Release commands

```bash
xcodebuild -workspace ios/App/App.xcworkspace -scheme App -configuration Release -archivePath build/ScoreCare.xcarchive archive
xcodebuild -exportArchive -archivePath build/ScoreCare.xcarchive -exportPath build/ios -exportOptionsPlist ExportOptions.plist
```

## Apple Developer requirements

- Active Apple Developer Program membership.
- App Store Connect access with Admin, App Manager, or Developer role.
- Bundle ID registered as `com.scorecareapp.scorecare`.
- App Store distribution certificate.
- App Store provisioning profile for `com.scorecareapp.scorecare`.
- App privacy answers for credit, identity, contact, payment, diagnostics, and analytics data.

## App Store Connect setup

1. Create the app in App Store Connect with Bundle ID `com.scorecareapp.scorecare`.
2. Set the app name to `ScoreCare`.
3. Set SKU to an internal unique value.
4. Complete pricing, availability, age rating, privacy nutrition labels, and support URLs.
5. Upload screenshots for required iPhone and iPad sizes if iPad remains enabled.

## Bundle ID configuration

- Identifier: `com.scorecareapp.scorecare`
- Capabilities to enable only if used in production:
  - Push Notifications
  - Associated Domains
  - Sign in with Apple

## Certificate requirements

- Apple Distribution certificate.
- App Store provisioning profile for `com.scorecareapp.scorecare`.
- APNs key or certificate only if iOS push notifications are enabled.

## IPA generation process

1. Set Codemagic environment variables.
2. Run `npm run ios:sync`.
3. Install CocoaPods in `ios/App`.
4. Archive `ios/App/App.xcworkspace`.
5. Export the archive with App Store export options.

## App Store submission process

1. Upload IPA to App Store Connect.
2. Select the uploaded build for the app version.
3. Complete export compliance.
4. Complete data safety/privacy declarations.
5. Submit for review.

