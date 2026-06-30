"use client";

import {
  BadgeCheck,
  CalendarDays,
  Mail,
  Phone,
  Shield,
  LogOut,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DeleteAccountFlow } from "@/components/dashboard/delete-account-flow";
import { AppCard } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired, logoutScorecareSession } from "@/lib/auth-session";

type UserProfile = {
  id: number;
  mobileNumber?: string;
  panNumber?: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  status?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isAdmin?: boolean;
};

export function ProfileDetails({}: { isAdminView?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        router.replace("/login");
        return;
      }

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

        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        const result = await response.json();
        setUser(result?.data?.user ?? null);
      } catch {
        setError("Could not load profile details.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function logout() {
    logoutScorecareSession(router.replace);
  }

  const details = [
    { label: "Full Name", value: user?.fullName, Icon: UserRound },
    { label: "Email", value: user?.email, Icon: Mail },
    { label: "Mobile Number", value: maskMobile(user?.mobileNumber), Icon: Phone },
    { label: "PAN Number", value: maskPan(user?.panNumber), Icon: WalletCards },
    { label: "Date of Birth", value: formatDate(user?.dateOfBirth), Icon: CalendarDays },
    { label: "Account Status", value: user?.status, Icon: Shield },
    { label: "Last Login", value: formatDateTime(user?.lastLoginAt), Icon: CalendarDays },
    { label: "Created At", value: formatDateTime(user?.createdAt), Icon: CalendarDays },
  ];

  return (
    <div className="space-y-3 animate-[creditPanelIn_0.42s_ease-out]">
      <section className="text-center">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-[var(--portal-blue)] text-white shadow-[0_10px_24px_rgba(22,119,255,0.2)]">
          <UserRound className="size-9" />
        </div>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
          <BadgeCheck className="size-4" /> {user?.status === "active" ? "Active Profile" : "Profile"}
        </div>
      </section>

      <AppCard>
        <div>
          <h2 className="text-base font-bold text-slate-950">Personal Details</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {loading ? "Loading your verified profile..." : "Profile details from your verified account."}
          </p>
        </div>

        {error ? <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">{error}</p> : null}

        <div className="mt-5 divide-y divide-slate-100">
          {details.map(({ Icon, label, value }) => (
            <div key={label} className="grid grid-cols-[2.5rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-cyan-700">
                <Icon className="size-5" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <p className="text-caption font-semibold text-slate-500">{label}</p>
                <p className="mt-1 truncate text-xs font-bold text-slate-900">{loading ? "..." : value || "-"}</p>
              </div>
            </div>
          ))}
        </div>
      </AppCard>

      <button
        type="button"
        onClick={logout}
        data-dashboard-logout="true"
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-white text-base font-semibold text-rose-600 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 active:scale-[0.99]"
      >
        <LogOut className="size-5" />
        Logout
      </button>

      <button
        type="button"
        onClick={() => setShowDeleteAccount(true)}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-rose-100 bg-white text-base font-semibold text-rose-600 shadow-sm transition-all hover:border-rose-200 hover:bg-rose-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="size-5" />
        Delete Account
      </button>

      {showDeleteAccount ? (
        <DeleteAccountFlow
          mobileNumber={user?.mobileNumber}
          onClose={() => setShowDeleteAccount(false)}
          onDone={() => router.replace("/login")}
        />
      ) : null}
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function maskMobile(value?: string) {
  if (!value) {
    return undefined;
  }

  const digits = value.replace(/\D/g, "");
  return `+91 ******${digits.slice(-4)}`;
}

function maskPan(value?: string) {
  if (!value) {
    return undefined;
  }

  return `${value.slice(0, 2)}******${value.slice(-2)}`.toUpperCase();
}
