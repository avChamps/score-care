# SCORECARE Project Document

## 1. Project Overview

SCORECARE is a premium credit intelligence web and mobile experience for users who want to check credit scores, understand credit reports, receive AI-style credit insights, manage loan repayments, and raise CIBIL score repair requests.

The project is built as a static-export Next.js application and wrapped for Android using Capacitor. It includes public marketing pages, account entry pages, legal pages, and a logged-in dashboard-style portal experience.

## 2. Objectives

- Provide a polished fintech interface for credit score monitoring and CIBIL report education.
- Present AI-powered credit analysis and credit improvement recommendations.
- Offer pricing and report purchase flows for credit monitoring and repair plans.
- Provide dashboard tools for score checks, score prediction, loan repayments, bill payments, profile management, and score repair requests.
- Support deployment as a static website and packaging as an Android app.

## 3. Target Users

- Individuals checking or improving their credit score.
- Users preparing for loan or credit card applications.
- Customers who need help correcting inaccurate CIBIL or bureau report entries.
- Small business owners and professionals who want credit-readiness insights.

## 4. Technology Stack

| Area | Technology |
| --- | --- |
| Frontend framework | Next.js 16.2.6 |
| UI runtime | React 19.2.4 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Animation | framer-motion and CSS animations |
| Utility helpers | clsx, tailwind-merge, class-variance-authority |
| Mobile wrapper | Capacitor 7 |
| Android build | Gradle Android project under `android/` |
| Static deployment | Next.js `output: "export"` |

## 5. Project Structure

```text
app/                         Next.js App Router pages and route layouts
components/layout/           Navbar, footer, logo, and app shell
components/sections/         Public website sections and shared marketing UI
components/dashboard/        Logged-in portal shell and dashboard widgets
components/ui/               Reusable UI primitives
lib/                         Shared constants and utility functions
public/                      Static public assets
android/                     Capacitor-generated Android project
out/                         Static web export output
.next/                       Next.js build output
```

## 6. Main Application Areas

### Public Website

The public site introduces SCORECARE and its services. It includes:

- Home page with hero, trust badges, features, AI showcase, pricing, testimonials, and FAQ.
- Credit score page for free credit score positioning.
- Credit report plans page.
- AI analysis page.
- CIBIL repair service page.
- Pricing page.
- About, blog, help center, contact, privacy policy, terms, and refund policy pages.

### Dashboard Portal

The dashboard is a mobile-app-like authenticated experience. Current implementation uses static/demo data and client-side state.

Dashboard sections include:

- Overview dashboard with credit score check, loan eligibility, score fix, and quick actions.
- Credit score screen with score refresh, downloadable text report, score behavior cards, and score predictor.
- Loans screen with loan repayment cards, overdue warnings, filters, and loan application dialog.
- Score Fix screen with active requests, request details, timeline, and new request form.
- Bill Payments page with grouped utility categories.
- Profile page for user, KYC, subscription, and account options.
- Notifications entry page and notification drawer behavior.

## 7. Key Routes

| Route | Purpose |
| --- | --- |
| `/` | Public homepage |
| `/credit-score` | Free credit score landing page |
| `/report` | Credit report plan and preview page |
| `/ai-analysis` | AI credit report analysis page |
| `/cibil-repair` | CIBIL repair services page |
| `/pricing` | Pricing comparison |
| `/about` | Company information |
| `/blog` | Credit strategy articles |
| `/help-center` | Support content |
| `/contact` | Contact options |
| `/login` | Login screen |
| `/signup` | Signup and OTP onboarding screen |
| `/dashboard` | Portal home |
| `/dashboard/credit-score` | CIBIL score and predictor |
| `/dashboard/loans` | Loans, EMI repayments, and loan application |
| `/dashboard/score-fix` | CIBIL repair request management |
| `/dashboard/bill-payments` | Bill payment categories |
| `/profile` | User profile and account settings |
| `/privacy-policy` | Privacy policy |
| `/terms` | Terms and conditions |
| `/refund-policy` | Refund policy |

## 8. Important Components

- `AppShell`: switches between public layout and portal layout based on route.
- `Navbar` and `Footer`: public website navigation and footer links.
- `HomeHero`: homepage hero section.
- `PageHero`: reusable page hero for public pages.
- `PortalShell`: dashboard layout with desktop sidebar and mobile bottom navigation.
- `PortalTopBar`: dashboard top bar with profile, title, and actions.
- `ScoreCheckCard`: dashboard credit score widget.
- `CreditScoreExperience`: score details, report download, and predictor.
- `LoansExperience`: loan repayment list and application dialog.
- `ScoreFixExperience`: repair request overview, details, and submission dialog.

## 9. Configuration

### Next.js

The project is configured for static export:

```ts
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};
```

Static export is required because Capacitor uses the generated `out/` folder as its web source.

### Capacitor

```ts
const config = {
  appId: "in.scorecare.app",
  appName: "ScoreCare",
  webDir: "out",
};
```

The Android app reads the exported web build from `out/`.

## 10. Setup Instructions

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the static website:

```bash
npm run build
```

Run linting:

```bash
npm run lint
```

Sync web output into Android:

```bash
npm run android:sync
```

Build a debug APK:

```bash
npm run apk:debug
```

The repository already contains a debug APK named `ScoreCare-debug.apk`.

## 11. Deployment

The app can be deployed as a static website because `next.config.ts` uses `output: "export"`. The generated static output is placed in `out/`.

The included `netlify.toml` is configured to publish the static `out/` directory.

## 12. Current Data and Behavior

The current app is primarily a frontend prototype. Many flows use static values and local React state, including:

- Credit score values and refresh behavior.
- Loan account data.
- Score prediction actions.
- Score fix request details and timeline.
- Profile and notification content.
- Contact details, pricing plans, testimonials, and FAQs.

There is no backend API, authentication service, payment gateway, database, or real credit bureau integration in the current codebase.

## 13. Known Limitations

- Demo data is hardcoded in frontend files.
- Login and signup screens are UI-only unless connected to a backend.
- Score refresh and report download are local client-side interactions.
- Loan application and score fix request forms do not submit to a server.
- Some text contains encoding artifacts for rupee symbols in `lib/site.ts`.
- No automated test suite is currently defined beyond the default Android sample tests.

## 14. Suggested Future Enhancements

- Add backend APIs for authentication, user profiles, reports, loans, and requests.
- Integrate a secure credit bureau or report provider.
- Add payment gateway support for subscriptions and report purchases.
- Add persistent storage for dashboard data.
- Add form validation and server-side submission handling.
- Add role-based admin tools for support and repair request management.
- Add automated unit, integration, and end-to-end tests.
- Fix text encoding issues for rupee symbols.
- Add production Android signing configuration.

## 15. Summary

SCORECARE is a polished fintech frontend for credit score monitoring, AI-style credit analysis, report plans, loan repayment management, and CIBIL repair support. It is currently best described as a production-ready UI prototype with static export support and Android packaging through Capacitor.
