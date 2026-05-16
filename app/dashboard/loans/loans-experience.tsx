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
import { useMemo, useState } from "react";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { cn } from "@/lib/utils";

type LoanFilter = "All Loans" | "Active" | "Completed";

const loans = [
  {
    id: "hdfc-active",
    bank: "HDFC Bank",
    borrower: "Suresh patel",
    amount: "Rs.500,000",
    emi: "Rs.500,000",
    nextEmi: "5 Feb",
    status: "Active",
    sanctioned: "5/1/2025",
    disbursed: "5/1/2025",
    tenure: "1/36",
    overdue: "",
  },
  {
    id: "hdfc-overdue",
    bank: "HDFC Bank",
    borrower: "Suresh patel",
    amount: "Rs.500,000",
    emi: "Rs.500,000",
    nextEmi: "5 Feb",
    status: "Disbursed",
    sanctioned: "5/1/2025",
    disbursed: "5/1/2025",
    tenure: "1/36",
    overdue: "Rs.23,200 overdue - Affects CIBIL",
  },
];

type Loan = (typeof loans)[number];

const employmentTypes = ["Salaried", "Self Employed", "Business Owner", "Professional"];

export function LoansExperience() {
  const [applyOpen, setApplyOpen] = useState(false);
  const [filter, setFilter] = useState<LoanFilter>("All Loans");
  const [employmentType, setEmploymentType] = useState("Salaried");

  const visibleLoans = useMemo(() => {
    if (filter === "Active") {
      return loans.filter((loan) => loan.status === "Active");
    }

    if (filter === "Completed") {
      return [];
    }

    return loans;
  }, [filter]);

  return (
    <PortalShell active="loans">
      <PortalTopBar title="Loan Repayments" />
      <PageContent>
        <RepaymentsView
          filter={filter}
          loans={visibleLoans}
          onApply={() => setApplyOpen(true)}
          onFilterChange={setFilter}
        />
      </PageContent>
      {applyOpen ? (
        <ApplyLoanDialog
          employmentType={employmentType}
          onClose={() => setApplyOpen(false)}
          onEmploymentTypeChange={setEmploymentType}
        />
      ) : null}
    </PortalShell>
  );
}

function RepaymentsView({
  filter,
  loans,
  onApply,
  onFilterChange,
}: {
  filter: LoanFilter;
  loans: Loan[];
  onApply: () => void;
  onFilterChange: (filter: LoanFilter) => void;
}) {
  return (
    <div className="space-y-6 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600">EMI workspace</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">Loan Repayments</h2>
        </div>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 text-xs font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(37,99,235,0.28)]"
          type="button"
          onClick={onApply}
        >
          <Plus className="size-5" /> Apply for Loan
        </button>
      </div>

      <button
        className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-[0_14px_42px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_48px_rgba(37,99,235,0.12)]"
        type="button"
        onClick={onApply}
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-600 to-cyan-500" />
        <div className="absolute -right-12 top-1/2 size-44 -translate-y-1/2 rounded-full bg-cyan-50" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
              <FileCheck2 className="size-8" />
            </span>
            <span>
              <span className="block text-lg font-bold text-slate-950">Apply for Loan</span>
              <span className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-500">
                <CheckCircle2 className="size-4" /> All requirements met
              </span>
            </span>
          </div>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cyan-100 text-2xl text-cyan-700 transition group-hover:translate-x-1">
            &rsaquo;
          </span>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-3">
          {["CIBIL", "KYC", "Plan"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700">
              <Check className="size-4" /> {item}
            </span>
          ))}
        </div>
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryCard tone="green" title="Active Loans" value="3" amount="Rs.1,550,000" caption="21/1/2026" />
        <SummaryCard tone="red" title="Overdue" value="3" amount="Rs.1,550,000" caption="Due date: 21/1/2026" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["All Loans", "Active", "Completed"] as LoanFilter[]).map((tab) => (
          <button
            key={tab}
            className={cn(
              "shrink-0 rounded-full border px-5 py-2.5 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm",
              filter === tab ? "border-cyan-200 bg-cyan-50 text-cyan-700" : "border-slate-200 bg-white text-slate-600",
            )}
            type="button"
            onClick={() => onFilterChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {loans.length ? (
          loans.map((loan, index) => <ProfessionalLoanCard key={loan.id} index={index} loan={loan} />)
        ) : (
          <AppCard className="xl:col-span-2">
            <p className="text-sm font-bold text-slate-800">No completed loans yet</p>
            <p className="mt-1 text-xs text-slate-500">Completed loan accounts will appear here after closure.</p>
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
    <AppCard
      className={cn(
        "relative overflow-hidden bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.09)]",
        isGreen ? "border-emerald-100" : "border-rose-100",
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1", isGreen ? "bg-emerald-500" : "bg-rose-500")} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-bold leading-tight text-slate-950">{title}</p>
        <span className={cn("grid size-11 place-items-center rounded-2xl border", isGreen ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-rose-100 bg-rose-50 text-rose-600")}>
          {isGreen ? <FileText className="size-5" /> : <Info className="size-5" />}
        </span>
      </div>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-3 text-sm font-semibold text-slate-700">{amount}</p>
      <p className="mt-1 text-xs text-slate-500">{caption}</p>
    </AppCard>
  );
}

function ProfessionalLoanCard({ loan, index }: { loan: Loan; index: number }) {
  const overdue = Boolean(loan.overdue);

  return (
    <AppCard
      className={cn(
        "space-y-5 animate-[creditPanelIn_0.45s_ease-out_both] transition duration-300 hover:-translate-y-0.5",
        overdue ? "border-rose-200 bg-white hover:shadow-rose-100" : "bg-white hover:border-cyan-200 hover:shadow-cyan-100",
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-950">{loan.bank}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{loan.borrower}</p>
        </div>
        <span className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", overdue ? "border-rose-300 text-rose-600" : "border-emerald-200 text-emerald-600")}>
          {loan.status}
        </span>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <p className="text-2xl font-bold text-slate-950">{loan.amount}</p>
        <p className="pb-1 text-xs font-medium text-slate-500">Loan Amount</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LoanMetric title="EMI Amount" value={loan.emi} />
        <LoanMetric title="Next EMI" value={loan.nextEmi} />
      </div>

      {overdue ? (
        <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-white/80 px-4 py-3 text-xs font-semibold text-rose-600">
          <Info className="size-5" /> {loan.overdue}
        </div>
      ) : null}

      <PrimaryPortalButton className={cn("h-12 w-full rounded-2xl text-sm", overdue && "bg-none bg-rose-500 shadow-rose-100")}>
        <CreditCard className="size-6" /> Pay EMI 15,000
      </PrimaryPortalButton>

      <div className="grid grid-cols-3 gap-3 text-xs text-slate-600">
        <span>
          <strong className="block text-slate-800">Sanctioned</strong>
          {loan.sanctioned}
        </span>
        <span>
          <strong className="block text-slate-800">Disbursed</strong>
          {loan.disbursed}
        </span>
        <span className="text-right">
          <strong className="block text-slate-800">{loan.tenure}</strong>
          EMIS
        </span>
      </div>
    </AppCard>
  );
}

function LoanMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function ApplyLoanDialog({
  employmentType,
  onClose,
  onEmploymentTypeChange,
}: {
  employmentType: string;
  onClose: () => void;
  onEmploymentTypeChange: (type: string) => void;
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
                <p className="text-sm font-bold text-emerald-700">CIBIL Score: 742</p>
                <p className="text-xs text-slate-600">Verified on 10/1/2025</p>
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
