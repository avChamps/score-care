"use client";

import { useEffect, useRef, useState } from "react";
import {
  Download,
  Gauge,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { AppCard, PrimaryPortalButton } from "@/components/dashboard/portal-ui";
import { SubscribePromptOverlay, useSubscribePrompt } from "@/components/dashboard/subscribe-prompt";
import { apiFetch, apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { CibilDisplayDataError, getCachedCibilDisplayData, getCachedCibilScoreCheckData, getStoredCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { canUseNativeReportDownload, enqueueNativeReportDownload } from "@/lib/native-report-download";
import { useSubscriptionAccess } from "@/lib/subscription-access";

type CibilPayload = {
  pan: string;
  mobile: string;
  name: string;
  gender: string;
  consent: "Y";
};

type UserProfile = {
  id: number;
  mobileNumber?: string;
  panNumber?: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  status?: string;
  cibilScore?: string | number | null;
  cibilLastCheckedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type ScoreStatus = {
  label: string;
  risk: string;
  tone: "success" | "warning" | "danger" | "neutral";
};

export function ScoreCheckCard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const autoCheckStarted = useRef(false);
  const { isFreeTier, loading: accessLoading } = useSubscriptionAccess();
  const { closeSubscribePrompt, promptSubscribe, showSubscribePrompt } = useSubscribePrompt();

  const lastCheckedLabel = formatLastChecked(user?.cibilLastCheckedAt);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      setProfileLoading(true);
      setError("");

      try {
        const response = await apiRequest("/users/me/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          clearScorecareSession();
          router.replace("/login");
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || "Unable to load profile");
        }

        const profile = result?.data?.user ?? null;
        setUser(profile);

        const profileScore = readScore(profile);

        if (profileScore) {
          setScore(profileScore);
          setChecked(true);
        }

        if (profile?.mobileNumber) {
          localStorage.setItem("scorecare_mobile_number", profile.mobileNumber);
        }

        if (profile?.panNumber) {
          localStorage.setItem("scorecare_pan_number", profile.panNumber);
        }

        if (profile?.fullName) {
          localStorage.setItem("scorecare_full_name", profile.fullName);
        }

        if (profile?.email) {
          localStorage.setItem("scorecare_email", profile.email);
        }

        if (profile?.dateOfBirth) {
          localStorage.setItem("scorecare_date_of_birth", profile.dateOfBirth);
        }

        if (!autoCheckStarted.current && profile?.panNumber && profile?.mobileNumber && profile?.fullName) {
          autoCheckStarted.current = true;
          void checkCibilScore(profile, token);
        }
      } catch {
        setError("Could not load your profile. Please try again.");
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function checkCibilScore(profile = user, tokenOverride?: string) {
    if (checking) return;

    const token = tokenOverride ?? localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    if (!profile?.panNumber || !profile?.mobileNumber || !profile?.fullName) {
      setError("Profile is missing PAN, mobile number, or name.");
      return;
    }

    const cibilPayload: CibilPayload = {
      pan: profile.panNumber,
      mobile: profile.mobileNumber,
      name: profile.fullName,
      consent: "Y",
      gender: "male",
    };

    setError("");
    setChecking(true);

    try {
      const result = await getCachedCibilScoreCheckData(token, cibilPayload);
      let displayResult = null;

      if (!accessLoading && !isFreeTier) {
        try {
          displayResult = await getCachedCibilDisplayData(token);
        } catch {
          displayResult = null;
        }
      }

      const latestScore = readScore(displayResult) ?? readScore(result);

      setScore(latestScore);
      setChecked(true);
    } catch (error) {
      if (error instanceof CibilDisplayDataError && (error.status === 401 || error.status === 403)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      const cachedScore = readScore(getStoredCibilScoreCheckData(token, cibilPayload)) ?? readScore(profile);

      if (cachedScore) {
        setScore(cachedScore);
        setChecked(true);
        setError("");
        return;
      }

      setError("Could not check your CIBIL score. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function refreshCachedCibilScore() {
    if (checking) return;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    if (!user?.panNumber || !user?.mobileNumber || !user?.fullName) {
      setError("Profile is missing PAN, mobile number, or name.");
      return;
    }

    const cibilPayload: CibilPayload = {
      pan: user.panNumber,
      mobile: user.mobileNumber,
      name: user.fullName,
      consent: "Y",
      gender: "male",
    };

    setError("");
    setChecking(true);

    try {
      await wait(3000);

      const cachedScore = readScore(getStoredCibilScoreCheckData(token, cibilPayload)) ?? readScore(user);

      if (cachedScore) {
        setScore(cachedScore);
        setChecked(true);
        return;
      }

      setError("Could not check your CIBIL score. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function downloadReport() {
    if (downloading) return;

    if (isFreeTier) {
      promptSubscribe();
      return;
    }

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return;
    }

    setError("");
    setDownloading(true);

    try {
      if (canUseNativeReportDownload()) {
        await enqueueNativeReportDownload("/credit-reports/cibil/download-report", token, getReportFileName(null));
        return;
      }

      const response = await apiFetch("/credit-reports/cibil/download-report", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to download report");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = getReportFileName(response.headers.get("content-disposition"));
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Could not download your CIBIL report. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <AppCard className="overflow-hidden xl:row-span-2">
      <SubscribePromptOverlay onClose={closeSubscribePrompt} show={showSubscribePrompt} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black text-[var(--portal-ink)]">
            Your CIBIL Score
          </p>
          <p className="text-xs text-[var(--portal-muted)]">
            {profileLoading
              ? "Loading verified profile..."
              : checked || lastCheckedLabel
                ? `Last checked: ${lastCheckedLabel ?? "just now"}`
                : `Ready for ${user?.fullName ?? "your profile"}.`}
          </p>
        </div>

        <span className="grid size-9 place-items-center rounded-xl bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">
          <Gauge className="size-4" />
        </span>
      </div>

      <div className="mt-4">
        <ScoreMeter checked={checked} score={score} />
      </div>

      <ScoreRangeLegend />

      {error ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs font-bold text-rose-600">
          {error}
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <PrimaryPortalButton
          type="button"
          data-dashboard-home="true"
          onClick={refreshCachedCibilScore}
          className="w-full px-3"
          disabled={profileLoading || checking}
        >
          <RotateCcw className={checking ? "size-4 animate-spin" : "size-4"} />
          {profileLoading ? "Loading..." : checking ? "Refreshing..." : "Refresh Score"}
        </PrimaryPortalButton>

        <button
          type="button"
          data-dashboard-home="true"
          onClick={downloadReport}
          disabled={downloading}
          className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-[var(--portal-border)] bg-white px-3 text-xs font-black text-[var(--portal-ink)] shadow-[var(--portal-shadow-soft)] transition hover:border-[var(--portal-blue)] hover:text-[var(--portal-blue)] sm:h-11 sm:text-sm"
        >
          <Download className={downloading ? "size-4 animate-pulse" : "size-4"} />
          {downloading ? "Downloading..." : "Download Report"}
        </button>
      </div>
    </AppCard>
  );
}

function ScoreRangeLegend() {
  const ranges = [
    { label: "Poor", range: "300-549", color: "bg-red-500" },
    { label: "Fair", range: "550-649", color: "bg-lime-400" },
    { label: "Good", range: "650-749", color: "bg-emerald-500" },
    { label: "Excellent", range: "750-900", color: "bg-green-500" },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-caption font-bold text-[var(--portal-muted)]">
      {ranges.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`size-2.5 rounded-full ${item.color}`} />
          <span>
            {item.label} - ({item.range})
          </span>
        </div>
      ))}
    </div>
  );
}

function ScoreMeter({
  checked,
  score,
}: {
  checked: boolean;
  score: number | null;
}) {
  const displayScore = score ?? 782;
  const scoreLabel = getScoreStatus(displayScore).label;
  const needleAngle = checked ? scoreToNeedleAngle(displayScore) : 270;

  return (
    <div className="relative mx-auto h-[13.25rem] w-full max-w-[22rem] animate-[meterFade_0.45s_ease-out]">
      <div className="absolute inset-x-4 bottom-6 top-4 rounded-[2rem] bg-[linear-gradient(180deg,#fbfdff_0%,#ffffff_60%,#f7fbff_100%)]" />

      <svg
        className="absolute inset-x-0 top-0 h-40 w-full overflow-visible"
        viewBox="0 0 224 148"
        aria-hidden="true"
      >
        <defs>
          <filter
            id="dashboard-meter-soft-shadow"
            x="-20%"
            y="-30%"
            width="140%"
            height="160%"
          >
            <feDropShadow
              dx="0"
              dy="5"
              floodColor="#101828"
              floodOpacity="0.1"
              stdDeviation="5"
            />
          </filter>

          <linearGradient
            id="dashboard-meter-arc"
            x1="18"
            x2="206"
            y1="118"
            y2="118"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#ff4d32" />
            <stop offset="33%" stopColor="#ffb21f" />
            <stop offset="68%" stopColor="#cbe63c" />
            <stop offset="100%" stopColor="#20bd6b" />
          </linearGradient>
        </defs>

        <path
          d="M 20 118 A 92 92 0 0 1 204 118"
          fill="none"
          pathLength="100"
          stroke="#e8f1fb"
          strokeLinecap="round"
          strokeWidth="18"
        />

        <path
          d="M 20 118 A 92 92 0 0 1 204 118"
          fill="none"
          filter="url(#dashboard-meter-soft-shadow)"
          pathLength="100"
          stroke="url(#dashboard-meter-arc)"
          strokeLinecap="round"
          strokeWidth="15"
        />

        <path
          d="M 39 118 A 73 73 0 0 1 185 118"
          fill="none"
          pathLength="100"
          stroke="#e4edf7"
          strokeLinecap="round"
          strokeWidth="2.5"
        />

        <path
          d="M 51 118 A 61 61 0 0 1 173 118"
          fill="none"
          pathLength="100"
          stroke="#eef4fa"
          strokeDasharray="3 4"
          strokeLinecap="round"
          strokeWidth="2"
        />

        {[0, 20, 40, 60, 80, 100].map((tick) => {
          const angle = Math.PI - (Math.PI * tick) / 100;
          const outerX = 112 + Math.cos(angle) * 89;
          const outerY = 118 - Math.sin(angle) * 89;
          const innerX = 112 + Math.cos(angle) * 79;
          const innerY = 118 - Math.sin(angle) * 79;

          return (
            <line
              key={tick}
              stroke={tick === 0 || tick === 100 ? "#98a2b3" : "#cfd8e3"}
              strokeLinecap="round"
              strokeWidth={tick === 0 || tick === 100 ? 2.2 : 1.7}
              x1={innerX}
              x2={outerX}
              y1={innerY}
              y2={outerY}
            />
          );
        })}

        <g
          className="transition-transform duration-1000 ease-out"
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: "112px 118px",
          }}
        >
          <path
            d="M112 116.5 L190 111.5 L190 124.5 L112 119.5 Z"
            fill="#0b376d"
          />
          <path
            d="M112 116.5 L190 111.5 L190 116.2 L112 118 Z"
            fill="#155aa4"
            opacity="0.9"
          />
        </g>

        <circle cx="112" cy="118" fill="#0b376d" r="9" />
        <circle cx="112" cy="118" fill="#1677ff" r="5" />
      </svg>

      <div className="absolute inset-x-3 bottom-10 flex justify-between px-2 text-xs font-black text-[var(--portal-muted)]">
        <span><AnimatedNumber value={300} /></span>
        <span><AnimatedNumber value={900} /></span>
      </div>

      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-2xl font-black text-[var(--portal-ink)]">
          <AnimatedNumber value={checked ? displayScore : "--"} />
        </p>
        <p className="text-xs font-bold text-[var(--portal-muted)]">
          {checked ? scoreLabel : "Check to view score"}
        </p>
      </div>
    </div>
  );
}

function readScore(result: unknown) {
  const data = result as {
    score?: unknown;
    cibilScore?: unknown;
    credit_score?: unknown;
    data?: {
      score?: unknown;
      cibilScore?: unknown;
      credit_score?: unknown;
      display?: {
        score?: {
          value?: unknown;
        };
      };
      report?: {
        score?: unknown;
        cibilScore?: unknown;
        credit_score?: unknown;
      };
    };
  };

  const score =
    data.data?.display?.score?.value ??
    data.data?.report?.cibilScore ??
    data.data?.report?.score ??
    data.data?.report?.credit_score ??
    data.data?.cibilScore ??
    data.data?.score ??
    data.data?.credit_score ??
    data.cibilScore ??
    data.score ??
    data.credit_score;

  const numericScore = typeof score === "number" ? score : Number(score);

  return Number.isFinite(numericScore) && numericScore > 0
    ? numericScore
    : null;
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getReportFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    const now = new Date();

    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    return `scorecare-cibil-report-${timestamp}.pdf`;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  const quotedMatch = /filename="?([^"]+)"?/i.exec(contentDisposition);
  const fileName = utf8Match?.[1] ?? quotedMatch?.[1];

  return fileName ? decodeURIComponent(fileName.trim()) : "scorecare-cibil-report.pdf";
}

function formatLastChecked(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function scoreToNeedleAngle(score: number) {
  const safeScore = Math.min(900, Math.max(300, score));
  const progress = (safeScore - 300) / 600;

  return Math.round(180 + progress * 180);
}

function getScoreStatus(score: number): ScoreStatus {
  if (score >= 800) {
    return {
      label: "Excellent",
      risk: "Very Low Risk",
      tone: "success",
    };
  }

  if (score >= 750) {
    return {
      label: "Good",
      risk: "Low Risk",
      tone: "success",
    };
  }

  if (score >= 700) {
    return {
      label: "Fair",
      risk: "Medium Risk",
      tone: "warning",
    };
  }

  if (score >= 650) {
    return {
      label: "Average",
      risk: "Elevated Risk",
      tone: "warning",
    };
  }

  if (score >= 300) {
    return {
      label: "Poor",
      risk: "High Risk",
      tone: "danger",
    };
  }

  return {
    label: "Pending",
    risk: "Not Assessed",
    tone: "neutral",
  };
}
