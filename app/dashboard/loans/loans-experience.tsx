"use client";

import {
  BadgeIndianRupee,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  FileCheck2,
  FileText,
  Info,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type LoanFilter = "All Loans" | "Active" | "Completed";
type DisplayDataResponse = {
  fetchedAt?: string | null;
  data?: {
    report?: {
      credit_score?: string | number | null;
    };
    display?: {
      profile?: {
        name?: string | null;
        fetched_at?: string | null;
      };
      score?: {
        value?: string | number | null;
      };
      accounts?: CreditAccount[] | null;
    };
  };
};
type CreditAccount = {
  account_closed?: string | null;
  amount_overdue?: string | number | null;
  current_balance?: string | number | null;
  emi?: string | number | null;
  high_credit_amount?: string | number | null;
  last_payment?: string | null;
  member_name?: string | null;
  opened?: string | null;
  payment_frequency?: string | null;
  repayment_tenure?: string | number | null;
  reported_and_certified?: string | null;
  type?: string | null;
};
type Loan = {
  amount: string;
  bank: string;
  borrower: string;
  disbursed: string;
  emi: string;
  id: string;
  nextEmi: string;
  overdue: string;
  paymentFrequency: string;
  sanctioned: string;
  status: "Active" | "Completed" | "Overdue";
  tenure: string;
};
type LoanSummary = {
  activeAmount: string;
  activeCount: number;
  lastChecked: string;
  overdueAmount: string;
  overdueCount: number;
};

const employmentTypes = ["Salaried", "Self Employed", "Business Owner", "Professional"];

export function LoansExperience() {
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [filter, setFilter] = useState<LoanFilter>("All Loans");
  const [employmentType, setEmploymentType] = useState("Salaried");
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loans = useMemo(() => buildLoans(displayData), [displayData]);
  const summary = useMemo(() => buildLoanSummary(loans, displayData), [displayData, loans]);
  const score = readScore(displayData);
  const lastChecked = readLastChecked(displayData);

  const visibleLoans = useMemo(() => {
    if (filter === "Active") {
      return loans.filter((loan) => loan.status === "Active");
    }

    if (filter === "Completed") {
      return loans.filter((loan) => loan.status === "Completed");
    }

    return loans;
  }, [filter, loans]);

  const loadLoans = useCallback(async () => {
    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/credit-reports/cibil/display-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      const result = (await response.json()) as DisplayDataResponse;

      if (!response.ok) {
        throw new Error("Unable to load loans");
      }

      setDisplayData(result);
    } catch {
      setDisplayData(null);
      setError("Could not load loan accounts from your CIBIL report.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadLoans();
    }, 0);

    return () => {
      window.clearTimeout(loadTimer);
    };
  }, [loadLoans]);

  return (
    <PortalShell active="loans">
      <PortalTopBar title="Loan Repayments" />
      <PageContent>
        <RepaymentsView
          error={error}
          filter={filter}
          lastChecked={lastChecked}
          loading={loading}
          loans={visibleLoans}
          onApply={() => setApplyOpen(true)}
          onFilterChange={setFilter}
          onRefresh={loadLoans}
          score={score}
          summary={summary}
        />
      </PageContent>
      {applyOpen ? (
        <ApplyLoanDialog
          employmentType={employmentType}
          lastChecked={lastChecked}
          onClose={() => setApplyOpen(false)}
          onEmploymentTypeChange={setEmploymentType}
          score={score}
        />
      ) : null}
    </PortalShell>
  );
}

