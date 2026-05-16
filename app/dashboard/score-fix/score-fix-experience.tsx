"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Info,
  MessageSquare,
  Plus,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  AppCard,
  PageContent,
  PortalShell,
  PortalTopBar,
  PrimaryPortalButton,
} from "@/components/dashboard/portal-ui";
import { cn } from "@/lib/utils";

type View = "overview" | "details";
type RequestTab = "active" | "resolved";
type Urgency = "Low" | "Medium" | "High" | "Critical";

const activeRequest = {
  id: "#RR001",
  status: "Under Review",
  date: "20/1/2026",
  priority: "Low priority",
  expected: "28 Jan 2025",
  summary: "My home loan was closed in december 2024 but it still shows as active in my CIBIL...",
  description:
    "My home loan was closed in december 2024 but it still shows as active in my CIBIL report. This is affecting my loan eligibility for a new car loan application.",
};

const urgencyOptions: Array<{ title: Urgency; subtitle: string }> = [
  { title: "Low", subtitle: "Informational correction" },
  { title: "Medium", subtitle: "Impacting score slowly" },
  { title: "High", subtitle: "Affecting loan eligibility" },
  { title: "Critical", subtitle: "Immediate rejection risk" },
];

const timeline = [
  { title: "Request submitted", body: "Your resolution request was successfully submitted.", date: "7 Jan 2026", done: true },
  { title: "Under Review", body: "Team started reviewing your case.", date: "9 Jan 2026", done: true },
  { title: "Additional info required", body: "We may ask for supporting evidence if needed.", date: "Pending", done: true },
  { title: "Settlement progress", body: "Settlement or bureau correction progress begins.", date: "Pending", done: false },
  { title: "Resolved", body: "Final resolution update will appear here.", date: "Pending", done: false },
];

export function ScoreFixExperience() {
  const [view, setView] = useState<View>("overview");
  const [requestOpen, setRequestOpen] = useState(false);
  const [tab, setTab] = useState<RequestTab>("active");
  const [urgency, setUrgency] = useState<Urgency>("Low");
  const [description, setDescription] = useState("");

  return (
    <PortalShell active="fix">
      <PortalTopBar title={view === "overview" ? "Fix your score" : "Request Details"} />
      <PageContent>
        {view === "overview" ? (
          <OverviewView
            activeTab={tab}
            onNew={() => setRequestOpen(true)}
            onOpenDetails={() => setView("details")}
            onTabChange={setTab}
          />
        ) : null}

        {view === "details" ? <DetailsView onBack={() => setView("overview")} /> : null}
      </PageContent>
      {requestOpen ? (
        <NewRequestDialog
          description={description}
          onClose={() => setRequestOpen(false)}
          onDescriptionChange={setDescription}
          onUrgencyChange={setUrgency}
          urgency={urgency}
        />
      ) : null}
    </PortalShell>
  );
}

function OverviewView({
  activeTab,
  onNew,
  onOpenDetails,
  onTabChange,
}: {
  activeTab: RequestTab;
  onNew: () => void;
  onOpenDetails: () => void;
  onTabChange: (tab: RequestTab) => void;
}) {
  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div>
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-cyan-600">Score repair desk</p>
        <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">Fix your score</h2>
      </div>

      <button
        className="group relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_14px_42px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_48px_rgba(37,99,235,0.12)]"
        type="button"
        onClick={onNew}
      >
        <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-blue-600 to-cyan-500" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Plus className="size-6" />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-950">Raise New Request</span>
              <span className="mt-1 block text-xs font-medium text-slate-500">Report CIBIL issues or initiate settlement.</span>
            </span>
          </div>
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cyan-50 text-xl text-cyan-700 transition group-hover:translate-x-1">
            &rsaquo;
          </span>
        </div>
      </button>

      <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-3.5 text-amber-800">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p className="text-xs leading-5">
          Behaviour insights are derived from credit bureau data and may vary based on reporting cycles.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-950">{activeTab === "active" ? "Active Requests" : "Resolved Requests"}</h3>
        <div className="flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <RequestTabButton active={activeTab === "active"} onClick={() => onTabChange("active")}>
            Active
          </RequestTabButton>
          <RequestTabButton active={activeTab === "resolved"} onClick={() => onTabChange("resolved")}>
            Resolved
          </RequestTabButton>
        </div>
      </div>

      {activeTab === "active" ? (
        <RequestCard onOpen={onOpenDetails} />
      ) : (
        <AppCard>
          <p className="text-sm font-bold text-slate-800">No resolved requests yet</p>
          <p className="mt-1 text-xs text-slate-500">Completed score-fix requests will appear here.</p>
        </AppCard>
      )}
    </div>
  );
}

function RequestTabButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[0.7rem] font-bold transition",
        active ? "bg-cyan-50 text-cyan-700" : "text-slate-500 hover:text-slate-900",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function RequestCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-[0_14px_42px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_18px_48px_rgba(37,99,235,0.12)]"
      type="button"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-black text-slate-950">{activeRequest.id}</p>
            <StatusPill>{activeRequest.status}</StatusPill>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-700">{activeRequest.summary}</p>
        </div>
        <span className="text-2xl leading-none text-slate-300 transition group-hover:translate-x-1 group-hover:text-cyan-500">&rsaquo;</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Clock3 className="size-4 text-slate-500" /> {activeRequest.date}
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[0.7rem] font-bold text-amber-700">{activeRequest.priority}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Expected resolution: <span className="font-bold text-slate-700">{activeRequest.expected}</span>
      </p>
    </button>
  );
}

function DetailsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <BackHeader title="Score Fix Request Details" onBack={onBack} />

      <AppCard className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-600 to-cyan-500" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500">Request ID</p>
            <p className="mt-1 text-base font-black text-slate-950">{activeRequest.id}</p>
          </div>
          <StatusPill>{activeRequest.status}</StatusPill>
        </div>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs leading-5 text-slate-700">Our team is actively analyzing your case and reviewing your CIBIL report.</p>
        </div>
      </AppCard>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoTile icon={<User className="size-6" />} title="Applicant" value="Rajesh sharma" />
        <InfoTile icon={<Info className="size-6" />} title="Urgency" value={activeRequest.priority} warning />
      </div>

      <AppCard>
        <div className="flex items-center gap-3">
          <MessageSquare className="size-5 text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-950">Issue Description</h3>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-700">{activeRequest.description}</p>
      </AppCard>

      <AppCard>
        <div className="flex items-center gap-3">
          <FileText className="size-5 text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-950">Attached CIBIL Report</h3>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <FileText className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-950">CIBIL Report</p>
              <p className="text-xs text-slate-500">PDF uploaded on 1/12/2025</p>
            </div>
          </div>
          <button aria-label="Download CIBIL report" className="grid size-10 place-items-center rounded-full bg-white text-slate-600 shadow-sm transition hover:text-cyan-700" type="button">
            <Download className="size-5" />
          </button>
        </div>
      </AppCard>

      <AppCard>
        <div className="flex items-center gap-3">
          <Clock3 className="size-5 text-cyan-600" />
          <h3 className="text-sm font-bold text-slate-950">Request Timeline</h3>
        </div>
        <div className="mt-5 space-y-0">
          {timeline.map((item, index) => (
            <TimelineItem key={item.title} item={item} last={index === timeline.length - 1} />
          ))}
        </div>
      </AppCard>
    </div>
  );
}

