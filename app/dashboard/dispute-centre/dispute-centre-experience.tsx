"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeIndianRupee, Landmark, ClipboardList,
  Building2,
  CheckCircle2 } from "lucide-react";
import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type DisputeRequest = {
  bureau?: string | null;
  bureaus?: string[] | null;
  createdAt?: string | null;
  createdDate?: string | null;
  disputeId?: string | null;
  expectedDate?: string | null;
  id?: string;
  issueDescription?: string | null;
  lenderName?: string | null;
  pointsGained?: number | string | null;
  progress?: number | string | null;
  publicId?: string;
  repairStatus?: string | null;
  resolutionDate?: string | null;
  resolvedAt?: string | null;
  status?: string | null;
  submittedAt?: string | null;
  submittedDate?: string | null;
};

type DisputeStatus = {
  activeDisputes?: number;
  resolvedDisputes?: number;
  pointsGained?: number;
};

const reportCardClass =
  "border border-[#103A2B]/50 bg-[linear-gradient(135deg,#06120E_0%,#081712_50%,#091813_100%)] shadow-[0_20px_45px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.02)]";
const reportMiniCardClass = "border border-[#0D5A3F]/55 bg-[linear-gradient(135deg,rgba(9,45,31,0.76),rgba(18,34,24,0.72))]";
const howItWorksSteps = [
  {
    Icon: ClipboardList,
    label: "File",
    meta: "Report error",
    color: "text-[#22F2C2]", // Green
  },
  {
    Icon: Building2,
    label: "Bureau",
    meta: "30-day review",
    color: "text-[#60A5FA]", // Blue
  },
  {
    Icon: Landmark,
    label: "Lender",
    meta: "Must respond",
    color: "text-[#FBBF24]", // Amber
  },
  {
    Icon: CheckCircle2,
    label: "Fixed",
    meta: "Score rises",
    color: "text-[#34D399]", // Emerald
  },
];

