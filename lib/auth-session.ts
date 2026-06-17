const SCORECARE_SESSION_KEYS = [
  "scorecare_token",
  "scorecare_token_type",
  "scorecare_mobile_number",
  "scorecare_pan_number",
  "scorecare_full_name",
  "scorecare_email",
  "scorecare_date_of_birth",
  "scorecare_assistant_context",
  "scorecare_assistant_messages",
  "scorecare_cibil_display_data",
  "scorecare_cibil_display_token",
  "scorecare_cibil_score_check_data",
  "scorecare_cibil_score_check_token",
  "scorecare_cibil_score_check_payload",
  "scorecare_registered_fcm_token",
  "scorecare_android_device_id",
  "scorecare_admin_view",
  "scorecare_language",
];

export function clearScorecareSession() {
  SCORECARE_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  clearGoogleTranslateCookie();
}

export function logoutScorecareSession() {
  clearScorecareSession();

  if (typeof window !== "undefined") {
    window.location.replace("/login");
    window.setTimeout(() => {
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }, 120);
  }
}

export function isTokenExpired(token: string) {
  if (token.split(".").length !== 3) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : 0;

    return Boolean(expiresAt) && Date.now() >= expiresAt;
  } catch {
    return false;
  }
}

function clearGoogleTranslateCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (typeof window !== "undefined" && window.location.hostname) {
    document.cookie = `googtrans=;domain=${window.location.hostname};path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
