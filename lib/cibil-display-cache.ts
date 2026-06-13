import { apiRequest } from "@/lib/api";

const cibilDisplayCacheKey = "scorecare_cibil_display_data";
const cibilDisplayCacheTokenKey = "scorecare_cibil_display_token";
const cibilScoreCheckCacheKey = "scorecare_cibil_score_check_data";
const cibilScoreCheckCacheTokenKey = "scorecare_cibil_score_check_token";
const cibilScoreCheckCachePayloadKey = "scorecare_cibil_score_check_payload";

let inFlightDisplayRequest: Promise<unknown> | null = null;
let inFlightScoreCheckRequest: Promise<unknown> | null = null;

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
  sessionStorage.removeItem(cibilScoreCheckCacheKey);
  sessionStorage.removeItem(cibilScoreCheckCacheTokenKey);
  sessionStorage.removeItem(cibilScoreCheckCachePayloadKey);
  inFlightDisplayRequest = null;
  inFlightScoreCheckRequest = null;
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

export async function getCachedCibilScoreCheckData(token: string, payload: unknown) {
  const payloadKey = JSON.stringify(payload);
  const cachedData = readCachedCibilScoreCheckData(token, payloadKey);

  if (cachedData) {
    return cachedData;
  }

  if (inFlightScoreCheckRequest) {
    return inFlightScoreCheckRequest;
  }

  inFlightScoreCheckRequest = fetchCibilScoreCheckData(token, payload, payloadKey);

  try {
    return await inFlightScoreCheckRequest;
  } finally {
    inFlightScoreCheckRequest = null;
  }
}

export function getStoredCibilScoreCheckData(token: string, payload: unknown) {
  return readCachedCibilScoreCheckData(token, JSON.stringify(payload));
}

export function getStoredLatestCibilScoreCheckData(token: string) {
  try {
    if (sessionStorage.getItem(cibilScoreCheckCacheTokenKey) !== token) {
      return null;
    }

    const cachedValue = sessionStorage.getItem(cibilScoreCheckCacheKey);

    return cachedValue ? normalizeCibilDisplayData(JSON.parse(cachedValue)) : null;
  } catch {
    return null;
  }
}

function readCachedCibilDisplayData(token: string) {
  try {
    if (sessionStorage.getItem(cibilDisplayCacheTokenKey) !== token) {
      clearCachedCibilDisplayData();
      return null;
    }

    const cachedValue = sessionStorage.getItem(cibilDisplayCacheKey);

    return cachedValue ? normalizeCibilDisplayData(JSON.parse(cachedValue)) : null;
  } catch {
    clearCachedCibilDisplayData();
    return null;
  }
}

function readCachedCibilScoreCheckData(token: string, payloadKey: string) {
  try {
    if (
      sessionStorage.getItem(cibilScoreCheckCacheTokenKey) !== token ||
      sessionStorage.getItem(cibilScoreCheckCachePayloadKey) !== payloadKey
    ) {
      sessionStorage.removeItem(cibilScoreCheckCacheKey);
      sessionStorage.removeItem(cibilScoreCheckCacheTokenKey);
      sessionStorage.removeItem(cibilScoreCheckCachePayloadKey);
      return null;
    }

    const cachedValue = sessionStorage.getItem(cibilScoreCheckCacheKey);

    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch {
    sessionStorage.removeItem(cibilScoreCheckCacheKey);
    sessionStorage.removeItem(cibilScoreCheckCacheTokenKey);
    sessionStorage.removeItem(cibilScoreCheckCachePayloadKey);
    return null;
  }
}

async function fetchCibilScoreCheckData(token: string, payload: unknown, payloadKey: string) {
  const response = await apiRequest("/credit-reports/cibil", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });
  const result = normalizeCibilDisplayData(parseApiResult(await readResponseJson(response)));

  if (!response.ok && !isSuccessfulCibilScoreResult(result)) {
    throw new CibilDisplayDataError(readApiMessage(result) || "Unable to fetch CIBIL score", response.status);
  }

  sessionStorage.setItem(cibilScoreCheckCacheKey, JSON.stringify(result));
  sessionStorage.setItem(cibilScoreCheckCacheTokenKey, token);
  sessionStorage.setItem(cibilScoreCheckCachePayloadKey, payloadKey);

  return result;
}

