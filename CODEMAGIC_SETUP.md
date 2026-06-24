# Codemagic Setup

## Environment variables

```bash
NEXT_PUBLIC_API_BASE_URL=https://scorecareapp.com/api
APP_STORE_CONNECT_ISSUER_ID=
APP_STORE_CONNECT_KEY_IDENTIFIER=
APP_STORE_CONNECT_PRIVATE_KEY=
CERTIFICATE_PRIVATE_KEY=
```

Store signing certificates and provisioning profiles in Codemagic code signing, not in source control.

## Workflow

```yaml
workflows:
  ios-app-store:
    name: iOS App Store
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      node: latest
      xcode: latest
      cocoapods: default
      vars:
        NEXT_PUBLIC_API_BASE_URL: https://scorecareapp.com/api
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.scorecareapp.scorecare
    scripts:
      - name: Install dependencies
        script: npm ci
      - name: Build and sync iOS
        script: npm run ios:sync
      - name: Install pods
        script: cd ios/App && pod install
      - name: Build IPA
        script: |
          xcode-project build-ipa \
            --workspace ios/App/App.xcworkspace \
            --scheme App
    artifacts:
      - build/ios/ipa/*.ipa
      - /tmp/xcodebuild_logs/*.log
    publishing:
      app_store_connect:
        auth: integration
        submit_to_testflight: true
```

## Manual checks before first build

- Confirm App Store Connect app exists for `com.scorecareapp.scorecare`.
- Confirm Codemagic signing profile maps to `com.scorecareapp.scorecare`.
- Confirm `NEXT_PUBLIC_API_BASE_URL` points to the production HTTPS API.
- Confirm Firebase iOS config is added before enabling iOS analytics, Crashlytics, or push.

