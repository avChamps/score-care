export const CIBIL_REPAIR_SELECTION_STORAGE_KEY = "scorecare_cibil_repair_selection";

export type SelectedCibilRepairAccount = {
  id: string;
  accountNumber: string;
  accountType: string;
  accountStatus: string;
  currentBalance: number;
  issueType: string;
  issueLabels: string[];
  rawAccount: Record<string, unknown>;
  subscriberName: string;
};

type StoredCibilRepairSelection = {
  accounts: SelectedCibilRepairAccount[];
  token: string;
};

export function readSelectedCibilRepairAccounts(token = readCurrentToken()) {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(CIBIL_REPAIR_SELECTION_STORAGE_KEY) ?? "null") as StoredCibilRepairSelection | null;

    if (!parsed || parsed.token !== token || !Array.isArray(parsed.accounts)) {
      clearSelectedCibilRepairAccounts();
      return [];
    }

    return parsed.accounts.filter(isSelectedCibilRepairAccount);
  } catch {
    clearSelectedCibilRepairAccounts();
    return [];
  }
}

export function writeSelectedCibilRepairAccounts(accounts: SelectedCibilRepairAccount[], token = readCurrentToken()) {
  localStorage.setItem(CIBIL_REPAIR_SELECTION_STORAGE_KEY, JSON.stringify({ accounts, token }));
}

export function clearSelectedCibilRepairAccounts() {
  localStorage.removeItem(CIBIL_REPAIR_SELECTION_STORAGE_KEY);
}

function readCurrentToken() {
  return typeof window === "undefined" ? "" : localStorage.getItem("scorecare_token") ?? "";
}

function isSelectedCibilRepairAccount(value: unknown): value is SelectedCibilRepairAccount {
  const account = value as SelectedCibilRepairAccount;

  return (
    Boolean(account) &&
    typeof account.id === "string" &&
    typeof account.accountNumber === "string" &&
    typeof account.accountType === "string" &&
    typeof account.accountStatus === "string" &&
    typeof account.currentBalance === "number" &&
    typeof account.issueType === "string" &&
    Array.isArray(account.issueLabels) &&
    Boolean(account.rawAccount) &&
    typeof account.rawAccount === "object" &&
    typeof account.subscriberName === "string"
  );
}
