const SCORECARE_SESSION_KEYS = [
  "scorecare_token",
  "scorecare_token_type",
  "scorecare_mobile_number",
  "scorecare_pan_number",
  "scorecare_full_name",
  "scorecare_email",
  "scorecare_date_of_birth",
];

export function clearScorecareSession() {
  SCORECARE_SESSION_KEYS.forEach((key) => sessionStorage.removeItem(key));
}

export function isTokenExpired(token: string) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : 0;

    return !expiresAt || Date.now() >= expiresAt;
  } catch {
    return true;
  }
}
