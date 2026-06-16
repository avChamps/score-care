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
  localStorage.removeItem(cibilDisplayCacheKey);
  localStorage.removeItem(cibilDisplayCacheTokenKey);
  localStorage.removeItem(cibilScoreCheckCacheKey);
  localStorage.removeItem(cibilScoreCheckCacheTokenKey);
  localStorage.removeItem(cibilScoreCheckCachePayloadKey);
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

export async function getCachedCibilScoreCheckData(token: string, payload: unknown, { forceRefresh = false }: { forceRefresh?: boolean } = {}) {
  const payloadKey = JSON.stringify(payload);
  const cachedData = forceRefresh ? null : readCachedCibilScoreCheckData(token, payloadKey);

  if (cachedData) {
    return cachedData;
  }

  if (!forceRefresh && inFlightScoreCheckRequest) {
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
    if (localStorage.getItem(cibilScoreCheckCacheTokenKey) !== token) {
      return null;
    }

    const cachedValue = localStorage.getItem(cibilScoreCheckCacheKey);

    return cachedValue ? normalizeCibilDisplayData(JSON.parse(cachedValue)) : null;
  } catch {
    return null;
  }
}

function readCachedCibilDisplayData(token: string) {
  try {
    if (localStorage.getItem(cibilDisplayCacheTokenKey) !== token) {
      clearCachedCibilDisplayData();
      return null;
    }

    const cachedValue = localStorage.getItem(cibilDisplayCacheKey);

    return cachedValue ? normalizeCibilDisplayData(JSON.parse(cachedValue)) : null;
  } catch {
    clearCachedCibilDisplayData();
    return null;
  }
}

function readCachedCibilScoreCheckData(token: string, payloadKey: string) {
  try {
    if (
      localStorage.getItem(cibilScoreCheckCacheTokenKey) !== token ||
      localStorage.getItem(cibilScoreCheckCachePayloadKey) !== payloadKey
    ) {
      localStorage.removeItem(cibilScoreCheckCacheKey);
      localStorage.removeItem(cibilScoreCheckCacheTokenKey);
      localStorage.removeItem(cibilScoreCheckCachePayloadKey);
      return null;
    }

    const cachedValue = localStorage.getItem(cibilScoreCheckCacheKey);

    return cachedValue ? normalizeCibilDisplayData(JSON.parse(cachedValue)) : null;
  } catch {
    localStorage.removeItem(cibilScoreCheckCacheKey);
    localStorage.removeItem(cibilScoreCheckCacheTokenKey);
    localStorage.removeItem(cibilScoreCheckCachePayloadKey);
    return null;
  }
}

