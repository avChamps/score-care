import { apiRequest } from "@/lib/api";

const cibilDisplayCacheKey = "scorecare_cibil_display_data";
const cibilDisplayCacheTokenKey = "scorecare_cibil_display_token";

let inFlightDisplayRequest: Promise<unknown> | null = null;

export class CibilDisplayDataError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CibilDisplayDataError";
    this.status = status;
  }
}

export function clearCachedCibilDisplayData() {
  sessionStorage.removeItem(cibilDisplayCacheKey);
  sessionStorage.removeItem(cibilDisplayCacheTokenKey);
  inFlightDisplayRequest = null;
}

export async function getCachedCibilDisplayData(token: string, { forceRefresh = false }: { forceRefresh?: boolean } = {}) {
  if (!forceRefresh) {
    const cachedData = readCachedCibilDisplayData(token);

    if (cachedData) {
      return cachedData;
    }

    if (inFlightDisplayRequest) {
      return inFlightDisplayRequest;
    }
  }

  inFlightDisplayRequest = fetchCibilDisplayData(token);

  try {
    return await inFlightDisplayRequest;
  } finally {
    inFlightDisplayRequest = null;
  }
}

function readCachedCibilDisplayData(token: string) {
  try {
    if (sessionStorage.getItem(cibilDisplayCacheTokenKey) !== token) {
      clearCachedCibilDisplayData();
      return null;
    }

    const cachedValue = sessionStorage.getItem(cibilDisplayCacheKey);

    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch {
    clearCachedCibilDisplayData();
    return null;
  }
}

async function fetchCibilDisplayData(token: string) {
  const response = await apiRequest("/credit-reports/cibil/display-data", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();

  if (!response.ok) {
    throw new CibilDisplayDataError(readApiMessage(result) || "Unable to load CIBIL display data", response.status);
  }

  sessionStorage.setItem(cibilDisplayCacheKey, JSON.stringify(result));
  sessionStorage.setItem(cibilDisplayCacheTokenKey, token);
  window.dispatchEvent(new CustomEvent("scorecare:cibil-display-updated", { detail: result }));

  return result;
}

function readApiMessage(result: unknown) {
  if (result && typeof result === "object" && "message" in result && typeof result.message === "string") {
    return result.message;
  }

  return "";
}
