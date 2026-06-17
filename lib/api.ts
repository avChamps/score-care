import { Capacitor, CapacitorHttp, type HttpOptions } from "@capacitor/core";

const PRODUCTION_API_BASE_URL = "https://scorecareapp.com/api";
const DEVELOPMENT_API_BASE_URL = "http://192.168.1.7:5000/";

export const API_BASE_URL = process.env.NODE_ENV === "development"
  ? normalizeApiBaseUrl(DEVELOPMENT_API_BASE_URL)
  : PRODUCTION_API_BASE_URL;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (API_BASE_URL.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

type ApiRequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: "GET" | "POST" | "PATCH";
  retry?: number;
  timeoutMs?: number;
};

type ApiFetchOptions = RequestInit & {
  retry?: number;
  timeoutMs?: number;
};

const DEFAULT_API_TIMEOUT_MS = 15000;
const RETRY_DELAY_MS = 600;
const inFlightRequests = new Map<string, Promise<ApiResponse>>();

type ApiResponse = Pick<Response, "ok" | "status" | "json">;

export async function apiRequest(path: string, options: ApiRequestOptions = {}): Promise<ApiResponse> {
  const method = options.method ?? "GET";
  const requestKey = buildRequestKey(path, method, options);

  if (requestKey && inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey)!;
  }

  const request = requestWithRetry(path, options, method);

  if (requestKey) {
    inFlightRequests.set(requestKey, request);
    request.finally(() => inFlightRequests.delete(requestKey));
  }

  return request;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const retryCount = options.retry ?? (options.method === "GET" || !options.method ? 1 : 0);

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await sendApiFetch(path, options);

      if (response.status === 401 || response.status === 403) {
        notifySessionExpired();
      }

      if (response.status >= 500 && attempt < retryCount) {
        await wait(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt >= retryCount) {
        throw error;
      }

      await wait(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error("API request failed");
}

async function requestWithRetry(path: string, options: ApiRequestOptions, method: "GET" | "POST" | "PATCH") {
  const retryCount = options.retry ?? (method === "GET" ? 1 : 0);

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const response = await sendApiRequest(path, options, method);

      if (response.status === 401 || response.status === 403) {
        notifySessionExpired();
      }

      if (response.status >= 500 && attempt < retryCount) {
        await wait(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt >= retryCount) {
        throw error;
      }

      await wait(RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error("API request failed");
}

async function sendApiRequest(path: string, options: ApiRequestOptions, method: "GET" | "POST" | "PATCH") {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let requestBody: BodyInit | undefined;

  if (typeof FormData !== "undefined" && options.body instanceof FormData) {
    requestBody = options.body;
  } else if (options.body !== undefined) {
    requestBody = JSON.stringify(options.body);
  }

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (Capacitor.isNativePlatform()) {
    const nativeOptions: HttpOptions = {
      url: apiUrl(path),
      method,
      headers,
      data: options.body,
      connectTimeout: options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS,
      readTimeout: options.timeoutMs ?? DEFAULT_API_TIMEOUT_MS,
    };
    const response = await CapacitorHttp.request(nativeOptions);

    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: async () => response.data,
    };
  }

  return apiFetch(path, {
    method,
    headers,
    body: requestBody,
    timeoutMs: options.timeoutMs,
    retry: 0,
  });
}

async function sendApiFetch(path: string, options: ApiFetchOptions) {
  const { timeoutMs } = options;
  const fetchOptions: RequestInit = { ...options };
  delete (fetchOptions as ApiFetchOptions).retry;
  delete (fetchOptions as ApiFetchOptions).timeoutMs;
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_API_TIMEOUT_MS);

  try {
    return await fetch(apiUrl(path), {
      ...fetchOptions,
      signal: controller.signal,
    });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function buildRequestKey(path: string, method: string, options: ApiRequestOptions) {
  if (method !== "GET") {
    return "";
  }

  return `${method}:${path}:${options.headers?.Authorization ?? ""}`;
}

function notifySessionExpired() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("scorecare:session-expired"));
}

function wait(ms: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, ms));
}

function normalizeApiBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}
