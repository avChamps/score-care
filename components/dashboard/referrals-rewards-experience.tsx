"use client";

import { AlertCircle, Coins, Copy, FileSearch, Gift, LoaderCircle, Send, Share2, Sparkles, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppCard, PrimaryPortalButton } from "@/components/dashboard/portal-ui";
import { apiRequest } from "@/lib/api";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { cn } from "@/lib/utils";

type ReferralMe = {
  referralCode?: string;
  shareLink?: string;
  summary?: Record<string, number>;
};
type Wallet = {
  balance?: number;
  lifetimeEarned?: number;
  lifetimeRedeemed?: number;
  updatedAt?: string;
};
type ListItem = Record<string, unknown>;
type InlineMessage = {
  message: string;
  tone: "error" | "success";
};

const tabs = ["Overview", "Referrals", "Coins", "Rewards", "Redemptions"] as const;
const selectedSubscriptionRedemptionKey = "scorecare_selected_subscription_redemption_public_id";
const selectedSubscriptionRedemptionByPlanKey = "scorecare_selected_subscription_redemption_by_plan";
type Tab = (typeof tabs)[number];

export function ReferralsRewardsExperience() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [applyCode, setApplyCode] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionTone, setActionTone] = useState<"error" | "success">("success");
  const [rewardMessage, setRewardMessage] = useState<InlineMessage & { rewardId: string } | null>(null);
  const [loadingTabs, setLoadingTabs] = useState<Record<Tab, boolean>>({
    Overview: true,
    Referrals: false,
    Coins: false,
    Rewards: false,
    Redemptions: false,
  });
  const [loadedTabs, setLoadedTabs] = useState<Record<Tab, boolean>>({
    Overview: false,
    Referrals: false,
    Coins: false,
    Rewards: false,
    Redemptions: false,
  });
  const [applyingCode, setApplyingCode] = useState(false);
  const [appliedRewardId, setAppliedRewardId] = useState("");
  const [redeemingRewardId, setRedeemingRewardId] = useState("");
  const [appliedRedemptionsByPlan, setAppliedRedemptionsByPlan] = useState<Record<string, { publicId: string; targetPublicId: string }>>({});
  const [referralMe, setReferralMe] = useState<ReferralMe | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [referrals, setReferrals] = useState<ListItem[]>([]);
  const [transactions, setTransactions] = useState<ListItem[]>([]);
  const [rewards, setRewards] = useState<ListItem[]>([]);
  const [redemptions, setRedemptions] = useState<ListItem[]>([]);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("scorecare_token") : null), []);

  const authHeaders = useCallback(() => {
    const authToken = localStorage.getItem("scorecare_token");

    if (!authToken || isTokenExpired(authToken)) {
      clearScorecareSession();
      router.replace("/login");
      return null;
    }

    return { Authorization: `Bearer ${authToken}` };
  }, [router]);

  const setTabLoading = useCallback((tab: Tab, loading: boolean) => {
    setLoadingTabs((current) => ({ ...current, [tab]: loading }));
  }, []);

  const setTabLoaded = useCallback((tab: Tab) => {
    setLoadedTabs((current) => ({ ...current, [tab]: true }));
  }, []);

  function showMessage(nextMessage: string, tone: "error" | "success" = "success") {
    setActionMessage(nextMessage);
    setActionTone(tone);
  }

  function showRewardMessage(rewardId: string, nextMessage: string, tone: "error" | "success" = "success") {
    setRewardMessage({ rewardId, message: nextMessage, tone });
  }

  const loadOverview = useCallback(async () => {
    const headers = authHeaders();

    if (!headers) return;

    setTabLoading("Overview", true);
    setActionMessage("");

    try {
      const [meResponse, walletResponse] = await Promise.all([
        apiRequest("/referrals/me", { headers }),
        apiRequest("/coins/wallet", { headers }),
      ]);
      const walletResult = await walletResponse.json();

      setReferralMe(readData(await meResponse.json()));
      setWallet(readData(walletResult)?.wallet ?? readData(walletResult));
      setTabLoaded("Overview");
    } catch {
      showMessage("Unable to load referral and coins data.", "error");
    } finally {
      setTabLoading("Overview", false);
    }
  }, [authHeaders, setTabLoaded, setTabLoading]);

  const loadTabData = useCallback(async (tab: Tab, force = false) => {
    if (tab === "Overview") {
      if (!loadedTabs.Overview || force) await loadOverview();
      return;
    }

    if (loadedTabs[tab] && !force) return;

    const headers = authHeaders();

    if (!headers) return;

    setTabLoading(tab, true);
    setActionMessage("");
    setRewardMessage(null);

    try {
      if (tab === "Referrals") {
        const response = await apiRequest("/referrals/my-referrals?page=1&limit=20", { headers });
        setReferrals(readList(await response.json(), "referrals"));
      } else if (tab === "Coins") {
        const response = await apiRequest("/coins/transactions?page=1&limit=20", { headers });
        setTransactions(readList(await response.json(), "transactions"));
      } else if (tab === "Rewards") {
        const response = await apiRequest("/rewards", { headers });
        setRewards(readList(await response.json(), "rewards"));
      } else if (tab === "Redemptions") {
        const response = await apiRequest("/rewards/redemptions?page=1&limit=20", { headers });
        setRedemptions(readList(await response.json(), "redemptions"));
      }

      setTabLoaded(tab);
    } catch {
      showMessage(`Unable to load ${tab.toLowerCase()} data.`, "error");
    } finally {
      setTabLoading(tab, false);
    }
  }, [authHeaders, loadOverview, loadedTabs, setTabLoaded, setTabLoading]);

  useEffect(() => {
    if (!token) {
      clearScorecareSession();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (!token) return;

    void loadTabData(activeTab);
  }, [activeTab, loadTabData, token]);

  async function applyReferralCode() {
    const headers = authHeaders();

    if (!headers || !applyCode.trim()) return;

    setApplyingCode(true);
    setActionMessage("");

    try {
      const resolveResponse = await apiRequest("/referrals/resolve", {
        method: "POST",
        body: { code: applyCode.trim() },
      });
      const resolveResult = await resolveResponse.json();

      if (!resolveResponse.ok) {
        showMessage(readMessage(resolveResult, "Invalid referral code."), "error");
        return;
      }

      const response = await apiRequest("/referrals/apply", {
        method: "POST",
        headers,
        body: {
          code: applyCode.trim(),
          deviceId: readDeviceId(),
        },
      });
      const result = await response.json();

      showMessage(response.ok ? readMessage(result, "Referral applied.") : readMessage(result, "Unable to apply referral."), response.ok ? "success" : "error");
      if (response.ok) void loadOverview();
    } catch {
      showMessage("Unable to apply referral.", "error");
    } finally {
      setApplyingCode(false);
    }
  }

  async function redeemReward(publicId: string) {
    const headers = authHeaders();
    const reward = rewards.find((item) => String(item.publicId ?? item.id ?? "") === publicId);
    const rewardType = String(reward?.rewardType ?? reward?.type ?? "").trim().toLowerCase();
    const targetPublicId = String(reward?.targetPublicId ?? "scorecare-basic-monthly").trim();

    if (!headers || redeemingRewardId) return;
    if (!publicId) {
      showMessage("Unable to redeem this reward.", "error");
      return;
    }

    setRedeemingRewardId(publicId);
    setRewardMessage(null);

    try {
      const response = await apiRequest(`/rewards/${publicId}/redeem`, {
        method: "POST",
        headers,
        body: {
          applyTo: "subscription_plan",
          targetPublicId,
          metadata: {},
        },
      });
      const result = await response.json();

      if (response.ok) {
        const redemptionPublicId = readRedemptionPublicId(result);
        const redemptionData = readRedemptionData(result);
        const appliedRewardType = String(redemptionData.rewardType ?? rewardType).trim().toLowerCase();
        const appliedTargetPublicId = String(redemptionData.targetPublicId ?? targetPublicId).trim();

        if (redemptionPublicId) {
          localStorage.setItem(selectedSubscriptionRedemptionKey, redemptionPublicId);
          if (appliedRewardType === "subscription_discount" && appliedTargetPublicId) {
            const nextRedemptions = {
              ...appliedRedemptionsByPlan,
              [appliedTargetPublicId]: { publicId: redemptionPublicId, targetPublicId: appliedTargetPublicId },
            };

            setAppliedRedemptionsByPlan(nextRedemptions);
            saveSubscriptionRedemptionsByPlan(nextRedemptions);
          }
        }

        setAppliedRewardId(publicId);
      }

      showRewardMessage(publicId, response.ok ? "Reward applied to your subscription checkout." : readMessage(result, "Unable to redeem reward."), response.ok ? "success" : "error");
      if (response.ok) {
        void loadOverview();
        void loadTabData("Rewards", true);
        void loadTabData("Redemptions", true);
        void loadTabData("Coins", true);
      }
    } catch {
      showRewardMessage(publicId, "Unable to redeem reward.", "error");
    } finally {
      setRedeemingRewardId("");
    }
  }

  async function copyReferral() {
    const text = referralMe?.shareLink || referralMe?.referralCode || "";

    if (!text) return;

    await navigator.clipboard?.writeText(text).catch(() => undefined);
    showMessage("Referral link copied.");
  }

  async function shareReferral() {
    const url = referralMe?.shareLink || "https://play.google.com/store/apps/details?id=in.scorecare.app";

    if (navigator.share) {
      await navigator.share({
        title: "ScoreCare",
        text: `Join ScoreCare${referralMe?.referralCode ? ` with my referral code ${referralMe.referralCode}` : ""}.`,
        url,
      }).catch(() => undefined);
      return;
    }

    await navigator.clipboard?.writeText(url).catch(() => undefined);
    showMessage("Share link copied.");
  }

  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <div className="relative overflow-hidden rounded-[2rem] border border-[#5EF2C2]/15 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.24),transparent_34%),linear-gradient(135deg,#0D1828,#06101A)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.34)]">
        <div className="absolute right-[-2.5rem] top-[-2rem] size-32 rounded-full border border-[#5EF2C2]/15 bg-[#5EF2C2]/5" />
        <div className="relative flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-caption font-black uppercase tracking-[0.16em] text-[#14B8A6]">Refer & Earn</p>
            <h1 className="mt-1 text-2xl font-black text-white">Referral & Coins</h1>
            <p className="mt-1 max-w-sm text-sm text-[#B7C7D8]">Share ScoreCare, track rewards, and redeem coins.</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#14B8A6]/15 text-[#5EF2C2]">
            <Sparkles className="size-6" />
          </span>
        </div>
      </div>

      {loadingTabs.Overview ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <MetricCard label="Balance" value={wallet?.balance ?? 0} />
          <MetricCard label="Lifetime Earned" value={wallet?.lifetimeEarned ?? 0} />
          <MetricCard label="Rewarded Referrals" value={referralMe?.summary?.rewarded ?? 0} />
        </div>
      )}

      <AppCard className="bg-[#0E1A2A]/92">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {tabs.map((tab) => (
            <button key={tab} data-dashboard-rewards="true" className={cn("min-w-0 rounded-full px-3 py-2 text-sm font-bold transition sm:px-4", activeTab === tab ? "bg-[#14B8A6] text-[#03110E] shadow-[0_10px_28px_rgba(20,184,166,0.26)]" : "border border-white/10 bg-white/[0.04] text-[#9fb2c6]")} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </AppCard>

      {loadingTabs[activeTab] ? <SkeletonList count={activeTab === "Overview" ? 2 : 3} /> : null}
      {!loadingTabs.Overview && activeTab === "Overview" ? (
        <div className="grid gap-4">
          <AppCard className="min-w-0 overflow-hidden">
            <div className="grid min-w-0 gap-4">
              <div className="min-w-0">
                <p className="text-caption font-bold uppercase tracking-[0.14em] text-[#5EF2C2]">Your code</p>
                <h2 className="mt-2 text-2xl font-black text-white">{referralMe?.referralCode || "--"}</h2>
                <p className="mt-1 break-all text-caption text-[#9fb2c6]">{referralMe?.shareLink || "Share link not available"}</p>
              </div>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                <button data-dashboard-rewards="true" className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-[#5EF2C2]/25 bg-[#5EF2C2]/10 px-2 text-caption font-bold text-[#5EF2C2]" type="button" onClick={() => void copyReferral()}>
                  <Copy className="size-4 shrink-0" /> <span className="min-w-0 truncate">Copy Link</span>
                </button>
                <button data-dashboard-rewards="true" className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-1.5 overflow-hidden rounded-full bg-[#14B8A6] px-2 text-caption font-black text-[#03110E]" type="button" onClick={() => void shareReferral()}>
                  <Share2 className="size-4 shrink-0" /> <span className="min-w-0 truncate">Share App</span>
                </button>
              </div>
            </div>
          </AppCard>
          <AppCard className="min-w-0 overflow-hidden">
            <CodeAction message={actionMessage} tone={actionTone} title="Have a referral code?" value={applyCode} onChange={setApplyCode} onSubmit={applyReferralCode} loading={applyingCode} />
          </AppCard>
        </div>
      ) : null}
      {!loadingTabs.Referrals && activeTab === "Referrals" ? <SimpleList empty="No Records Found" message="No referrals available." items={referrals} /> : null}
      {!loadingTabs.Coins && activeTab === "Coins" ? <CoinsTransactionList items={transactions} /> : null}
      {!loadingTabs.Rewards && activeTab === "Rewards" ? (
        <div className="grid gap-3">
          {rewards.length ? rewards.map((reward) => (
            <RewardCard appliedRewardId={appliedRewardId} key={String(reward.publicId ?? reward.id)} message={rewardMessage?.rewardId === String(reward.publicId ?? "") ? rewardMessage : null} redeemingRewardId={redeemingRewardId} reward={reward} onRedeem={redeemReward} />
          )) : <EmptyState title="No Records Found" message="No active rewards available." />}
        </div>
      ) : null}
      {!loadingTabs.Redemptions && activeTab === "Redemptions" ? <SimpleList empty="No Records Found" message="No redemptions available." items={redemptions} /> : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <AppCard>
      <p className="text-caption font-bold uppercase tracking-[0.12em] text-[#9fb2c6]">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#5EF2C2]">{value}</p>
    </AppCard>
  );
}

function MetricSkeleton() {
  return (
    <AppCard>
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-32 rounded-full bg-white/10" />
        <div className="h-7 w-16 rounded-full bg-white/10" />
      </div>
    </AppCard>
  );
}

function CodeAction({ loading, message, onChange, onSubmit, title, tone, value }: { loading: boolean; message: string; onChange: (value: string) => void; onSubmit: () => void; title: string; tone: "error" | "success"; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B121D] p-4">
      <p className="text-sm font-black text-white">{title}</p>
      <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2">
        <input className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-[#050912] px-3 text-sm font-bold text-white outline-none" value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} placeholder="SC123ABCDEF" />
        <button data-dashboard-rewards="true" className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 text-sm font-black text-[#03110E] disabled:opacity-60" type="button" disabled={loading || !value.trim()} onClick={() => void onSubmit()}>
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
          Apply
        </button>
      </div>
      {message ? (
        <p className={cn("mt-3 flex items-start gap-2 rounded-xl border px-3 py-2 text-caption font-bold", tone === "error" ? "border-[#FF6B6B]/20 bg-[#FF6B6B]/8 text-[#FF9A9A]" : "border-[#5EF2C2]/20 bg-[#5EF2C2]/8 text-[#5EF2C2]")}>
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{message}</span>
        </p>
      ) : null}
    </div>
  );
}

function RewardCard({ appliedRewardId, message, onRedeem, redeemingRewardId, reward }: { appliedRewardId: string; message: InlineMessage | null; onRedeem: (publicId: string) => void; redeemingRewardId: string; reward: ListItem }) {
  const publicId = String(reward.publicId ?? "");
  const coinCost = Number(reward.coinCost ?? 0);
  const isApplied = appliedRewardId === publicId;
  const isRedeeming = redeemingRewardId === publicId;

  return (
    <AppCard className={cn("relative min-w-0 overflow-hidden border-[#5EF2C2]/18 bg-[linear-gradient(145deg,rgba(20,184,166,0.13),rgba(11,18,29,0.94)_42%,rgba(14,26,42,0.96))]", isApplied && "ring-1 ring-[#5EF2C2]/35")}>
      <div className="absolute right-[-1.5rem] top-[-1.5rem] size-20 rounded-full bg-[#5EF2C2]/10 blur-xl" />
      <div className="relative grid gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#5EF2C2]/12 text-[#5EF2C2] shadow-[inset_0_0_0_1px_rgba(94,242,194,0.18)]">
            <Gift className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-white">{String(reward.title ?? "Reward")}</h3>
            <p className="mt-1 text-caption leading-relaxed text-[#B7C7D8]">{String(reward.description ?? reward.terms ?? "")}</p>
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="inline-flex min-w-0 items-center gap-2 rounded-full border border-[#5EF2C2]/15 bg-[#06121E]/80 px-3 py-2 text-sm font-black text-[#5EF2C2]">
            <Coins className="size-4 shrink-0" />
            <span className="truncate">{coinCost.toLocaleString("en-IN")} coins</span>
          </div>
          <PrimaryPortalButton data-dashboard-rewards="true" disabled={Boolean(redeemingRewardId) || !publicId || isApplied} onClick={() => void onRedeem(publicId)}>
            {isApplied ? "Applied" : isRedeeming ? "Please wait" : "Redeem"}
          </PrimaryPortalButton>
        </div>
        {message ? <InlineActionMessage message={message.message} tone={message.tone} /> : null}
        {isApplied && !message ? <InlineActionMessage message="Reward applied. Continue to subscription checkout to use this discount." tone="success" /> : null}
      </div>
    </AppCard>
  );
}

function InlineActionMessage({ message, tone }: InlineMessage) {
  return (
    <p className={cn("flex items-start gap-2 rounded-xl border px-3 py-2 text-caption font-bold", tone === "error" ? "border-[#FF6B6B]/20 bg-[#FF6B6B]/8 text-[#FF9A9A]" : "border-[#5EF2C2]/20 bg-[#5EF2C2]/8 text-[#5EF2C2]")}>
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }, (_, index) => (
        <AppCard key={index}>
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-32 rounded-full bg-white/10" />
            <div className="h-3 w-full rounded-full bg-white/10" />
            <div className="h-3 w-7/12 rounded-full bg-white/10" />
          </div>
        </AppCard>
      ))}
    </div>
  );
}

function EmptyState({ message, title }: { message: string; title: string }) {
  return (
    <div className="grid min-h-[18rem] place-items-center px-4 py-10 text-center">
      <div>
        <FileSearch className="mx-auto size-12 text-[#8FA3B8]" strokeWidth={1.8} />
        <h3 className="mt-5 text-base font-black text-white">{title}</h3>
        <p className="mt-2 text-sm font-medium text-[#9fb2c6]">{message}</p>
      </div>
    </div>
  );
}

function SimpleList({ empty, items, message }: { empty: string; items: ListItem[]; message: string }) {
  if (!items.length) return <EmptyState title={empty} message={message} />;

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <AppCard key={String(item.publicId ?? item.id ?? index)}>
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#5EF2C2]/10 text-[#5EF2C2]">
              <WalletCards className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white">{String(item.title ?? item.status ?? item.type ?? item.source ?? "Record")}</p>
              <p className="mt-1 text-caption text-[#9fb2c6]">{formatItem(item)}</p>
            </div>
          </div>
        </AppCard>
      ))}
    </div>
  );
}

