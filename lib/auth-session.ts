export function clearScorecareSession() {
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.clear();
  }

  clearGoogleTranslateCookie();
}

export function logoutScorecareSession(navigate?: (href: string) => void) {
  clearScorecareSession();

  if (navigate) {
    navigate("/login");
    return;
  }

  if (typeof window !== "undefined") {
    window.location.replace("/login");
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
