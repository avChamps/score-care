"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { ButtonLoader } from "@/components/auth/button-loader";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiFetch } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData } from "@/lib/cibil-display-cache";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Building2,
  FileText,
  Landmark,
  ShieldCheck,
  BadgeCheck,
  Upload,
  LucideIcon
} from "lucide-react";

type DisputeAccount = {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  bureaus: string[];
  lenderName: string;
  overdueAmount: number | null;
  ownershipType: string;
  rawAccount: Record<string, unknown>;
  status: string;
};

type DisputeDocumentField = "closureCertificate" | "paymentReceipt" | "bankStatement" | "identityProof";
type DisputeDocuments = Record<DisputeDocumentField, File | null>;

const errorTypes = [
  "Account showing active after closure",
  "Wrong payment status (late/default)",
  "Incorrect personal information",
  "Duplicate account entry",
  "Wrong credit limit shown",
  "Settled loan still showing balance",
  "Identity theft - fraudulent account",
  "Other",
];
const bureauOptions = ["CIBIL", "Equifax", "Experian", "CRIF"];
const disputeDocumentFields: Array<{ field: DisputeDocumentField; label: string; required?: boolean }> = [
  { field: "closureCertificate", label: "Closure Certificate / NOC", required: true },
  { field: "paymentReceipt", label: "Payment Receipt" },
  { field: "bankStatement", label: "Bank Statement" },
  { field: "identityProof", label: "Identity Proof" },
];
const reportCardClass =
  "border border-[#103A2B]/50 bg-[linear-gradient(135deg,#06120E_0%,#081712_50%,#091813_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.02)]";
const reportMiniCardClass = "border border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]";

