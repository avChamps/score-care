# ScoreCare Project Documentation

## 1. Project Overview

ScoreCare is a credit intelligence platform built for web and mobile users. The product helps customers check their credit score, view credit report details, understand credit health, get AI-assisted insights, manage loans, track disputes, request CIBIL repair support, and access subscription-based services.

The application is built as a responsive Next.js frontend and packaged as native Android and iOS apps using Capacitor.

## 2. Business Purpose

ScoreCare is designed to provide customers with a single digital platform for:

- Credit score monitoring
- Credit report access
- AI-based credit insights
- Credit improvement guidance
- CIBIL repair request management
- Loan and EMI-related workflows
- Personalized offers
- Notifications and support
- Admin monitoring and operations

## 3. User Roles

### Customer

Customers can log in, view their dashboard, check credit reports, manage score improvement actions, apply for loans, view offers, raise disputes, manage profile details, and purchase subscription or repair services.

### Admin

Admins can access a protected admin dashboard to monitor platform activity, users, loans, subscriptions, chats, and help/support sections.

## 4. Main Modules

### Public Website

The public website presents ScoreCare services and helps visitors understand the product before logging in or signing up.

Included pages:

- Home
- Credit Score
- Credit Report
- AI Analysis
- CIBIL Repair
- Pricing
- About
- Blog
- Help Center
- Contact
- Privacy Policy
- Terms and Conditions
- Refund Policy

### Authentication

The login flow supports mobile-number-based OTP authentication.

Authentication-related features:

- Send OTP
- Verify OTP
- Store user session token
- Fetch user profile
- Redirect logged-in users to dashboard
- Redirect expired or unauthenticated users to login
- Logout and session cleanup

### Customer Dashboard

The customer dashboard is the main logged-in experience.

Included features:

- Credit score summary
- Credit health overview
- Credit report access
- AI credit assistant
- Report download
- Credit improvement actions
- Subscription prompt
- Notifications
- User profile details
- Language preference
- Account deletion flow

### Credit Report

The credit report module allows users to fetch and view credit report information.

Included features:

- CIBIL display data
- CRIF report data
- Credit report download
- Cached report display for faster user experience
- AI explanation of credit report insights

### CIBIL Repair / Score Improvement

The score improvement module helps users identify credit issues and start a repair journey.

Included features:

- Credit improvement plan
- Repair service content
- Repair request status
- User repair request history
- Document upload
- Payment order creation
- Razorpay payment flow
- Repair request submission after payment

### Dispute Centre

The dispute centre allows users to view and create disputes related to credit report issues.

Included features:

- Dispute list
- New dispute submission
- Authenticated dispute API integration

### Loans

The loans module allows users to check loan status and submit loan applications.

Included features:

- Loan status
- Loan options
- Loan application form
- EMI/payment-oriented dashboard entry points

### Offers

The offers section displays eligible or available offers for logged-in users.

### Notifications

The notification module supports user notifications and device registration.

Included features:

- Notification listing
- Mark all notifications as read
- Push notification registration
- Native mobile push support

### Admin Dashboard

The admin area is role-protected and available only for admin users.

Included sections:

- Admin overview
- Users
- Loans
- Subscriptions
- Chats
- Help

Admin dashboard metrics include:

- Total users
- New users
- Subscriptions
- Revenue amount
- Upcoming overdues
- Total messages
- Loan pipeline status

## 5. Technology Stack

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16 |
| UI Library | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | lucide-react |
| Animation | framer-motion |
| Mobile App Wrapper | Capacitor 7 |
| Android | Native Android project under `android/` |
| iOS | Native iOS project under `ios/` |
| Payments | Razorpay |
| Analytics | Firebase Analytics |
| Crash Reporting | Firebase Crashlytics |
| Push Notifications | Firebase Messaging / Capacitor Push Notifications |
| API Communication | Fetch / Capacitor HTTP |

## 6. Platform Support

ScoreCare supports:

- Responsive web browser experience
- Android app build through Capacitor
- iOS app build through Capacitor

The app uses the static export output folder `out/` as the web source for native mobile builds.

## 7. API Configuration

The frontend communicates with the backend API using the configured base URL:

```text
https://scorecareapp.com/api
```

The API base URL can also be overridden using:

```text
NEXT_PUBLIC_API_BASE_URL
```

## 8. Key API Areas Used By Frontend

The frontend integrates with backend APIs for:

