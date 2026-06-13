"use client";

import {
  ArrowLeft,
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
import { SubscribePromptOverlay, getSubscriptionPlans, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { apiRequest, apiUrl } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { useSubscriptionAccess } from "@/lib/subscription-access";
import { cn } from "@/lib/utils";

type LoanFilter = "All Loans" | "Your Applications";
type LoanStatusFilter = "All" | "Active Loans" | "Closed Loans";
type DisplayDataResponse = {
  fetchedAt?: string | null;
  data?: {
    name?: string | null;
    report?: {
      credit_score?: string | number | null;
    };
    credit_score?: string | number | null;
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
    credit_report?: {
      CAIS_Account?: {
        CAIS_Account_DETAILS?: CreditAccount[] | null;
      };
    };
  };
};
type CreditAccount = {
  Account_Type?: string | number | null;
  Account_Number?: string | number | null;
  Amount_Past_Due?: string | number | null;
  Current_Balance?: string | number | null;
  Date_Closed?: string | null;
  Date_Reported?: string | null;
  Highest_Credit_or_Original_Loan_Amount?: string | number | null;
  Identification_Number?: string | number | null;
  Open_Date?: string | null;
  Payment_Frequency?: string | null;
  Portfolio_Type?: string | null;
  Repayment_Tenure?: string | number | null;
  Scheduled_Monthly_Payment_Amount?: string | number | null;
  Subscriber_Name?: string | null;
  Terms_Duration?: string | number | null;
  Terms_Frequency?: string | null;
  Date_of_Last_Payment?: string | number | null;
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
  loanType: string;
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
type LoanOption = {
  displayOrder?: number | null;
  isActive?: boolean | null;
  label: string;
  value: string;
};
type LoanOptionsResponse = {
  data?: {
    employmentTypes?: LoanOption[] | null;
    loanTypes?: LoanOption[] | null;
  };
};

const fallbackLoanTypes = [
  { label: "Personal Loan", value: "personal" },
  { label: "Overdraft Loan", value: "overdraft" },
  { label: "Home Loan", value: "home" },
  { label: "Business Loan", value: "business" },
  { label: "MSME Loan", value: "msme" },
  { label: "Loan Against Property", value: "loan_against_property" },
];
const fallbackEmploymentTypes = [
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
  const [loanStatusFilter, setLoanStatusFilter] = useState<LoanStatusFilter>("All");
  const [loanType, setLoanType] = useState("personal");
  const [employmentType, setEmploymentType] = useState("salaried");
  const [displayData, setDisplayData] = useState<DisplayDataResponse | null>(null);
  const [error, setError] = useState("");
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [applicationError, setApplicationError] = useState("");
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBenefitsPrompt, setShowBenefitsPrompt] = useState(false);
  const [toast, setToast] = useState<LoanToast | null>(null);
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  const loans = useMemo(() => buildLoans(displayData), [displayData]);
  const summary = useMemo(() => buildLoanSummary(loans, displayData), [displayData, loans]);
  const score = readScore(displayData);
  const lastChecked = readLastChecked(displayData);

  const visibleLoans = useMemo(() => {
    if (isFreeTier || filter === "Your Applications") {
      return [];
    }

    if (loanStatusFilter === "Active Loans") {
      return loans.filter((loan) => loan.status === "Active" || loan.status === "Overdue");
    }

    if (loanStatusFilter === "Closed Loans") {
      return loans.filter((loan) => loan.status === "Completed");
    }

    return loans;
  }, [filter, isFreeTier, loanStatusFilter, loans]);

  const openBenefitsPrompt = useCallback(() => {
    setShowBenefitsPrompt(true);
  }, []);

  const loadLoans = useCallback(async () => {
    if (accessLoading) {
      return;
    }

    const token = sessionStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    if (isFreeTier) {
      setDisplayData(getStoredLatestCibilScoreCheckData(token) as DisplayDataResponse | null);
      setError("");
      setLoading(false);
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

      const cachedResult = getStoredLatestCibilScoreCheckData(token) as DisplayDataResponse | null;

      setDisplayData(cachedResult);
      setError(cachedResult ? "" : "Could not load loan accounts from your CIBIL report.");
    } finally {
      setLoading(false);
    }
  }, [accessLoading, isFreeTier, router]);

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

  useEffect(() => {
    if (accessLoading || !isFreeTier || filter === "Your Applications") {
      return;
    }

    void Promise.resolve().then(() => {
      setFilter("Your Applications");
      void loadApplicationStatus();
    });
  }, [accessLoading, filter, isFreeTier, loadApplicationStatus]);

  return (
    <PortalShell active="loans">
      <div className="min-h-screen bg-[#050B15]">
        <PortalTopBar title="Loan Repayments" />
        <PageContent className="max-w-md px-4 py-6 text-white">
          <RepaymentsView
            error={error}
            application={application}
            applicationError={applicationError}
            applicationLoading={applicationLoading}
            filter={filter}
            lastChecked={lastChecked}
            loanStatusFilter={loanStatusFilter}
            loading={loading}
            loans={visibleLoans}
            onApply={() => setApplyOpen(true)}
            onBack={() => router.back()}
            onApplicationsRefresh={loadApplicationStatus}
            onFilterChange={(nextFilter) => {
              if (isFreeTier && nextFilter === "All Loans") {
                openBenefitsPrompt();
                return;
              }

              setFilter(nextFilter);

              if (nextFilter === "Your Applications") {
                void loadApplicationStatus();
              }
            }}
            onRefresh={loadLoans}
            onLoanStatusFilterChange={setLoanStatusFilter}
            onSubscribePrompt={openBenefitsPrompt}
            score={score}
            summary={summary}
            subscriptionLocked={isFreeTier}
          />
        </PageContent>
      </div>
      {showBenefitsPrompt ? (
        <LoanBenefitsPrompt
          onClose={() => setShowBenefitsPrompt(false)}
          onSubscribe={() => {
            setShowBenefitsPrompt(false);
            promptSubscribe();
          }}
        />
      ) : null}
      <SubscribePromptOverlay onClose={closeSubscribePrompt} show={showSubscribePrompt} />
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
  loanStatusFilter,
  loading,
  loans,
  onApplicationsRefresh,
  onApply,
  onBack,
  onFilterChange,
  onLoanStatusFilterChange,
  onRefresh,
  onSubscribePrompt,
  score,
  summary,
  subscriptionLocked,
}: {
  application: LoanApplication | null;
  applicationError: string;
  applicationLoading: boolean;
  error: string;
  filter: LoanFilter;
  lastChecked: string | null;
  loanStatusFilter: LoanStatusFilter;
  loading: boolean;
  loans: Loan[];
  onApplicationsRefresh: () => void;
  onApply: () => void;
  onBack: () => void;
  onFilterChange: (filter: LoanFilter) => void;
  onLoanStatusFilterChange: (filter: LoanStatusFilter) => void;
  onRefresh: () => void;
  onSubscribePrompt: () => void;
  score: number | null;
  summary: LoanSummary;
  subscriptionLocked: boolean;
}) {
  return (
    <div className="space-y-4 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="flex items-start gap-3">
        <button
          aria-label="Go back"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white transition hover:bg-white/[0.12]"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#FFD34D]">Loans</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Repayments</h2>
          <p className="mt-1 text-xs text-[#94A3B8]">{loading ? "Loading CIBIL accounts..." : lastChecked ? `Report updated ${lastChecked}` : "Report data not available"}</p>
        </div>
        <button
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] px-3.5 text-xs font-semibold text-[#07111F] shadow-[0_12px_24px_rgba(255,122,0,0.22)] transition hover:brightness-105"
          type="button"
          onClick={onApply}
        >
          <Plus className="size-3.5" /> Apply
        </button>
      </div>

      <button
        className="group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0C1626] p-4 text-left shadow-[0_18px_42px_rgba(0,0,0,0.32)] transition hover:border-white/[0.15]"
        type="button"
        onClick={onApply}
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-[#6F6AFF]" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.08] text-[#6F6AFF]">
              <FileCheck2 className="size-[1.125rem]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.82rem] font-semibold text-white">Need a new loan?</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#94A3B8]">
                <CheckCircle2 className="size-3.5 text-[#22F2C2]" /> CIBIL score {score ?? "--"} and report details are ready
              </span>
            </span>
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-lg text-[#94A3B8] transition group-hover:text-[#6F6AFF]">
            &rsaquo;
          </span>
        </div>
        <div className="relative mt-3 flex flex-wrap gap-2">
          {["CIBIL", "KYC", "Plan"].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[0.65rem] font-semibold text-[#94A3B8]">
              <Check className="size-3 text-[#22F2C2]" /> {item}
            </span>
          ))}
        </div>
      </button>

      <div className="grid grid-cols-2 overflow-hidden rounded-[24px] border border-white/10 bg-[#0C1626] shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
        <SummaryCard tone="green" title="Active Loans" value={loading ? "..." : String(summary.activeCount)} amount={loading ? "..." : summary.activeAmount} caption={summary.lastChecked} onClick={subscriptionLocked ? onSubscribePrompt : undefined} />
        <SummaryCard tone="red" title="Overdue" value={loading ? "..." : String(summary.overdueCount)} amount={loading ? "..." : summary.overdueAmount} caption={summary.overdueCount ? "Affects CIBIL" : "No overdue amount"} onClick={subscriptionLocked ? onSubscribePrompt : undefined} />
      </div>

      {error ? (
        <AppCard className="!border-[#FF5C8A]/25 !bg-[#FF5C8A]/10">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium leading-5 text-[#FF8AAB]">{error}</p>
            <button className="shrink-0 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[0.68rem] font-semibold text-[#FF8AAB]" type="button" onClick={onRefresh}>
              Retry
            </button>
          </div>
        </AppCard>
      ) : null}

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {(["All Loans", "Your Applications"] as LoanFilter[]).map((tab) => (
          <button
            key={tab}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
              filter === tab ? "border-[#6F6AFF] bg-[#6F6AFF]/10 text-[#8EA2FF]" : "border-white/10 bg-white/[0.06] text-[#94A3B8]",
            )}
            type="button"
            onClick={() => onFilterChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {filter === "All Loans" ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["All", "Active Loans", "Closed Loans"] as LoanStatusFilter[]).map((tab) => (
            <button
              key={tab}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold transition",
                loanStatusFilter === tab ? "border-[#22F2C2] bg-[#22F2C2]/10 text-[#5EF2C2]" : "border-white/10 bg-white/[0.05] text-[#94A3B8]",
              )}
              type="button"
              onClick={() => onLoanStatusFilterChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3">
        {filter === "Your Applications" ? (
          <LoanApplicationStatusCard application={application} error={applicationError} loading={applicationLoading} onApply={onApply} onRefresh={onApplicationsRefresh} />
        ) : loading ? (
          <LoanLoadingCards />
        ) : loans.length ? (
          loans.map((loan, index) => <ProfessionalLoanCard key={loan.id} index={index} loan={loan} />)
        ) : (
          <AppCard className="!border-white/10 !bg-[#0C1626] xl:col-span-2">
            <p className="text-sm font-semibold text-white">No loan accounts found</p>
            <p className="mt-1 text-xs text-[#94A3B8]">Loan accounts from your latest CIBIL report will appear here.</p>
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
        className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-[#0C1626] p-4 text-white shadow-[0_22px_60px_rgba(0,0,0,0.42)] animate-[creditPanelIn_0.22s_ease-out]"
        role="status"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#22F2C2]/10 text-[#22F2C2]">
          <CheckCircle2 className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-white">{title}</span>
          <span className="mt-1 block text-xs font-medium leading-5 text-[#94A3B8]">{message}</span>
        </span>
        <button
          aria-label="Close success notification"
          className="grid size-8 shrink-0 place-items-center rounded-full text-[#94A3B8] transition hover:bg-white/[0.08] hover:text-white"
          type="button"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

function LoanBenefitsPrompt({ onClose, onSubscribe }: { onClose: () => void; onSubscribe: () => void }) {
  const [showLeavingMessage, setShowLeavingMessage] = useState(false);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [isLoadingBenefits, setIsLoadingBenefits] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadBenefits() {
      try {
        const plans = await getSubscriptionPlans();
        const apiBenefits = Array.from(new Set(plans.flatMap((plan) => plan.benefits).filter(Boolean)));

        if (isMounted) {
          setBenefits(apiBenefits);
        }
      } catch {
        if (isMounted) {
          setBenefits([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBenefits(false);
        }
      }
    }

    void loadBenefits();

    return () => {
      isMounted = false;
    };
  }, []);

  const benefitItems = benefits.length ? benefits : ["Loan payment tracking", "EMI reminders", "AI Credit Coach weekly"];

  return (
    <div className="fixed inset-0 z-[110] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="min-h-44 bg-[radial-gradient(circle_at_82%_0%,rgba(94,242,194,0.24),transparent_34%),linear-gradient(180deg,#1D2A3A_0%,#0D131C_100%)] px-5 py-6">
          <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits" onClick={() => setShowLeavingMessage(true)}>
            <X className="size-5" />
          </button>
          <div className="mt-10 max-w-[18rem]">
            <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Premium Benefits</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Unlock complete loan tracking</h2>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-3 text-[13px] font-medium leading-5 text-[#AAB6C8]">
            {isLoadingBenefits ? (
              <>
                <span className="h-11 rounded-2xl bg-white/[0.06] animate-pulse" />
                <span className="h-11 rounded-2xl bg-white/[0.06] animate-pulse" />
                <span className="h-11 rounded-2xl bg-white/[0.06] animate-pulse" />
              </>
            ) : (
              benefitItems.map((benefit) => (
                <p key={benefit} className="rounded-2xl bg-white/[0.06] px-4 py-3">{benefit}</p>
              ))
            )}
          </div>

          <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-[14px] font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={onSubscribe}>
            Subscription
          </button>
          <button className="mx-auto mt-3 block text-[11px] font-medium text-[#6F7B8E]" type="button" onClick={() => setShowLeavingMessage(true)}>
            skip for later
          </button>
        </div>
      </section>

      {showLeavingMessage ? (
        <div className="absolute inset-0 z-10 flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm" onClick={onClose}>
          <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]" onClick={(event) => event.stopPropagation()}>
            <div className="min-h-44 bg-[radial-gradient(circle_at_82%_0%,rgba(94,242,194,0.24),transparent_34%),linear-gradient(180deg,#1D2A3A_0%,#0D131C_100%)] px-5 py-6">
              <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits message" onClick={onClose}>
                <X className="size-5" />
              </button>
              <div className="mt-10 max-w-[18rem]">
                <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Before you leave</p>
                <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Enjoy more benefits with premium</h2>
              </div>
            </div>

            <div className="px-5 pb-5 pt-4">
              <div className="grid gap-3 text-[13px] font-medium leading-5 text-[#AAB6C8]">
                {benefitItems.map((benefit) => (
                  <p key={benefit} className="rounded-2xl bg-white/[0.06] px-4 py-3">{benefit}</p>
                ))}
              </div>

              <button className="mt-5 h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-[14px] font-semibold text-[#201300] shadow-[0_14px_28px_rgba(255,122,0,0.24)]" type="button" onClick={onSubscribe}>
                View subscription
              </button>
              <button className="mx-auto mt-3 block text-[11px] font-medium text-[#6F7B8E]" type="button" onClick={onClose}>
                Continue free
              </button>
            </div>
          </section>
        </div>
      ) : null}
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
      <AppCard className="!border-white/10 !bg-[#0C1626]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#6F6AFF]/10 text-[#8EA2FF]">
            <LoaderCircle className="size-5 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Loading application status</p>
            <p className="mt-1 text-xs font-medium text-[#94A3B8]">Checking your latest loan application.</p>
          </div>
        </div>
      </AppCard>
    );
  }

  if (!application) {
    return (
      <AppCard className="!border-white/10 !bg-[#0C1626] rounded-[24px] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.82rem] font-semibold text-white">{error || "Loan application not found"}</p>
            <p className="mt-1 text-xs font-medium leading-5 text-[#94A3B8]">Your submitted loan application will appear here after you apply.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button className="rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2 text-xs font-semibold text-[#CBD5E1] shadow-sm transition hover:border-white/20" type="button" onClick={onRefresh}>
              Refresh
            </button>
            <button className="rounded-full bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] px-3.5 py-2 text-xs font-semibold text-[#07111F] shadow-[0_12px_24px_rgba(255,122,0,0.22)] transition hover:brightness-105" type="button" onClick={onApply}>
              Apply
            </button>
          </div>
        </div>
      </AppCard>
    );
  }

  const status = application.applicationStatus || "submitted";

  return (
    <AppCard className="!border-white/10 !bg-[#0C1626] overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[#22F2C2]">Your Application</p>
          <h3 className="mt-1 text-base font-medium tracking-tight text-white">{formatRupees(application.loanAmount)}</h3>
          <p className="mt-1 text-[0.72rem] font-normal text-[#94A3B8]">{formatLoanTypeLabel(application.loanType)} application</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-[#22F2C2]/20 bg-[#22F2C2]/10 px-3 py-1.5 text-[0.7rem] font-medium capitalize text-[#22F2C2]">
          {status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 sm:grid-cols-3">
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
      <p className="text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[#94A3B8]">{label}</p>
      <p className="mt-1 text-xs font-medium text-white">{value}</p>
    </div>
  );
}

function SummaryCard({
  amount,
  caption,
  onClick,
  title,
  tone,
  value,
}: {
  amount: string;
  caption: string;
  onClick?: () => void;
  title: string;
  tone: "green" | "red";
  value: string;
}) {
  const isGreen = tone === "green";

  return (
    <button
      className={cn(
        "relative min-h-[140px] border-r border-white/10 bg-transparent p-4 text-left last:border-r-0",
        onClick && "cursor-pointer transition hover:bg-white/[0.06]",
        !isGreen && "bg-rose-500/5",
      )}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.72rem] font-semibold leading-tight text-[#94A3B8]">{title}</p>
        <span className={cn("grid size-7 place-items-center rounded-lg border", isGreen ? "border-[#22F2C2]/20 bg-[#22F2C2]/10 text-[#22F2C2]" : "border-[#FF5C8A]/25 bg-[#FF5C8A]/10 text-[#FF5C8A]")}>
          {isGreen ? <FileText className="size-4" /> : <Info className="size-4" />}
        </span>
      </div>
      <p className="mt-5 text-xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs font-semibold text-[#CBD5E1]">{amount}</p>
      <p className="mt-1 text-xs text-[#94A3B8]">{caption}</p>
    </button>
  );
}

function ProfessionalLoanCard({ loan, index }: { loan: Loan; index: number }) {
  const overdue = loan.status === "Overdue";
  const completed = loan.status === "Completed";

  return (
    <AppCard
      className={cn(
        "!border-white/10 !bg-[#0C1626] animate-[creditPanelIn_0.45s_ease-out_both] overflow-hidden p-0 shadow-[0_18px_42px_rgba(0,0,0,0.28)]",
        overdue && "!border-[#FF5C8A]/25",
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-white/10 px-3.5 py-3 sm:px-4">
        <div>
          <h3 className="text-sm font-semibold text-white">{loan.bank}</h3>
          <p className="mt-0.5 text-xs text-[#94A3B8]">{loan.loanType}</p>
        </div>
        <span className={cn("rounded-full border px-2.5 py-1 text-[0.68rem] font-semibold", overdue ? "border-[#FF5C8A]/25 bg-[#FF5C8A]/10 text-[#FF8AAB]" : "border-[#22F2C2]/20 bg-[#22F2C2]/10 text-[#22F2C2]")}>
          {loan.status}
        </span>
      </div>

      <div className="px-3.5 py-3 sm:px-4">
        <p className="text-xs font-medium text-[#94A3B8]">Loan Amount</p>
        <p className="mt-1 text-xl font-semibold text-white">{loan.amount}</p>
      </div>

      <div className="grid grid-cols-2 border-y border-white/10">
        <LoanMetric title="EMI Amount" value={loan.emi} />
        <LoanMetric title="Last Payment" value={loan.nextEmi} />
      </div>

      {overdue ? (
        <div className="mx-4 mt-4 inline-flex items-center gap-2 rounded-xl border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 px-3 py-2 text-xs font-medium text-[#FF8AAB] sm:mx-5">
          <Info className="size-5" /> {loan.overdue}
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2.5 px-3.5 py-3 text-[0.7rem] text-[#94A3B8] sm:px-4">
        <MetaCell label="Sanctioned" value={loan.sanctioned} />
        <MetaCell label="Disbursed" value={loan.disbursed} />
        <MetaCell align="right" label="EMIs" value={loan.tenure} />
      </div>

      {!completed ? (
        <div className="border-t border-white/10 bg-white/[0.06] px-3.5 py-2.5 sm:px-4">
          <PrimaryPortalButton
            disabled
            className={cn(
              "h-9 w-full rounded-xl text-xs",
              overdue && "border-[#FF5C8A] bg-[#FF5C8A] shadow-none hover:bg-[#FF5C8A]"
            )}
          >
            <CreditCard className="size-4" />
            {/* Pay EMI {loan.emi} */}
               Pay EMI
          </PrimaryPortalButton>
        </div>
      ) : null}
    </AppCard>
  );
}

function LoanLoadingCards() {
  return (
    <>
      {[0, 1].map((item) => (
        <AppCard key={item} className="!border-white/10 !bg-[#0C1626] space-y-4">
          <div className="flex items-center justify-between gap-4">
            <span className="h-4 w-36 rounded-full bg-white/10 animate-pulse" />
            <span className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
          </div>
          <span className="block h-8 w-44 rounded-full bg-white/10 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <span className="h-14 rounded-2xl bg-white/10 animate-pulse" />
            <span className="h-14 rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </AppCard>
      ))}
    </>
  );
}

function LoanMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="border-r border-white/10 bg-transparent p-4 last:border-r-0">
      <p className="text-xs font-medium text-[#94A3B8]">{title}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MetaCell({ align, label, value }: { align?: "right"; label: string; value: string }) {
  return (
    <span className={cn(align === "right" && "text-right")}>
      <strong className="block font-semibold text-white">{label}</strong>
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
  const [loanTypeOptions, setLoanTypeOptions] = useState<LoanOption[]>(fallbackLoanTypes);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState<LoanOption[]>(fallbackEmploymentTypes);
  const [scoreRefreshing, setScoreRefreshing] = useState(false);
  const selectedLoanType = loanTypeOptions.find((type) => type.value === loanType) ?? loanTypeOptions[0];
  const [loanAmount, setLoanAmount] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadLoanOptions() {
      try {
        const response = await apiRequest("/loans/options");

        if (!response.ok) {
          return;
        }

        const result = (await response.json()) as LoanOptionsResponse;
        const nextLoanTypes = normalizeLoanOptions(result.data?.loanTypes, fallbackLoanTypes);
        const nextEmploymentTypes = normalizeLoanOptions(result.data?.employmentTypes, fallbackEmploymentTypes);

        if (!isMounted) {
          return;
        }

        setLoanTypeOptions(nextLoanTypes);
        setEmploymentTypeOptions(nextEmploymentTypes);

        if (!nextLoanTypes.some((type) => type.value === loanType)) {
          onLoanTypeChange(nextLoanTypes[0].value);
        }

        if (!nextEmploymentTypes.some((type) => type.value === employmentType)) {
          onEmploymentTypeChange(nextEmploymentTypes[0].value);
        }
      } catch {
        if (isMounted) {
          setLoanTypeOptions(fallbackLoanTypes);
          setEmploymentTypeOptions(fallbackEmploymentTypes);
        }
      }
    }

    void loadLoanOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleScoreRefresh = async () => {
    if (scoreRefreshing) return;

    setScoreRefreshing(true);
    await wait(3000);
    setScoreRefreshing(false);
  };

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
    <div className="fixed inset-0 z-[120] flex items-end bg-black/70 px-0 pt-8 backdrop-blur-md animate-[creditPanelIn_0.2s_ease-out] sm:items-center sm:px-6 sm:py-5">
      <div className="mx-auto flex h-[calc(100dvh-2rem)] max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-[#07111F] text-white shadow-[0_24px_70px_rgba(0,0,0,0.52)] sm:h-[calc(100dvh-2.5rem)] sm:rounded-[32px]">
        <div className="flex shrink-0 items-start gap-3 border-b border-white/10 bg-[#07111F] px-4 py-4 sm:px-5">
          <button
            aria-label="Back from loan application"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white transition hover:bg-white/[0.12]"
            type="button"
            onClick={onClose}
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#8EA2FF]">Loan Application</p>
            <h2 className="mt-1 text-base font-semibold tracking-tight text-white">Apply for Loan</h2>
            <p className="mt-1 text-[0.7rem] text-[#94A3B8]">Complete the details and upload required PDF documents.</p>
          </div>
          <button
            aria-label="Close loan application"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white transition hover:bg-white/[0.12]"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#0C1626] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#22F2C2]" />
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#22F2C2]/10 text-[#22F2C2]">
                <CheckCircle2 className="size-6" />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#22F2C2]">CIBIL Score: {score ?? "--"}</p>
                <p className="text-[0.7rem] text-[#94A3B8]">{lastChecked ? `Verified on ${lastChecked}` : "Latest report data will be used when available"}</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 text-[0.7rem] font-semibold text-[#8EA2FF] transition hover:text-white" type="button" onClick={handleScoreRefresh} disabled={scoreRefreshing}>
              {scoreRefreshing ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
              {scoreRefreshing ? "Loading..." : "Refresh"}
            </button>
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleApplyLoan}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Loan Amount" required>

                <div
                  className={cn(
                    "flex h-12 items-center rounded-[18px] border bg-[#101B2B] px-3.5 shadow-sm transition",
                    loanAmount
                      ? "border-[#22F2C2] shadow-[0_0_0_1px_rgba(34,242,194,0.25)]"
                      : "border-white/10",
                  )}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[#94A3B8]">
                    <BadgeIndianRupee className="size-4" />
                  </span>

                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    placeholder="Enter Loan Amount"
                    className="ml-3 h-full flex-1 bg-transparent text-sm font-medium text-white outline-none"
                  />
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
                    className="flex h-12 w-full items-center justify-between rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-left text-xs font-medium text-white shadow-sm outline-none transition hover:border-white/20 focus:border-[#6F6AFF] focus:ring-4 focus:ring-[#6F6AFF]/10"
                    type="button"
                    onClick={() => setLoanTypeOpen((open) => !open)}
                  >
                    <span>{selectedLoanType.label}</span>
                    <ChevronDown className={cn("size-5 text-[#94A3B8] transition", loanTypeOpen && "rotate-180")} />
                  </button>
                  {loanTypeOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-[#101B2B] py-1 shadow-[0_18px_45px_rgba(0,0,0,0.32)]" role="listbox">
                      {loanTypeOptions.map((type) => {
                        const selected = type.value === loanType;

                        return (
                          <button
                            key={type.value}
                            aria-selected={selected}
                            className={cn(
                              "flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition hover:bg-white/[0.08]",
                              selected ? "bg-[#6F6AFF]/10 text-[#8EA2FF]" : "text-[#CBD5E1]",
                            )}
                            role="option"
                            type="button"
                            onClick={() => {
                              onLoanTypeChange(type.value);
                              setLoanTypeOpen(false);
                            }}
                          >
                            {type.label}
                            {selected ? <Check className="size-4 text-[#22F2C2]" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </FormField>
            </div>

            <FormField label="Employment Type" required>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {employmentTypeOptions.map((type) => {
                  const selected = employmentType === type.value;

                  return (
                    <button
                      key={type.value}
                      className={cn(
                        "flex min-h-11 items-center justify-center gap-2 rounded-full border px-3 text-center text-[0.7rem] font-semibold leading-tight transition hover:-translate-y-0.5",
                        selected ? "border-[#22F2C2]/40 bg-[#10263A] text-[#22F2C2]" : "border-white/10 bg-white/[0.06] text-[#94A3B8]",
                      )}
                      type="button"
                      onClick={() => onEmploymentTypeChange(type.value)}
                    >
                      {selected ? <span className="size-2 shrink-0 rounded-full bg-[#22F2C2]" /> : null}
                      <span className="min-w-0">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <UploadField files={selectedFiles.salarySlips} inputRef={(input) => { uploadInputRefs.current.salarySlips = input; }} label="Salary Slip" maxFiles={uploadLimits.salarySlips} name="salarySlips" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              <UploadField files={selectedFiles.bankStatements} inputRef={(input) => { uploadInputRefs.current.bankStatements = input; }} label="Bank Statement (3 Months)" maxFiles={uploadLimits.bankStatements} name="bankStatements" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              <UploadField files={selectedFiles.aadhaarCard} inputRef={(input) => { uploadInputRefs.current.aadhaarCard = input; }} label="Aadhaar Card" maxFiles={uploadLimits.aadhaarCard} name="aadhaarCard" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              <UploadField files={selectedFiles.panCard} inputRef={(input) => { uploadInputRefs.current.panCard = input; }} label="PAN Card" maxFiles={uploadLimits.panCard} name="panCard" onChange={handleUploadChange} onRemove={handleUploadRemove} />
            </div>

            {submitError ? (
              <p className="rounded-2xl border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 px-4 py-3 text-sm font-medium text-[#FF8AAB]">{submitError}</p>
            ) : null}
            <div className="-mx-4 border-t border-white/10 bg-[#07111F] px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4 sm:-mx-5 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                <button
                  className="h-11 rounded-full border border-white/10 bg-white/[0.06] text-xs font-semibold text-[#CBD5E1] shadow-sm transition hover:-translate-y-0.5 hover:border-white/20"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <PrimaryPortalButton className="h-11 rounded-full border-0 bg-[linear-gradient(135deg,#FFD34D,#FF7A00)] text-xs font-semibold text-[#07111F] shadow-[0_12px_24px_rgba(255,122,0,0.22)] hover:brightness-105" disabled={submitting} type="submit">
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
      <span className="mb-2 block text-xs font-semibold text-white">
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
        "h-12 w-full rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-xs font-medium text-white shadow-sm outline-none transition placeholder:text-[#94A3B8] focus:border-[#22F2C2] focus:outline-none focus:ring-4 focus:ring-[#22F2C2]/10 focus-visible:outline-none",
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
      <label className="grid min-h-32 cursor-pointer place-items-center rounded-[18px] border border-dashed border-white/10 bg-[#101B2B] px-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-[#6F6AFF]/60 hover:bg-white/[0.06]">
        <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" multiple name={name} required onChange={(event) => onChange(name, event)} />
        <span className="min-w-0">
          <Upload className="mx-auto size-8 text-[#94A3B8]" />
          <span className="mt-3 block text-xs font-medium text-[#CBD5E1]">Upload {label}</span>
          <span className="mt-2 block text-[0.68rem] text-[#94A3B8]">Upload PDF format only. Max {maxFiles} files.</span>
          <span className={cn("mt-3 block text-[0.68rem] font-semibold", files.length ? "text-[#8EA2FF]" : "text-[#94A3B8]")}>{fileCountLabel}</span>
          {files.length ? (
            <span className="mt-2 block space-y-1 text-left">
              {files.map((file, index) => (
                <span key={`${file.name}-${file.lastModified}`} className="flex min-w-0 items-center gap-2 rounded-lg bg-white/[0.08] px-2 py-1 text-[0.68rem] font-medium text-[#CBD5E1]">
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[#94A3B8] transition hover:bg-white/10 hover:text-[#FF5C8A]"
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
  return fallbackLoanTypes.find((type) => type.value === value)?.label ?? (value ? value.replace(/_/g, " ") : "Loan");
}

function normalizeLoanOptions(options: LoanOption[] | null | undefined, fallback: LoanOption[]) {
  const normalized = (options ?? [])
    .filter((option) => option && option.isActive !== false && option.label && option.value)
    .sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0))
    .map((option) => ({ label: option.label, value: option.value }));

  return normalized.length ? normalized : fallback;
}

function buildLoans(result: DisplayDataResponse | null): Loan[] {
  const borrower = result?.data?.display?.profile?.name || result?.data?.name || "Borrower";
  const accounts = readLoanAccounts(result);

  return accounts.map((account, index) => {
    const overdueAmount = readNumericValue(account.amount_overdue ?? account.Amount_Past_Due);
    const closed = isLoanClosed(account);
    const status = overdueAmount > 0 ? "Overdue" : closed ? "Completed" : "Active";
    const emi = formatOptionalRupees(account.emi ?? account.Scheduled_Monthly_Payment_Amount);
    const currentBalance = readNumericValue(account.current_balance ?? account.Current_Balance);
    const originalAmount = readNumericValue(account.high_credit_amount ?? account.Highest_Credit_or_Original_Loan_Amount);
    const amount = currentBalance || originalAmount;

    return {
      amount: formatRupees(amount),
      bank: account.member_name || account.Subscriber_Name || formatAccountType(account.Account_Type) || "Credit lender",
      borrower,
      disbursed: formatCompactDate(account.opened || account.Open_Date),
      emi,
      id: `${account.Identification_Number ?? account.Account_Number ?? account.member_name ?? account.Subscriber_Name ?? "loan"}-${account.type ?? account.Account_Type ?? "account"}-${index}`,
      loanType: formatAccountType(account.type ?? account.Account_Type) || "Loan Account",
      nextEmi: formatCompactDate(account.last_payment ?? account.Date_of_Last_Payment),
      overdue: overdueAmount > 0 ? `${formatRupees(overdueAmount)} overdue - Affects CIBIL` : "",
      paymentFrequency: formatPaymentFrequency(account.payment_frequency ?? account.Payment_Frequency ?? account.Terms_Frequency),
      sanctioned: formatCompactDate(account.opened || account.Open_Date),
      status,
      tenure: account.repayment_tenure || account.Repayment_Tenure || account.Terms_Duration ? String(account.repayment_tenure ?? account.Repayment_Tenure ?? account.Terms_Duration) : "--",
    };
  });
}

function buildLoanSummary(loans: Loan[], result: DisplayDataResponse | null): LoanSummary {
  const activeLoans = loans.filter((loan) => loan.status === "Active" || loan.status === "Overdue");
  const overdueLoans = loans.filter((loan) => loan.status === "Overdue");
  const accounts = readLoanAccounts(result);
  const activeAmount = accounts
    .filter((account) => !isLoanClosed(account))
    .reduce((total, account) => total + readNumericValue(account.current_balance ?? account.Current_Balance), 0);
  const overdueAmount = accounts.reduce((total, account) => total + readNumericValue(account.amount_overdue ?? account.Amount_Past_Due), 0);

  return {
    activeAmount: formatRupees(activeAmount),
    activeCount: activeLoans.length,
    lastChecked: readLastChecked(result) ?? "--",
    overdueAmount: formatRupees(overdueAmount),
    overdueCount: overdueLoans.length,
  };
}

function readLoanAccounts(result: DisplayDataResponse | null) {
  const reportAccounts = result?.data?.credit_report?.CAIS_Account?.CAIS_Account_DETAILS;

  if (Array.isArray(reportAccounts)) {
    return reportAccounts;
  }

  return result?.data?.display?.accounts ?? [];
}

function isLoanClosed(account: CreditAccount) {
  const closedValue = String(account.account_closed ?? account.Date_Closed ?? "").trim();

  return Boolean(closedValue && closedValue !== "00000000" && closedValue !== "11111111");
}

function readScore(result: DisplayDataResponse | null) {
  const score = result?.data?.display?.score?.value ?? result?.data?.credit_score ?? result?.data?.report?.credit_score;
  const numericScore = typeof score === "number" ? score : Number(score);

  return Number.isFinite(numericScore) && numericScore > 0 ? numericScore : null;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readLastChecked(result: DisplayDataResponse | null) {
  const value = result?.data?.display?.profile?.fetched_at ?? result?.fetchedAt;

  return value ? formatDateTime(value) : null;
}

function readNumericValue(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));

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

function formatOptionalRupees(value: unknown) {
  const amount = readNumericValue(value);

  return amount ? formatRupees(amount) : "--";
}

function formatAccountType(value: unknown) {
  const accountTypes: Record<string, string> = {
    "1": "Auto Loan",
    "2": "Home Loan",
    "3": "Loan Against Property",
    "4": "Loan Against Shares",
    "5": "Personal Loan",
    "6": "Consumer Loan",
    "7": "Gold Loan",
    "8": "Education Loan",
    "9": "Business Loan",
    "10": "Credit Card",
    "13": "Auto Loan",
    "17": "Auto Loan",
    "31": "Credit Card",
    "35": "Credit Card",
    "36": "Credit Card",
    "37": "Business Loan",
    "51": "Business Loan",
    "52": "Business Loan",
    "53": "Business Loan",
    "54": "Business Loan",
    "55": "Business Loan",
    "56": "Business Loan",
    "57": "Business Loan",
    "58": "Business Loan",
    "59": "Business Loan",
    "61": "Business Loan",
  };
  const key = String(value ?? "").trim();

  return key ? accountTypes[key] ?? `Account ${key}` : "";
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

function formatCompactDate(value?: string | number | null) {
  const raw = String(value ?? "").trim();

  if (!raw) return "--";

  if (/^\d{8}$/.test(raw)) {
    if (raw === "11111111" || raw === "00000000") {
      return "--";
    }

    const firstFour = Number(raw.slice(0, 4));
    const year = firstFour >= 1900 ? raw.slice(0, 4) : raw.slice(4);
    const month = firstFour >= 1900 ? raw.slice(4, 6) : raw.slice(2, 4);
    const day = firstFour >= 1900 ? raw.slice(6, 8) : raw.slice(0, 2);

    return `${day}/${month}/${year}`;
  }

  return raw;
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
