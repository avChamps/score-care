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
  LoaderCircle,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { apiRequest, apiUrl } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData } from "@/lib/cibil-display-cache";
import { cn } from "@/lib/utils";

type LoanFilter = "All Loans" | "Your Applications";
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
type LoanToast = {
  message: string;
  title: string;
};
type LoanApplication = {
  applicationStatus?: string | null;
  id?: string | number | null;
  loanAmount?: string | number | null;
  loanType?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
};

const loanTypes = [
  { label: "Personal Loan", value: "personal" },
  { label: "Overdraft Loan", value: "overdraft" },
  { label: "Home Loan", value: "home" },
  { label: "Business Loan", value: "business" },
  { label: "MSME Loan", value: "msme" },
  { label: "Loan Against Property", value: "loan_against_property" },
];
const employmentTypes = [
  { label: "Salaried", value: "salaried" },
  { label: "Self Employed", value: "self_employed" },
  { label: "Business Owner", value: "business_owner" },
  { label: "Professional", value: "professional" },
];
const uploadLimits = {
  aadhaarCard: 2,
  bankStatements: 3,
  panCard: 2,
  salarySlips: 8,
};

type UploadFieldName = keyof typeof uploadLimits;
type SelectedUploadFiles = Record<UploadFieldName, File[]>;

const emptySelectedUploadFiles: SelectedUploadFiles = {
  aadhaarCard: [],
  bankStatements: [],
  panCard: [],
  salarySlips: [],
};