export function DisputeCentreExperience() {
  const [requests, setRequests] = useState<DisputeRequest[]>([]);
  const [status, setStatus] = useState<DisputeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDisputes() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        window.location.href = "/login";
        return;
      }

      try {
        const [statusResponse, requestsResponse] = await Promise.all([
          apiRequest("/cibil-repair-content/requests/me/status", { headers: { Authorization: `Bearer ${token}` } }),
          apiRequest("/cibil-repair-content/requests/me", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (statusResponse.status === 401 || statusResponse.status === 403 || requestsResponse.status === 401 || requestsResponse.status === 403) {
          clearScorecareSession();
          window.location.href = "/login";
          return;
        }

        const [statusResult, requestsResult] = await Promise.all([statusResponse.json(), requestsResponse.json()]);

        setStatus(readStatus(requestsResult?.data) ?? readStatus(statusResult?.data));
        setRequests(Array.isArray(requestsResult?.data?.requests) ? requestsResult.data.requests : []);
      } catch {
        setStatus(null);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    void loadDisputes();
  }, []);

  const stats = [
    { label: "Active disputes", value: activeCount(requests) },
    { label: "Resolved disputes", value: requests.filter((request) => normalizeStatus(request) === "Resolved").length },
    { label: "Points gained", value: status?.pointsGained ?? sumPoints(requests) },
  ];

  return (
    <PortalShell active="fix">
      <div className="min-h-screen bg-[#050912] pb-28 text-white">
        <PortalTopBar title="Dispute Centre" />
        <PageContent className="px-4 py-5">
          <div className="mx-auto max-w-md space-y-4">
            <section className={cn("rounded-[2rem] p-4", reportCardClass)}>
              <h1 className="text-lg font-black tracking-tight">Dispute Centre</h1>
              <p className="mt-1 text-caption text-[#9fb2c6]">Fight errors • Protect your score</p>
            </section>

            <section className={cn("rounded-[1.65rem] p-4", reportCardClass)}>
              <div className="grid grid-cols-3 gap-2">
                {stats.map((stat) => (
                  <div key={stat.label} className={cn("rounded-2xl px-3 py-3", reportMiniCardClass)}>
                    <p className="text-lg font-black">{stat.value}</p>
                    <p className="mt-1 text-caption leading-3 text-[#9fb2c6]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className={cn("rounded-[1.65rem] p-4", reportCardClass)}>
              <h2 className="text-sm font-bold">How It Works</h2>
             <div className="mt-4 grid grid-cols-4 gap-2">
  {howItWorksSteps.map(({ Icon, label, meta, color }) => (
    <div
      key={label}
      className={cn(
        "rounded-2xl px-2 py-3 text-center",
        reportMiniCardClass
      )}
    >
      <Icon
        className={cn("mx-auto size-6", color)}
        strokeWidth={2.2}
      />

      <p className="mt-2 text-caption font-black leading-3 text-white">
        {label}
      </p>

      <p className="mt-1 text-[10px] font-semibold leading-3 text-[#9fb2c6]">
        {meta}
      </p>
    </div>
  ))}
</div>
            </section>

            <section className={cn("rounded-[1.65rem] p-4", reportCardClass)}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold">Existing Dispute Cases</h2>
                {requests.length ? <Link className="rounded-full bg-[#22F2C2] px-4 py-2 text-xs font-black text-[#04120e]" data-dashboard-dispute="true" href="/dashboard/dispute-centre/new">File New</Link> : null}
              </div>
              <div className="mt-4 space-y-3">
                {loading ? <div className={cn("h-24 animate-pulse rounded-2xl", reportMiniCardClass)} /> : null}
                {!loading && !requests.length ? (
                  <div className={cn("rounded-2xl p-4 text-center", reportMiniCardClass)}>
                    <p className="text-sm font-semibold">No disputes filed yet</p>
                    <p className="mx-auto mt-1 max-w-xs text-caption leading-5 text-[#9fb2c6]">Review your credit accounts and raise a dispute if you find incorrect information.</p>
                    <Link className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22F2C2,#13B98F)] px-4 text-center text-sm font-black text-[#04120e] shadow-[0_14px_28px_rgba(34,242,194,0.22)]" data-dashboard-dispute="true" href="/dashboard/dispute-centre/new">
                      File New Dispute
                    </Link>
                  </div>
                ) : null}
                {requests.map((request) => (
                  <DisputeCard key={request.disputeId || request.publicId || request.id} request={request} />
                ))}
              </div>
            </section>

            {requests.length ? (
              <Link className="flex h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22F2C2,#13B98F)] px-4 text-center text-sm font-black text-[#04120e] shadow-[0_14px_28px_rgba(34,242,194,0.22)]" data-dashboard-dispute="true" href="/dashboard/dispute-centre/new">
                File New Dispute
              </Link>
            ) : null}
          </div>
        </PageContent>
        <DashboardBottomNav />
      </div>
    </PortalShell>
  );
}

function DisputeCard({ request }: { request: DisputeRequest }) {
  const progress = readProgress(request.progress);
  const submittedDate = request.submittedDate || request.submittedAt || request.createdDate || request.createdAt;
  const resolutionDate = request.resolutionDate || request.resolvedAt;
  const bureaus = readBureaus(request);

  return (
    <article className={cn("rounded-2xl p-4", reportMiniCardClass)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{request.lenderName || request.disputeId || request.publicId || request.id}</p>
          {request.issueDescription ? <p className="mt-1 text-caption leading-5 text-[#9fb2c6]">{request.issueDescription}</p> : null}
        </div>
        <span className="shrink-0 rounded-full bg-[#22F2C2]/12 px-2.5 py-1 text-caption font-bold text-[#22F2C2]">{normalizeStatus(request)}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-caption text-[#9fb2c6]">
        <span>Bureau <b className="block text-white">{bureaus || "--"}</b></span>
        <span>Status <b className="block text-white">{normalizeStatus(request)}</b></span>
        <span>Progress <b className="block text-white">{progress !== null ? `${progress}%` : "--"}</b></span>
        <span>Submitted <b className="block text-white">{formatDate(submittedDate)}</b></span>
        {resolutionDate ? <span>Resolution <b className="block text-white">{formatDate(resolutionDate)}</b></span> : null}
        {request.pointsGained ? <span>Points <b className="block text-[#22F2C2]">+{request.pointsGained}</b></span> : null}
      </div>
      {progress !== null ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-[#22F2C2]" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
    </article>
  );
}

function readStatus(data: unknown): DisputeStatus | null {
  const status = data as DisputeStatus | null;
  return status && (status.activeDisputes !== undefined || status.resolvedDisputes !== undefined || status.pointsGained !== undefined) ? status : null;
}

function normalizeStatus(request: DisputeRequest) {
  const rawStatus = String(request.repairStatus || request.status || "").toLowerCase();
  if (rawStatus.includes("resolved") || rawStatus.includes("complete")) return "Resolved";
  if (rawStatus.includes("review")) return "Under Review";
  return "Submitted";
}

function activeCount(requests: DisputeRequest[]) {
  return requests.filter((request) => normalizeStatus(request) !== "Resolved").length;
}

function sumPoints(requests: DisputeRequest[]) {
  return requests.reduce((total, request) => total + (Number(request.pointsGained) || 0), 0);
}

function readProgress(value: DisputeRequest["progress"]) {
  if (value === null || value === undefined || value === "") return null;

  const progress = Number(value);

  return Number.isFinite(progress) ? Math.max(0, Math.min(100, progress)) : null;
}

function readBureaus(request: DisputeRequest) {
  if (Array.isArray(request.bureaus) && request.bureaus.length) {
    return request.bureaus.filter(Boolean).join(", ");
  }

  return request.bureau || "";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--";

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
