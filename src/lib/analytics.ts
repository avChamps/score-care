"use client";

import { Capacitor } from "@capacitor/core";
import { canUseNativeMetaEvents, nativeMetaEvents } from "@/lib/native-meta-events";

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
  "currency",
  "page_name",
  "payment_status",
  "plan_public_id",
  "report_available",
  "subscription_status",
  "value",
]);

export async function trackEvent(eventName: string, params: SafeAnalyticsParams = {}) {
  if (!allowedEvents.has(eventName)) {
    return;
  }

  trackMetaEvent(eventName, params);
  void trackNativeMetaEvent(eventName, params);

  if (!isNativeAndroid()) {
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

function trackMetaEvent(eventName: string, params: SafeAnalyticsParams) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  const metaEvent = mapMetaEvent(eventName);

  if (!metaEvent) {
    return;
  }

  const safeParams = sanitizeParams(params);
  const metaParams = {
    content_ids: safeParams.plan_public_id ? [String(safeParams.plan_public_id)] : undefined,
    content_type: safeParams.plan_public_id ? "subscription_plan" : undefined,
    currency: typeof safeParams.currency === "string" ? safeParams.currency : "INR",
    status: safeParams.payment_status ?? safeParams.subscription_status,
    value: typeof safeParams.value === "number" ? safeParams.value : undefined,
  };

  window.fbq("track", metaEvent, Object.fromEntries(Object.entries(metaParams).filter(([, value]) => value !== undefined)));
}

async function trackNativeMetaEvent(eventName: string, params: SafeAnalyticsParams) {
  if (typeof window === "undefined" || !canUseNativeMetaEvents()) {
    return;
  }

  const nativeEvent = mapNativeMetaEvent(eventName);

  if (!nativeEvent) {
    return;
  }

  try {
    const payload = createNativeMetaPayload(params);
    await nativeMetaEvents.logEvent({
      name: nativeEvent,
      params: payload.params,
      value: payload.value,
    });
  } catch {
    // Native Meta App Events is best-effort only.
  }
}

function mapMetaEvent(eventName: string) {
  const eventMap: Record<string, string> = {
    consent_accepted: "CompleteRegistration",
    login_started: "Lead",
    otp_requested: "Contact",
    pan_submitted: "SubmitApplication",
    razorpay_payment_started: "InitiateCheckout",
    razorpay_payment_success: "Purchase",
    subscription_activated: "Subscribe",
    subscription_plan_viewed: "ViewContent",
  };

  return eventMap[eventName] ?? "";
}

function mapNativeMetaEvent(eventName: string) {
  const eventMap: Record<string, string> = {
    app_open: "fb_mobile_activate_app",
    consent_accepted: "fb_mobile_complete_registration",
    credit_report_viewed: "credit_report_viewed",
    dashboard_viewed: "dashboard_viewed",
    loan_page_viewed: "loan_page_viewed",
    login_started: "Lead",
    otp_requested: "Contact",
    otp_verified: "otp_verified",
    pan_submitted: "SubmitApplication",
    pdf_report_downloaded: "pdf_report_downloaded",
    razorpay_payment_failed: "razorpay_payment_failed",
    razorpay_payment_started: "fb_mobile_initiated_checkout",
    razorpay_payment_success: "fb_mobile_purchase",
    score_improve_viewed: "score_improve_viewed",
    subscription_activated: "Subscribe",
    subscription_plan_viewed: "fb_mobile_content_view",
  };

  return eventMap[eventName] ?? "";
}

function createNativeMetaPayload(params: SafeAnalyticsParams) {
  const safeParams = sanitizeParams(params);
  const nativeParams: Record<string, string | number | boolean> = {};

  if (typeof safeParams.currency === "string") {
    nativeParams.fb_currency = safeParams.currency;
  } else {
    nativeParams.fb_currency = "INR";
  }

  if (safeParams.plan_public_id) {
    nativeParams.fb_content_id = String(safeParams.plan_public_id);
    nativeParams.fb_content_type = "subscription_plan";
  }

  if (safeParams.payment_status) {
    nativeParams.payment_status = String(safeParams.payment_status);
  }

  if (safeParams.subscription_status) {
    nativeParams.subscription_status = String(safeParams.subscription_status);
  }

  if (typeof safeParams.report_available === "boolean") {
    nativeParams.report_available = safeParams.report_available;
  }

  return {
    params: nativeParams,
    value: typeof safeParams.value === "number" ? safeParams.value : undefined,
  };
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