function NewRequestDialog({
  description,
  onClose,
  onDescriptionChange,
  onUrgencyChange,
  urgency,
}: {
  description: string;
  onClose: () => void;
  onDescriptionChange: (value: string) => void;
  onUrgencyChange: (urgency: Urgency) => void;
  urgency: Urgency;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-5 backdrop-blur-sm animate-[creditPanelIn_0.2s_ease-out] sm:px-6">
      <div className="mx-auto flex h-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 sm:px-5">
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-cyan-600">Score Fix</p>
            <h2 className="mt-1 text-base font-bold tracking-tight text-slate-950">Score Fix Request</h2>
            <p className="mt-1 text-xs text-slate-500">Report bureau issues with clear details and urgency.</p>
          </div>
          <button
            aria-label="Close score fix request"
            className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-slate-900"
            type="button"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5">
          <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Full name As per (PAN)" required>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                  <p className="text-sm font-bold text-slate-950">Rajesh sharma</p>
                  <p className="mt-1 text-xs text-slate-500">Auto-fetched from PAN-verified profile</p>
                </div>
              </FormField>

              <FormField label="Select Your Card" required>
                <button className="flex h-[4.65rem] w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-400 shadow-sm" type="button">
                  Select your card <ChevronDown className="size-5" />
                </button>
              </FormField>
            </div>

            <FormField label="Issue Description" required>
              <textarea
                className="min-h-40 w-full resize-none rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                maxLength={1000}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Describe the issue you are facing in simple words..."
                value={description}
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>Min 50, Max 1000 characters</span>
                <span>{description.length}/1000</span>
              </div>
            </FormField>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-950">Examples</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">
                <li>Loan closed but still showing active.</li>
                <li>Late payment wrongly marked even though EMI was paid.</li>
              </ul>
            </div>

            <FormField label="Type of Urgency" required>
              <div className="grid gap-3 sm:grid-cols-2">
                {urgencyOptions.map((option) => {
                  const selected = urgency === option.title;
                  return (
                    <button
                      key={option.title}
                      className={cn(
                        "rounded-2xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-sm",
                        selected ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-700",
                      )}
                      type="button"
                      onClick={() => onUrgencyChange(option.title)}
                    >
                      <span className="flex items-center justify-between gap-3 text-xs font-bold">
                        {option.title}
                        {selected ? <span className="size-2.5 rounded-full bg-cyan-500" /> : null}
                      </span>
                      <span className="mt-2 block text-xs text-slate-500">{option.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </FormField>

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
                  Submit Request
                </PrimaryPortalButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        aria-label="Back"
        className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300"
        type="button"
        onClick={onBack}
      >
        <span className="text-2xl leading-none">&lsaquo;</span>
      </button>
      <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
    </div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[0.7rem] font-bold text-amber-700">
      <span className="size-2 rounded-full bg-amber-500" /> {children}
    </span>
  );
}

function InfoTile({ icon, title, value, warning }: { icon: React.ReactNode; title: string; value: string; warning?: boolean }) {
  return (
    <AppCard>
      <div className="flex items-center gap-3">
        <span className={cn("text-cyan-600", warning && "text-amber-600")}>{icon}</span>
        <p className="text-xs font-bold text-slate-700">{title}</p>
      </div>
      <p className={cn("mt-5 rounded-full px-4 py-2 text-xs font-bold", warning ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-700")}>
        {value}
      </p>
    </AppCard>
  );
}

function TimelineItem({ item, last }: { item: (typeof timeline)[number]; last: boolean }) {
  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!last ? <div className="absolute left-[0.85rem] top-8 h-full border-l border-dashed border-slate-200" /> : null}
      <span className={cn("relative z-10 grid size-7 shrink-0 place-items-center rounded-full border", item.done ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-slate-200 bg-slate-50 text-slate-300")}>
        <Check className="size-4" />
      </span>
      <div className={cn(!item.done && "opacity-55")}>
        <p className="text-xs font-bold text-slate-950">{item.title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
        <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
          <CalendarDays className="size-4" /> {item.date}
        </p>
      </div>
    </div>
  );
}

function FormField({ children, label, required }: { children: React.ReactNode; label: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold text-slate-900">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