function RepaymentsView({
  error,
  filter,
  lastChecked,
  loading,
  loans,
  onApply,
  onFilterChange,
  onRefresh,
  score,
  summary,
}: {
  error: string;
  filter: LoanFilter;
  lastChecked: string | null;
  loading: boolean;
  loans: Loan[];
  onApply: () => void;
  onFilterChange: (filter: LoanFilter) => void;
  onRefresh: () => void;
  score: number | null;
  summary: LoanSummary;
}) {
  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[var(--portal-orange)]">Loans</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Repayments</h2>
          <p className="mt-1 text-xs text-slate-500">{loading ? "Loading CIBIL accounts..." : lastChecked ? `Report updated ${lastChecked}` : "Report data not available"}</p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[var(--portal-orange)] px-3.5 text-xs font-bold text-white shadow-[0_2px_6px_rgba(255,109,0,0.22)] transition hover:bg-[var(--portal-orange-deep)]"
          type="button"
          onClick={onApply}
        >
          <Plus className="size-4" /> Apply
        </button>
      </div>

      <button
        className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[var(--portal-shadow-soft)] transition hover:border-slate-300"
        type="button"
        onClick={onApply}
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-[var(--portal-blue)]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
              <FileCheck2 className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-950">Need a new loan?</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> CIBIL score {score ?? "--"} and report details are ready
              </span>
            </span>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-50 text-xl text-slate-500 transition group-hover:text-[var(--portal-blue)]">
            &rsaquo;
          </span>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2">
          {["CIBIL", "KYC", "Plan"].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[0.68rem] font-bold text-slate-600">
              <Check className="size-3.5 text-emerald-600" /> {item}
            </span>
          ))}
        </div>
      </button>

      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[var(--portal-shadow-soft)]">
        <SummaryCard tone="green" title="Active Loans" value={loading ? "..." : String(summary.activeCount)} amount={loading ? "..." : summary.activeAmount} caption={summary.lastChecked} />
        <SummaryCard tone="red" title="Overdue" value={loading ? "..." : String(summary.overdueCount)} amount={loading ? "..." : summary.overdueAmount} caption={summary.overdueCount ? "Affects CIBIL" : "No overdue amount"} />
      </div>

      {error ? (
        <AppCard className="border-rose-200 bg-rose-50">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold leading-5 text-rose-700">{error}</p>
            <button className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[0.68rem] font-bold text-rose-700" type="button" onClick={onRefresh}>
              Retry
            </button>
          </div>
        </AppCard>
      ) : null}

      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-2">
        {(["All Loans", "Active", "Completed"] as LoanFilter[]).map((tab) => (
          <button
            key={tab}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition",
              filter === tab ? "border-[var(--portal-blue)] bg-white text-[var(--portal-blue)]" : "border-slate-200 bg-white text-slate-600",
            )}
            type="button"
            onClick={() => onFilterChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {loading ? (
          <LoanLoadingCards />
        ) : loans.length ? (
          loans.map((loan, index) => <ProfessionalLoanCard key={loan.id} index={index} loan={loan} />)
        ) : (
          <AppCard className="xl:col-span-2">
            <p className="text-sm font-bold text-slate-800">{filter === "Completed" ? "No completed loans yet" : "No loan accounts found"}</p>
            <p className="mt-1 text-xs text-slate-500">{filter === "Completed" ? "Completed loan accounts will appear here after closure." : "Loan accounts from your latest CIBIL report will appear here."}</p>
          </AppCard>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  amount,
  caption,
  title,
  tone,
  value,
}: {
  amount: string;
  caption: string;
  title: string;
  tone: "green" | "red";
  value: string;
}) {
  const isGreen = tone === "green";

  return (
    <div
      className={cn(
        "relative border-r border-slate-200 bg-white p-4 last:border-r-0",
        !isGreen && "bg-rose-50/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold leading-tight text-slate-600">{title}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg border", isGreen ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-rose-100 bg-rose-50 text-rose-600")}>
          {isGreen ? <FileText className="size-5" /> : <Info className="size-5" />}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{amount}</p>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

function ProfessionalLoanCard({ loan, index }: { loan: Loan; index: number }) {
  const overdue = loan.status === "Overdue";

  return (
    <AppCard
      className={cn(
        "animate-[creditPanelIn_0.45s_ease-out_both] overflow-hidden p-0",
        overdue ? "border-rose-200 bg-white" : "bg-white",
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-base font-bold text-slate-950">{loan.bank}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{loan.borrower}</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", overdue ? "border-rose-300 text-rose-600" : "border-emerald-200 text-emerald-600")}>
          {loan.status}
        </span>
      </div>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-xs font-semibold text-slate-500">Loan Amount</p>
        <p className="mt-1 text-2xl font-bold text-slate-950">{loan.amount}</p>
      </div>

      <div className="grid grid-cols-2 border-y border-slate-100">
        <LoanMetric title="EMI Amount" value={loan.emi} />
        <LoanMetric title="Last Payment" value={loan.nextEmi} />
      </div>

      {overdue ? (
        <div className="mx-4 mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 sm:mx-5">
          <Info className="size-5" /> {loan.overdue}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3 px-4 py-4 text-xs text-slate-600 sm:px-5">
        <MetaCell label="Sanctioned" value={loan.sanctioned} />
        <MetaCell label="Disbursed" value={loan.disbursed} />
        <MetaCell align="right" label="EMIs" value={loan.tenure} />
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        <PrimaryPortalButton className={cn("h-11 w-full rounded-xl text-sm", overdue && "border-rose-500 bg-rose-500 shadow-rose-100 hover:bg-rose-600")}>
          <CreditCard className="size-5" /> Pay EMI {loan.emi}
        </PrimaryPortalButton>
      </div>
    </AppCard>
  );
}

function LoanLoadingCards() {
  return (
    <>
      {[0, 1].map((item) => (
        <AppCard key={item} className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="h-4 w-36 rounded-full bg-slate-100 animate-pulse" />
            <span className="h-7 w-20 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <span className="block h-8 w-44 rounded-full bg-slate-100 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <span className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
            <span className="h-14 rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        </AppCard>
      ))}
    </>
  );
}

function LoanMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="border-r border-slate-100 bg-white p-4 last:border-r-0">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function MetaCell({ align, label, value }: { align?: "right"; label: string; value: string }) {
  return (
    <span className={cn(align === "right" && "text-right")}>
      <strong className="block text-slate-800">{label}</strong>
      {value}
    </span>
  );
}

function ApplyLoanDialog({
  employmentType,
  lastChecked,
  onClose,
  onEmploymentTypeChange,
  score,
}: {
  employmentType: string;
  lastChecked: string | null;
  onClose: () => void;
  onEmploymentTypeChange: (type: string) => void;
  score: number | null;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-5 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out] sm:px-6">
      <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">Loan Application</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Apply for Loan</h2>
            <p className="mt-1 text-xs text-slate-500">Complete the details and upload required PDF documents.</p>
          </div>
          <button
            aria-label="Close loan application"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-slate-900"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500" />
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-700">CIBIL Score: {score ?? "--"}</p>
                <p className="text-xs text-slate-600">{lastChecked ? `Verified on ${lastChecked}` : "Latest report data will be used when available"}</p>
              </div>
            </div>
            <button className="text-xs font-bold text-cyan-700 transition hover:text-cyan-900" type="button">
              Refresh
            </button>
          </div>

          <form className="mt-5 grid gap-5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Loan Amount" required>
                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-cyan-300">
                  <BadgeIndianRupee className="size-5 shrink-0 text-slate-400" />
                  <input className="min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400" inputMode="numeric" placeholder="Enter Loan Amount" />
                </div>
              </FormField>

              <FormField label="Type of Loan" required>
                <button className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm" type="button">
                  Personal Loan <ChevronDown className="size-5 text-slate-400" />
                </button>
              </FormField>
            </div>

            <FormField label="Employment Type" required>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {employmentTypes.map((type) => {
                  const selected = employmentType === type;

                  return (
                    <button
                      key={type}
                      className={cn(
                        "h-11 rounded-full border px-3 text-xs font-bold transition hover:-translate-y-0.5",
                        selected ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600",
                      )}
                      type="button"
                      onClick={() => onEmploymentTypeChange(type)}
                    >
                      {selected ? <span className="mr-2 inline-block size-2 rounded-full bg-cyan-500" /> : null}
                      {type}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Monthly Income" required>
                <TextInput placeholder="Enter Monthly Income" />
              </FormField>

              <FormField label="Company Name" required>
                <TextInput placeholder="Enter Company Name" />
              </FormField>
            </div>

            <FormField label="Work Experience (Years)" required>
              <TextInput placeholder="Enter Work Experience (Years)" />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <UploadField label="Salary Slip" />
              <UploadField label="Bank Statement (3 Months)" />
              <UploadField label="Aadhaar Card" />
              <UploadField label="PAN Card" />
            </div>

            <div className="sticky bottom-0 -mx-4 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                <button
                  className="h-11 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <PrimaryPortalButton className="h-11 rounded-full text-xs">
                  Review & Submit
                </PrimaryPortalButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FormField({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-900">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function TextInput({ placeholder }: { placeholder: string }) {
  return (
    <input className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100" placeholder={placeholder} />
  );
}

function UploadField({ label }: { label: string }) {
  return (
    <FormField label={label} required>
      <label className="grid min-h-32 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/40">
        <input className="sr-only" type="file" accept="application/pdf" />
        <span>
          <Upload className="mx-auto size-8 text-slate-400" />
          <span className="mt-3 block text-sm font-semibold text-slate-500">Upload {label}</span>
          <span className="mt-2 block text-xs text-slate-400">Upload PDF format only</span>
        </span>
      </label>
    </FormField>
  );
}

function buildLoans(result: DisplayDataResponse | null): Loan[] {
  const borrower = result?.data?.display?.profile?.name || "Borrower";
  const accounts = result?.data?.display?.accounts ?? [];

  return accounts.map((account, index) => {
    const overdueAmount = readNumericValue(account.amount_overdue);
    const closed = Boolean(account.account_closed);
    const status = overdueAmount > 0 ? "Overdue" : closed ? "Completed" : "Active";
    const emi = formatRupees(account.emi);
    const amount = readNumericValue(account.high_credit_amount) || readNumericValue(account.current_balance);

    return {
      amount: formatRupees(amount),
      bank: account.member_name || "Credit lender",
      borrower,
      disbursed: formatCompactDate(account.reported_and_certified || account.opened),
      emi,
      id: `${account.member_name || "loan"}-${account.type || "account"}-${index}`,
      nextEmi: account.last_payment ? formatCompactDate(account.last_payment) : "--",
      overdue: overdueAmount > 0 ? `${formatRupees(overdueAmount)} overdue - Affects CIBIL` : "",
      paymentFrequency: formatPaymentFrequency(account.payment_frequency),
      sanctioned: formatCompactDate(account.opened),
      status,
      tenure: account.repayment_tenure ? String(account.repayment_tenure) : "--",
    };
  });
}

function buildLoanSummary(loans: Loan[], result: DisplayDataResponse | null): LoanSummary {
  const activeLoans = loans.filter((loan) => loan.status === "Active" || loan.status === "Overdue");
  const overdueLoans = loans.filter((loan) => loan.status === "Overdue");
  const accounts = result?.data?.display?.accounts ?? [];
  const activeAmount = accounts
    .filter((account) => !account.account_closed)
    .reduce((total, account) => total + (readNumericValue(account.high_credit_amount) || readNumericValue(account.current_balance)), 0);
  const overdueAmount = accounts.reduce((total, account) => total + readNumericValue(account.amount_overdue), 0);

  return {
    activeAmount: formatRupees(activeAmount),
    activeCount: activeLoans.length,
    lastChecked: readLastChecked(result) ?? "--",
    overdueAmount: formatRupees(overdueAmount),
    overdueCount: overdueLoans.length,
  };
}

function readScore(result: DisplayDataResponse | null) {
  const score = result?.data?.display?.score?.value ?? result?.data?.report?.credit_score;
  const numericScore = typeof score === "number" ? score : Number(score);

  return Number.isFinite(numericScore) && numericScore > 0 ? numericScore : null;
}

function readLastChecked(result: DisplayDataResponse | null) {
  const value = result?.data?.display?.profile?.fetched_at ?? result?.fetchedAt;

  return value ? formatDateTime(value) : null;
}

function readNumericValue(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatRupees(value: unknown) {
  const amount = readNumericValue(value);

  if (!amount) return "Rs. 0";

  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount).replace("₹", "Rs. ");
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return formatCompactDate(value);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCompactDate(value?: string | null) {
  if (!value) return "--";

  if (/^\d{8}$/.test(value)) {
    const day = value.slice(0, 2);
    const month = value.slice(2, 4);
    const year = value.slice(4);

    if (value === "11111111" || value === "00000000") {
      return "--";
    }

    return `${day}/${month}/${year}`;
  }

  return value;
}

function formatPaymentFrequency(value?: string | null) {
  const frequencies: Record<string, string> = {
    "01": "Weekly",
    "02": "Fortnightly",
    "03": "Monthly",
    "04": "Quarterly",
  };

  return value ? frequencies[value] ?? value : "--";
}
