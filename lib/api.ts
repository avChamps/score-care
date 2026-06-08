import { Capacitor, CapacitorHttp, type HttpOptions } from "@capacitor/core";
import { clearScorecareSession } from "@/lib/auth-session";

export const API_BASE_URL = 'http://localhost:5000';

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type ApiRequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PATCH";
};

export async function apiRequest(path: string, options: ApiRequestOptions = {}) {
  const method = options.method ?? "GET";
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (Capacitor.isNativePlatform()) {
    const nativeOptions: HttpOptions = {
      url: apiUrl(path),
      method,
      headers,
      data: options.body,
    };
    const response = await CapacitorHttp.request(nativeOptions);
    handleNotFoundRedirect(response.status);

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
    };
  }

  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  handleNotFoundRedirect(response.status);

  return response;
}

function handleNotFoundRedirect(status: number) {
  if (status !== 404 || typeof window === "undefined") {
    return;
  }

  clearScorecareSession();

  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}