async function fetchCibilScoreCheckData(token: string, payload: unknown, payloadKey: string) {
  const response = await apiRequest("/credit-reports/crif", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = normalizeCibilDisplayData(parseApiResult(await readResponseJson(response)));

  if (!response.ok || !isSuccessfulCibilScoreResult(result)) {
    throw new CibilDisplayDataError(readApiMessage(result) || "Unable to fetch CIBIL score", response.status);
  }

  localStorage.setItem(cibilScoreCheckCacheKey, JSON.stringify(result));
  localStorage.setItem(cibilScoreCheckCacheTokenKey, token);
  localStorage.setItem(cibilScoreCheckCachePayloadKey, payloadKey);

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

  localStorage.setItem(cibilDisplayCacheKey, JSON.stringify(result));
  localStorage.setItem(cibilDisplayCacheTokenKey, token);
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
    success?: unknown;
    status?: unknown;
    status_code?: unknown;
    message_code?: unknown;
    data?: {
      credit_score?: unknown;
      pan?: unknown;
    };
    provider?: {
      statusCode?: unknown;
      messageCode?: unknown;
    };
  };

  return (
    (data.success === true || data.status === "success") &&
    (data.status_code === 200 || data.provider?.statusCode === 200) &&
    (data.message_code === "success" || data.provider?.messageCode === "success") &&
    Boolean(data.data?.credit_score) &&
    Boolean(data.data?.pan)
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
          BureauScore?: unknown;
          FCIREXScore?: unknown;
        };
        SCORES?: {
          SCORE?: CrifScore | CrifScore[];
        };
        CAIS_Account?: {
          CAIS_Account_DETAILS?: ExperianAccount[];
        };
        RESPONSES?: {
          RESPONSE?: CrifResponse | CrifResponse[];
        };
        "INQUIRY-HISTORY"?: {
          HISTORY?: CrifEnquiry | CrifEnquiry[];
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

  const crifAccounts = mapCrifAccounts(report.RESPONSES?.RESPONSE);

  if (crifAccounts.length) {
    report.CAIS_Account = {
      ...report.CAIS_Account,
      CAIS_Account_DETAILS: crifAccounts,
    };
  }

  const crifScore = readCrifScore(report.SCORES?.SCORE);

  if (crifScore !== null) {
    report.SCORE = {
      ...report.SCORE,
      BureauScore: report.SCORE?.BureauScore ?? crifScore,
      FCIREXScore: report.SCORE?.FCIREXScore ?? crifScore,
    };
    response.data.credit_score = response.data.credit_score ?? crifScore;
  }

  const score = response.data.credit_score ?? report.SCORE?.BureauScore ?? report.SCORE?.FCIREXScore;
  const accounts = Array.isArray(report.CAIS_Account?.CAIS_Account_DETAILS)
    ? report.CAIS_Account.CAIS_Account_DETAILS.map(normalizeExperianAccount)
    : [];
  const crifEnquiries = mapCrifEnquiries(report["INQUIRY-HISTORY"]?.HISTORY);
  const enquiries = report["INQUIRY-HISTORY"]
    ? crifEnquiries
    : Array.isArray(report.CAPS?.CAPS_Application_Details)
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
  Account_Number?: unknown;
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

type CrifScore = {
  "SCORE-VALUE"?: unknown;
};

type CrifLoanDetails = {
  "ACCOUNT-STATUS"?: unknown;
  "ACCT-NUMBER"?: unknown;
  "ACCT-TYPE"?: unknown;
  "ACTUAL-PAYMENT"?: unknown;
  "CLOSED-DATE"?: unknown;
  "COMBINED-PAYMENT-HISTORY"?: unknown;
  "CREDIT-GUARANTOR"?: unknown;
  "CREDIT-LIMIT"?: unknown;
  "CURRENT-BAL"?: unknown;
  "DISBURSED-AMT"?: unknown;
  "DISBURSED-DT"?: unknown;
  "INSTALLMENT-AMT"?: unknown;
  "LAST-PAYMENT-DATE"?: unknown;
  "OBLIGATION"?: unknown;
  "OVERDUE-AMT"?: unknown;
  "REPAYMENT-TENURE"?: unknown;
};

type CrifResponse = {
  "LOAN-DETAILS"?: CrifLoanDetails | CrifLoanDetails[];
};

type CrifEnquiry = Record<string, unknown>;

type ExperianEnquiry = {
  Amount_Financed?: unknown;
  Date_of_Request?: unknown;
  Enquiry_Reason?: unknown;
  Finance_Purpose?: unknown;
  Subscriber_Name?: unknown;
};

function normalizeExperianAccount(account: ExperianAccount) {
  const closedDate = normalizeExperianDate(account.Date_Closed);
  const accountStatus = account.Account_Status ?? null;

  return {
    account_closed: closedDate ?? (isClosedAccountStatus(accountStatus) ? "Closed" : null),
    account_status: accountStatus,
    amount_overdue: normalizeAmount(account.Amount_Past_Due),
    current_balance: normalizeAmount(account.Current_Balance),
    emi: normalizeAmount(account.Scheduled_Monthly_Payment_Amount) || "",
    high_credit_amount: normalizeAmount(account.Credit_Limit_Amount) || normalizeAmount(account.Highest_Credit_or_Original_Loan_Amount),
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

function readCrifScore(score: CrifScore | CrifScore[] | undefined) {
  const scoreRecord = Array.isArray(score) ? score[0] : score;
  const value = normalizeAmount(scoreRecord?.["SCORE-VALUE"]);

  return value > 0 ? value : null;
}

function mapCrifAccounts(response: CrifResponse | CrifResponse[] | undefined): ExperianAccount[] {
  return asArray(response)
    .flatMap((item) => asArray(item?.["LOAN-DETAILS"]))
    .map(mapCrifAccount);
}

function mapCrifAccount(account: CrifLoanDetails): ExperianAccount {
  const accountType = stringifyValue(account["ACCT-TYPE"]).trim();
  const status = stringifyValue(account["ACCOUNT-STATUS"]).trim();
  const emi = readFirstFilledValue([account.OBLIGATION, account["INSTALLMENT-AMT"], account["ACTUAL-PAYMENT"]]);

  return {
    Account_Number: account["ACCT-NUMBER"],
    Account_Status: status,
    Account_Type: accountType,
    Amount_Past_Due: normalizeAmount(account["OVERDUE-AMT"]),
    Credit_Limit_Amount: normalizeAmount(account["CREDIT-LIMIT"]),
    Current_Balance: normalizeAmount(account["CURRENT-BAL"]),
    Date_Closed: normalizeCrifDate(account["CLOSED-DATE"]),
    Date_of_Last_Payment: normalizeCrifDate(account["LAST-PAYMENT-DATE"]),
    Highest_Credit_or_Original_Loan_Amount: normalizeAmount(account["DISBURSED-AMT"]),
    Open_Date: normalizeCrifDate(account["DISBURSED-DT"]),
    Portfolio_Type: accountType === "Credit Card" ? "R" : "I",
    Repayment_Tenure: account["REPAYMENT-TENURE"],
    Scheduled_Monthly_Payment_Amount: normalizeCrifEmiAmount(emi),
    Subscriber_Name: stringifyValue(account["CREDIT-GUARANTOR"]).trim() || null,
    CAIS_Account_History: parseCrifPaymentHistory(account["COMBINED-PAYMENT-HISTORY"]),
  };
}

function parseCrifPaymentHistory(value: unknown) {
  const history = stringifyValue(value);

  if (!history) {
    return [];
  }

  return history.split("|").map((entry) => {
    const [period = "", status = ""] = entry.split(",");
    const [monthName = "", yearValue = ""] = period.split(":");
    const [dpdValue = "", classification = ""] = status.split("/");
    const dpd = Number(dpdValue);

    return {
      Year: Number(yearValue) || 0,
      Month: readMonthNumber(monthName),
      Days_Past_Due: Number.isFinite(dpd) ? dpd : 0,
      Asset_Classification: classification || "",
    };
  }).filter((item) => item.Year && item.Month);
}

function isClosedAccountStatus(value: unknown) {
  return stringifyValue(value).trim().toLowerCase() === "closed";
}

function normalizeAmount(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const amount = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));

  return Number.isFinite(amount) ? amount : 0;
}

function normalizeCrifEmiAmount(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const amountValue = typeof value === "string" ? value.split("/")[0] : value;

  return normalizeAmount(amountValue);
}

function readFirstFilledValue(values: unknown[]) {
  return values.find((value) => value !== null && value !== undefined && String(value).trim() !== "");
}

function normalizeCrifDate(value: unknown) {
  const dateValue = stringifyValue(value).trim();
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dateValue);

  if (!match) {
    return normalizeExperianDate(value);
  }

  return `${match[3]}${match[2]}${match[1]}`;
}

function readMonthNumber(value: string) {
  const months: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  return months[value.trim().toLowerCase()] ?? 0;
}

function asArray<T>(value: T | T[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function mapCrifEnquiries(history: CrifEnquiry | CrifEnquiry[] | undefined): ReturnType<typeof normalizeExperianEnquiry>[] {
  return asArray(history)
    .filter((enquiry) => enquiry && Object.keys(enquiry).length > 0)
    .map((enquiry) => ({
      enquiry_amount: normalizeAmount(readFirstValue(enquiry, ["AMOUNT", "INQUIRY-AMOUNT", "ENQUIRY-AMOUNT"])),
      enquiry_date: normalizeCrifDate(readFirstValue(enquiry, ["INQUIRY-DATE", "ENQUIRY-DATE", "DATE"])),
      enquiry_kind: stringifyValue(readFirstValue(enquiry, ["INQUIRY-TYPE", "ENQUIRY-TYPE", "TYPE"])) || "Hard",
      enquiry_purpose: stringifyValue(readFirstValue(enquiry, ["PURPOSE", "INQUIRY-PURPOSE", "ENQUIRY-PURPOSE", "LOAN-TYPE"])),
      member: stringifyValue(readFirstValue(enquiry, ["MEMBER-NAME", "SUBSCRIBER-NAME", "LENDER-NAME", "CREDIT-GRANTOR"])).trim() || null,
    }));
}

function readFirstValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== null && record[key] !== undefined && record[key] !== "") {
      return record[key];
    }
  }

  return null;
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

  if (Number(dateValue.slice(0, 4)) >= 1900) {
    return dateValue;
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
