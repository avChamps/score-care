"use client";

import { Capacitor } from "@capacitor/core";

type SafeAnalyticsParams = Record<string, string | number | boolean | null | undefined>;

const allowedEvents = new Set([
  "app_open",
  "login_started",
  "otp_requested",
  "otp_verified",
  "pan_submitted",
  "consent_accepted",
  "dashboard_viewed",
  "credit_report_viewed",
  "score_improve_viewed",
  "loan_page_viewed",
  "subscription_plan_viewed",
  "razorpay_payment_started",
  "razorpay_payment_success",
  "razorpay_payment_failed",
  "subscription_activated",
  "pdf_report_downloaded",
]);

const allowedParamKeys = new Set([
  "page_name",
  "payment_status",
  "plan_public_id",
  "report_available",
  "subscription_status",
]);

export async function trackEvent(eventName: string, params: SafeAnalyticsParams = {}) {
  if (!isNativeAndroid() || !allowedEvents.has(eventName)) {
    return;
  }

  try {
    const { FirebaseAnalytics } = await import("@capacitor-firebase/analytics");
    await FirebaseAnalytics.logEvent({
      name: eventName,
      params: sanitizeParams(params),
    });
  } catch {
    // Native analytics is best-effort only.
  }
}

export async function logCrashlyticsMessage(message: string) {
  if (!isNativeAndroid() || !message) {
    return;
  }

  try {
    const { FirebaseCrashlytics } = await import("@capacitor-firebase/crashlytics");
    await FirebaseCrashlytics.log({ message: sanitizeMessage(message) });
  } catch {
    // Native crash logging is best-effort only.
  }
}

export async function setSafeUserId(userPublicId?: string | null) {
  if (!isNativeAndroid() || !userPublicId) {
    return;
  }

  const safeUserId = String(userPublicId).trim();
  if (!safeUserId || hasSensitivePattern(safeUserId)) {
    return;
  }

  try {
    const [{ FirebaseAnalytics }, { FirebaseCrashlytics }] = await Promise.all([
      import("@capacitor-firebase/analytics"),
      import("@capacitor-firebase/crashlytics"),
    ]);
    await Promise.allSettled([
      FirebaseAnalytics.setUserId({ userId: safeUserId }),
      FirebaseCrashlytics.setUserId({ userId: safeUserId }),
    ]);
  } catch {
    // Native identity linking is best-effort only.
  }
}

export async function triggerTestCrash() {
  if (process.env.NODE_ENV === "production" || !isNativeAndroid()) {
    return;
  }

  try {
    const { FirebaseCrashlytics } = await import("@capacitor-firebase/crashlytics");
    await FirebaseCrashlytics.crash({ message: "ScoreCare dev test crash" });
  } catch {
    // Test crash is only available in the native Android app.
  }
}

function isNativeAndroid() {
  return typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

function sanitizeParams(params: SafeAnalyticsParams) {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([key, value]) => allowedParamKeys.has(key) && value !== undefined && value !== null)
      .map(([key, value]) => [key, typeof value === "string" ? sanitizeMessage(value) : value]),
  );
}

function sanitizeMessage(message: string) {
  return message.replace(/[^\w .:/-]/g, "").slice(0, 120);
}

function hasSensitivePattern(value: string) {
  return /^[A-Z]{5}\d{4}[A-Z]$/i.test(value) || /\S+@\S+\.\S+/.test(value) || /\d{10,}/.test(value);
}