async function fetchCibilDisplayData(token: string) {
  const response = await apiRequest("/credit-reports/cibil/display-data", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = normalizeCibilDisplayData(parseApiResult(await readResponseJson(response)));

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

function parseApiResult(result: unknown) {
  if (typeof result !== "string") {
    return result;
  }

  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

async function readResponseJson(response: { json: () => Promise<unknown> }) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSuccessfulCibilScoreResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return false;
  }

  const data = result as {
    status?: unknown;
    data?: {
      credit_score?: unknown;
    };
    provider?: {
      statusCode?: unknown;
      messageCode?: unknown;
    };
  };

  return (
    data.status === "success" &&
    Boolean(data.data?.credit_score)
  );
}

function normalizeCibilDisplayData(result: unknown) {
  if (!result || typeof result !== "object") {
    return result;
  }

  const response = result as {
    data?: {
      name?: unknown;
      credit_score?: unknown;
      credit_report?: {
        SCORE?: {
          FCIREXScore?: unknown;
        };
        CAIS_Account?: {
          CAIS_Account_DETAILS?: ExperianAccount[];
        };
        CAPS?: {
          CAPS_Application_Details?: ExperianEnquiry[];
        };
      };
      display?: unknown;
      report?: Record<string, unknown>;
    };
    fetchedAt?: unknown;
  };

  if (!response.data || response.data.display) {
    return result;
  }

  const report = response.data.credit_report;

  if (!report) {
    return result;
  }

  const score = response.data.credit_score ?? report.SCORE?.FCIREXScore;
  const accounts = Array.isArray(report.CAIS_Account?.CAIS_Account_DETAILS)
    ? report.CAIS_Account.CAIS_Account_DETAILS.map(normalizeExperianAccount)
    : [];
  const enquiries = Array.isArray(report.CAPS?.CAPS_Application_Details)
    ? report.CAPS.CAPS_Application_Details.map(normalizeExperianEnquiry)
    : [];

  response.data.report = {
    ...response.data.report,
    credit_score: score,
    has_pdf: Boolean(response.data.report?.has_pdf),
    download_url: response.data.report?.download_url ?? null,
  };
  response.data.display = {
    profile: {
      name: typeof response.data.name === "string" ? response.data.name : null,
      fetched_at: typeof response.fetchedAt === "string" ? response.fetchedAt : null,
    },
    score: {
      value: score,
      factors: buildScoreFactors(accounts, enquiries),
      range: "300 to 900",
    },
    accounts,
    enquiries,
  };

  return response;
}

type ExperianAccount = {
  Account_Status?: unknown;
  Account_Type?: unknown;
  Amount_Past_Due?: unknown;
  Credit_Limit_Amount?: unknown;
  Current_Balance?: unknown;
  Date_of_Last_Payment?: unknown;
  Date_Closed?: unknown;
  Date_Reported?: unknown;
  Highest_Credit_or_Original_Loan_Amount?: unknown;
  Open_Date?: unknown;
  Payment_History_Profile?: unknown;
  Portfolio_Type?: unknown;
  Rate_of_Interest?: unknown;
  Repayment_Tenure?: unknown;
  Scheduled_Monthly_Payment_Amount?: unknown;
  Subscriber_Name?: unknown;
  Terms_Frequency?: unknown;
  Terms_Duration?: unknown;
  CAIS_Account_History?: unknown;
};

type ExperianEnquiry = {
  Amount_Financed?: unknown;
  Date_of_Request?: unknown;
  Enquiry_Reason?: unknown;
  Finance_Purpose?: unknown;
  Subscriber_Name?: unknown;
};

function normalizeExperianAccount(account: ExperianAccount) {
  const closedDate = normalizeExperianDate(account.Date_Closed);

  return {
    account_closed: closedDate,
    account_status: account.Account_Status ?? null,
    amount_overdue: account.Amount_Past_Due ?? 0,
    current_balance: account.Current_Balance ?? 0,
    emi: account.Scheduled_Monthly_Payment_Amount || "",
    high_credit_amount: account.Credit_Limit_Amount || account.Highest_Credit_or_Original_Loan_Amount || 0,
    last_payment: normalizeExperianDate(account.Date_of_Last_Payment) ?? normalizeExperianDate(account.Date_Reported),
    member_name: typeof account.Subscriber_Name === "string" ? account.Subscriber_Name : null,
    opened: normalizeExperianDate(account.Open_Date),
    payment_history: account.Payment_History_Profile ? [stringifyValue(account.Payment_History_Profile)] : [],
    payment_history_details: Array.isArray(account.CAIS_Account_History) ? account.CAIS_Account_History : [],
    payment_frequency: stringifyValue(account.Terms_Frequency),
    portfolio_type: stringifyValue(account.Portfolio_Type),
    rate_of_interest: account.Rate_of_Interest || null,
    repayment_tenure: account.Repayment_Tenure || account.Terms_Duration || null,
    reported_and_certified: normalizeExperianDate(account.Date_Reported),
    type: stringifyValue(account.Account_Type),
  };
}

function normalizeExperianEnquiry(enquiry: ExperianEnquiry) {
  return {
    enquiry_amount: enquiry.Amount_Financed ?? 0,
    enquiry_date: normalizeExperianDate(enquiry.Date_of_Request),
    enquiry_kind: "Hard",
    enquiry_purpose: stringifyValue(enquiry.Finance_Purpose ?? enquiry.Enquiry_Reason),
    member: typeof enquiry.Subscriber_Name === "string" ? enquiry.Subscriber_Name : null,
  };
}

function normalizeExperianDate(value: unknown) {
  const dateValue = stringifyValue(value);

  if (!/^\d{8}$/.test(dateValue) || dateValue === "00000000" || dateValue === "11111111") {
    return null;
  }

  return `${dateValue.slice(6)}${dateValue.slice(4, 6)}${dateValue.slice(0, 4)}`;
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function buildScoreFactors(accounts: ReturnType<typeof normalizeExperianAccount>[], enquiries: ReturnType<typeof normalizeExperianEnquiry>[]) {
  const factors = [];
  const overdueAccounts = accounts.filter((account) => Number(account.amount_overdue) > 0).length;

  if (overdueAccounts) {
    factors.push("overdue accounts");
  }

  if (enquiries.length > 2) {
    factors.push("recent enquiries");
  }

  if (accounts.some((account) => Number(account.current_balance) > 0)) {
    factors.push("active credit balances");
  }

  return factors;
}
