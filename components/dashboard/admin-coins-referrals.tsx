"use client";

import { CheckCircle2, Coins, LoaderCircle, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppCard, PrimaryPortalButton } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;
type AdminTab = "Summary" | "Transactions" | "Referrals" | "Fraud Queue" | "Rewards";

const tabs: AdminTab[] = ["Summary", "Transactions", "Referrals", "Fraud Queue", "Rewards"];

const emptyRewardForm = {
  title: "",
  description: "",
  type: "subscription_discount",
  value: "100",
  valueType: "flat",
  terms: "",
  coinCost: "1000",
  maxRedemptionsPerUser: "3",
  displayOrder: "1",
  isActive: true,
  ruleIsActive: true,
};

export function AdminCoinsReferrals() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("Summary");
  const [summary, setSummary] = useState<Row | null>(null);
  const [transactions, setTransactions] = useState<Row[]>([]);
  const [referrals, setReferrals] = useState<Row[]>([]);
  const [fraudQueue, setFraudQueue] = useState<Row[]>([]);
  const [rewards, setRewards] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [adjustForm, setAdjustForm] = useState({ amount: "", reason: "", userPublicId: "" });
  const [eventForm, setEventForm] = useState({ subscriptionPublicId: "", userPublicId: "" });
  const [rewardForm, setRewardForm] = useState(emptyRewardForm);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      clearScorecareSession();
      router.replace("/login");
      return null;
    }

    return { Authorization: `Bearer ${token}` };
  }, [router]);

  const loadData = useCallback(async () => {
    const headers = authHeaders();

    if (!headers) return;

    setLoading(true);
    setNotice("");

    try {
      const [summaryResponse, transactionsResponse, referralsResponse, fraudResponse, rewardsResponse] = await Promise.all([
        apiRequest("/admin/coins/summary", { headers }),
        apiRequest("/admin/coins/transactions?page=1&limit=20", { headers }),
        apiRequest("/admin/referrals?page=1&limit=20", { headers }),
        apiRequest("/admin/referrals/fraud-queue?page=1&limit=20", { headers }),
        apiRequest("/admin/rewards", { headers }),
      ]);

      setSummary(readData(await summaryResponse.json()));
      setTransactions(readList(await transactionsResponse.json(), "transactions"));
      setReferrals(readList(await referralsResponse.json(), "referrals"));
      setFraudQueue(readList(await fraudResponse.json(), "referrals"));
      setRewards(readList(await rewardsResponse.json(), "rewards"));
    } catch {
      setNotice("Unable to load admin coins and referrals data.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function adjustCoins() {
    const headers = authHeaders();

    if (!headers || saving) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await apiRequest("/admin/coins/adjust", {
        method: "POST",
        headers,
        body: {
          userPublicId: adjustForm.userPublicId.trim(),
          amount: Number(adjustForm.amount),
          reason: adjustForm.reason.trim(),
        },
      });
      const result = await response.json();

      setNotice(response.ok ? readMessage(result, "Coins adjusted.") : readMessage(result, "Unable to adjust coins."));
      if (response.ok) {
        setAdjustForm({ amount: "", reason: "", userPublicId: "" });
        void loadData();
      }
    } catch {
      setNotice("Unable to adjust coins.");
    } finally {
      setSaving(false);
    }
  }

  async function updateFraud(publicId: string, fraudStatus: "approved" | "rejected") {
    const headers = authHeaders();

    if (!headers || saving) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await apiRequest(`/admin/referrals/${publicId}/fraud`, {
        method: "PATCH",
        headers,
        body: {
          fraudStatus,
          fraudReason: fraudStatus === "approved" ? "Manual review passed" : "Manual review rejected",
        },
      });
      const result = await response.json();

      setNotice(response.ok ? readMessage(result, "Fraud review updated.") : readMessage(result, "Unable to update fraud status."));
      if (response.ok) void loadData();
    } catch {
      setNotice("Unable to update fraud status.");
    } finally {
      setSaving(false);
    }
  }

  async function sendReferralEvent(type: "kyc" | "subscription") {
    const headers = authHeaders();

    if (!headers || !eventForm.userPublicId.trim() || saving) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await apiRequest(type === "kyc" ? "/admin/referrals/events/kyc-completed" : "/admin/referrals/events/subscription-completed", {
        method: "POST",
        headers,
        body: type === "kyc"
          ? { userPublicId: eventForm.userPublicId.trim() }
          : { userPublicId: eventForm.userPublicId.trim(), subscriptionPublicId: eventForm.subscriptionPublicId.trim() },
      });
      const result = await response.json();

      setNotice(response.ok ? readMessage(result, "Referral event processed.") : readMessage(result, "Unable to process referral event."));
      if (response.ok) void loadData();
    } catch {
      setNotice("Unable to process referral event.");
    } finally {
      setSaving(false);
    }
  }

  async function createReward() {
    const headers = authHeaders();

    if (!headers || saving) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await apiRequest("/admin/rewards", {
        method: "POST",
        headers,
        body: normalizeRewardPayload(rewardForm),
      });
      const result = await response.json();

      setNotice(response.ok ? readMessage(result, "Reward created.") : readMessage(result, "Unable to create reward."));
      if (response.ok) {
        setRewardForm(emptyRewardForm);
        void loadData();
      }
    } catch {
      setNotice("Unable to create reward.");
    } finally {
      setSaving(false);
    }
  }

  async function disableReward(publicId: string) {
    const headers = authHeaders();

    if (!headers || saving) return;

    setSaving(true);
    setNotice("");

    try {
      const response = await apiRequest(`/admin/rewards/${publicId}`, {
        method: "DELETE",
        headers,
      });
      const result = await response.json();

      setNotice(response.ok ? readMessage(result, "Reward disabled.") : readMessage(result, "Unable to disable reward."));
      if (response.ok) void loadData();
    } catch {
      setNotice("Unable to disable reward.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div>
        <p className="text-caption font-black uppercase tracking-[0.16em] text-[#14B8A6]">Admin</p>
        <h1 className="mt-1 text-2xl font-black text-white">Coins & Referrals</h1>
        <p className="mt-1 text-sm text-[#9fb2c6]">Monitor coin liability, referral activity, fraud review, and rewards.</p>
      </div>

      {notice ? <p className="rounded-2xl border border-[#5EF2C2]/20 bg-[#5EF2C2]/10 px-4 py-3 text-sm font-bold text-[#5EF2C2]">{notice}</p> : null}

      <AppCard>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} className={cn("rounded-full px-4 py-2 text-sm font-bold transition", activeTab === tab ? "bg-[#14B8A6] text-[#03110E]" : "border border-white/10 bg-white/[0.04] text-[#9fb2c6]")} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </AppCard>

      {loading ? <AppCard><p className="text-sm font-bold text-[#9fb2c6]">Loading admin data...</p></AppCard> : null}
      {!loading && activeTab === "Summary" ? (
        <div className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(summary ?? {}).filter(([, value]) => typeof value !== "object").slice(0, 6).map(([key, value]) => (
              <AppCard key={key}>
                <p className="text-caption font-bold uppercase tracking-[0.12em] text-[#9fb2c6]">{key}</p>
                <p className="mt-2 text-2xl font-black text-[#5EF2C2]">{String(value ?? 0)}</p>
              </AppCard>
            ))}
          </div>
          <AdminForm title="Manual coin adjustment">
            <input className={inputClass} placeholder="User public ID" value={adjustForm.userPublicId} onChange={(event) => setAdjustForm((form) => ({ ...form, userPublicId: event.target.value }))} />
            <input className={inputClass} placeholder="Amount, e.g. 500 or -100" value={adjustForm.amount} onChange={(event) => setAdjustForm((form) => ({ ...form, amount: event.target.value }))} />
            <input className={inputClass} placeholder="Reason" value={adjustForm.reason} onChange={(event) => setAdjustForm((form) => ({ ...form, reason: event.target.value }))} />
            <PrimaryPortalButton disabled={saving || !adjustForm.userPublicId || !adjustForm.amount || !adjustForm.reason} onClick={() => void adjustCoins()}>Adjust coins</PrimaryPortalButton>
          </AdminForm>
          <AdminForm title="Referral milestone events">
            <input className={inputClass} placeholder="User public ID" value={eventForm.userPublicId} onChange={(event) => setEventForm((form) => ({ ...form, userPublicId: event.target.value }))} />
            <input className={inputClass} placeholder="Subscription public ID" value={eventForm.subscriptionPublicId} onChange={(event) => setEventForm((form) => ({ ...form, subscriptionPublicId: event.target.value }))} />
            <div className="flex flex-wrap gap-2">
              <PrimaryPortalButton disabled={saving || !eventForm.userPublicId} onClick={() => void sendReferralEvent("kyc")}>KYC completed</PrimaryPortalButton>
              <PrimaryPortalButton disabled={saving || !eventForm.userPublicId || !eventForm.subscriptionPublicId} onClick={() => void sendReferralEvent("subscription")}>Subscription completed</PrimaryPortalButton>
            </div>
          </AdminForm>
        </div>
      ) : null}
      {!loading && activeTab === "Transactions" ? <AdminRows empty="No coin transactions found." rows={transactions} icon="coins" /> : null}
      {!loading && activeTab === "Referrals" ? <AdminRows empty="No referrals found." rows={referrals} icon="shield" /> : null}
      {!loading && activeTab === "Fraud Queue" ? <FraudRows onUpdate={updateFraud} rows={fraudQueue} saving={saving} /> : null}
      {!loading && activeTab === "Rewards" ? (
        <div className="grid gap-4">
          <AdminForm title="Create reward">
            <input className={inputClass} placeholder="Title" value={rewardForm.title} onChange={(event) => setRewardForm((form) => ({ ...form, title: event.target.value }))} />
            <input className={inputClass} placeholder="Description" value={rewardForm.description} onChange={(event) => setRewardForm((form) => ({ ...form, description: event.target.value }))} />
            <input className={inputClass} placeholder="Terms" value={rewardForm.terms} onChange={(event) => setRewardForm((form) => ({ ...form, terms: event.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-3">
              <input className={inputClass} placeholder="Value" value={rewardForm.value} onChange={(event) => setRewardForm((form) => ({ ...form, value: event.target.value }))} />
              <input className={inputClass} placeholder="Coin cost" value={rewardForm.coinCost} onChange={(event) => setRewardForm((form) => ({ ...form, coinCost: event.target.value }))} />
              <input className={inputClass} placeholder="Max/user" value={rewardForm.maxRedemptionsPerUser} onChange={(event) => setRewardForm((form) => ({ ...form, maxRedemptionsPerUser: event.target.value }))} />
            </div>
            <PrimaryPortalButton disabled={saving || !rewardForm.title || !rewardForm.coinCost} onClick={() => void createReward()}>Create reward</PrimaryPortalButton>
          </AdminForm>
          <div className="grid gap-3">
            {rewards.length ? rewards.map((reward) => (
              <AppCard key={String(reward.publicId ?? reward.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-white">{String(reward.title ?? "Reward")}</p>
                    <p className="mt-1 text-caption text-[#9fb2c6]">{formatRow(reward)}</p>
                  </div>
                  <button className="grid size-10 place-items-center rounded-full border border-[#FF5C8A]/20 bg-[#FF5C8A]/10 text-[#FF8AAB]" type="button" disabled={saving} onClick={() => void disableReward(String(reward.publicId ?? ""))}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </AppCard>
            )) : <AppCard><p className="text-sm font-bold text-[#9fb2c6]">No rewards found.</p></AppCard>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const inputClass = "h-11 rounded-xl border border-white/10 bg-[#050912] px-3 text-sm font-bold text-white outline-none placeholder:text-[#7E91A8]";

function AdminForm({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <AppCard>
      <p className="mb-3 text-sm font-black text-white">{title}</p>
      <div className="grid gap-3">{children}</div>
    </AppCard>
  );
}

function AdminRows({ empty, icon, rows }: { empty: string; icon: "coins" | "shield"; rows: Row[] }) {
  if (!rows.length) return <AppCard><p className="text-sm font-bold text-[#9fb2c6]">{empty}</p></AppCard>;
  const Icon = icon === "coins" ? Coins : ShieldCheck;

  return (
    <div className="grid gap-3">
      {rows.map((row, index) => (
        <AppCard key={String(row.publicId ?? row.id ?? index)}>
          <div className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#5EF2C2]/10 text-[#5EF2C2]"><Icon className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-black text-white">{String(row.title ?? row.status ?? row.type ?? row.source ?? "Record")}</p>
              <p className="mt-1 text-caption text-[#9fb2c6]">{formatRow(row)}</p>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
}

function FraudRows({ onUpdate, rows, saving }: { onUpdate: (publicId: string, status: "approved" | "rejected") => void; rows: Row[]; saving: boolean }) {
  if (!rows.length) return <AppCard><p className="text-sm font-bold text-[#9fb2c6]">No fraud review items found.</p></AppCard>;

  return (
    <div className="grid gap-3">
      {rows.map((row, index) => {
        const publicId = String(row.publicId ?? row.id ?? "");

        return (
          <AppCard key={String(publicId || index)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black text-white">{String(row.status ?? row.fraudStatus ?? "Referral")}</p>
                <p className="mt-1 text-caption text-[#9fb2c6]">{formatRow(row)}</p>
              </div>
              <div className="flex gap-2">
                <button className="grid size-10 place-items-center rounded-full bg-[#14B8A6] text-[#03110E]" type="button" disabled={saving || !publicId} onClick={() => void onUpdate(publicId, "approved")}>
                  {saving ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                </button>
                <button className="grid size-10 place-items-center rounded-full border border-[#FF5C8A]/20 bg-[#FF5C8A]/10 text-[#FF8AAB]" type="button" disabled={saving || !publicId} onClick={() => void onUpdate(publicId, "rejected")}>
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}

function normalizeRewardPayload(form: typeof emptyRewardForm) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    type: form.type,
    value: Number(form.value),
    valueType: form.valueType,
    terms: form.terms.trim(),
    coinCost: Number(form.coinCost),
    maxRedemptionsPerUser: Number(form.maxRedemptionsPerUser),
    validFrom: null,
    validTo: null,
    isActive: form.isActive,
    ruleIsActive: form.ruleIsActive,
    displayOrder: Number(form.displayOrder),
  };
}

function readData(result: unknown) {
  const data = result as { data?: unknown };
  return (data?.data ?? result) as Row;
}

function readList(result: unknown, key: string): Row[] {
  const data = readData(result);
  const list = data?.[key] ?? data?.items ?? data?.rows ?? data;
  return Array.isArray(list) ? list : [];
}

function readMessage(result: unknown, fallback: string) {
  const data = result as { message?: string };
  return data.message || fallback;
}

function formatRow(row: Row) {
  return Object.entries(row)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}
