import { Capacitor, CapacitorHttp, type HttpOptions } from "@capacitor/core";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://score-care-service.onrender.com";

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

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
    };
  }

  return fetch(apiUrl(path), {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}
