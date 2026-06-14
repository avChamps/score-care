"use client";

import {
  ArrowLeft,
  BadgeIndianRupee,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Info,
  LoaderCircle,
  Menu,
  Plus,
  Upload,
  X,
  FileSearch
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfilePanel, type UserProfile } from "@/app/dashboard/home-dashboard";
import dashboardBg from "@/assets/dashboard-bg.jpg";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
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
type LoanStatusFilter = "All" | "Loans" | "Credit Cards";
const LOAN_ACCOUNT_TYPES = new Set([
  "1","2","3","4","5","6","7","8","9",
  "13","17","37","51","52","53","54",
  "55","56","57","58","59","61"
]);
const CREDIT_CARD_ACCOUNT_TYPES = new Set([
  "10","31","35","36"
]);
const ACTIVE_ACCOUNT_STATUSES = new Set([
  "11","21","78"
]);
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
  Account_Status?: string | number | null;
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
  account_status?: string | number | null;
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
  accountType: string;
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [, setIsLanguageLoading] = useState(false);
  const [showBenefitsPrompt, setShowBenefitsPrompt] = useState(false);
  const [toast, setToast] = useState<LoanToast | null>(null);
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  const loans = useMemo(() => buildLoans(displayData), [displayData]);
  const summary = useMemo(() => buildLoanSummary(loans, displayData), [displayData, loans]);
  const score = readScore(displayData);
  const lastChecked = readLastChecked(displayData);
  const storedProfileName = typeof window !== "undefined" ? localStorage.getItem("scorecare_full_name")?.trim() : "";
  const profileName = profile?.fullName?.trim() || displayData?.data?.display?.profile?.name?.trim() || storedProfileName || "there";

  const visibleLoans = useMemo(() => {
    if (isFreeTier || filter === "Your Applications") {
      return [];
    }

    if (loanStatusFilter === "Loans") {
      return loans.filter((loan) => LOAN_ACCOUNT_TYPES.has(loan.accountType));
    }

    if (loanStatusFilter === "Credit Cards") {
      return loans.filter((loan) => CREDIT_CARD_ACCOUNT_TYPES.has(loan.accountType));
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

    const token = localStorage.getItem("scorecare_token");

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
    const token = localStorage.getItem("scorecare_token");

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
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PortalTopBar title="Loans" />
        <PageContent className="px-4 py-5">
          <div className="mx-auto max-w-md">
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
              onProfileOpen={() => setShowProfile(true)}
              score={score}
              summary={summary}
            />
          </div>
        </PageContent>
      </div>
      <DashboardBottomNav />
      {showProfile ? (
        <ProfilePanel
          profile={profile}
          name={profileName}
          onClose={() => setShowProfile(false)}
          onHelp={() => router.push("/help-center")}
          onLanguageLoadingChange={setIsLanguageLoading}
          onProfileUpdate={setProfile}
        />
      ) : null}
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
  onFilterChange,
  onLoanStatusFilterChange,
  onProfileOpen,
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
  loanStatusFilter: LoanStatusFilter;
  loading: boolean;
  loans: Loan[];
  onApplicationsRefresh: () => void;
  onApply: () => void;
  onFilterChange: (filter: LoanFilter) => void;
  onLoanStatusFilterChange: (filter: LoanStatusFilter) => void;
  onProfileOpen: () => void;
  onRefresh: () => void;
  score: number | null;
  summary: LoanSummary;
}) {
  const totalEmiDue = loans.reduce((total, loan) => total + readNumericValue(loan.emi), 0);
  const paidOnTime = loans.filter((loan) => loan.status === "Active" || loan.status === "Completed").length;
  const historyRows = buildPaymentHistoryRows(loans);

  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          aria-label="Open profile menu"
          className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
          onClick={onProfileOpen}
        >
          <Menu className="size-5" strokeWidth={1.8} />
        </button>
        <Link
          aria-label="Open notifications"
          className="relative grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl"
          href="/notifications"
        >
          <Bell className="size-6" strokeWidth={1.8} />
        </Link>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] font-black leading-none tracking-tight text-white">Loans</h1>
          <p className="mt-2 text-sm font-medium text-[#9fb2c6]">Track EMIs, dues and repayment health.</p>
        </div>
        {/* <button
          aria-label="Go back"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-xl transition hover:border-[#22F2C2]/45"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
        </button> */}
      </div>

      <section className="rounded-[28px] border border-[#00CFA4]/35 bg-[radial-gradient(circle_at_100%_0%,rgba(34,242,194,0.14),transparent_34%),linear-gradient(145deg,#062B1F,#0B3A29)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#22F2C2]">Repayment Health</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">EMI Summary</h2>
            <p className="mt-1 text-[12px] text-[#9fb2c6]">{loading ? "Loading accounts..." : lastChecked ? `Updated ${lastChecked}` : "Report data not available"}</p>
          </div>

          <button
            disabled={true}
            className="
  inline-flex h-10 items-center justify-center gap-1.5
  rounded-full
  border border-[#FFD34D]/35
  bg-[linear-gradient(135deg,rgba(255,211,77,0.22),rgba(180,120,0,0.38))]
  px-4
  text-[13px]
  font-bold
  text-[#FFD34D]
  shadow-[0_10px_24px_rgba(255,211,77,0.16),inset_0_1px_0_rgba(255,255,255,0.08)]
  backdrop-blur-xl

  disabled:cursor-not-allowed
  disabled:border-white/10
  disabled:bg-[#1A2433]
  disabled:text-[#6B7280]
  disabled:shadow-none
  disabled:opacity-60
  "
            type="button"
            onClick={onApply}
          >
            <Plus className="size-3.5" />
            Apply
          </button>


        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <SummaryStat label="Total EMI Due" value={loading ? "..." : formatRupees(totalEmiDue)} />
          <SummaryStat label="Active Loans" value={loading ? "..." : String(summary.activeCount)} />
          <SummaryStat label="Due This Month" value={loading ? "..." : String(summary.overdueCount)} />
          <SummaryStat label="Paid On Time" value={loading ? "..." : String(paidOnTime)} />
        </div>
      </section>



      {error ? (
        <div className="rounded-[24px] border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium leading-5 text-[#FF8AAB]">{error}</p>
            <button className="shrink-0 rounded-xl border border-[#FF5C8A]/25 bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-[#FF8AAB]" type="button" onClick={onRefresh}>
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
        {(["All Loans", "Your Applications"] as LoanFilter[]).map((tab) => (
          <button
            key={tab}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
              filter === tab ? "border-[#22F2C2]/45 bg-[#22F2C2]/12 text-[#22F2C2]" : "border-white/10 bg-white/5 text-[#9fb2c6]",
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
          {(["All", "Loans", "Credit Cards"] as LoanStatusFilter[]).map((tab) => (
            <button
              key={tab}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                loanStatusFilter === tab ? "border-[#08DB69]/45 bg-[#08DB69]/12 text-[#08DB69]" : "border-white/10 bg-white/5 text-[#9fb2c6]",
              )}
              type="button"
              onClick={() => onLoanStatusFilterChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-4 pb-28">
        {filter === "Your Applications" ? (
          <LoanApplicationStatusCard application={application} error={applicationError} loading={applicationLoading} onApply={onApply} onRefresh={onApplicationsRefresh} />
        ) : loading ? (
          <LoanLoadingCards />
        ) : loans.length ? (
          loans.map((loan, index) => <ProfessionalLoanCard key={loan.id} index={index} loan={loan} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileSearch className="size-10 text-[#6B7280]" />
            <p className="mt-4 text-[15px] font-semibold text-white">No Records Found</p>
          </div>
        )}
      </div>

      {/* <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(145deg,#111821,#151E2A)] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-white">Payment History</h2>
          <span className="rounded-full bg-[#22F2C2]/12 px-3 py-1 text-[12px] font-medium text-[#22F2C2]">Monthly</span>
        </div>
        <div className="mt-4 grid gap-2">
          {historyRows.length ? historyRows.map((row) => (
            <div key={`${row.month}-${row.amount}`} className="grid grid-cols-[1fr_auto] gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div>
                <p className="text-sm font-bold text-white">{row.month}</p>
                <p className="mt-1 text-[12px] text-[#9fb2c6]">Paid Date: {row.paidDate}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-[#08DB69]">{row.amount}</p>
                <StatusPill status={row.status} />
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <p className="text-sm font-bold text-white">No payment history found</p>
              <p className="mt-1 text-[12px] text-[#9fb2c6]">Month-wise EMI payments will appear here.</p>
            </div>
          )}
        </div>
      </section> */}
    </div>
  );
}

function LoanSuccessToast({ message, onClose, title }: { message: string; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-x-4 top-4 z-[90] flex justify-center sm:inset-x-auto sm:right-5 sm:top-5">
      <div
        className="flex w-full max-w-md items-start gap-3 rounded-2xl border border-[var(--portal-border)] bg-white p-4 text-[var(--portal-ink)] shadow-[var(--portal-shadow)] animate-[creditPanelIn_0.22s_ease-out]"
        role="status"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1F756B]/10 text-[#1F756B]">
          <CheckCircle2 className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-[var(--portal-ink)]">{title}</span>
          <span className="mt-1 block text-xs font-medium leading-5 text-[var(--portal-muted)]">{message}</span>
        </span>
        <button
          aria-label="Close success notification"
          className="grid size-8 shrink-0 place-items-center rounded-full text-[var(--portal-muted)] transition hover:bg-[var(--portal-surface-soft)] hover:text-[var(--portal-ink)]"
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
        <div
          className="min-h-44 bg-cover bg-center px-5 py-6"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(9,14,22,0.1), rgba(9,14,22,0.9)), url(${dashboardBg.src})` }}
        >
          <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits" onClick={() => setShowLeavingMessage(true)}>
            <X className="size-5" />
          </button>
          <div className="mt-10 max-w-[18rem]">
            <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Premium Benefits</p>
            <h2 className="mt-2 text-[22px] font-semibold leading-7 text-white">Unlock complete loan tracking</h2>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="grid gap-3 text-[13px] font-medium leading-5 text-[#AAB6C8]">
            {isLoadingBenefits ? (
              <>
                <span className="h-11 animate-pulse rounded-2xl bg-white/[0.08]" />
                <span className="h-11 animate-pulse rounded-2xl bg-white/[0.08]" />
                <span className="h-11 animate-pulse rounded-2xl bg-white/[0.08]" />
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
          <button className="mx-auto mt-3 block text-[12px] font-medium text-[#6F7B8E]" type="button" onClick={() => setShowLeavingMessage(true)}>
            skip for later
          </button>
        </div>
      </section>

      {showLeavingMessage ? (
        <div className="absolute inset-0 z-10 flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm" onClick={onClose}>
          <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]" onClick={(event) => event.stopPropagation()}>
            <div
              className="min-h-44 bg-cover bg-center px-5 py-6"
              style={{ backgroundImage: `linear-gradient(180deg, rgba(9,14,22,0.1), rgba(9,14,22,0.9)), url(${dashboardBg.src})` }}
            >
              <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/12 text-white backdrop-blur" type="button" aria-label="Close benefits message" onClick={onClose}>
                <X className="size-5" />
              </button>
              <div className="mt-10 max-w-[18rem]">
                <p className="text-[12px] font-semibold uppercase tracking-[3px] text-[#5EF2C2]">Before you leave</p>
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
              <button className="mx-auto mt-3 block text-[12px] font-medium text-[#6F7B8E]" type="button" onClick={onClose}>
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
      <AppCard>
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">
            <LoaderCircle className="size-5 animate-spin" />
          </span>
          <div>
            <p className="text-sm font-black text-[var(--portal-ink)]">Loading application status</p>
            <p className="mt-1 text-xs font-medium text-[var(--portal-muted)]">Checking your latest loan application.</p>
          </div>
        </div>
      </AppCard>
    );
  }

  if (!application) {
    return (
      // <AppCard>
      //   <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      //     <div>
      //       <p className="text-[0.82rem] font-black text-[var(--portal-ink)]">{error || "Loan application not found"}</p>
      //       <p className="mt-1 text-xs font-medium leading-5 text-[var(--portal-muted)]">Your submitted loan application will appear here after you apply.</p>
      //     </div>
      //     <div className="flex shrink-0 gap-2">
      //       <button className="rounded-xl border border-[var(--portal-border)] bg-white px-3.5 py-2 text-xs font-bold text-[var(--portal-ink)] shadow-sm transition hover:border-[var(--portal-blue)]" type="button" onClick={onRefresh}>
      //         Refresh
      //       </button>
      //       <button className="rounded-xl bg-[var(--portal-orange)] px-3.5 py-2 text-xs font-black text-white shadow-[0_2px_6px_rgba(255,109,0,0.24)] transition hover:bg-[var(--portal-orange-deep)]" type="button" onClick={onApply}>
      //         Apply
      //       </button>
      //     </div>
      //   </div>
      // </AppCard>

     <div className="flex flex-col items-center justify-center py-12 text-center">
  <FileSearch
    className="size-12 text-[#AAB6C8]"
    strokeWidth={1.6}
  />

  <p className="mt-4 text-[15px] font-semibold text-white">
    No Records Found
  </p>

  <p className="mt-1 text-[13px] text-[#AAB6C8]">
    No loan applications available.
  </p>
</div>

    );
  }

  const status = application.applicationStatus || "submitted";

  return (
    <AppCard className="overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#1F756B]">Your Application</p>
          <h3 className="mt-1 text-base font-black tracking-tight text-[var(--portal-ink)]">{formatRupees(application.loanAmount)}</h3>
          <p className="mt-1 text-[12px] font-normal text-[var(--portal-muted)]">{formatLoanTypeLabel(application.loanType)} application</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-[#1F756B]/20 bg-[#1F756B]/10 px-3 py-1.5 text-[0.7rem] font-medium capitalize text-[#1F756B]">
          {status.replace(/_/g, " ")}
        </span>
      </div>
      <div className="mt-4 grid gap-3 rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-3 sm:grid-cols-3">
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
      <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[var(--portal-muted)]">{label}</p>
      <p className="mt-1 text-xs font-bold text-[var(--portal-ink)]">{value}</p>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-[#0F5D43]/45 bg-[#102017]/70 p-3">
      <p className="text-[11px] font-semibold text-[#9fb2c6]">{label}</p>
      <p className="mt-2 text-base font-black text-[#08DB69]">{value}</p>
    </div>
  );
}

function ProfessionalLoanCard({ loan, index }: { loan: Loan; index: number }) {
  const overdue = loan.status === "Overdue";
  const completed = loan.status === "Completed";
  const displayStatus = overdue ? "Overdue" : completed ? "On Time" : "Due Soon";

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-white/12 bg-white/[0.035] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="absolute left-5 right-5 top-0 h-[3px] rounded-full bg-[linear-gradient(90deg,#22F2C2,#FFD34D)]" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-white">{loan.bank}</h3>
          <p className="mt-0.5 text-xs text-[#AAB6C8]">{loan.loanType}</p>
        </div>
        <StatusPill status={displayStatus} />
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7FA6B8]">EMI Amount</p>
        <p className="mt-1 text-2xl font-black text-white">{loan.emi}</p>
        <p className="mt-1 text-xs text-[#AAB6C8]">Due date: {loan.nextEmi}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <LoanMetric title="Loan Amount" value={loan.amount} />
        <LoanMetric title="Frequency" value={loan.paymentFrequency} />
      </div>

      {overdue ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/12 px-3 py-2 text-xs font-medium text-[#EF4444]">
          <Info className="size-5" /> {loan.overdue}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-3 gap-2.5 text-[0.7rem] text-[#AAB6C8]">
        <MetaCell label="Sanctioned" value={loan.sanctioned} />
        <MetaCell label="Disbursed" value={loan.disbursed} />
        <MetaCell align="right" label="EMIs" value={loan.tenure} />
      </div>

      {!completed ? (
        <div className="pt-3">
          <button
            disabled
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-[#A78BFA]/55 bg-[linear-gradient(135deg,#7C3AED,rgba(59,130,246,0.94))] text-[13px] font-bold text-white shadow-[0_12px_28px_rgba(124,58,237,0.3),0_0_22px_rgba(59,130,246,0.2)] transition hover:scale-[1.01] active:scale-[0.99]"
            type="button"
          >
            <BadgeIndianRupee className="size-4" strokeWidth={2} />
            Pay EMI
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LoanLoadingCards() {
  return (
    <>
      {[0, 1].map((item) => (
        <div key={item} className="space-y-4 rounded-[24px] border border-white/10 bg-[#111821] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
          <div className="flex items-center justify-between gap-4">
            <span className="h-4 w-36 rounded-full bg-white/10 animate-pulse" />
            <span className="h-7 w-20 rounded-full bg-white/10 animate-pulse" />
          </div>
          <span className="block h-8 w-44 rounded-full bg-white/10 animate-pulse" />
          <div className="grid grid-cols-2 gap-3">
            <span className="h-14 rounded-2xl bg-white/10 animate-pulse" />
            <span className="h-14 rounded-2xl bg-white/10 animate-pulse" />
          </div>
        </div>
      ))}
    </>
  );
}

function LoanMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7FA6B8]">{title}</p>
      <p className="mt-1 text-sm font-black text-white">{value}</p>
    </div>
  );
}

function MetaCell({ align, label, value }: { align?: "right"; label: string; value: string }) {
  return (
    <span className={cn(align === "right" && "text-right")}>
      <strong className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#7FA6B8]">{label}</strong>
      <span className="mt-1 block font-bold text-white">{value}</span>
    </span>
  );
}

function StatusPill({ status }: { status: "On Time" | "Due Soon" | "Overdue" }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[12px] font-semibold",
        status === "On Time" && "border-[#08DB69]/30 bg-[#08DB69]/12 text-[#08DB69]",
        status === "Due Soon" && "border-[#FFD34D]/30 bg-[#FFD34D]/12 text-[#FFD34D]",
        status === "Overdue" && "border-[#EF4444]/30 bg-[#EF4444]/12 text-[#EF4444]",
      )}
    >
      {status}
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
    const token = localStorage.getItem("scorecare_token");

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
    <div className="fixed inset-0 z-[120] overflow-y-auto overflow-x-hidden bg-[#050912] text-white backdrop-blur-md animate-[creditPanelIn_0.2s_ease-out]">
      <div className="mx-auto flex min-h-screen w-full max-w-md min-w-0 flex-col overflow-x-hidden rounded-t-[30px] border-t border-white/10 bg-[#050912] px-4 pb-28 pt-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:border sm:border-white/10">
        <div className="shrink-0">
          <div className="rounded-[28px] border border-[#00CFA4]/25 bg-[radial-gradient(circle_at_100%_0%,rgba(34,242,194,0.12),transparent_34%),linear-gradient(145deg,#061A13,#082519)] p-5">
            <div className="flex items-start gap-3">
              <button
                aria-label="Back from loan application"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#22F2C2]/45 hover:text-[#22F2C2]"
                type="button"
                onClick={onClose}
              >
                <ArrowLeft className="size-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#22F2C2]">Loan Application</p>
                <h2 className="mt-2 text-lg font-black tracking-tight text-white">Apply for Loan</h2>
                <p className="mt-1 text-[0.75rem] text-[#AAB6C8]">Complete the details and upload required PDF documents.</p>
              </div>
              <button
                aria-label="Close loan application"
                className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[#22F2C2]/45 hover:text-[#22F2C2]"
                type="button"
                onClick={onClose}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-x-hidden py-5">
          <div className="relative flex min-w-0 items-center justify-between gap-4 overflow-hidden rounded-[20px] border border-[#22F2C2]/25 bg-[linear-gradient(145deg,#0A1725,#111821)] p-4 shadow-[0_14px_30px_rgba(0,0,0,0.28)]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#22F2C2]/12 text-[#22F2C2]">
                <CheckCircle2 className="size-6" />
              </span>
              <div>
                <p className="text-xs font-semibold text-[#22F2C2]">CIBIL Score: {score ?? "--"}</p>
                <p className="text-[0.7rem] text-[#AAB6C8]">{lastChecked ? `Verified on ${lastChecked}` : "Latest report data will be used when available"}</p>
              </div>
            </div>
            <button className="inline-flex shrink-0 items-center gap-1.5 text-[0.7rem] font-bold text-[#08DB69] transition hover:text-[#22F2C2]" type="button" onClick={handleScoreRefresh} disabled={scoreRefreshing}>
              {scoreRefreshing ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
              {scoreRefreshing ? "Loading..." : "Refresh"}
            </button>
          </div>

          <form className="mt-5 grid min-w-0 gap-5" onSubmit={handleApplyLoan}>
            <FormSection title="Loan Details">
              <FormField label="Loan Amount" required>
                <TextInput
                  type="number"
                  name="loanAmount"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="Enter Loan Amount"
                  required
                />
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
                    className="flex h-14 w-full items-center justify-between rounded-[18px] border border-[#1F756B]/35 bg-[#101B2B] px-4 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition hover:border-[#22F2C2] focus:border-[#22F2C2]"
                    type="button"
                    onClick={() => setLoanTypeOpen((open) => !open)}
                  >
                    <span>{selectedLoanType.label}</span>
                    <ChevronDown className={cn("size-5 text-[#AAB6C8] transition", loanTypeOpen && "rotate-180")} />
                  </button>
                  {loanTypeOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-[#1F756B]/35 bg-[#101B2B] py-1 shadow-[0_18px_45px_rgba(0,0,0,0.35)]" role="listbox">
                      {loanTypeOptions.map((type) => {
                        const selected = type.value === loanType;

                        return (
                          <button
                            key={type.value}
                            aria-selected={selected}
                            className={cn(
                              "flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-medium transition hover:bg-white/[0.06]",
                              selected ? "bg-[#22F2C2]/12 text-[#22F2C2]" : "text-[#AAB6C8]",
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

              <FormField label="Employment Type" required>
                <EmploymentTypeOptions employmentType={employmentType} employmentTypeOptions={employmentTypeOptions} onEmploymentTypeChange={onEmploymentTypeChange} />
              </FormField>
            </FormSection>

            <FormSection title="Employment Details">
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
            </FormSection>

            <FormSection title="Document Details">
              <div className="grid gap-4 sm:grid-cols-2">
                <UploadField files={selectedFiles.panCard} inputRef={(input) => { uploadInputRefs.current.panCard = input; }} label="PAN Card" maxFiles={uploadLimits.panCard} name="panCard" onChange={handleUploadChange} onRemove={handleUploadRemove} />
                <UploadField files={selectedFiles.aadhaarCard} inputRef={(input) => { uploadInputRefs.current.aadhaarCard = input; }} label="Aadhaar Card" maxFiles={uploadLimits.aadhaarCard} name="aadhaarCard" onChange={handleUploadChange} onRemove={handleUploadRemove} />
                <UploadField files={selectedFiles.bankStatements} inputRef={(input) => { uploadInputRefs.current.bankStatements = input; }} label="Bank Statement (3 Months)" maxFiles={uploadLimits.bankStatements} name="bankStatements" onChange={handleUploadChange} onRemove={handleUploadRemove} />
                <UploadField files={selectedFiles.salarySlips} inputRef={(input) => { uploadInputRefs.current.salarySlips = input; }} label="Salary Slip" maxFiles={uploadLimits.salarySlips} name="salarySlips" onChange={handleUploadChange} onRemove={handleUploadRemove} />
              </div>
            </FormSection>

            {submitError ? (
              <p className="rounded-2xl border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 px-4 py-3 text-sm font-medium text-[#FF8AAB]">{submitError}</p>
            ) : null}
            <div className="border-t border-white/10 bg-[#050912] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-4">
              <div className="grid gap-3 sm:grid-cols-[0.7fr_1fr]">
                <button
                  className="h-12 rounded-[18px] border border-white/10 bg-white/[0.05] text-xs font-bold text-[#AAB6C8] transition hover:-translate-y-0.5 hover:border-[#22F2C2]/45 hover:text-white"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <PrimaryPortalButton className="h-12 rounded-[18px] border-0 bg-[linear-gradient(135deg,#08DB69,#22F2C2)] text-xs font-bold text-[#031812] shadow-[0_12px_28px_rgba(8,219,105,0.28)] hover:brightness-105" disabled={submitting} type="submit">
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
      <span className="mb-2 block text-[12px] font-semibold text-[#DDE7F4]">
        {label} {required ? <span className="text-[#FF5C8A]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function FormSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="min-w-0 rounded-[24px] border border-[#1F756B]/25 bg-[linear-gradient(145deg,#09131F,#0D1827)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#22F2C2]">{title}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function EmploymentTypeOptions({
  employmentType,
  employmentTypeOptions,
  onEmploymentTypeChange,
}: {
  employmentType: string;
  employmentTypeOptions: LoanOption[];
  onEmploymentTypeChange: (type: string) => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-2 gap-2.5">
      {employmentTypeOptions.map((type) => {
        const selected = employmentType === type.value;

        return (
          <button
            key={type.value}
            className={cn(
              "flex h-12 items-center justify-center gap-2 rounded-full border px-3 text-center transition hover:-translate-y-0.5",
              selected ? "border-[#22F2C2]/45 bg-[#22F2C2]/12 text-[14px] font-semibold text-[#22F2C2] shadow-[0_0_18px_rgba(34,242,194,0.12)]" : "border-white/10 bg-white/[0.05] text-[14px] font-medium text-[#AAB6C8]",
            )}
            type="button"
            onClick={() => onEmploymentTypeChange(type.value)}
          >
            {selected ? <span className="size-2 shrink-0 rounded-full bg-[#22F2C2]" /> : null}
            <span className="min-w-0 truncate">{type.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TextInput({ className, ...props }: React.ComponentPropsWithoutRef<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-[18px] border border-white/10 bg-[#101B2B] px-4 text-[14px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition placeholder:text-[#8FA3B8] focus:border-[#22F2C2] focus:outline-none focus-visible:outline-none",
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
      <label className="grid min-h-32 cursor-pointer place-items-center rounded-[20px] border border-dashed border-[#22F2C2]/30 bg-[#0A1725] px-4 text-center text-[#AAB6C8] transition hover:-translate-y-0.5 hover:border-[#22F2C2]/60 hover:bg-[#0D1C2B]">
        <input ref={inputRef} className="sr-only" type="file" accept="application/pdf" multiple name={name} required onChange={(event) => onChange(name, event)} />
        <span className="w-full min-w-0">
          <Upload className="mx-auto size-8 text-[#22F2C2]" />
          <span className="mt-3 block text-xs font-bold text-white">Upload {label}</span>
          <span className="mt-2 block text-[12px] text-[#AAB6C8]">Upload PDF format only. Max {maxFiles} files.</span>
          <span className={cn("mt-3 block text-[12px] font-semibold", files.length ? "text-[#22F2C2]" : "text-[#AAB6C8]")}>{fileCountLabel}</span>
          {files.length ? (
            <span className="mx-auto mt-2 block w-full max-w-[calc(100%-1.5rem)] space-y-1 text-left">
              {files.map((file, index) => (
                <span key={`${file.name}-${file.lastModified}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-[11px] font-medium text-[#DDE7F4]">
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <button
                    aria-label={`Remove ${file.name}`}
                    className="grid size-5 shrink-0 place-items-center rounded-full text-[#AAB6C8] transition hover:bg-[#FF5C8A]/10 hover:text-[#FF5C8A]"
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
  const accounts = readLoanAccounts(result).filter(isActiveLoanPageAccount);

  return accounts.map((account, index) => {
    const overdueAmount = readNumericValue(account.amount_overdue ?? account.Amount_Past_Due);
    const closed = isLoanClosed(account);
    const status = overdueAmount > 0 ? "Overdue" : closed ? "Completed" : "Active";
    const emi = formatOptionalRupees(account.emi ?? account.Scheduled_Monthly_Payment_Amount);
    const currentBalance = readNumericValue(account.current_balance ?? account.Current_Balance);
    const originalAmount = readNumericValue(account.high_credit_amount ?? account.Highest_Credit_or_Original_Loan_Amount);
    const amount = currentBalance || originalAmount;

    return {
      accountType: readAccountType(account),
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
  const accounts = readLoanAccounts(result).filter(isActiveLoanPageAccount);
  const activeAmount = accounts
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

function buildPaymentHistoryRows(loans: Loan[]) {
  return loans.slice(0, 4).map((loan, index) => ({
    amount: loan.emi,
    month: formatPaymentHistoryMonth(loan.nextEmi, index),
    paidDate: loan.nextEmi,
    status: loan.status === "Overdue" ? "Overdue" as const : index === 0 && loan.status === "Active" ? "Due Soon" as const : "On Time" as const,
  }));
}

function formatPaymentHistoryMonth(value: string, index: number) {
  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(parsed);
  }

  return index === 0 ? "This Month" : index === 1 ? "Last Month" : `Month ${index + 1}`;
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

function isActiveLoanPageAccount(account: CreditAccount) {
  const accountType = readAccountType(account);
  const accountStatus = normalizeAccountCode(account.account_status ?? account.Account_Status);

  return (
    !isLoanClosed(account) &&
    ACTIVE_ACCOUNT_STATUSES.has(accountStatus) &&
    (
      LOAN_ACCOUNT_TYPES.has(accountType) ||
      CREDIT_CARD_ACCOUNT_TYPES.has(accountType)
    )
  );
}

function readAccountType(account: CreditAccount) {
  return normalizeAccountCode(account.type ?? account.Account_Type);
}

function normalizeAccountCode(value: unknown) {
  return String(value ?? "").trim();
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