export function LoansExperience() {
  const router = useRouter();
  const [applyOpen, setApplyOpen] = useState(false);
  const [filter, setFilter] = useState<LoanFilter>("All Loans");
  const [loanType, setLoanType] = useState("personal");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [applicationError, setApplicationError] = useState("");
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<LoanToast | null>(null);

  const loans = useMemo(() => buildLoans(displayData), [displayData]);
  const summary = useMemo(() => buildLoanSummary(loans, displayData), [displayData, loans]);
  const score = readScore(displayData);
  const lastChecked = readLastChecked(displayData);

  const visibleLoans = useMemo(() => {
    if (filter === "Your Applications") {
      return [];
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
      const result = (await getCachedCibilDisplayData(token)) as DisplayDataResponse;

      setDisplayData(result);
    } catch (loadError) {
      if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      setDisplayData(null);
      setError("Could not load loan accounts from your CIBIL report.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadApplicationStatus = useCallback(async () => {
    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setApplicationLoading(true);
    setApplicationError("");

    try {
      const response = await apiRequest("/loans/me/status", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = (await response.json()) as { data?: LoanApplication | null; message?: string; status?: string };

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok || result.status === "error") {
        setApplication(null);
        setApplicationError(result.message || "Loan application not found");
        return;
      }

      setApplication(result.data ?? null);
    } catch {
      setApplication(null);
      setApplicationError("Could not load your loan application status.");
    } finally {
      setApplicationLoading(false);
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

  useEffect(() => {
    if (!toast) return;

    const toastTimer = window.setTimeout(() => {
      setToast(null);
    }, 4200);

    return () => {
      window.clearTimeout(toastTimer);
    };
  }, [toast]);

  return (
    <PortalShell active="loans">
      <PortalTopBar title="Loan Repayments" />
      <PageContent>
        <RepaymentsView
          error={error}
          application={application}
          applicationError={applicationError}
          applicationLoading={applicationLoading}
          filter={filter}
          lastChecked={lastChecked}
          loading={loading}
          loans={visibleLoans}
          onApply={() => setApplyOpen(true)}
          onApplicationsRefresh={loadApplicationStatus}
          onFilterChange={(nextFilter) => {
            setFilter(nextFilter);

            if (nextFilter === "Your Applications") {
              void loadApplicationStatus();
            }
          }}
          onRefresh={loadLoans}
          score={score}
          summary={summary}
        />
      </PageContent>
      {applyOpen ? (
        <ApplyLoanDialog
          employmentType={employmentType}
          lastChecked={lastChecked}
          loanType={loanType}
          onClose={() => setApplyOpen(false)}
          onApplicationSuccess={() => {
            setApplyOpen(false);
            window.dispatchEvent(new Event("scorecare:notifications-updated"));

            if (filter === "Your Applications") {
              void loadApplicationStatus();
            }
            setToast({
              title: "Loan application submitted",
              message: "Your details and documents were sent successfully. Our team will review them shortly.",
            });
          }}
          onEmploymentTypeChange={setEmploymentType}
          onLoanTypeChange={setLoanType}
          score={score}
        />
      ) : null}
      {toast ? <LoanSuccessToast message={toast.message} title={toast.title} onClose={() => setToast(null)} /> : null}
    </PortalShell>
  );
}

function RepaymentsView({
  application,
  applicationError,
  applicationLoading,
  error,
  filter,
  lastChecked,
  loading,
  loans,
  onApplicationsRefresh,
  onApply,
  onFilterChange,
  onRefresh,
  score,
  summary,
}: {
  application: LoanApplication | null;
  applicationError: string;
  applicationLoading: boolean;
  error: string;
  filter: LoanFilter;
  lastChecked: string | null;
  loading: boolean;
  loans: Loan[];
  onApplicationsRefresh: () => void;
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
        {(["All Loans", "Your Applications"] as LoanFilter[]).map((tab) => (
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
        {filter === "Your Applications" ? (
          <LoanApplicationStatusCard application={application} error={applicationError} loading={applicationLoading} onApply={onApply} onRefresh={onApplicationsRefresh} />
        ) : loading ? (
          <LoanLoadingCards />
        ) : loans.length ? (
          loans.map((loan, index) => <ProfessionalLoanCard key={loan.id} index={index} loan={loan} />)
        ) : (
          <AppCard className="xl:col-span-2">
            <p className="text-sm font-bold text-slate-800">No loan accounts found</p>
            <p className="mt-1 text-xs text-slate-500">Loan accounts from your latest CIBIL report will appear here.</p>
          </AppCard>
        )}
      </div>
    </div>
  );
}

function LoanSuccessToast({ message, onClose, title }: { message: string; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-x-4 top-4 z-[90] flex justify-center sm:inset-x-auto sm:right-5 sm:top-5">
      <div
        className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_22px_60px_rgba(15,23,42,0.18)] ring-1 ring-emerald-50 animate-[creditPanelIn_0.22s_ease-out]"
        role="status"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-950">{title}</span>
          <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{message}</span>
        </span>
        <button
          aria-label="Close success notification"
          className="grid size-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          type="button"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function LoanApplicationStatusCard({
  application,
  error,
  loading,
  onApply,
  onRefresh,
}: {
  application: LoanApplication | null;
  error: string;
  loading: boolean;
  onApply: () => void;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <AppCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600">
            <LoaderCircle className="size-5 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Loading application status</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">Checking your latest loan application.</p>
          </div>
        </div>
      </AppCard>
    );
  }

  if (!application) {
    return (
      <AppCard className="border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-950">{error || "Loan application not found"}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Your submitted loan application will appear here after you apply.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300" type="button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="rounded-full bg-[var(--portal-orange)] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[var(--portal-orange-deep)]" type="button" onClick={onApply}>
              Apply
            </button>
          </div>
        </div>
      </AppCard>
    );
  }

  const status = application.applicationStatus || "submitted";

  return (
    <AppCard className="overflow-hidden border-emerald-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-600">Your Application</p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">{formatRupees(application.loanAmount)}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatLoanTypeLabel(application.loanType)} application</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black capitalize text-emerald-700">
          {status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3">
        <ApplicationMeta label="Application ID" value={application.id ? String(application.id) : "--"} />
        <ApplicationMeta label="Submitted" value={formatDateTime(application.submittedAt || "")} />
        <ApplicationMeta label="Updated" value={formatDateTime(application.updatedAt || "")} />
      </div>
    </AppCard>
  );
}

function ApplicationMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
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
  loanType,
  onApplicationSuccess,
  onClose,
  onEmploymentTypeChange,
  onLoanTypeChange,
  score,
}: {
  employmentType: string;
  lastChecked: string | null;
  loanType: string;
  onApplicationSuccess: () => void;
  onClose: () => void;
  onEmploymentTypeChange: (type: string) => void;
  onLoanTypeChange: (type: string) => void;
  score: number | null;
}) {
  const selectedLoanType = loanTypes.find((type) => type.value === loanType) ?? loanTypes[0];
  const uploadInputRefs = useRef<Record<UploadFieldName, HTMLInputElement | null>>({
    aadhaarCard: null,
    bankStatements: null,
    panCard: null,
    salarySlips: null,
  });
  const [selectedFiles, setSelectedFiles] = useState<SelectedUploadFiles>(emptySelectedUploadFiles);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loanTypeOpen, setLoanTypeOpen] = useState(false);

  const handleUploadChange = (name: UploadFieldName, event: React.ChangeEvent<HTMLInputElement>) => {
    const maxFiles = uploadLimits[name];
    const files = Array.from(event.target.files ?? []);
    const acceptedFiles = files.slice(0, maxFiles);

    if (files.length > maxFiles) {
      const dataTransfer = new DataTransfer();

      acceptedFiles.forEach((file) => dataTransfer.items.add(file));
      event.target.files = dataTransfer.files;
      setSubmitError(`You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"} for ${formatUploadFieldName(name)}.`);
    } else {
      setSubmitError("");
    }

    setSelectedFiles((currentFiles) => ({
      ...currentFiles,
      [name]: acceptedFiles,
    }));
  };

  const syncUploadInputFiles = (name: UploadFieldName, files: File[]) => {
    const input = uploadInputRefs.current[name];

    if (!input) return;

    const dataTransfer = new DataTransfer();

    files.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
  };

  const handleUploadRemove = (name: UploadFieldName, fileIndex: number) => {
    setSubmitError("");
    setSelectedFiles((currentFiles) => {
      const nextFiles = currentFiles[name].filter((_, index) => index !== fileIndex);

      syncUploadInputFiles(name, nextFiles);

      return {
        ...currentFiles,
        [name]: nextFiles,
      };
    });
  };

  const handleApplyLoan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      setSubmitError("Your session has expired. Please login again.");
      return;
    }

    const formData = new FormData(form);
    const payload = new FormData();
    const requiredFields = ["loanAmount", "monthlyIncome", "workExperience"] as const;

    for (const field of requiredFields) {
      const value = String(formData.get(field) ?? "").trim();

      if (!value) {
        setSubmitError("Please complete all required loan details.");
        return;
      }

      payload.append(field, value);
    }

    payload.append("loanType", loanType);
    payload.append("employmentType", employmentType);

    const requiredFileFields = ["salarySlips", "bankStatements", "aadhaarCard", "panCard"] as const;

    for (const field of requiredFileFields) {
      const files = formData.getAll(field).filter((file): file is File => file instanceof File && file.size > 0);
      const maxFiles = uploadLimits[field];

      if (!files.length) {
        setSubmitError("Please upload all required PDF documents.");
        return;
      }

      if (files.length > maxFiles) {
        setSubmitError(`You can upload up to ${maxFiles} file${maxFiles === 1 ? "" : "s"} for ${formatUploadFieldName(field)}.`);
        return;
      }

      files.forEach((file) => payload.append(field, file));
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(apiUrl("/loans/apply"), {
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        method: "POST",
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        throw new Error("Your session has expired. Please login again.");
      }

      if (!response.ok) {
        throw new Error((await readApiMessage(response)) || "Unable to submit loan application.");
      }

      form.reset();
      setSelectedFiles(emptySelectedUploadFiles);
      setSubmitting(false);
      onApplicationSuccess();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit loan application.");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/45 px-4 py-5 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out] sm:px-6">
      <div className="mx-auto flex h-[calc(100dvh-2.5rem)] max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
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

          <form className="mt-5 grid gap-5" onSubmit={handleApplyLoan}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Loan Amount" required>
                <div className="flex h-12 items-center rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-cyan-300">
                  <BadgeIndianRupee className="size-5 shrink-0 text-slate-400" />
                  <input className="min-w-0 flex-1 rounded-none bg-transparent px-3 text-sm font-semibold outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0 focus-visible:outline-none" inputMode="numeric" name="loanAmount" placeholder="Enter Loan Amount" required />
                </div>
              </FormField>

              <FormField label="Type of Loan" required>
                <div
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setLoanTypeOpen(false);
                    }
                  }}
                >
                  <button
                    aria-expanded={loanTypeOpen}
                    aria-haspopup="listbox"
                    className="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-700 shadow-sm outline-none transition hover:border-cyan-200 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                    type="button"
                    onClick={() => setLoanTypeOpen((open) => !open)}
                  >
                    <span>{selectedLoanType.label}</span>
                    <ChevronDown className={cn("size-5 text-slate-400 transition", loanTypeOpen && "rotate-180")} />
                  </button>
                  {loanTypeOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-[0_18px_45px_rgba(15,23,42,0.18)]" role="listbox">
                      {loanTypes.map((type) => {
                        const selected = type.value === loanType;

                        return (
                          <button
                            key={type.value}
                            aria-selected={selected}
                            className={cn(
                              "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-semibold transition hover:bg-cyan-50",
                              selected ? "bg-cyan-50 text-cyan-700" : "text-slate-600",
                            )}
                            role="option"
                            type="button"
                            onClick={() => {
                              onLoanTypeChange(type.value);
                              setLoanTypeOpen(false);
                            }}
                          >
                            {type.label}
                            {selected ? <Check className="size-4 text-cyan-600" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </FormField>
            </div>

            <FormField label="Employment Type" required>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {employmentTypes.map((type) => {
                  const selected = employmentType === type.value;

                  return (
                    <button
                      key={type.value}
                      className={cn(
                        "h-11 rounded-full border px-3 text-xs font-bold transition hover:-translate-y-0.5",
                        selected ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600",
                      )}
                      type="button"
                      onClick={() => onEmploymentTypeChange(type.value)}
                    >
                      {selected ? <span className="mr-2 inline-block size-2 rounded-full bg-cyan-500" /> : null}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Monthly Income" required>
                <TextInput inputMode="numeric" name="monthlyIncome" placeholder="Enter Monthly Income" required />
              </FormField>

              <FormField label="Company Name">
                <TextInput name="companyName" placeholder="Enter Company Name" />
              </FormField>
            </div>

            <FormField label="Work Experience (Years)" required>
              <TextInput inputMode="numeric" name="workExperience" placeholder="Enter Work Experience (Years)" required />
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2">
              <UploadField files={selectedFiles.salarySlips} inputRef={(input) => { uploadInputRefs.current.salarySlips = input; }} label="Salary Slip" maxFiles={uploadLimits.salarySlips} name="salarySlips" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              <UploadField files={selectedFiles.bankStatements} inputRef={(input) => { uploadInputRefs.current.bankStatements = input; }} label="Bank Statement (3 Months)" maxFiles={uploadLimits.bankStatements} name="bankStatements" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              <UploadField files={selectedFiles.aadhaarCard} inputRef={(input) => { uploadInputRefs.current.aadhaarCard = input; }} label="Aadhaar Card" maxFiles={uploadLimits.aadhaarCard} name="aadhaarCard" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              <UploadField files={selectedFiles.panCard} inputRef={(input) => { uploadInputRefs.current.panCard = input; }} label="PAN Card" maxFiles={uploadLimits.panCard} name="panCard" onChange={handleUploadChange} onRemove={handleUploadRemove} />
            </div>

            {submitError ? (
              <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{submitError}</p>
            ) : null}
            <div className="sticky bottom-0 z-20 -mx-4 bg-white/95 px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] pt-4 backdrop-blur sm:-mx-5 sm:px-5 lg:pb-4">
              <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                <button
                  className="h-11 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <PrimaryPortalButton className="h-11 rounded-full text-xs" disabled={submitting} type="submit">
                  {submitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Review & Submit"
                  )}
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

function TextInput({ className, ...props }: React.ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}

function UploadField({
  files,
  inputRef,
  label,
  maxFiles,
  name,
  onChange,
  onRemove,
}: {
  files: File[];
  inputRef: (input: HTMLInputElement | null) => void;
  label: string;
  maxFiles: number;
  name: UploadFieldName;
  onChange: (name: UploadFieldName, event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (name: UploadFieldName, fileIndex: number) => void;
}) {
  const fileCountLabel = `${files.length}/${maxFiles} file${maxFiles === 1 ? "" : "s"} selected`;

  return (
    <FormField label={label} required>
      <label className="grid min-h-32 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50/40">
        <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" multiple name={name} required onChange={(event) => onChange(name, event)} />
        <span className="min-w-0">
          <Upload className="mx-auto size-8 text-slate-400" />
          <span className="mt-3 block text-sm font-semibold text-slate-500">Upload {label}</span>
          <span className="mt-2 block text-xs text-slate-400">Upload PDF format only. Max {maxFiles} files.</span>
          <span className={cn("mt-3 block text-xs font-bold", files.length ? "text-cyan-700" : "text-slate-400")}>{fileCountLabel}</span>
          {files.length ? (
            <span className="mt-2 block space-y-1 text-left">
              {files.map((file, index) => (
                <span key={`${file.name}-${file.lastModified}`} className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600">
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-white hover:text-rose-600"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      onRemove(name, index);
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </label>
    </FormField>
  );
}

async function readApiMessage(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await response.json()) as unknown;

    if (body && typeof body === "object") {
      const message = "message" in body ? body.message : "error" in body ? body.error : null;

      return typeof message === "string" ? message : "";
    }

    return "";
  }

  return response.text();
}

function formatUploadFieldName(name: UploadFieldName) {
  const labels: Record<UploadFieldName, string> = {
    aadhaarCard: "Aadhaar Card",
    bankStatements: "Bank Statement",
    panCard: "PAN Card",
    salarySlips: "Salary Slip",
  };

  return labels[name];
}

function formatLoanTypeLabel(value?: string | null) {
  return loanTypes.find((type) => type.value === value)?.label ?? (value ? value.replace(/_/g, " ") : "Loan");
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