export function NewDisputeExperience() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [accounts, setAccounts] = useState<DisputeAccount[]>([]);
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [errorType, setErrorType] = useState("");
  const [availableBureaus, setAvailableBureaus] = useState<string[]>([]);
  const [selectedBureaus, setSelectedBureaus] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [documents, setDocuments] = useState<DisputeDocuments>({
    bankStatement: null,
    closureCertificate: null,
    identityProof: null,
    paymentReceipt: null,
  });
  const [documentError, setDocumentError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadAccounts() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      try {
        const result = await getCachedCibilDisplayData(token);
        const displayAccounts = readDisputeAccounts(result);

        setAccounts(displayAccounts);
        setAvailableBureaus(bureauOptions);
        setSelectedBureaus([]);
      } catch (error) {
        if (error instanceof CibilDisplayDataError && (error.status === 401 || error.status === 403)) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        setAccounts([]);
        setAvailableBureaus([]);
        setSelectedBureaus([]);
      }
    }

    void loadAccounts();
  }, [router]);


  const disputeEligibleAccounts = useMemo(() => accounts.filter(isDisputeEligibleAccount), [accounts]);
  const visibleAccounts = showAllAccounts ? accounts : disputeEligibleAccounts;
  const selectedAccount = useMemo(() => visibleAccounts.find((account) => account.id === selectedAccountId) ?? null, [selectedAccountId, visibleAccounts]);
  const canContinue =
    (step === 1 && Boolean(selectedAccount)) ||
    (step === 2 && Boolean(errorType)) ||
    (step === 3 && selectedBureaus.length > 0) ||
    (step === 4 && Boolean(documents.closureCertificate));

  function updateDocument(field: DisputeDocumentField, file: File | null) {
    const validationError = file ? validateDisputeDocument(file) : "";

    setDocumentError(validationError);
    setDocuments((current) => ({ ...current, [field]: validationError ? null : file }));
  }

  async function submitDispute() {
    if (!selectedAccount || !canContinue || submitting) return;

    const token = localStorage.getItem("scorecare_token");
    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    const payload = new FormData();
    payload.append("accountData", JSON.stringify({
      lenderName: selectedAccount.lenderName,
      accountNumber: selectedAccount.accountNumber,
      accountType: selectedAccount.accountType,
    }));
    payload.append("errorType", errorType);
    payload.append("bureaus", JSON.stringify(selectedBureaus));

    if (details.trim()) {
      payload.append("additionalDetails", details.trim());
    }

    disputeDocumentFields.forEach(({ field }) => {
      const file = documents[field];

      if (file) payload.append(field, file);
    });

    setSubmitting(true);

    try {
      const response = await apiFetch("/api/disputes", {
        body: payload,
        headers: { Authorization: `Bearer ${token}` },
        method: "POST",
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok) return;

      router.push("/dashboard/dispute-centre");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalShell active="fix">
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PortalTopBar title="Raise Dispute" />
        <PageContent className="px-4 py-5">
          <div className="mx-auto max-w-md space-y-4">
            <button
              aria-label="Go back"
              className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl transition hover:border-[#22F2C2]/45"
              data-dashboard-dispute="true"
              type="button"
              onClick={() => router.push("/dashboard/dispute-centre")}
            >
              <ArrowLeft className="size-6" strokeWidth={2.2} />
            </button>

        <section className={cn("rounded-[2rem] p-4", reportCardClass)}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-caption font-bold uppercase tracking-[0.16em] text-[#22F2C2]">Step {step} of 4</p>
              <h1 className="mt-1 text-lg font-black">{stepTitle(step)}</h1>
              <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">{stepSubtitle(step)}</p>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#22F2C2]" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </section>

        <div>
          {step === 1 ? <AccountStep accounts={visibleAccounts} hasDisputeEligibleAccounts={disputeEligibleAccounts.length > 0} selectedAccountId={selectedAccountId} onSelect={setSelectedAccountId} onViewAllAccounts={() => setShowAllAccounts(true)} /> : null}
          {step === 2 ? <OptionStep options={errorTypes} selected={errorType} onSelect={setErrorType} /> : null}
          {step === 3 ? <BureauStep bureaus={availableBureaus} details={details} selectedBureaus={selectedBureaus} onDetails={setDetails} onToggle={setSelectedBureaus} /> : null}
          {step === 4 ? <EvidenceStep documents={documents} error={documentError} onChange={updateDocument} /> : null}
        </div>

       <div className="sticky bottom-24 z-20 py-2">
    <button
      aria-busy={submitting}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#22F2C2,#18C79E)] text-sm font-bold text-white shadow-[0_10px_24px_rgba(34,242,194,0.28)] transition-all duration-200 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:border disabled:disabled:border-white/5 disabled:bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] disabled:text-[#6F7B8E] disabled:shadow-none"
      data-dashboard-dispute="true"
      disabled={!canContinue || submitting}
      type="button"
      onClick={() =>
        step === 4
          ? void submitDispute()
          : setStep((current) => Math.min(4, current + 1))
      }
    >
      {step === 4
        ? submitting
          ? <><ButtonLoader className="size-5" /> Submitting...</>
          : "Submit"
        : "Next"}
    </button>
</div>

          </div>
        </PageContent>
        <DashboardBottomNav />
      </div>
    </PortalShell>
  );
}

function AccountStep({ accounts, hasDisputeEligibleAccounts, selectedAccountId, onSelect, onViewAllAccounts }: { accounts: DisputeAccount[]; hasDisputeEligibleAccounts: boolean; selectedAccountId: string; onSelect: (accountId: string) => void; onViewAllAccounts: () => void }) {
  if (!accounts.length) {
    return (
      <div className={cn("space-y-3 rounded-2xl p-4", reportMiniCardClass)}>
        <div>
          <p className="text-sm font-semibold">No dispute-eligible accounts found from your credit report.</p>
          <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">All accounts currently appear to be reported correctly.</p>
        </div>
        {!hasDisputeEligibleAccounts ? (
          <button className="h-11 rounded-2xl border border-[#22F2C2]/70 px-4 text-sm font-black text-[#22F2C2]" data-dashboard-dispute="true" type="button" onClick={onViewAllAccounts}>
            View All Accounts
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => {
        const selected = selectedAccountId === account.id;

        return (
          <button className={cn("w-full rounded-2xl border p-4 text-left transition", selected ? "border-[#22F2C2] bg-[#0B2B23]" : reportMiniCardClass)} data-dashboard-dispute="true" key={account.id} type="button" onClick={() => onSelect(account.id)}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold">{account.lenderName}</p>
                <p className="mt-1 text-sm text-[#9fb2c6]">{account.accountType} - {maskAccountNumber(account.accountNumber)}</p>
              </div>
              <span className={cn("grid size-6 shrink-0 place-items-center rounded-md border text-caption font-black", selected ? "border-[#22F2C2] bg-[#22F2C2] text-[#04120e]" : "border-white/25 text-transparent")}>✓</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <span className="text-[#9fb2c6]">Status <b className="block text-base text-white">{account.status || "--"}</b></span>
              <span className="text-[#9fb2c6]">Balance <b className="block text-base text-white"><AnimatedNumber value={formatINR(account.balance)} /></b></span>
              {account.ownershipType ? <span className="text-[#9fb2c6]">Ownership <b className="block text-base text-white">{account.ownershipType}</b></span> : null}
              {account.overdueAmount !== null ? <span className="text-[#9fb2c6]">Overdue <b className="block text-base text-white"><AnimatedNumber value={formatINR(account.overdueAmount)} /></b></span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function OptionStep({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (option: string) => void }) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button className={cn("flex min-h-14 w-full items-center justify-between rounded-2xl border p-4 text-left text-sm font-semibold", selected === option ? "border-[#22F2C2] bg-[#0B2B23] text-white" : reportMiniCardClass)} data-dashboard-dispute="true" key={option} type="button" onClick={() => onSelect(option)}>
          <span>{option}</span>
          <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border text-caption", selected === option ? "border-[#22F2C2] bg-[#22F2C2] text-[#04120e]" : "border-white/25 text-transparent")}>✓</span>
        </button>
      ))}
    </div>
  );
}

function BureauStep({ bureaus, details, selectedBureaus, onDetails, onToggle }: { bureaus: string[]; details: string; selectedBureaus: string[]; onDetails: (details: string) => void; onToggle: (bureaus: string[]) => void }) {
  
  
const bureauConfig: Record<
  string,
  {
    icon: LucideIcon;
    color: string;
  }
> = {
  CIBIL: {
    icon: Building2,
    color: "text-[#22F2C2]",
  },
  Equifax: {
    icon: Landmark,
    color: "text-[#60A5FA]",
  },
  Experian: {
    icon: ShieldCheck,
    color: "text-[#FBBF24]",
  },
  CRIF: {
    icon: BadgeCheck,
    color: "text-[#A78BFA]",
  },
};
  
  
  return (
    <div className="space-y-4">
     <div className="grid grid-cols-2 gap-3">
  {bureaus.map((bureau) => {
    const selected = selectedBureaus.includes(bureau);

    const config = bureauConfig[bureau];
    const Icon = config?.icon ?? Building2;

    return (
      <button
        key={bureau}
        type="button"
        data-dashboard-dispute="true"
        onClick={() =>
          onToggle(
            selected
              ? selectedBureaus.filter((item) => item !== bureau)
              : [...selectedBureaus, bureau]
          )
        }
        className={cn(
          "flex h-20 flex-col items-center justify-center gap-2 rounded-2xl border transition-all",
          selected
            ? "border-[#22F2C2] bg-[#0B2B23]"
            : reportMiniCardClass
        )}
      >
        <Icon
          className={cn(
            "size-6",
            selected ? "text-[#22F2C2]" : config?.color
          )}
          strokeWidth={2.2}
        />

        <span
          className={cn(
            "text-sm font-black",
            selected ? "text-[#22F2C2]" : "text-white"
          )}
        >
          {bureau}
        </span>
      </button>
    );
  })}
</div>
      <textarea className="min-h-28 w-full rounded-2xl border border-[#0D5A3F]/55 bg-[#071812] p-4 text-sm text-white outline-none placeholder:text-[#6F7B8E]" placeholder="Add any supporting context..." value={details} onChange={(event) => onDetails(event.target.value)} />
    </div>
  );
}

function EvidenceStep({ documents, error, onChange }: { documents: DisputeDocuments; error: string; onChange: (field: DisputeDocumentField, file: File | null) => void }) {
  return (
    <div className="space-y-3">
      {disputeDocumentFields.map(({ field, label, required }) => {
        const file = documents[field];

        return (
          <label className={cn("flex min-h-24 cursor-pointer items-center gap-3 rounded-2xl border border-dashed p-4", reportMiniCardClass)} key={field}>
            <input
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              className="sr-only"
              type="file"
              onChange={(event) => onChange(field, event.target.files?.[0] ?? null)}
            />
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-[#22F2C2]">
              <FileText className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-black text-white">{label}</span>
              {required ? <span className="mt-1 block text-caption font-bold text-[#FF5C8A]">Required</span> : null}
              {file ? <span className="mt-1 block truncate text-caption text-[#22F2C2]">{file.name}</span> : null}
            </span>
            <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#22F2C2]/12 px-3 text-caption font-black text-[#22F2C2]">
              <Upload className="size-4" />
              {file ? "Change" : "Upload"}
            </span>
          </label>
        );
      })}
      {error ? <p className="rounded-2xl border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 px-4 py-3 text-sm font-medium text-[#FF8AAB]">{error}</p> : null}
      <p className="rounded-2xl border border-[#22F2C2]/25 bg-[#22F2C2]/10 px-4 py-3 text-caption leading-5 text-[#9fb2c6]">ScoreCare will file and track your dispute automatically.</p>
    </div>
  );
}

function validateDisputeDocument(file: File) {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
  const allowedExtension = /\.(pdf|jpe?g|png)$/i.test(file.name);

  if (!allowedTypes.includes(file.type) && !allowedExtension) return "Only PDF, JPG, JPEG, or PNG files are allowed.";
  if (file.size > 5 * 1024 * 1024) return "Each document must be 5MB or smaller.";

  return "";
}

function readDisputeAccounts(displayData: unknown): DisputeAccount[] {
  const data = displayData as { data?: { credit_report?: { CAIS_Account?: { CAIS_Account_DETAILS?: unknown } } } } | null;
  const rawAccounts = Array.isArray(data?.data?.credit_report?.CAIS_Account?.CAIS_Account_DETAILS)
    ? data.data.credit_report.CAIS_Account.CAIS_Account_DETAILS as Record<string, unknown>[]
    : [];
  return rawAccounts.map((account, index) => {
    const accountNumber = readString(account.Account_Number ?? account.account_number ?? account.AccountNumber);
    const lenderName = readString(account.Subscriber_Name ?? account.subscriber_name);
    const accountType = readString(account.Account_Type_Description ?? account.account_type_description ?? account.Account_Type ?? account.account_type);
    const status = readString(account.Account_Status ?? account.account_status);

    return {
      accountNumber,
      accountType,
      balance: toNumber(account.Current_Balance ?? account.current_balance),
      bureaus: readAccountBureaus(account),
      id: `${lenderName.toLowerCase() || "account"}-${accountNumber || index}`,
      lenderName: lenderName || "Unknown lender",
      overdueAmount: hasValue(account.Amount_Past_Due ?? account.amount_past_due) ? toNumber(account.Amount_Past_Due ?? account.amount_past_due) : null,
      ownershipType: readString(account.Ownership_Indicator ?? account.ownership_indicator),
      rawAccount: account,
      status,
    };
  });
}

function isDisputeEligibleAccount(account: DisputeAccount) {
  return isRawDisputeEligibleAccount(account.rawAccount);
}

function isRawDisputeEligibleAccount(account: Record<string, unknown>) {
  return (
    toNumber(account.Amount_Past_Due ?? account.amount_past_due) > 0 ||
    hasPositiveDaysPastDue(account.CAIS_Account_History ?? account.cais_account_history) ||
    hasNonZeroValue(account.Written_off_Settled_Status ?? account.written_off_settled_status) ||
    toNumber(account.Settlement_Amount ?? account.settlement_amount) > 0 ||
    toNumber(account.Written_Off_Amt_Total ?? account.written_off_amt_total) > 0 ||
    toNumber(account.Written_Off_Amt_Principal ?? account.written_off_amt_principal) > 0
  );
}

function hasPositiveDaysPastDue(history: unknown): boolean {
  if (!Array.isArray(history)) return false;

  return history.some((entry) => {
    if (!entry || typeof entry !== "object") return false;

    const historyEntry = entry as Record<string, unknown>;

    return toNumber(historyEntry.Days_Past_Due ?? historyEntry.days_past_due) > 0;
  });
}

function readAccountBureaus(account: Record<string, unknown>) {
  return readBureauValues(account.bureaus ?? account.bureau ?? account.Bureau ?? account.provider ?? account.Provider);
}

function readBureauValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(readBureauValues);
  }

  if (value && typeof value === "object") {
    return Object.values(value).flatMap(readBureauValues);
  }

  const bureau = readString(value);

  return bureau ? [bureau] : [];
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function hasNonZeroValue(value: unknown) {
  return hasValue(value) && readString(value) !== "0";
}

function stepTitle(step: number) {
  if (step === 1) return "Which account has the error?";
  if (step === 2) return "What is the error?";
  if (step === 3) return "Which bureau to dispute?";
  return "Upload evidence";
}

function stepSubtitle(step: number) {
  if (step === 1) return "Pick the lender from your credit report";
  if (step === 2) return "Select the type of mistake";
  if (step === 3) return "Select where the error appears";
  return "Documents that support your dispute";
}

function toNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;

  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", { currency: "INR", maximumFractionDigits: 0, style: "currency" }).format(Math.round(amount));
}

function maskAccountNumber(accountNumber: string) {
  if (!accountNumber) return "--";
  if (/x/i.test(accountNumber)) return accountNumber;
  return accountNumber.length > 4 ? `${"X".repeat(Math.max(accountNumber.length - 4, 3))}${accountNumber.slice(-4)}` : accountNumber;
}
