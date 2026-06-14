import { Capacitor, CapacitorHttp, type HttpOptions } from "@capacitor/core";

const fallbackApiBaseUrl = "https://scorecareapp.com/api";

export const API_BASE_URL = sanitizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) || fallbackApiBaseUrl;

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

  try {
    if (Capacitor.isNativePlatform()) {
      const nativeOptions: HttpOptions = {
        url: apiUrl(path),
        method,
        headers,
        data: options.body,
        connectTimeout: 20000,
        readTimeout: 20000,
      };
      const response = await CapacitorHttp.request(nativeOptions);

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: async () => response.data ?? null,
      };
    }

    return await fetch(apiUrl(path), {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    console.error("[ScoreCare] API request failed", { path, error });

    return {
      ok: false,
      status: 0,
      json: async () => null,
    };
  }
}

function sanitizeApiBaseUrl(value: string | undefined) {
  const apiBaseUrl = value?.trim().replace(/\/$/, "");

  if (!apiBaseUrl || /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiBaseUrl)) {
    return "";
  }

  return apiBaseUrl;
}