- OTP authentication
- User profile
- User language preference
- Credit reports
- Report downloads
- AI assistant
- Subscription plans
- Razorpay payment confirmation
- CIBIL repair content
- CIBIL repair requests
- Credit repair document upload
- Loan options and loan applications
- Disputes
- Notifications
- Notification preferences
- Device registration for push notifications
- Feedback
- Admin dashboard analytics
- Admin user, loan, subscription, chat, and help data

## 9. Important Routes

| Route | Purpose |
| --- | --- |
| `/` | Public homepage |
| `/login` | Customer login |
| `/signup` | Signup / onboarding |
| `/credit-score` | Credit score landing page |
| `/report` | Credit report page |
| `/ai-analysis` | AI analysis page |
| `/cibil-repair` | CIBIL repair landing page |
| `/pricing` | Pricing page |
| `/about` | Company page |
| `/blog` | Blog page |
| `/help-center` | Help center |
| `/contact` | Contact page |
| `/dashboard` | Customer dashboard |
| `/dashboard/credit-score` | Credit report and score details |
| `/dashboard/score-fix` | Score improvement / repair tools |
| `/dashboard/score-fix/cibil-repair-summary` | Repair payment and request summary |
| `/dashboard/dispute-centre` | Dispute centre |
| `/dashboard/dispute-centre/new` | New dispute request |
| `/dashboard/loans` | Loans and EMI section |
| `/dashboard/offers` | Offers section |
| `/dashboard/bill-payments` | Bill payment categories |
| `/notifications` | Notifications |
| `/profile` | User profile |
| `/dashboard/admin` | Admin dashboard |
| `/dashboard/admin/users` | Admin users |
| `/dashboard/admin/loans` | Admin loans |
| `/dashboard/admin/subscriptions` | Admin subscriptions |
| `/dashboard/admin/chats` | Admin chats |
| `/dashboard/admin/help` | Admin help |
| `/privacy-policy` | Privacy policy |
| `/terms` | Terms and conditions |
| `/refund-policy` | Refund policy |

## 10. Mobile App Configuration

Capacitor app configuration:

```text
App Name: ScoreCare
App ID: com.scorecareapp.scorecare
Web Directory: out
Start Path: /loading.html
```

Native app features include:

- App lifecycle tracking
- Network plugin support
- Push notifications
- Firebase Analytics
- Firebase Crashlytics
- Native Razorpay payment bridge
- Native report download support

## 11. Payment Integration

ScoreCare uses Razorpay for paid flows.

Payment areas include:

- Subscription purchase
- CIBIL repair payment

The app supports:

- Web Razorpay checkout
- Native Razorpay checkout in mobile app
- Payment confirmation with backend API
- Request creation after successful repair payment

## 12. Security And Session Handling

Security-related behavior implemented in the frontend:

- Token-based authenticated API requests
- Automatic redirect to login for missing or expired sessions
- Session cleanup on logout
- Admin route access controlled by backend profile role
- API timeout and retry handling
- Native HTTP support for mobile app requests

## 13. Deployment Overview

The project is configured as a static export Next.js application.

Deployment output:

```text
out/
```

The included Netlify configuration publishes the static output folder.

Native app builds use the same exported web output through Capacitor.

## 14. Project Folder Summary

| Folder / File | Purpose |
| --- | --- |
| `app/` | Next.js pages, layouts, and route-level experiences |
| `components/` | Shared UI, layout, dashboard, and auth components |
| `lib/` | Shared API, session, payment, cache, and utility logic |
| `src/` | Native/mobile hooks, analytics, and push notification helpers |
| `public/` | Public images, icons, and media assets |
| `android/` | Android Capacitor project |
| `ios/` | iOS Capacitor project |
| `scripts/` | Build and asset cleanup scripts |
| `out/` | Static export output |

## 15. Current Status

The frontend is implemented with live API integration points for authentication, profile, reports, subscriptions, loans, disputes, notifications, AI assistant, CIBIL repair, and admin analytics.

The project is ready to be shared as a client-facing product build for review, testing, and further backend/API validation.

## 16. Recommended Client Review Checklist

- Verify public website content and contact details
- Verify pricing and subscription plan details
- Test login and OTP flow
- Test credit report fetch and download
- Test subscription payment flow
- Test CIBIL repair payment and request creation
- Test loan application flow
- Test dispute creation flow
- Test notifications on Android and iOS
- Verify admin access and dashboard data
- Review privacy policy, terms, and refund policy
- Validate Android and iOS app behavior before store submission