function CoinsTransactionList({ items }: { items: ListItem[] }) {
  if (!items.length) return <EmptyState title="No Records Found" message="No coin transactions available." />;

  return (
    <div className="grid gap-3">
      {items.map((item, index) => {
        const amount = Number(item.amount ?? 0);
        const type = String(item.type ?? "");
        const isEarn = type.toLowerCase() === "earn" || amount > 0;

        return (
          <AppCard key={String(item.publicId ?? item.id ?? index)}>
            <div className="flex items-start gap-3">
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", isEarn ? "bg-[#5EF2C2]/10 text-[#5EF2C2]" : "bg-[#FACC15]/10 text-[#FACC15]")}>
                <Coins className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white">{String(item.description ?? formatLabel(item.source) ?? "Coin transaction")}</p>
                    <p className="mt-1 text-caption font-medium text-[#9fb2c6]">{formatLabel(item.referenceType) || "ScoreCare coins"}</p>
                  </div>
                  <p className={cn("shrink-0 text-base font-black", isEarn ? "text-[#5EF2C2]" : "text-[#FACC15]")}>{isEarn ? "+" : "-"}{Math.abs(amount).toLocaleString("en-IN")}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-caption font-bold text-[#8FA3B8]">
                  {item.balanceAfter !== undefined ? <span className="rounded-full bg-white/[0.04] px-2.5 py-1">Balance {Number(item.balanceAfter).toLocaleString("en-IN")}</span> : null}
                  {item.createdAt ? <span className="rounded-full bg-white/[0.04] px-2.5 py-1">{formatDate(item.createdAt)}</span> : null}
                </div>
              </div>
            </div>
          </AppCard>
        );
      })}
    </div>
  );
}

function readData(result: unknown) {
  const data = result as { data?: unknown };
  return (data?.data ?? result) as Record<string, unknown>;
}

function readList(result: unknown, key: string): ListItem[] {
  const data = readData(result);
  const list = data?.[key] ?? data?.items ?? data?.rows ?? data;
  return Array.isArray(list) ? list : [];
}

function readMessage(result: unknown, fallback: string) {
  const data = result as { data?: { message?: unknown }; error?: unknown; message?: unknown };
  const message = data.message ?? data.error ?? data.data?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

function readRedemptionPublicId(result: unknown) {
  const data = (result as { data?: unknown })?.data ?? result;
  const redemption = data as { publicId?: unknown; redemption?: { publicId?: unknown } };
  const publicId = redemption.redemption?.publicId ?? redemption.publicId;

  return typeof publicId === "string" && publicId.trim() ? publicId : "";
}

function readRedemptionData(result: unknown) {
  const data = (result as { data?: unknown })?.data ?? result;
  const value = data as { redemption?: unknown };

  return (value.redemption && typeof value.redemption === "object" ? value.redemption : data) as Record<string, unknown>;
}

function saveSubscriptionRedemptionsByPlan(redemptions: Record<string, { publicId: string; targetPublicId: string }>) {
  localStorage.setItem(selectedSubscriptionRedemptionByPlanKey, JSON.stringify(redemptions));
}

function readDeviceId() {
  const key = "scorecare_device_id";
  const existing = localStorage.getItem(key);

  if (existing) return existing;

  const next = createClientId();
  localStorage.setItem(key, next);
  return next;
}

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatItem(item: ListItem) {
  return Object.entries(item)
    .filter(([key, value]) => value !== null && value !== undefined && typeof value !== "object" && !key.toLowerCase().includes("id"))
    .slice(0, 4)
    .map(([key, value]) => `${formatLabel(key)}: ${String(value)}`)
    .join(" · ");
}

function formatLabel(value: unknown) {
  if (!value) return "";

  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: unknown) {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
