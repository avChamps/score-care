# App Store Checklist

## Metadata

- App Name: ScoreCare
- Bundle Identifier: com.scorecareapp.scorecare
- Version: 1.0
- Build Number: 1
- Category: Finance
- Support URL configured.
- Privacy Policy URL configured.

## Build

- `NEXT_PUBLIC_API_BASE_URL` set to production HTTPS API.
- `npm run ios:sync` completes.
- CocoaPods install completes in `ios/App`.
- Archive validates in Xcode or Codemagic.
- IPA uploads to App Store Connect.

## Review risks

- Credit report and PAN consent text must be clear before data collection.
- Privacy labels must disclose credit, identity, contact, payment, diagnostics, and analytics data.
- Paid services must match displayed pricing, refund policy, and subscription terms.
- Any iOS push notification usage requires APNs setup and user permission messaging.
- Razorpay web checkout inside iOS WebView must be tested on a physical device.

## Remaining manual steps

- Add Apple signing assets in Codemagic.
- Create App Store Connect app record.
- Upload screenshots and app preview assets.
- Complete App Privacy and Export Compliance.
- Run a physical iPhone smoke test before submission.

