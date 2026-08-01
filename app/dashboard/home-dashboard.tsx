"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import type { ComponentType } from "react";
import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dashboardBg from "@/assets/dashboard-bg.jpg";

import {
  ArrowUpRight,
  ArrowLeft,
  Bell,
  Bot,
  ChartNoAxesCombined,
  CircleHelp,
  CreditCard,
  Crown,
  FileText,
  Fingerprint,
  Headphones,
  KeyRound,
  Lightbulb,
  LockKeyhole,
  Languages,
  ReceiptText,
  LogOut,
  Trash2,
  ShieldAlert,
  Share2,
  Target,
  TrendingUp,
  Wrench,
  X,
  LucideIcon,

  // FAQ Screen Icons
  Search,
  ChevronDown,
  ChevronLeft,
  Phone,
  Mail,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  House,
  BadgeIndianRupee,
  Sparkles,
  Star,
  Receipt
} from "lucide-react";

import { DashboardBottomNav } from "@/components/dashboard/bottom-nav";
import { DeleteAccountFlow } from "@/components/dashboard/delete-account-flow";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { DashboardHeaderHomeControl, PortalShell } from "@/components/dashboard/portal-ui";
import { SupportDrawer } from "@/components/dashboard/topbar-actions";
import { PremiumBenefitsIntro, ProBenefitsComparisonSheet, SubscribePromptOverlay, formatBillingCycle, formatPlanAmount, getSubscriptionPlans, type SubscriptionPlan } from "@/components/dashboard/subscribe-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { CibilDisplayDataError, clearCachedCibilDisplayData, getCachedCibilDisplayData, getCachedCibilScoreCheckData, getStoredLatestCibilScoreCheckData } from "@/lib/cibil-display-cache";
import { apiRequest, apiUrl } from "@/lib/api";
import { canUseBiometricAppLock, disableAppLock, disableBiometricAppLock, enableBiometricAppLock, readAppLockSettings, saveAppLockPin } from "@/lib/app-lock";
import { clearScorecareSession, isTokenExpired, logoutScorecareSession } from "@/lib/auth-session";
import { replaceAfterPaymentSuccess } from "@/lib/payment-navigation";
import { logCrashlyticsMessage, setSafeUserId, trackEvent } from "@/src/lib/analytics";
import { initializePushNotifications, type PushNotificationInitState } from "@/src/lib/pushNotifications";
import { cn } from "@/lib/utils";

type DashboardData = {
  score: number | null;
  rating: string;
  grade: string;
  monthlyChange: number | string;
  sixMonthChange: number | string;
  targetScore: number | string;
  targetMonth: string;
  activeDisputes: number | string;
  scoreGain: number | string;
  emiDue: string;
  dueMonth: string;
  improvement: number | string;
  offers: number | string;
  hasReportData?: boolean;
  trend: number[];
  trendMonths: string[];
  hasScoreHistory: boolean;
  factors: Array<{ name: string; value: number; meta: string; tone: "good" | "warn" | "alert" }>;
  coach: string;
  coachGain: number;
  coachTime: string;
};

export type UserProfile = {
  accessType?: string | null;
  mobileNumber?: string;
  panNumber?: string;
  planStatus?: string | null;
  status?: string | null;
  subscription?: {
    accessType?: string | null;
    planStatus?: string | null;
    status?: string | null;
    subscriptionStatus?: string | null;
  } | null;
  subscriptionStatus?: string | null;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  publicId?: string | null;
  public_id?: string | null;
  selectedLanguage?: string | null;
  cibilScore?: string | number | null;
};

type NotificationItem = {
  createdAt?: string | null;
  id: string | number;
  isRead?: boolean | null;
  message?: string | null;
  readAt?: string | null;
  title?: string | null;
};

type CreditReportDownloadItem = {
  createdAt?: string | null;
  creditReportId?: string | number | null;
  creditScore?: string | number | null;
  downloadedAt?: string | null;
  id: string | number;
  provider?: string | null;
  reportFetchedAt?: string | null;
  reportType?: string | null;
};

type CibilRepairStatus = {
  activeDisputes?: number;
};

type FaqCategory = {
  id: string;
  Icon: LucideIcon;
  label: string;
  color: string;
  questions: Array<{ q: string; a: string }>;
};

type GeneralSettings = {
  website: string;
  email: string;
  mobileNumber: string;
  whatsappNumber: string;
};

type HomepageImageTheme = {
  imageName?: string | null;
  fileName?: string | null;
  isActive?: boolean | null;
};

const appTiles = [
  { href: "/dashboard/dispute-centre", Icon: Wrench, title: "Dispute Centre", value: "0", meta: "active", alert: true },
  { href: "/dashboard/loans", Icon: BadgeIndianRupee, title: "Pay EMIs", value: "-", meta: "-" },
  { href: "/dashboard/score-fix?tab=credit-improvement-plan", Icon: ChartNoAxesCombined, title: "Improve Score", value: "-", meta: "-" },
  { href: "/dashboard/offers", Icon: CreditCard, title: "Get Offers", value: "0", meta: "pre-approved", offer: true },
];
const freeTierAppTiles = [
  { href: "/dashboard/credit-score", Icon: CreditCard, title: "Credit Score", value: "-", meta: "-" },
  { href: "/dashboard/loans", Icon: BadgeIndianRupee, title: "Pay EMIs", value: "-", meta: "-" },
  { href: "/dashboard/score-fix?tab=credit-improvement-plan", Icon: ChartNoAxesCombined, title: "Improve Score", value: "-", meta: "-" },
  { href: "/dashboard/offers", Icon: CreditCard, title: "Get Offers", value: "-", meta: "-", offer: true },
];
const notificationsPageSize = 10;
const scorecarePlayStoreUrl = "https://play.google.com/apps/internaltest/4701307504694712853";
const actionPlanAiCache = new Map<string, Promise<string>>();
let googleTranslateRetryTimers: number[] = [];
let googleTranslatePendingLanguage = "";
const languageOptions = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
];
const faqCategoryStyles = [
  { Icon: House, color: "#6C63FF" },
  { Icon: BadgeIndianRupee, color: "#FF9D28" },
  { Icon: HelpCircle, color: "#07844E" },
];
const FAQ_DATA: FaqCategory[] = [
  {
    id: "general",
    Icon: House,
    label: "General",
    color: "#6C63FF",
    questions: [
      {
        q: "What is Scorecare?",
        a: "Scorecare is India's most complete credit health app...",
      },
      {
        q: "Is Scorecare free to use?",
        a: "Yes — the Starter plan is free forever...",
      },
    ],
  },
  {
    id: "scores",
    Icon: BadgeIndianRupee,
    label: "Credit Score",
    color: "#FF9D28",
    questions: [
      {
        q: "What is a credit score?",
        a: "A credit score is a 3-digit number between 300 and 900...",
      },
    ],
  },
];

export function HomeDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLanguageLoading, setIsLanguageLoading] = useState(false);
  const [name, setName] = useState("there");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData>(createEmptyDashboard());
  const [error, setError] = useState("");
  const [isFreeTier, setIsFreeTier] = useState(false);
  const [showBenefitsPrompt, setShowBenefitsPrompt] = useState(false);
  const [benefitsPaymentLoading, setBenefitsPaymentLoading] = useState(false);
  const [benefitsPaymentTrigger, setBenefitsPaymentTrigger] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [pushNotificationState, setPushNotificationState] = useState<PushNotificationInitState>({
    error: null,
    fcmToken: null,
    isLoading: false,
    isNativeAndroid: false,
    permission: null,
  });
  const [homepageBackgroundImages, setHomepageBackgroundImages] = useState<string[]>([dashboardBg.src]);
  const [homepageBackgroundIndex, setHomepageBackgroundIndex] = useState(0);
  const isDashboardLoadingRef = useRef(false);
  const subscriptionSuccessReloadedRef = useRef(false);

  const loadDashboard = useCallback(async (showLoading = true) => {
    if (isDashboardLoadingRef.current) {
      return null;
    }

    isDashboardLoadingRef.current = true;

    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      isDashboardLoadingRef.current = false;
      clearScorecareSession();
      window.location.replace("/login");
      return null;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }

      setIsLanguageLoading(readStoredLanguage() !== "en");
      setError("");

      const [profile, subscriptionStatus] = await Promise.all([
        loadProfile(token),
        loadSubscriptionStatus(token).catch(() => null),
      ]);
      const profileWithSubscription = applySubscriptionStatus(profile, subscriptionStatus);
      const shouldWaitForLanguage = applyProfileLanguage(profileWithSubscription);
      setIsLanguageLoading(shouldWaitForLanguage);
      const freeTier = isFreeTierProfile(profileWithSubscription);
      const displayData = freeTier ? await loadBasicCibilScoreData(token, profileWithSubscription) : await loadCibilData(token, profileWithSubscription);
      const activeDisputes = freeTier ? 0 : await loadActiveDisputes(token);
      const notifications = await loadNotifications(token);

      setName(profileWithSubscription?.fullName?.trim() || readDisplayName(displayData) || "there");
      setProfile(profileWithSubscription);
      void setSafeUserId(profileWithSubscription?.publicId ?? profileWithSubscription?.public_id ?? null);
      setIsFreeTier(freeTier);
      setNotificationUnreadCount(notifications.unreadCount);
      setDashboard(freeTier ? buildFreeTierDashboard(displayData) : buildDashboardData(displayData, profileWithSubscription, activeDisputes));
      void trackEvent("dashboard_viewed", {
        page_name: "dashboard",
        report_available: Boolean(displayData),
        subscription_status: freeTier ? "free" : "paid",
      });
      void logCrashlyticsMessage("Dashboard loaded");
      if (shouldWaitForLanguage) {
        await waitForLanguageApply();
      }
      setIsLanguageLoading(false);
      return { freeTier };
    } catch (loadError) {
      if (loadError instanceof CibilDisplayDataError && (loadError.status === 401 || loadError.status === 403)) {
        clearScorecareSession();
        window.location.replace("/login");
        return null;
      }

      setName(localStorage.getItem("scorecare_full_name")?.trim() || "there");
      setDashboard(createEmptyDashboard());
      setError("Score data is unavailable right now.");
      setIsLanguageLoading(false);
      return null;
    } finally {
      isDashboardLoadingRef.current = false;
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let removeBackButtonListener: (() => void) | undefined;

    void App.addListener("backButton", () => {
      if (window.location.pathname === "/dashboard") {
        void App.exitApp();
        return;
      }

      window.history.back();
    }).then((listener) => {
      removeBackButtonListener = () => listener.remove();
    });

    return () => removeBackButtonListener?.();
  }, []);

  useEffect(() => {
    if (!window.location.search.includes("subscription=success")) {
      return;
    }

    clearSubscriptionDashboardCache();
    const timer = window.setTimeout(() => void loadDashboard(true).then((result) => {
      if (result?.freeTier && !subscriptionSuccessReloadedRef.current && !hasReloadedSubscriptionSuccess()) {
        subscriptionSuccessReloadedRef.current = true;
        markSubscriptionSuccessReloaded();
        window.location.reload();
      }
    }), 700);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useEffect(() => {
    function refreshDashboard() {
      void loadDashboard(false);
    }

    window.addEventListener("scorecare:app-refresh", refreshDashboard);

    return () => window.removeEventListener("scorecare:app-refresh", refreshDashboard);
  }, [loadDashboard]);

  useEffect(() => {
    function refreshAfterSubscriptionSuccess() {
      clearSubscriptionDashboardCache();
      void loadDashboard(true).then((result) => {
        if (result?.freeTier && !subscriptionSuccessReloadedRef.current && !hasReloadedSubscriptionSuccess()) {
          subscriptionSuccessReloadedRef.current = true;
          markSubscriptionSuccessReloaded();
          routerReplaceDashboardSuccess();
        }
      });
    }

    window.addEventListener("scorecare:subscription-activated", refreshAfterSubscriptionSuccess);

    return () => window.removeEventListener("scorecare:subscription-activated", refreshAfterSubscriptionSuccess);
  }, [loadDashboard]);

  useEffect(() => {
    let isMounted = true;

    async function loadHomepageImageTheme() {
      try {
        const response = await apiRequest("/general/homepage-image-themes");

        if (!response.ok) {
          return;
        }

        const imageUrls = readHomepageImageThemeUrls(await response.json());

        if (isMounted && imageUrls.length) {
          setHomepageBackgroundImages(imageUrls);
          setHomepageBackgroundIndex(0);
        }
      } catch {
        if (isMounted) {
          setHomepageBackgroundImages([dashboardBg.src]);
          setHomepageBackgroundIndex(0);
        }
      }
    }

    void loadHomepageImageTheme();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    homepageBackgroundImages.forEach((imageUrl) => {
      const image = new Image();
      image.src = imageUrl;
    });

    if (homepageBackgroundImages.length < 2) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setHomepageBackgroundIndex((currentIndex) => (currentIndex + 1) % homepageBackgroundImages.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [homepageBackgroundImages]);

  useEffect(() => {
    let isMounted = true;

    async function handleDisplayUpdate(event: Event) {
      if (isDashboardLoadingRef.current) {
        return;
      }

      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        return;
      }

      const displayData = (event as CustomEvent<unknown>).detail;
      const [latestProfile, subscriptionStatus] = await Promise.all([
        profile ? Promise.resolve(profile) : loadProfile(token).catch(() => profile),
        loadSubscriptionStatus(token).catch(() => null),
      ]);
      const profileWithSubscription = applySubscriptionStatus(latestProfile, subscriptionStatus);
      const freeTier = isFreeTierProfile(profileWithSubscription);
      const activeDisputes = freeTier ? 0 : await loadActiveDisputes(token);

      if (!isMounted) {
        return;
      }

      setName(profileWithSubscription?.fullName?.trim() || readDisplayName(displayData) || "there");
      setProfile(profileWithSubscription);
      setIsFreeTier(freeTier);
      setDashboard(freeTier ? buildFreeTierDashboard(displayData) : buildDashboardData(displayData, profileWithSubscription, activeDisputes));
      setError("");
    }

    window.addEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("scorecare:cibil-display-updated", handleDisplayUpdate);
    };
  }, [profile]);

  useEffect(() => {
    let cleanup: { remove: () => Promise<void> } | null = null;
    let isMounted = true;
    let shouldRemoveAfterInit = false;
    const token = localStorage.getItem("scorecare_token");

    if (!profile || !token || isTokenExpired(token)) {
      return;
    }

    // Push notifications are initialized only after authenticated dashboard data is available.
    void initializePushNotifications(token, {
      onStateChange: (state) => {
        if (isMounted) {
          setPushNotificationState(state);
        }
      },
    }).then((removeListeners) => {
      cleanup = removeListeners;
      if (shouldRemoveAfterInit) {
        void cleanup?.remove();
      }
    });

    return () => {
      isMounted = false;
      shouldRemoveAfterInit = true;
      void cleanup?.remove();
    };
  }, [profile]);

  useEffect(() => {
    if (pushNotificationState.isNativeAndroid) {
      console.debug("[ScoreCare Push] State changed", pushNotificationState);
    }
  }, [pushNotificationState]);

  useEffect(() => {
    function handleNativeBackRoot() {
      setShowBenefitsPrompt(true);
    }

    window.addEventListener("scorecare:native-back-root", handleNativeBackRoot);

    return () => window.removeEventListener("scorecare:native-back-root", handleNativeBackRoot);
  }, []);

  useEffect(() => {
    async function refreshNotifications() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) return;

      try {
        const result = await loadNotifications(token);
        setNotificationUnreadCount(result.unreadCount);
      } catch {
        setNotificationUnreadCount(0);
      }
    }

    window.addEventListener("scorecare:notifications-updated", refreshNotifications);

    return () => window.removeEventListener("scorecare:notifications-updated", refreshNotifications);
  }, []);

  const visibleDashboard = dashboard;
  const score = visibleDashboard.score;
  const { arcPercent, displayScore, meterRef } = useAnimatedCreditScoreMeter(score);
  const hasJourneyMonths = visibleDashboard.trend.length > 0 && visibleDashboard.trendMonths.length > 0;
  const currentScore = hasJourneyMonths ? visibleDashboard.trend[visibleDashboard.trend.length - 1] : score;
  const firstScore = visibleDashboard.hasScoreHistory && visibleDashboard.trend.length ? visibleDashboard.trend[0] : currentScore;
  const growth = typeof currentScore === "number" && typeof firstScore === "number" ? currentScore - firstScore : 0;
  const lowScore = hasJourneyMonths ? Math.min(...visibleDashboard.trend) : "-";
  const lowIndex = visibleDashboard.trend.indexOf(Number(lowScore));
  const currentTrendMonth = visibleDashboard.trendMonths[visibleDashboard.trendMonths.length - 1] ?? "--";
  const targetScore = visibleDashboard.targetScore;
  const journeyChart = useMemo(() => {
    if (!hasJourneyMonths) {
      return { areaPath: "", linePath: "", points: [], yLabels: [] };
    }

    const values = visibleDashboard.trend;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const padding = Math.max(8, Math.ceil((maxValue - minValue) * 0.2));
    const floor = Math.max(300, Math.floor(minValue - padding));
    const ceiling = Math.min(900, Math.ceil(maxValue + padding));
    const range = Math.max(1, ceiling - floor);
    const points = values.map((value, index) => ({
      x: 18 + (index / Math.max(1, values.length - 1)) * 264,
      y: 120 - ((value - floor) / range) * 96,
    }));
    const linePath = points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;

      const previous = points[index - 1];
      const controlX = (previous.x + point.x) / 2;
      return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    }, "");
    const areaPath = `${linePath} L ${points[points.length - 1].x} 136 L ${points[0].x} 136 Z`;
    const yLabels = Array.from({ length: 5 }, (_, index) => ({
      label: Math.round(ceiling - ((ceiling - floor) / 4) * index),
      y: 24 + index * 24,
    }));

    return { areaPath, linePath, points, yLabels };
  }, [hasJourneyMonths, visibleDashboard.trend]);
  const premiumClickProps = isFreeTier ? {
    onClick: () => setShowBenefitsPrompt(true),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setShowBenefitsPrompt(true);
      }
    },
    role: "button",
    tabIndex: 0,
  } : {};
  const reportUnavailable = Boolean(error) || !visibleDashboard.hasReportData;
  const dashboardTiles = isFreeTier ? freeTierAppTiles : buildAppTiles(visibleDashboard, reportUnavailable);

  return (
    <PortalShell active="home">
    <div className="page min-h-screen overflow-x-hidden bg-[#050912] pb-32 text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <div id="google_translate_element" className="hidden" />
      <section
        className="hero-header fixed inset-x-0 top-0 z-0 min-h-[340px] overflow-hidden px-5 pb-16 pt-6 shadow-[0_26px_58px_rgba(94,99,235,0.34)] sm:min-h-[430px] sm:px-8 sm:pb-28 sm:pt-7"
      >
        {homepageBackgroundImages.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${index === homepageBackgroundIndex ? "opacity-100" : "opacity-0"}`}
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(104,111,242,0.86),rgba(178,167,255,0.62)_48%,rgba(116,112,255,0.78))]" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <DashboardHeaderHomeControl className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl sm:size-16" iconClassName="size-5 sm:size-6" onMenuClick={() => setShowProfile(true)} />
            <div className="flex items-center gap-3">
              {isFreeTier ? (
                <button
                  aria-label="Premium benefits"
                  className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl sm:size-16"
                  type="button"
                  onClick={() => setShowBenefitsPrompt(true)}
                >
                  <Crown className="size-6 fill-[#FFD34D]/20" strokeWidth={1.8} />
                </button>
              ) : null}
              <button
                aria-label="Open support chat"
                className="grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#22F2C2] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl sm:size-16"
                type="button"
                onClick={() => setShowHelp(true)}
              >
                <Headphones className="size-6" strokeWidth={1.8} />
              </button>
              <Link
                aria-label="Open notifications"
                className="relative grid size-14 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FFD34D] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_14px_30px_rgba(20,26,86,0.2)] backdrop-blur-xl sm:size-16"
                href="/notifications"
              >
                <Bell className="size-6" strokeWidth={1.8} />
                {notificationUnreadCount > 0 ? (
                  <span className="absolute right-1.5 top-1.5 grid min-w-5 place-items-center rounded-full bg-[#FF3B30] px-1.5 text-caption font-bold leading-5 text-white shadow-[0_6px_12px_rgba(255,59,48,0.28)]">
                    <AnimatedNumber value={notificationUnreadCount > 99 ? "99+" : notificationUnreadCount} />
                  </span>
                ) : null}
              </Link>
            </div>
          </div>

          <div className="mt-10 max-w-sm sm:mt-16">
            <div className="min-w-0">
              <h1 className="max-w-[19rem] text-[28px] font-black leading-tight text-white drop-shadow-[0_10px_24px_rgba(11,37,69,0.26)] sm:text-[34px]">Take control of your credit</h1>

                <p className="mt-4 inline-flex items-center rounded-full bg-[#112C8F] px-4 py-2 text-white shadow-[0_12px_26px_rgba(17,44,143,0.22)] sm:mt-5">
                  <span className="text-base font-medium sm:text-lg">
                    Hi,
                  </span>
                  <span className="ml-1 text-lg font-semibold sm:text-xl">
                    {name}
                  </span>
                </p>
            </div>
          </div>
        </div>
      </section>

      <main className="dashboard-shell relative z-10 mx-auto mt-[280px] max-w-5xl rounded-t-[30px] bg-[#050912] px-4 pb-8 pt-5 sm:mt-[350px] sm:px-6 sm:pt-7 lg:px-8">
        {isLoading ? (
          <DashboardHomeSkeleton />
        ) : score ? (
          <>

            <section
              ref={meterRef}
              {...premiumClickProps}
              className={cn(
                "mt-3 overflow-hidden rounded-[14px] bg-[radial-gradient(circle_at_10%_100%,rgba(24,72,96,0.20),transparent_32%),radial-gradient(circle_at_86%_0%,rgba(28,61,95,0.24),transparent_34%),linear-gradient(145deg,#071522,#0A1725)] shadow-[0_18px_42px_rgba(0,0,0,0.30)]",
                isFreeTier && "cursor-pointer"
              )}
            >
              <div className="relative h-[235px] sm:h-[255px]">
                <div className="absolute left-1/2 top-2 grid size-[178px] -translate-x-1/2 place-items-center sm:size-[198px]">
                  <svg
                    className="absolute inset-0 size-full"
                    viewBox="0 0 220 220"
                    aria-hidden="true"
                  >
                    <defs>
                      <filter id="scoreArcGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    <circle
                      cx="110"
                      cy="110"
                      r="86"
                      fill="none"
                      stroke="#203A62"
                      strokeLinecap="round"
                      strokeWidth="14"
                      pathLength="100"
                      strokeDasharray="75 25"
                      transform="rotate(135 110 110)"
                    />

                    <circle
                      cx="110"
                      cy="110"
                      r="86"
                      fill="none"
                      stroke={score >= 700 ? "#08DB69" : "#FF3B30"}
                      strokeLinecap="round"
                      strokeWidth="14"
                      pathLength="100"
                      strokeDasharray={`${arcPercent * 0.75} 100`}
                      transform="rotate(135 110 110)"
                      filter="url(#scoreArcGlow)"
                    />
                  </svg>

                  <div className="absolute inset-[42px] rounded-full bg-[#091829] shadow-[inset_0_12px_28px_rgba(0,0,0,0.34)]" />

                  <div className="relative -mt-5 text-center">
                    <p className="text-[34px] font-black leading-none tracking-[-0.04em] text-white sm:text-[40px]">
                      {displayScore}
                    </p>

                    <p className="mt-1 text-caption font-black tracking-[0.18em] text-[#08DB69] sm:text-caption">
                      {visibleDashboard.rating}
                    </p>

                    <p className="mt-1 text-caption font-normal text-[#AAB6C8] sm:text-caption">
                      out of 900
                    </p>

                    <p className="mt-1.5 text-caption font-black text-[#08DB69] sm:text-caption">
                      Grade {visibleDashboard.grade}+
                    </p>
                  </div>

                <span className="absolute left-[1%] top-[80%] -translate-y-1/2 text-caption font-medium text-[#DCE6F2]">
  300
</span>

<span className="absolute right-[1%] top-[80%] -translate-y-1/2 text-caption font-medium text-[#DCE6F2]">
  900
</span>
                </div>

                <div className="absolute bottom-3 left-0 right-0 mx-3 grid h-[60px] grid-cols-3 overflow-hidden rounded-[13px] bg-[#172638] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <SummaryTile
                    label="This month"
                    value={formatSignedValue(visibleDashboard.monthlyChange)}
                    onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined}
                  />

                  <SummaryTile
                    label="6 months"
                    value={formatSignedValue(visibleDashboard.sixMonthChange)}
                    onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined}
                  />

                  <SummaryTile
                    label="Target"
                    value={String(visibleDashboard.targetScore)}
                    target
                    onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined}
                  />
                </div>
              </div>
            </section>


            <section className="mt-5 grid grid-cols-2 gap-4">
              {dashboardTiles.map((tile) => (
                <QuickCard key={tile.title} {...tile} disabled={!isFreeTier && reportUnavailable} locked={isFreeTier} onLockedClick={() => setShowBenefitsPrompt(true)} />
              ))}
              {/* <button className="min-h-[122px] rounded-[20px] border border-white/10 bg-white/[0.07] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl" type="button" onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : () => setShowActionPlan(true)}>
                <QuickCardContent Icon={Bot} meta="AI Agents" title="Your" value="Score Coach" />
              </button> */}
            </section>

            <section {...premiumClickProps} className={cn("mt-5 overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#101B2B,#111827)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg  font-bold tracking-normal">Credit Score History</h2>
                <span className="rounded-full bg-[#22F2C2]/12 px-3 py-1 text-caption font-medium text-[#22F2C2]">{formatSignedValue(growth)} growth</span>
              </div>
              {hasJourneyMonths ? (
                <svg className="mt-5 h-[150px] w-full rounded-2xl bg-[#08111F]" viewBox="0 0 320 150" preserveAspectRatio="none" role="img" aria-label="Credit score history trend">
                  <defs>
                    <linearGradient id="journeyBlueArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#1EA7FF" stopOpacity="0.82" />
                      <stop offset="58%" stopColor="#1EA7FF" stopOpacity="0.36" />
                      <stop offset="100%" stopColor="#1EA7FF" stopOpacity="0" />
                    </linearGradient>
                    <filter id="journeyGlow">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  {journeyChart.yLabels.map(({ label, y }) => (
                    <g key={label}>
                      <line x1="14" x2="282" y1={y} y2={y} stroke="#FFFFFF" strokeOpacity="0.14" strokeWidth="1" />
                      <text x="290" y={y + 3} fill="#AAB6C8" fontSize="9" fontWeight="600">{label}</text>
                    </g>
                  ))}
                  <path d={journeyChart.areaPath} fill="url(#journeyBlueArea)" />
                  <path d={journeyChart.linePath} fill="none" stroke="#1EA7FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" filter="url(#journeyGlow)" />
                  {journeyChart.points.map((point, index) => (
                    <circle key={`${visibleDashboard.trendMonths[index]}-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#22F2C2" filter="url(#journeyGlow)" />
                  ))}
                  {visibleDashboard.trendMonths.map((month, index) => (
                    <text key={`${month}-${index}`} x={18 + (index / Math.max(1, visibleDashboard.trendMonths.length - 1)) * 264} y="144" fill="#AAB6C8" fontSize="9" fontWeight="600" textAnchor="middle">{formatJourneyAxisMonth(month)}</text>
                  ))}
                </svg>
              ) : (
                <div className="mt-5 flex h-[150px] items-center justify-center rounded-2xl border border-white/10 bg-[#08111F] px-6 text-center text-caption font-medium leading-5 text-[#AAB6C8]">
                  Score history will appear after your next report update.
                </div>
              )}
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                {hasJourneyMonths ? (
                  <>
                    <JourneyStat label="Lowest" value={`${lowScore} ${visibleDashboard.trendMonths[lowIndex] ?? "--"}`} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                    <JourneyStat label="Current" value={`${currentScore ?? "-"} ${currentTrendMonth}`} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                    <JourneyStat label="Target" value={`${targetScore} ${visibleDashboard.targetMonth}`} gold onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                  </>
                ) : (
                  <>
                    <JourneyStat label="Lowest" value={String(score ?? "-")} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                    <JourneyStat label="Highest" value={String(score ?? "-")} onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                    <JourneyStat label="Target" value={`${targetScore} ${visibleDashboard.targetMonth}`} gold onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : undefined} />
                  </>
                )}
              </div>
            </section>

            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <h2 className="text-title font-bold tracking-normal">Score Factors</h2>
              <div className="mt-6 space-y-5">
                {visibleDashboard.factors.map((factor) => (
                  <div key={factor.name}>
                    <div className="flex items-center justify-between gap-3 text-caption">
                      <p className="font-normal text-body text-white">{factor.name}</p>
                      <p className={cn("font-normal", factor.tone === "good" && "text-[#16a34a]", factor.tone === "warn" && "text-[#FFD34D]", factor.tone === "alert" && "text-[#FF3B30]")}>{factor.meta}</p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn("h-full rounded-full", factor.tone === "good" && "bg-[#16A34A]", factor.tone === "warn" && "bg-[#FFD34D]", factor.tone === "alert" && "bg-[#FF3B30]")}
                        style={{ width: `${factor.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section {...premiumClickProps} className={cn("mt-5 rounded-[28px] bg-[radial-gradient(circle_at_100%_0%,rgba(35,143,128,0.1),transparent_34%),linear-gradient(135deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]", isFreeTier && "cursor-pointer")}>
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#16415A] text-white">
                  <Lightbulb className="size-7" />
                </span>
                <div className="min-w-0">
                  <p className="text-body font-bold text-[#22D3EE]">AI Credit Coach</p>
                  <h2 className="mt-2 text-body-sm font-normal leading-5 tracking-normal">{visibleDashboard.coach}</h2>
                  <div className="mt-4 flex flex-wrap gap-2 text-caption font-medium">
                    <span className="rounded-full bg-[#1F756B]/18 px-3 py-1 text-[#22D3EE]">+{visibleDashboard.coachGain} points</span>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-[#22D3EE]">{visibleDashboard.coachTime}</span>
                  </div>
                </div>
              </div>
              <button className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#08DB69] text-caption font-medium text-white shadow-[0_12px_24px_rgba(31,117,107,0.18)]" type="button" onClick={isFreeTier ? () => setShowBenefitsPrompt(true) : () => setShowActionPlan(true)}>
                View Action Plan <ArrowUpRight className="size-5" />
              </button>
            </section>
          </>
        ) : (
          <div className="mt-5 rounded-[26px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-7 text-center text-body-sm font-medium text-[#AAB6C8]">{error || visibleDashboard.coach}</div>
        )}
      </main>

      <DashboardBottomNav />

      {isLanguageLoading ? <LanguageApplyLoader /> : null}
      {showProfile ? <ProfilePanel profile={profile} name={name} onClose={() => setShowProfile(false)} onHelp={() => setShowHelp(true)} onLanguageLoadingChange={setIsLanguageLoading} onProfileUpdate={setProfile} /> : null}
      {showHelp ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[rgba(7,11,18,0.66)] px-5 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <HelpSupportModal
            onClose={() => setShowHelp(false)}
            onLiveChat={() => {
              setShowHelp(false);
              setShowAiChat(true);
            }}
          />
        </div>
      ) : null}
      {showAiChat ? (
        <div className="portal-theme fixed inset-0 z-[90] bg-[rgba(23,32,51,0.42)] backdrop-blur-sm" onClick={() => setShowAiChat(false)}>
          <aside
            className="ml-auto flex h-[calc(100dvh-var(--native-status-offset,0px))] w-full max-w-md flex-col border-l border-white/[0.08] bg-[#050912] shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
            onClick={(event) => event.stopPropagation()}
          >
            <SupportDrawer onClose={() => setShowAiChat(false)} />
          </aside>
        </div>
      ) : null}
      {showBenefitsPrompt ? (
        <BenefitsPrompt
          loading={benefitsPaymentLoading}
          onClose={() => setShowBenefitsPrompt(false)}
          onSubscribe={() => setBenefitsPaymentTrigger((value) => value + 1)}
        />
      ) : null}
      {showActionPlan ? <ActionPlanPopup dashboard={visibleDashboard} profile={profile} onClose={() => setShowActionPlan(false)} /> : null}
      <SubscribePromptOverlay
        show={false}
        onClose={() => undefined}
        onPaymentFlowStart={() => setShowBenefitsPrompt(false)}
        onPaymentLoadingChange={setBenefitsPaymentLoading}
        paymentTrigger={benefitsPaymentTrigger}
      />
    </div>
    </PortalShell>
  );
}


function HelpSupportModal({ onClose, onLiveChat }: { onClose: () => void; onLiveChat: () => void }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [faqData, setFaqData] = useState<FaqCategory[]>([]);
  const [general, setGeneral] = useState<GeneralSettings | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [isFaqLoading, setIsFaqLoading] = useState(true);
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: "", visible: false });

  useEffect(() => {
    let isMounted = true;

    async function loadFaqs() {
      try {
        const response = await apiRequest("/faqs");

        if (!response.ok) {
          return;
        }

        const apiFaqs = readFaqCategories(await response.json());

        if (isMounted) {
          setFaqData(apiFaqs);
        }
      } catch {
        if (isMounted) {
          setFaqData([]);
        }
      } finally {
        if (isMounted) {
          setIsFaqLoading(false);
        }
      }
    }

    void loadFaqs();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGeneral() {
      try {
        const response = await apiRequest("/general");

        if (!response.ok) {
          return;
        }

        const apiGeneral = readGeneralSettings(await response.json());

        if (isMounted) {
          setGeneral(apiGeneral);
        }
      } catch {
        if (isMounted) {
          setGeneral(null);
        }
      }
    }

    void loadGeneral();

    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  };

  const openLiveChat = () => {
    onClose();
    onLiveChat();
  };

  async function submitHelpFeedback(isLiked: boolean) {
    if (feedbackLoading) return;

    setFeedbackLoading(true);

    try {
      await submitFeedback({
        rating: isLiked ? 5 : 1,
        message: isLiked ? "Help page was helpful" : "Help page was not helpful",
        isLiked,
        isDisliked: !isLiked,
      });
      window.dispatchEvent(new Event("scorecare:profile-notifications-refresh"));
      window.dispatchEvent(new Event("scorecare:notifications-updated"));
      showToast(isLiked ? "Thanks for the feedback!" : "We'll improve this page!");
    } catch {
      showToast("Unable to submit feedback.");
    } finally {
      setFeedbackLoading(false);
    }
  }

  const searchLower = search.toLowerCase();

  const filteredData = faqData.map((cat) => ({
    ...cat,
    questions: cat.questions.filter(
      (item) =>
        (!searchLower ||
          item.q.toLowerCase().includes(searchLower) ||
          item.a.toLowerCase().includes(searchLower)) &&
        (activeCategory === "all" || activeCategory === cat.id)
    ),
  })).filter((cat) => cat.questions.length > 0);

  const totalResults = filteredData.reduce((s, c) => s + c.questions.length, 0);
  const totalQ = faqData.reduce((s, c) => s + c.questions.length, 0);
  const supportEmail = general?.email.trim() || "";
  const supportMobile = general?.mobileNumber.trim() || "";
  const whatsappNumber = general?.whatsappNumber.trim() || "";
  const website = general?.website.trim() || "";

  const toggle = (key: string) => setOpenItem(openItem === key ? null : key);

  return (
    <section
      className="fixed inset-0 z-[80] overflow-y-auto bg-[#070B12] px-4 pb-28 pt-[calc(var(--native-status-offset,0px)+1.75rem)] text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mx-auto max-w-md pb-10">
        <div
          className={cn(
            "fixed left-1/2 top-[calc(env(safe-area-inset-top,0px)+1.25rem)] z-[9999] -translate-x-1/2 rounded-full bg-[#5EF2C2] px-5 py-2.5 text-caption font-semibold text-[#06221A] shadow-[0_14px_30px_rgba(94,242,194,0.22)] transition-transform",
            toast.visible ? "translate-y-0" : "-translate-y-24"
          )}
        >
          {toast.msg}
        </div>

        <div className="relative overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ebe7d9,#faf7ed_48%,#d9d0bd)] p-5 text-[#111827] shadow-[0_22px_46px_rgba(58,75,140,0.38)]">
          <div className="relative">
            <div className="mb-7 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full bg-black/15 text-white backdrop-blur"
                aria-label="Close help"
              >
                <ChevronLeft className="size-5" strokeWidth={1.8} />
              </button>

              <p className="rounded-full bg-white/40 px-3 py-1 text-caption font-semibold uppercase tracking-wide text-[#6F7B8E]">Support</p>
            </div>

            <div className="grid size-14 place-items-center rounded-2xl bg-[#112C8F] text-white shadow-[0_12px_26px_rgba(17,44,143,0.22)]">
              <HelpCircle className="size-7" strokeWidth={1.8} />
            </div>

            <h2 className="mt-5 text-[26px] font-bold leading-tight text-[#10206B]">
              How can we help?
            </h2>

            <p className="mt-2 text-caption font-medium leading-5 text-[#6F7B8E]">
              {totalQ} answers across {faqData.length} topics
            </p>

            <div className="mt-5 flex items-center gap-2.5 rounded-[18px] border border-white/60 bg-white/50 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <Search className="size-5 text-[#6F7B8E]" strokeWidth={1.8} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search questions"
                className="min-w-0 flex-1 bg-transparent text-body-sm font-medium text-[#111827] outline-none placeholder:text-[#8A94A6]"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="grid size-6 place-items-center rounded-full bg-[#111827]/10 text-[#6F7B8E]"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {[
                ["24/7", "Support", "#112C8F"],
                ["10 sec", "Response", "#FF9D28"],
                ["98%", "Resolved", "#07844E"],
              ].map(([value, label, color]) => (
                <div
                  key={label}
                  className="rounded-[16px] bg-white/45 px-2 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]"
                >
                  <p className="text-base font-bold" style={{ color }}>
                    {value}
                  </p>
                  <p className="mt-0.5 text-caption font-medium leading-snug text-[#6F7B8E]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-5 overflow-x-auto pb-1.5">
            <div className="flex w-max gap-2">
              <CategoryPill
                Icon={Sparkles}
                label="All Topics"
                color="#6C63FF"
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />

              {faqData.map((cat) => (
                <CategoryPill
                  key={cat.id}
                  Icon={cat.Icon}
                  label={cat.label}
                  color={cat.color}
                  active={activeCategory === cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                />
              ))}
            </div>
          </div>

          {search ? (
            <div className="mb-4 rounded-[18px] bg-[#111821] px-4 py-3 text-caption font-medium text-[#AAB6C8]">
              {totalResults > 0 ? (
                <>
                  Found{" "}
                  <strong className="text-[#5EF2C2]">
                    {totalResults} answer{totalResults > 1 ? "s" : ""}
                  </strong>{" "}
                  for &quot;{search}&quot;
                </>
              ) : (
                <>No results for &quot;{search}&quot; - try different words</>
              )}
            </div>
          ) : null}

          {isFaqLoading ? (
            <FaqSkeleton />
          ) : filteredData.length === 0 ? (
            <div className="mb-5 rounded-[26px] bg-[#111821] px-5 py-10 text-center">
              <Search className="mx-auto mb-3 size-9 text-[#6F7B8E]" strokeWidth={1.7} />
              <p className="mb-2 text-base font-semibold text-white">
                No results found
              </p>
              <p className="text-caption leading-6 text-[#AAB6C8]">
                Try different words or browse a category above.
              </p>
            </div>
          ) : null}

          {filteredData.map((cat) => (
            <div key={cat.id} className="mb-7">
              {(activeCategory === "all" || !search) && (
                <div className="mb-3 flex items-center gap-2.5">
                  <div
                    className="grid size-[36px] place-items-center rounded-[14px] border"
                    style={{
                      backgroundColor: `${cat.color}22`,
                      borderColor: `${cat.color}44`,
                      color: cat.color,
                    }}
                  >
                    <cat.Icon className="size-5" strokeWidth={1.8} />
                  </div>

                  <div>
                    <p className="text-body font-semibold text-white">
                      {cat.label}
                    </p>
                    <p className="mt-0.5 text-caption font-medium text-[#AAB6C8]">
                      {cat.questions.length} question
                      {cat.questions.length > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div
                    className="ml-2 h-px flex-1"
                    style={{ backgroundColor: `${cat.color}22` }}
                  />
                </div>
              )}

              {cat.questions.map((item, index) => {
                const key = `${cat.id}-${index}`;

                return (
                  <AccordionItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    color={cat.color}
                    index={index}
                    isOpen={openItem === key}
                    onToggle={() => toggle(key)}
                  />
                );
              })}
            </div>
          ))}

          <div className="mb-4 rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
            <h3 className="text-base font-semibold text-white">
              Still need help?
            </h3>
            <p className="mt-1 text-caption leading-6 text-[#AAB6C8]">
              Contact SCORECARE support for profile, report, subscription, and score queries.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <ContactCard
                Icon={MessageCircle}
                label="Live Chat"
                sub="Reply in 10 sec"
                color="#5EF2C2"
                onClick={openLiveChat}
              />
              <ContactCard
                Icon={Phone}
                label="Call Us"
                sub="Mon-Sat"
                color="#FF9D28"
                onClick={() => {
                  if (supportMobile) {
                    window.location.href = `tel:${supportMobile}`;
                  }
                }}
              />
              <ContactCard
                Icon={Mail}
                label="Email"
                sub="24 hrs"
                color="#6C63FF"
                onClick={() => {
                  if (supportEmail) {
                    window.location.href = `mailto:${supportEmail}?subject=Scorecare Support`;
                  }
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="mb-4 flex w-full items-center gap-3.5 rounded-[22px] bg-[linear-gradient(135deg,#5EF2C2,#22D983)] px-4 py-3.5 text-left text-[#06221A] shadow-[0_12px_24px_rgba(94,242,194,0.2)]"
            onClick={() => {
              if (whatsappNumber) {
                window.open(`https://wa.me/${toDialNumber(whatsappNumber)}`, "_blank");
              }
            }}
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-[16px] bg-white/30">
              <MessageCircle className="size-6" strokeWidth={1.8} />
            </span>

            <span className="flex-1">
              <span className="block text-body-sm font-semibold">
                Chat on WhatsApp
              </span>
              <span className="mt-0.5 block text-caption font-medium opacity-75">
                Get help for disputes, payments and score queries
              </span>
            </span>

            <ArrowUpRight className="size-5" strokeWidth={1.8} />
          </button>

          <div className="rounded-[22px] bg-[#111821] px-4 py-4">
            <p className="mb-3 text-body-sm font-semibold text-white">
              Was this page helpful?
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={feedbackLoading}
                onClick={() => submitHelpFeedback(true)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[#5EF2C2]/12 p-2.5 text-caption font-semibold text-[#5EF2C2]"
              >
                <ThumbsUp className="size-4" strokeWidth={1.8} /> Yes
              </button>

              <button
                type="button"
                disabled={feedbackLoading}
                onClick={() => submitHelpFeedback(false)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-[16px] bg-[#FF3B30]/12 p-2.5 text-caption font-semibold text-[#FF3B30]"
              >
                <ThumbsDown className="size-4" strokeWidth={1.8} /> No
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-caption font-medium text-[#6F7B8E]">
            {website ? "SCORECARE support" : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function CategoryPill({ active, color, Icon, label, onClick }: { active: boolean; color: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={cn("flex items-center gap-2 rounded-full border px-3.5 py-2 text-caption font-semibold transition", active ? "text-white" : "text-[#AAB6C8]")}
      style={{
        backgroundColor: active ? color : "#111821",
        borderColor: active ? `${color}66` : "rgba(255,255,255,0.07)",
      }}
      onClick={onClick}
    >
      <Icon className="size-4" strokeWidth={1.8} />
      {label}
    </button>
  );
}

function FaqSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 bg-white/[0.06]" />
      <Skeleton className="h-12 bg-white/[0.06]" />
      <Skeleton className="h-12 bg-white/[0.06]" />
      <Skeleton className="h-12 bg-white/[0.06]" />
    </div>
  );
}

function AccordionItem({ a, color, index, isOpen, onToggle, q }: { a: string; color: string; index: number; isOpen: boolean; onToggle: () => void; q: string }) {
  return (
    <div className="mb-2.5 overflow-hidden rounded-[20px] bg-[#111821] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-3.5 text-left" onClick={onToggle}>
        <span className="grid size-8 shrink-0 place-items-center rounded-[12px] text-caption font-semibold" style={{ backgroundColor: `${color}22`, color }}>
          {index + 1}
        </span>
        <span className="flex-1 text-body-sm font-medium leading-5 text-white">{q}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-[#AAB6C8] transition-transform", isOpen && "rotate-180")} strokeWidth={1.8} />
      </button>
      {isOpen ? <p className="border-t border-white/[0.06] px-4 py-3 text-caption leading-6 text-[#AAB6C8]">{a}</p> : null}
    </div>
  );
}

function readFaqCategories(result: unknown): FaqCategory[] {
  const value = result as { data?: unknown; faqs?: unknown };
  const data = value?.data as { categories?: unknown; faqs?: unknown; items?: unknown } | unknown[];
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.categories)
      ? data.categories
      : Array.isArray(data?.faqs)
        ? data.faqs
        : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(value?.faqs)
            ? value.faqs
            : [];

  if (source.some((item) => Array.isArray((item as { questions?: unknown })?.questions))) {
    return source.map((category, index) => normalizeFaqCategory(category, index)).filter((category) => category.questions.length);
  }

  return groupFlatFaqs(source);
}

function normalizeFaqCategory(category: unknown, index: number): FaqCategory {
  const item = category as { category?: unknown; categoryLabel?: unknown; id?: unknown; label?: unknown; name?: unknown; questions?: unknown; title?: unknown };
  const style = faqCategoryStyles[index % faqCategoryStyles.length];
  const label = String(item.categoryLabel ?? item.label ?? item.name ?? item.title ?? item.category ?? "General");
  const id = String(item.id ?? label.toLowerCase().replace(/\s+/g, "-"));
  const questions = Array.isArray(item.questions) ? item.questions.map(normalizeFaqItem).filter(isFaqItem) : [];

  return {
    id,
    Icon: style.Icon,
    label,
    color: style.color,
    questions,
  };
}

function groupFlatFaqs(faqs: unknown[]): FaqCategory[] {
  const categories = new Map<string, Array<{ q: string; a: string }>>();

  faqs.forEach((faq) => {
    const item = faq as { answer?: unknown; category?: unknown; categoryLabel?: unknown; question?: unknown; title?: unknown };
    const question = String(item.question ?? item.title ?? "").trim();
    const answer = String(item.answer ?? "").trim();

    if (!question || !answer) {
      return;
    }

    const category = String(item.categoryLabel ?? item.category ?? "General");
    categories.set(category, [...(categories.get(category) ?? []), { q: question, a: answer }]);
  });

  return Array.from(categories.entries()).map(([label, questions], index) => {
    const style = faqCategoryStyles[index % faqCategoryStyles.length];

    return {
      id: label.toLowerCase().replace(/\s+/g, "-"),
      Icon: style.Icon,
      label,
      color: style.color,
      questions,
    };
  });
}

function normalizeFaqItem(faq: unknown) {
  const item = faq as { a?: unknown; answer?: unknown; q?: unknown; question?: unknown; title?: unknown };
  const question = String(item.q ?? item.question ?? item.title ?? "").trim();
  const answer = String(item.a ?? item.answer ?? "").trim();

  return question && answer ? { q: question, a: answer } : null;
}

function isFaqItem(faq: { q: string; a: string } | null): faq is { q: string; a: string } {
  return Boolean(faq);
}

function readGeneralSettings(result: unknown): GeneralSettings {
  const value = result as { data?: Partial<GeneralSettings> };

  return {
    website: String(value.data?.website ?? ""),
    email: String(value.data?.email ?? ""),
    mobileNumber: String(value.data?.mobileNumber ?? ""),
    whatsappNumber: String(value.data?.whatsappNumber ?? ""),
  };
}

function readHomepageImageThemeUrls(result: unknown) {
  const value = result as { data?: unknown; homepageImageThemes?: unknown; themes?: unknown };
  const source = value.data ?? value.homepageImageThemes ?? value.themes ?? result;
  const themes = Array.isArray(source) ? source : [source];
  const activeThemeUrls = themes
    .map((theme) => theme as HomepageImageTheme)
    .filter((theme) => theme.isActive !== false && theme.fileName)
    .map((theme) => resolveHomepageImageFileUrl(theme.fileName))
    .filter(Boolean);

  return activeThemeUrls.length ? activeThemeUrls : [dashboardBg.src];
}

function resolveHomepageImageFileUrl(fileName: unknown) {
  const value = String(fileName ?? "").trim();

  if (!value) {
    return "";
  }

  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/") || value.includes("/")) {
    return apiUrl(value);
  }

  return apiUrl(`/uploads/homepage-image-themes/${value}`);
}

function toDialNumber(value: string) {
  return value.replace(/\D/g, "");
}

function useAnimatedCreditScoreMeter(score: number | null) {
  const meterRef = useRef<HTMLElement | null>(null);
  const [animatedScore, setAnimatedScore] = useState(300);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!score) {
      return;
    }

    const actualScore = clampCreditScore(score);

    if (hasAnimated.current) {
      const frame = requestAnimationFrame(() => {
        setAnimatedScore(actualScore);
      });

      return () => cancelAnimationFrame(frame);
    }

    let frame = 0;
    let observer: IntersectionObserver | null = null;
    let started = false;
    const keyframes = [
      { progress: 0, score: 300, ease: easeInOutCubic },
      { progress: 0.36, score: 900, ease: easeInOutCubic },
      { progress: 0.72, score: 300, ease: easeOutCubic },
      { progress: 1, score: actualScore, ease: easeOutCubic },
    ];

    function startAnimation() {
      if (started) return;

      started = true;
      hasAnimated.current = true;
      const startedAt = performance.now();

      function update(now: number) {
        const progress = Math.min(1, (now - startedAt) / 2800);
        const currentScore = readCreditScoreKeyframe(keyframes, progress);

        setAnimatedScore(currentScore);

        if (progress < 1) {
          frame = requestAnimationFrame(update);
          return;
        }

        setAnimatedScore(actualScore);
      }

      frame = requestAnimationFrame(update);
    }

    const node = meterRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      startAnimation();
    } else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect();
          startAnimation();
        }
      }, { threshold: 0.35 });
      observer.observe(node);
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [score]);

  return {
    arcPercent: ((clampCreditScore(animatedScore) - 300) / 600) * 100,
    displayScore: Math.round(clampCreditScore(animatedScore)),
    meterRef,
  };
}

function readCreditScoreKeyframe(keyframes: Array<{ progress: number; score: number; ease: (progress: number) => number }>, progress: number) {
  const nextIndex = keyframes.findIndex((keyframe) => keyframe.progress >= progress);
  const currentIndex = Math.max(1, nextIndex === -1 ? keyframes.length - 1 : nextIndex);
  const previous = keyframes[currentIndex - 1];
  const next = keyframes[currentIndex];
  const segmentProgress = (progress - previous.progress) / Math.max(0.001, next.progress - previous.progress);

  return clampCreditScore(lerp(previous.score, next.score, next.ease(segmentProgress)));
}

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function easeInOutCubic(progress: number) {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function clampCreditScore(score: number) {
  return Math.min(900, Math.max(300, Math.round(score)));
}

function ContactCard({ color, Icon, label, onClick, sub }: { color: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; label: string; onClick: () => void; sub: string }) {
  return (
    <button type="button" className="min-w-0 rounded-[18px] bg-white/[0.06] px-2 py-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]" onClick={onClick}>
      <span className="mx-auto grid size-9 place-items-center rounded-[13px]" style={{ backgroundColor: `${color}22`, color }}>
        <Icon className="size-5" strokeWidth={1.8} />
      </span>
      <span className="mt-2 block text-caption font-semibold text-white">{label}</span>
      <span className="mt-0.5 block text-caption font-medium leading-snug text-[#AAB6C8]">{sub}</span>
    </button>
  );
}



function SummaryTile({
  label,
  onClick,
  value,
  target = false,
}: {
  label: string;
  onClick?: () => void;
  value: string;
  target?: boolean;
}) {
  const positive = String(value).startsWith("+");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center border-r border-white/[0.03] px-1 text-center last:border-r-0",
        onClick && "cursor-pointer"
      )}
    >
      <p
        className={cn(
          "flex items-center justify-center gap-1 text-base font-black leading-none tracking-[-0.02em] sm:text-title",
          target ? "text-[#08DB69]" : "text-[#08DB69]"
        )}
      >
        {!target && positive ? (
          <ArrowUpRight className="size-4" strokeWidth={3} />
        ) : null}
        <AnimatedNumber value={value} />
      </p>

      <p className="mt-2 truncate text-caption font-medium text-[#AAB6C8] sm:text-caption">
        {label}
      </p>
    </button>
  );
}

function DashboardHomeSkeleton() {
  return (
    <div className="mt-5 space-y-5">
      <section className="rounded-[24px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-3 shadow-[0_22px_46px_rgba(0,0,0,0.24)] sm:rounded-[28px] sm:p-5">
        <div className="grid gap-4">
          <div className="mx-auto grid size-36 place-items-center rounded-full bg-white/[0.06] sm:size-52">
            <div className="size-24 animate-pulse rounded-full bg-white/[0.08] sm:size-36" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-14 animate-pulse rounded-[16px] bg-white/[0.06] sm:h-20 sm:rounded-[20px]" />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={cn("animate-pulse rounded-[20px] bg-[#121820]", index < 2 ? "min-h-36" : "min-h-24")} />
        ))}
      </section>

      <section className="rounded-[28px] bg-[linear-gradient(145deg,#111821,#151E2A)] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.2)]">
        <div className="h-4 w-28 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="mt-5 h-32 animate-pulse rounded-[22px] bg-white/[0.06]" />
      </section>
    </div>
  );
}

function LanguageApplyLoader() {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#050912] px-4 pb-8 pt-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mt-12">
          <div className="h-4 w-36 animate-pulse rounded-full bg-white/[0.08]" />
          <div className="mt-3 h-7 w-52 animate-pulse rounded-full bg-white/[0.08]" />
        </div>
        <main className="mt-12 rounded-t-[30px] bg-[#050912] pb-8 pt-5">
          <DashboardHomeSkeleton />
        </main>
      </div>
    </div>
  );
}

function buildAppTiles(dashboard: DashboardData, unavailable: boolean) {
  if (unavailable) {
    return appTiles.map((tile) => ({ ...tile, value: "-", meta: "-" }));
  }

  return [
    {
      ...appTiles[0],
      value: String(dashboard.activeDisputes ?? "-"),
      meta: dashboard.activeDisputes === "-" ? "-" : "active",
    },
    {
      ...appTiles[1],
      value: dashboard.emiDue || "-",
      meta: dashboard.dueMonth && dashboard.dueMonth !== "--" ? dashboard.dueMonth : "-",
    },
    {
      ...appTiles[2],
      value: dashboard.improvement === "-" ? "-" : typeof dashboard.improvement === "number" ? `${formatSignedValue(dashboard.improvement)} pts` : dashboard.improvement,
      meta: dashboard.improvement === "-" ? "-" : typeof dashboard.improvement === "number" ? "possible" : "",
    },
    {
      ...appTiles[3],
      value: String(dashboard.offers ?? "-"),
      meta: dashboard.offers === "-" ? "-" : "pre-approved",
    },
  ];
}

function QuickCard({ disabled = false, href, Icon, title, value, meta, alert = false, locked = false, offer = false, onLockedClick }: { disabled?: boolean; href: string; Icon: ComponentType<{ className?: string; strokeWidth?: number }>; title: string; value: string; meta: string; alert?: boolean; locked?: boolean; offer?: boolean; onLockedClick?: () => void }) {
  const className = "min-h-[122px] rounded-[20px] border border-white/10 bg-white/[0.07] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_36px_rgba(0,0,0,0.24)] backdrop-blur-xl transition hover:bg-white/[0.1]";

  if (disabled) {
    return (
      <div className={className}>
        <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
      </div>
    );
  }

  if (locked) {
    return (
      <button className={className} data-dashboard-subscribe="true" type="button" onClick={onLockedClick}>
        <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
      </button>
    );
  }

  return (
    <Link className={className} data-dashboard-dispute={title === "Dispute Centre" ? "true" : undefined} href={href}>
      <QuickCardContent Icon={Icon} alert={alert} meta={meta} offer={offer} title={title} value={value} />
    </Link>
  );
}

function QuickCardContent({ Icon, alert, meta, offer, title, value }: { Icon: ComponentType<{ className?: string; strokeWidth?: number }>; alert?: boolean; meta: string; offer?: boolean; title: string; value: string }) {
  return (
    <>
      <span className={cn("grid size-10 place-items-center rounded-[13px] border border-white/10 bg-[#173B66]/80 text-[#DFEBFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_18px_rgba(21,101,192,0.3)]", alert && "bg-[#FF3B30]/70 text-white", offer && "bg-[#4A431C]/70 text-[#FFD34D]")}>
        <Icon className="size-5" strokeWidth={1.7} />
      </span>
      <p className="mt-4 text-body font-black leading-5 text-white">{title}</p>
      <p
        className={cn(
          "mt-1 text-caption font-lighter tracking-normal",
          alert
            ? "text-[#FF3B30]"
            : offer
              ? "text-[#FFD34D]"
              : "text-[#08DB69]"
        )}
      >
        <AnimatedNumber value={value} /> {meta}
      </p>

    </>
  );
}

function JourneyStat({ label, onClick, value, gold = false }: { label: string; onClick?: () => void; value: string; gold?: boolean }) {
  return (
    <button className={cn("rounded-[20px] bg-white/[0.06] p-3 text-left", onClick && "cursor-pointer")} type="button" onClick={onClick}>
      <p className="text-caption font-normal text-[#AAB6C8]">{label}</p>
      <p className={cn("mt-1 text-caption font-medium", gold ? "text-[#08DB69]" : "text-white")}><AnimatedNumber value={value} /></p>
    </button>
  );
}

function ActionPlanPopup({ dashboard, profile, onClose }: { dashboard: DashboardData; profile: UserProfile | null; onClose: () => void }) {
  const [aiPlan, setAiPlan] = useState("");
  const [aiPlanError, setAiPlanError] = useState("");
  const [aiPlanLoading, setAiPlanLoading] = useState(true);
  const points = buildActionPlanPoints(dashboard);
  const aiPoints = parseAiActionPlanPoints(aiPlan);

  useEffect(() => {
    let active = true;

    async function loadAiActionPlan() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        clearScorecareSession();
        window.location.replace("/login");
        return;
      }

      if (active) {
        setAiPlan("");
        setAiPlanError("");
        setAiPlanLoading(true);
      }

      try {
        const generalPrompt = await loadActionPlanGeneralPrompt();
        const prompt = buildActionPlanAiPrompt(generalPrompt, dashboard, profile);
        let actionPlanRequest = actionPlanAiCache.get(prompt);

        if (!actionPlanRequest) {
          actionPlanRequest = loadGeminiActionPlan(token, prompt);
          actionPlanAiCache.set(prompt, actionPlanRequest);
        }

        const actionPlan = await actionPlanRequest;

        if (active) {
          setAiPlan(actionPlan);
        }
      } catch {
        if (active) {
          setAiPlanError("Could not load AI action plan right now.");
        }
      } finally {
        if (active) {
          setAiPlanLoading(false);
        }
      }
    }

    void loadAiActionPlan();

    return () => {
      active = false;
    };
  }, [dashboard, profile]);

  return (
    <div className="fixed inset-0 z-[72] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="bg-[radial-gradient(circle_at_90%_0%,rgba(94,242,194,0.28),transparent_35%),linear-gradient(145deg,#121C28,#0D131C)] px-5 pb-5 pt-4">
          <button className="ml-auto grid size-9 place-items-center rounded-full bg-white/10 text-white backdrop-blur" type="button" aria-label="Close action plan" onClick={onClose}>
            <X className="size-5" />
          </button>
          <p className="mt-3 text-caption font-bold uppercase tracking-[3px] text-[#22D3EE]">AI Credit Coach</p>
          <h2 className="mt-2 text-heading font-semibold leading-7 text-white">Your action plan</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-caption font-medium">
            <span className="rounded-full bg-[#5EF2C2]/14 px-3 py-1 text-[#5EF2C2]">+{dashboard.coachGain} points</span>
            <span className="rounded-full bg-white/8 px-3 py-1 text-[#AAB6C8]">{dashboard.coachTime}</span>
          </div>
        </div>

        <div className="grid min-h-[216px] gap-3 px-5 py-5">
          {aiPlanLoading ? (
            <ActionPlanSkeleton />
          ) : null}
          {aiPlanError ? <p className="rounded-2xl bg-[#FF3B30]/10 px-4 py-3 text-body-sm font-medium leading-5 text-[#FF8AAB]">{aiPlanError}</p> : null}
          {(!aiPlanLoading && aiPoints.length ? aiPoints : !aiPlanLoading && !aiPlan ? points : []).map(({ Icon, text, title, tone }) => (
            <div key={text} className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
              <span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-full", tone === "mint" ? "bg-[#5EF2C2]/14 text-[#5EF2C2]" : tone === "gold" ? "bg-[#FFD34D]/14 text-[#FFD34D]" : "bg-[#FF7A00]/14 text-[#FF9F45]")}>
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <p className="text-body-sm font-medium leading-5 text-[#D7DEE9]">
                {title ? (
                  <span
                    className={cn(
                      "font-bold",
                      tone === "mint"
                        ? "text-[#4FD1FF]"
                        : tone === "gold"
                          ? "text-[#FFD34D]"
                          : "text-[#FF9F45]"
                    )}
                  >
                    {title}:{" "}
                  </span>
                ) : null}
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function loadGeminiActionPlan(token: string, prompt: string) {
  try {
    const response = await apiRequest("/ai/gemini", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        message: prompt,
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(readAiMessage(result) || "Unable to load action plan");
    }

    return readAiMessage(result);
  } catch (error) {
    actionPlanAiCache.delete(prompt);
    throw error;
  }
}

async function loadActionPlanGeneralPrompt() {
  const response = await apiRequest("/general");
  const result = await response.json() as { data?: { prompt_message?: unknown } };
  const promptMessage = String(result.data?.prompt_message ?? "").trim();

  if (!response.ok || !promptMessage) {
    throw new Error("Unable to load action plan prompt");
  }

  return promptMessage;
}

function ActionPlanSkeleton() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-2xl bg-white/[0.06] px-4 py-3">
          <span className="mt-0.5 size-8 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/12" />
            <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-4/5 animate-pulse rounded-full bg-white/10" />
          </div>
        </div>
      ))}
    </>
  );
}

function buildActionPlanAiPrompt(generalPrompt: string, dashboard: DashboardData, profile: UserProfile | null) {
  return [
    generalPrompt,
    "Analyze the following current user credit data and create a concise personalized CIBIL improvement action plan.",
    "Return exactly 4 lines in this format: Title: action.",
    "Do not include markdown, numbering, bullets, or intro text. Keep it practical, specific, and under 90 words.",
    `User name: ${profile?.fullName?.trim() || "unavailable"}`,
    `Current score: ${dashboard.score ?? "unavailable"}`,
    `Target score: ${dashboard.targetScore} by ${dashboard.targetMonth}`,
    `Expected score gain: ${dashboard.coachGain} points in ${dashboard.coachTime}`,
    `Improvement gap: ${dashboard.improvement}`,
    `Active disputes/default items: ${dashboard.activeDisputes}`,
    `EMI due: ${dashboard.emiDue}`,
    `Credit factors: ${dashboard.factors.map((factor) => `${factor.name} ${factor.value}% (${factor.meta})`).join(", ") || "unavailable"}`,
    `Local coach note: ${dashboard.coach}`,
  ].join("\n");
}

function parseAiActionPlanPoints(plan: string) {
  const icons = [Target, Lightbulb, TrendingUp, ShieldAlert];
  const tones = ["gold", "mint", "mint", "orange"] as const;

  return plan
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "")
        .replace(/\*\*/g, "")
        .trim(),
    )
    .filter((line) => line && !/^here'?s\b/i.test(line))
    .slice(0, 4)
    .map((line, index) => {
      const [title, ...body] = line.split(":");
      const text = body.join(":").trim();

      return {
        Icon: icons[index] ?? Lightbulb,
        title: text ? title.trim() : "",
        text: text || line,
        tone: tones[index] ?? "mint",
      };
    });
}

function readAiMessage(result: unknown): string {
  if (typeof result === "string") {
    return result.trim();
  }

  if (!result || typeof result !== "object") {
    return "";
  }

  const data = result as {
    answer?: unknown;
    content?: unknown;
    data?: unknown;
    message?: unknown;
    reply?: unknown;
    response?: unknown;
    text?: unknown;
  };

  for (const value of [data.answer, data.reply, data.response, data.message, data.text, data.content]) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return readAiMessage(data.data);
}

function buildActionPlanPoints(dashboard: DashboardData) {
  const weakestFactor = dashboard.factors.filter((factor) => factor.value > 0).sort((first, second) => first.value - second.value)[0];

  return [
    {
      Icon: Target,
      title: "",
      text: `Move from ${dashboard.score} to ${dashboard.targetScore} by ${dashboard.targetMonth}.`,
      tone: "gold" as const,
    },
    {
      Icon: Lightbulb,
      title: "",
      text: weakestFactor ? `Focus first on ${weakestFactor.name.toLowerCase()} because it is marked ${weakestFactor.meta}.` : dashboard.coach,
      tone: "mint" as const,
    },
    {
      Icon: TrendingUp,
      title: "",
      text: `Expected improvement is ${formatSignedValue(dashboard.improvement)} points with a possible +${dashboard.coachGain} point gain.`,
      tone: "mint" as const,
    },
    {
      Icon: ShieldAlert,
      title: "",
      text: `${formatActiveValue(dashboard.activeDisputes)} dispute item needs review before applying for new credit.`,
      tone: "orange" as const,
    },
  ];
}

function BenefitsPrompt({ loading = false, onClose, onSubscribe }: { loading?: boolean; onClose: () => void; onSubscribe: () => void }) {
  const [showLeavingMessage, setShowLeavingMessage] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBenefits() {
      try {
        const plans = await getSubscriptionPlans();

        if (isMounted) {
          const plan = plans[0] ?? null;
          setSubscriptionPlan(plan);
        }
      } catch {
        if (isMounted) {
          setSubscriptionPlan(null);
        }
      }
    }

    void loadBenefits();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(var(--native-status-offset,0px)+0.75rem)] backdrop-blur-sm">
      <section className="mx-auto h-[calc(100dvh-var(--native-status-offset,0px)-1.75rem-env(safe-area-inset-bottom,0px))] w-full max-w-md overflow-y-auto rounded-[30px] bg-[#0D131C] shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <PremiumBenefitsIntro benefits={subscriptionPlan?.benefits} ctaLabel={subscriptionPlan ? `Pay ${formatPlanAmount(subscriptionPlan)} ${formatBillingCycle(subscriptionPlan.billingCycle)}` : "Pay now"} loading={loading} onClose={() => setShowLeavingMessage(true)} onSubscribe={onSubscribe} />
      </section>
      {showLeavingMessage ? (
        <ProBenefitsComparisonSheet comparisonBenefits={subscriptionPlan?.comparisonBenefits} ctaLabel={subscriptionPlan ? `Pay ${formatPlanAmount(subscriptionPlan)} ${formatBillingCycle(subscriptionPlan.billingCycle)}` : "Pay now"} loading={loading} onClose={onClose} onSubscribe={onSubscribe} zIndex="z-[70]" />
      ) : null}
    </div>
  );
}

function DownloadReportsPopup({ onClose }: { onClose: () => void }) {
  const [downloads, setDownloads] = useState<CreditReportDownloadItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDownloads() {
      const token = localStorage.getItem("scorecare_token");

      if (!token || isTokenExpired(token)) {
        setError("Please login again to view downloads.");
        setLoading(false);
        return;
      }

      try {
        const result = await loadCreditReportDownloads(token);
        setDownloads(result);
      } catch {
        setError("Unable to load downloaded reports.");
      } finally {
        setLoading(false);
      }
    }

    void loadDownloads();
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(var(--native-status-offset,0px)+1rem)] backdrop-blur-sm">
      <section className="mx-auto flex max-h-full w-full max-w-md flex-col overflow-hidden rounded-[30px] bg-[#0D131C] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="shrink-0 flex items-center justify-between gap-3">
          <h2 className="text-title font-bold text-white">Download Reports</h2>
          <button className="grid size-9 place-items-center rounded-full bg-white/10 text-white" type="button" aria-label="Close download reports" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-[18px] bg-white/[0.06] px-4 py-3">
                  <div className="h-3 w-2/5 animate-pulse rounded-full bg-white/10" />
                  <div className="mt-3 h-2.5 w-3/5 animate-pulse rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="mt-5 rounded-[18px] bg-[#FF5C8A]/10 px-4 py-3 text-caption font-medium text-[#FF8AAB]">{error}</p>
          ) : downloads.length ? (
            <div className="mt-5 space-y-3">
              {downloads.map((download) => (
                <div key={download.id} className="rounded-[18px] bg-white/[0.06] px-4 py-3">
                  {/* <p className="text-body-sm font-semibold text-white">{formatReportType(download.reportType)}</p> */}
                  <div className="mt-2 grid grid-cols-2 gap-2 text-caption text-[#AAB6C8]">
                    {/* <p>Provider: <span className="font-semibold text-white">{download.provider || "--"}</span></p> */}
                    <p>Score: <span className="font-semibold text-white">{download.creditScore ?? "--"}</span></p>
                    <p className="col-span-2">Fetched: <span className="font-semibold text-white">{formatOptionalDownloadDate(download.reportFetchedAt)}</span></p>
                    <p className="col-span-2">Downloaded: <span className="font-semibold text-white">{formatOptionalDownloadDate(download.downloadedAt)}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-white/[0.06]">
                <div className="grid size-14 animate-pulse place-items-center rounded-full bg-[#5EF2C2]/12 text-[#5EF2C2]">
                  <FileText className="size-7" strokeWidth={1.8} />
                </div>
              </div>
              <p className="mt-5 text-base font-semibold text-white">No records found</p>
              <p className="mt-2 text-caption leading-5 text-[#AAB6C8]">Downloaded reports will appear here.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function LanguageSettingsPopup({
  onClose,
  onSelect,
  selectedLanguage,
}: {
  onClose: () => void;
  onSelect: (language: string) => void;
  selectedLanguage: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-title font-bold text-white">Language Settings</h2>
          <button className="grid size-9 place-items-center rounded-full bg-white/10 text-white" type="button" aria-label="Close language settings" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          {languageOptions.map((language) => (
            <button
              key={language.code}
              type="button"
              className={cn(
                "flex h-12 items-center justify-between rounded-[16px] px-4 text-left text-body-sm font-semibold transition",
                selectedLanguage === language.code ? "bg-[#5EF2C2] text-[#06221a]" : "bg-white/[0.06] text-white hover:bg-white/[0.1]"
              )}
              onClick={() => onSelect(language.code)}
            >
              {language.label}
              {selectedLanguage === language.code ? <span className="text-caption font-bold">Selected</span> : null}
            </button>
          ))}
        </div>

      </section>
    </div>
  );
}

function AppLockSettingsPopup({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState(() => readAppLockSettings());
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const biometricAvailable = canUseBiometricAppLock();

  async function savePin() {
    if (pin.length < 4 || pin !== confirmPin || saving) {
      setMessage(pin.length < 4 ? "Enter a 4 to 6 digit PIN." : "PINs do not match.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await saveAppLockPin(pin);
      setSettings(readAppLockSettings());
      setPin("");
      setConfirmPin("");
      setMessage("App lock enabled.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBiometric(enabled: boolean) {
    setSaving(true);
    setMessage("");

    try {
      if (enabled) {
        await enableBiometricAppLock();
        setMessage("Biometric unlock enabled.");
      } else {
        await disableBiometricAppLock();
        setMessage("Biometric unlock disabled.");
      }

      setSettings(readAppLockSettings());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update biometric unlock.");
    } finally {
      setSaving(false);
    }
  }

  function turnOffAppLock() {
    disableAppLock();
    setSettings(readAppLockSettings());
    setPin("");
    setConfirmPin("");
    setMessage("App lock disabled.");
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/60 px-4 pb-4 backdrop-blur-sm">
      <section className="mx-auto w-full max-w-md overflow-hidden rounded-[30px] bg-[#0D131C] p-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-[0.18em] text-[#22F2C2]">Security</p>
            <h2 className="mt-1 text-title font-bold">App Security Lock</h2>
          </div>
          <button className="grid size-9 place-items-center rounded-full bg-white/10 text-white" type="button" aria-label="Close app lock settings" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-1 size-5 text-[#22F2C2]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">PIN fallback</p>
              <p className="mt-1 text-caption leading-5 text-[#AAB6C8]">Required before enabling biometric unlock.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <input className="h-11 rounded-[16px] border border-white/10 bg-[#070B12] px-3 text-center text-sm font-bold tracking-[0.25em] outline-none" inputMode="numeric" maxLength={6} placeholder="PIN" type="password" value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            <input className="h-11 rounded-[16px] border border-white/10 bg-[#070B12] px-3 text-center text-sm font-bold tracking-[0.25em] outline-none" inputMode="numeric" maxLength={6} placeholder="Confirm" type="password" value={confirmPin} onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>

          <button className="mt-4 h-11 w-full rounded-[16px] bg-[#22F2C2] text-sm font-black text-[#04120e] disabled:opacity-50" disabled={saving} type="button" onClick={() => void savePin()}>
            {settings.enabled ? "Update PIN" : "Enable App Lock"}
          </button>
        </div>

        <label className="mt-4 flex items-center gap-4 rounded-[22px] border border-white/10 bg-white/[0.05] p-4">
          <Fingerprint className="size-5 text-[#AAB6C8]" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold">Biometric unlock</span>
            <span className="mt-1 block text-caption leading-5 text-[#6F7B8E]">{biometricAvailable ? "Use Face ID, fingerprint, or device screen lock." : "Not available on this device/browser."}</span>
          </span>
          <input className="size-5 accent-[#2DB094] disabled:opacity-50" type="checkbox" checked={settings.biometricEnabled} disabled={!settings.enabled || !biometricAvailable || saving} onChange={(event) => void toggleBiometric(event.target.checked)} />
        </label>

        {message ? <p className="mt-3 text-center text-caption font-semibold text-[#AAB6C8]">{message}</p> : null}

        {settings.enabled ? (
          <button className="mt-4 h-11 w-full rounded-[16px] border border-[#FF5C8A]/25 bg-[#FF5C8A]/10 text-sm font-bold text-[#FF8AAB]" type="button" onClick={turnOffAppLock}>
            Turn off app lock
          </button>
        ) : null}
      </section>
    </div>
  );
}

export function ProfilePanel({ name, onClose, onHelp, onLanguageLoadingChange, onProfileUpdate, profile }: { name: string; onClose: () => void; onHelp: () => void; onLanguageLoadingChange: (loading: boolean) => void; onProfileUpdate: (profile: UserProfile | null) => void; profile: UserProfile | null }) {
  const router = useRouter();
  const phone = profile?.mobileNumber || localStorage.getItem("scorecare_mobile_number") || "--";
  const completion = calculateProfileCompletion(profile);
  const [notificationError, setNotificationError] = useState("");
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsMarkingAll, setNotificationsMarkingAll] = useState(false);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(() => normalizeLanguageCode(profile?.selectedLanguage) || readStoredLanguage());
  const [showAppLockSettings, setShowAppLockSettings] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showDownloadReports, setShowDownloadReports] = useState(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [whatsappAlertsEnabled, setWhatsappAlertsEnabled] = useState(false);
  const [whatsappAlertsError, setWhatsappAlertsError] = useState("");
  const [whatsappAlertsLoading, setWhatsappAlertsLoading] = useState(true);
  const [whatsappAlertsSaving, setWhatsappAlertsSaving] = useState(false);
  const [toast, setToast] = useState({ msg: "", visible: false });

  useEffect(() => {
    void refreshProfileNotifications();
    void loadWhatsappAlertsPreference();

    window.addEventListener("scorecare:profile-notifications-refresh", refreshProfileNotifications);

    return () => {
      window.removeEventListener("scorecare:profile-notifications-refresh", refreshProfileNotifications);
    };
  }, []);

  useEffect(() => {
    if (showLanguageSettings) {
      loadGoogleTranslate();
    }
  }, [showLanguageSettings]);

  useEffect(() => {
    const profileLanguage = normalizeLanguageCode(profile?.selectedLanguage);

    if (!profileLanguage) return;

    setSelectedLanguage(profileLanguage);
    if (profileLanguage !== readStoredLanguage()) {
      applyProfileLanguage(profile);
    }
  }, [profile?.selectedLanguage]);

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast((current) => ({ ...current, visible: false })), 2200);
  };

  async function openNotifications() {
    const token = localStorage.getItem("scorecare_token");

    setShowNotifications(true);
    setNotificationError("");

    if (!token || isTokenExpired(token)) {
      setNotificationError("Please login again to view notifications.");
      return;
    }

    setNotificationLoading(true);

    try {
      const result = await loadNotifications(token);
      setNotifications(result.notifications);
      setNotificationUnreadCount(result.unreadCount);
    } catch {
      setNotificationError("Unable to load notifications.");
    } finally {
      setNotificationLoading(false);
    }
  }

  async function refreshProfileNotifications() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) return;

    try {
      const result = await loadNotifications(token);
      setNotifications(result.notifications);
      setNotificationUnreadCount(result.unreadCount);
    } catch {
      setNotificationUnreadCount(0);
    }
  }

  async function markAllNotificationsRead() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      setNotificationError("Please login again to update notifications.");
      return;
    }

    setNotificationsMarkingAll(true);
    setNotificationError("");

    try {
      await markNotificationsReadAll(token);
      const readAt = new Date().toISOString();

      setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true, readAt })));
      setNotificationUnreadCount(0);
      window.dispatchEvent(new Event("scorecare:notifications-updated"));
    } catch {
      setNotificationError("Unable to mark all notifications read.");
    } finally {
      setNotificationsMarkingAll(false);
    }
  }

  async function loadWhatsappAlertsPreference() {
    const token = localStorage.getItem("scorecare_token");

    if (!token || isTokenExpired(token)) {
      setWhatsappAlertsLoading(false);
      return;
    }

    setWhatsappAlertsError("");
    setWhatsappAlertsLoading(true);

    try {
      const enabled = await getNotificationPreferences(token);
      setWhatsappAlertsEnabled(enabled);
    } catch {
      setWhatsappAlertsError("Unable to load WhatsApp alerts.");
    } finally {
      setWhatsappAlertsLoading(false);
    }
  }

  async function updateWhatsappAlertsPreference(enabled: boolean) {
    const token = localStorage.getItem("scorecare_token");
    const previousValue = whatsappAlertsEnabled;

    if (!token || isTokenExpired(token) || whatsappAlertsSaving) return;

    setWhatsappAlertsEnabled(enabled);
    setWhatsappAlertsSaving(true);
    setWhatsappAlertsError("");

    try {
      const updatedValue = await updateNotificationPreferences(token, enabled);
      setWhatsappAlertsEnabled(updatedValue);
    } catch {
      setWhatsappAlertsEnabled(previousValue);
      setWhatsappAlertsError("Unable to update WhatsApp alerts.");
    } finally {
      setWhatsappAlertsSaving(false);
    }
  }

  async function shareApp() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "ScoreCare",
          text: "Download ScoreCare",
          url: scorecarePlayStoreUrl,
        });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") {
          return;
        }

        window.location.assign(scorecarePlayStoreUrl);
        return;
      }
    }

    window.location.assign(scorecarePlayStoreUrl);
  }

  async function updateSelectedLanguage(language: string) {
    const token = localStorage.getItem("scorecare_token");
    const selectedLanguageLabel = languageOptions.find((item) => item.code === language)?.label;

    if (!token || isTokenExpired(token) || !selectedLanguageLabel) return;

    onLanguageLoadingChange(language !== "en");
    setSelectedLanguage(language);
    applyGoogleLanguageWithRetry(language);
    setShowLanguageSettings(false);

    try {
      await updateUserLanguage(token, selectedLanguageLabel);
      const updatedProfile = await loadProfile(token);
      const updatedLanguage = normalizeLanguageCode(updatedProfile?.selectedLanguage);

      onProfileUpdate(updatedProfile);

      if (updatedLanguage && updatedLanguage !== language) {
        setSelectedLanguage(updatedLanguage);
        applyGoogleLanguageWithRetry(updatedLanguage);
      }
    } finally {
      if (language !== "en") {
        await waitForLanguageApply();
      }
      onLanguageLoadingChange(false);
    }
  }

  async function submitRatingFeedback() {
    if (!selectedRating || ratingLoading) return;

    setRatingLoading(true);
    setRatingError("");

    try {
      await submitFeedback({
        rating: selectedRating,
        message: ratingComment.trim() || "Score Care rating",
        isLiked: selectedRating >= 4,
        isDisliked: selectedRating <= 2,
      });

      const token = localStorage.getItem("scorecare_token");

      if (token && !isTokenExpired(token)) {
        const result = await loadNotifications(token);
        setNotifications(result.notifications);
        setNotificationUnreadCount(result.unreadCount);
      }

      setShowRatingForm(false);
      setSelectedRating(0);
      setRatingComment("");
      showToast("Thanks for your feedback.");
    } catch {
      setRatingError("Unable to submit feedback.");
    } finally {
      setRatingLoading(false);
    }
  }

  function logoutUser() {
    logoutScorecareSession(router.replace);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070B12] px-4 pb-28 pt-[calc(var(--native-status-offset,0px)+1.75rem)] text-white [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <div
        className={cn(
          "fixed left-1/2 top-[calc(var(--native-status-offset,0px)+1.5rem)] z-[9999] -translate-x-1/2 rounded-full bg-[#5EF2C2] px-5 py-2.5 text-caption font-semibold text-[#06221A] shadow-[0_14px_30px_rgba(94,242,194,0.22)] transition-transform",
          toast.visible ? "translate-y-0" : "-translate-y-24"
        )}
      >
        {toast.msg}
      </div>

      <section className="relative mx-auto max-w-md overflow-hidden rounded-[30px] bg-[linear-gradient(160deg,#ebe7d9,#faf7ed_48%,#d9d0bd)] p-5 text-[#111827] shadow-[0_22px_46px_rgba(58,75,140,0.38)]">
        <button className="absolute left-5 top-5 grid size-8 place-items-center rounded-full bg-black/18 text-white backdrop-blur" type="button" aria-label="Close profile" onClick={onClose}>
          <X className="size-6" strokeWidth={1.6} />
        </button>

        <div className="mt-12 rounded-[24px] bg-white/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="mb-5 inline-flex rounded-full bg-[#C9F9DF] px-4 py-1.5 text-caption font-medium text-[#07844E]">{completion}% Complete</div>
          <div className="grid gap-3.5">
            <ProfileField label="Full name" value={profile?.fullName || name} />
            <ProfileField label="Phone number" value={formatPhone(phone)} />
            <ProfileField label="PAN" value={profile?.panNumber || "--"} />
            <ProfileField
              label="Date of Birth"
              value={
                profile?.dateOfBirth
                  ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  : "--"
              }
            />
          </div>
        </div>

      </section>

      <section className="mx-auto mt-6 max-w-md rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <p className="text-caption font-medium uppercase tracking-wide text-[#AAB6C8]">
          Credit Service
        </p>

        <ProfileOption
          title="Download Reports"
          subtitle="View downloaded report history"
          Icon={FileText}
          onClick={() => setShowDownloadReports(true)}
        />

        <ProfileOption
          title="Loans"
          subtitle="Smart Offers"
          Icon={ReceiptText}
          onClick={() => {
            onClose();
            router.push("/dashboard/loans");
          }}
        />
      </section>

      <section className="mx-auto mt-6 max-w-md rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <p className="text-caption font-medium uppercase tracking-wide text-[#AAB6C8]">
          Other Options
        </p>

        <ProfileOption
          title="Notification"
          subtitle="Alerts, Updates & Reminders"
          Icon={Bell}
          badgeCount={notificationUnreadCount}
          onClick={openNotifications}
        />

        <ProfileOption
          title="Help & Support"
          subtitle="Chat, Support & FAQ"
          Icon={CircleHelp}
          onClick={onHelp}
        />

        <ProfileOption
          title="Share App"
          subtitle="Invite Friends & Family"
          Icon={Share2}
          onClick={() => void shareApp()}
        />

        <ProfileOption
          title="Rate Score Care"
          subtitle="Help us improve"
          Icon={Star}
          onClick={() => setShowRatingForm((current) => !current)}
        />

        {showRatingForm ? (
          <div className="mb-3 rounded-[22px] border border-[#5EF2C2]/15 bg-[#070B12] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Select ${value} star rating`}
                    className="grid size-9 place-items-center rounded-full bg-white/[0.04] text-[#6F7B8E] transition hover:bg-[#5EF2C2]/10 hover:text-[#5EF2C2]"
                    onClick={() => {
                      setSelectedRating(value);
                    }}
                  >
                    <Star className={cn("size-5", selectedRating >= value && "fill-[#5EF2C2] text-[#5EF2C2]")} strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>

            <textarea
              value={ratingComment}
              onChange={(event) => setRatingComment(event.target.value)}
              placeholder="Share your feedback"
              className="mt-4 min-h-24 w-full resize-none rounded-[18px] border border-white/[0.08] bg-[#111821] px-4 py-3 text-body-sm font-medium leading-5 text-white outline-none placeholder:text-[#AAB6C8]/60 focus:border-[#5EF2C2]/60 focus:ring-4 focus:ring-[#5EF2C2]/10"
            />

            {ratingError ? (
              <p className="mt-3 text-caption font-medium text-[#FF3B30]">{ratingError}</p>
            ) : null}

            <button
              type="button"
              className="mt-4 h-11 w-full rounded-[16px] bg-[#2DB094] text-body-sm font-semibold text-white shadow-[0_12px_26px_rgba(45,176,148,0.22)] transition hover:bg-[#249a81] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!selectedRating || ratingLoading}
              onClick={submitRatingFeedback}
            >
              {ratingLoading ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        ) : null}

        <ProfileOption
          title="App Security Lock"
          subtitle="PIN lock with biometric unlock when available"
          Icon={LockKeyhole}
          onClick={() => setShowAppLockSettings(true)}
        />

        <ProfileOption
          title="Language Settings"
          subtitle={languageOptions.find((language) => language.code === selectedLanguage)?.label || profile?.selectedLanguage || "English"}
          Icon={Languages}
          onClick={() => setShowLanguageSettings(true)}
        />

        <label className="flex w-full items-center gap-4 py-4">
          <MessageCircle className="size-5 text-[#AAB6C8]" />
          <span className="flex-1">
            <span className="block text-body font-medium text-white">WhatsApp Alerts</span>
            <span className="mt-0.5 block text-caption text-[#6F7B8E]">
              {whatsappAlertsError || (whatsappAlertsLoading ? "Loading preference..." : "Alerts, updates & reminders")}
            </span>
          </span>
          <input
            type="checkbox"
            checked={whatsappAlertsEnabled}
            disabled={whatsappAlertsLoading || whatsappAlertsSaving}
            onChange={(event) => updateWhatsappAlertsPreference(event.target.checked)}
            className="size-5 accent-[#2DB094] disabled:cursor-not-allowed disabled:opacity-50"
          />
        </label>

        <ProfileOption
          title="Logout"
          subtitle="Sign Out From Account"
          Icon={LogOut}
          danger
          onClick={logoutUser}
        />
      </section>

      <section className="mx-auto mt-6 max-w-md rounded-[26px] bg-[#111821] p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
        <p className="text-caption font-medium uppercase tracking-wide text-[#AAB6C8]">
          Danger Zone
        </p>
        <ProfileOption
          title="Delete Account"
          subtitle="Permanently remove your account"
          Icon={Trash2}
          danger
          onClick={() => setShowDeleteAccount(true)}
        />
      </section>

      {showNotifications ? (
        <NotificationsScreen
          error={notificationError}
          loading={notificationLoading}
          markingAll={notificationsMarkingAll}
          notifications={notifications}
          onBack={() => setShowNotifications(false)}
          onReadAll={markAllNotificationsRead}
          unreadCount={notificationUnreadCount}
        />
      ) : null}

      {showDownloadReports ? <DownloadReportsPopup onClose={() => setShowDownloadReports(false)} /> : null}

      {showLanguageSettings ? (
        <LanguageSettingsPopup
          selectedLanguage={selectedLanguage}
          onClose={() => setShowLanguageSettings(false)}
          onSelect={(language) => void updateSelectedLanguage(language)}
        />
      ) : null}

      {showAppLockSettings ? (
        <AppLockSettingsPopup onClose={() => setShowAppLockSettings(false)} />
      ) : null}

      {showDeleteAccount ? (
        <DeleteAccountFlow
          mobileNumber={phone}
          onClose={() => setShowDeleteAccount(false)}
          onDone={() => router.replace("/login")}
        />
      ) : null}

      <p className="mt-6 text-center text-caption font-normal text-[#6F7B8E]">V 1.0.0</p>
    </div>
  );
}



function NotificationsScreen({ error, loading, markingAll, notifications, onBack, onReadAll, unreadCount }: { error: string; loading: boolean; markingAll: boolean; notifications: NotificationItem[]; onBack: () => void; onReadAll: () => void; unreadCount: number }) {
  return (
    <div className="fixed inset-0 z-[60] bg-white text-[#1F2937] [font-family:Inter,Manrope,-apple-system,BlinkMacSystemFont,'SF_Pro_Display','Segoe_UI',system-ui,sans-serif]">
      <header className="flex h-[calc(var(--native-status-offset,0px)+72px)] items-center gap-2 border-b border-black/10 bg-white px-5 pt-[var(--native-status-offset,0px)] shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <button className="grid size-6 place-items-center text-[#1F2937]" type="button" aria-label="Back" onClick={onBack}>
          <ArrowLeft className="size-6" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-medium text-[#1F2937]">Notifications</h1>
          <p className="mt-0.5 text-caption font-medium text-[#6F7B8E]">{unreadCount} unread</p>
        </div>
        <button
          className="rounded-full border border-black/10 px-3 py-1.5 text-caption font-semibold text-[#1F2937] disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!unreadCount || markingAll}
          onClick={onReadAll}
        >
          {markingAll ? "Updating..." : "Read all"}
        </button>
      </header>

      <main>
        {loading ? (
          <NotificationScreenSkeleton />
        ) : error ? (
          <p className="px-5 py-5 text-caption font-normal text-[#FF3B30]">{error}</p>
        ) : notifications.length ? (
          notifications.map((notification) => (
            <article key={notification.id} className={cn("border-b border-black/20 px-5 py-5", !notification.isRead && "bg-[#F2FFFA]")}>
              <h2 className="text-base font-medium leading-5 text-black">{notification.title || "Notification"}</h2>
              <p className="mt-2 text-base font-normal leading-4 text-black">{notification.message || "--"}</p>
              {notification.createdAt ? <p className="mt-5 text-right text-caption font-normal text-black">{formatNotificationRelativeTime(notification.createdAt)}</p> : null}
            </article>
          ))
        ) : (
          <p className="px-5 py-5 text-caption font-normal text-[#111827]">No notifications yet.</p>
        )}
      </main>
    </div>
  );
}

function NotificationScreenSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, index) => (
        <article key={index} className="border-b border-black/10 px-5 py-5">
          <div className="h-3 w-2/5 animate-pulse rounded-full bg-black/10" />
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-full animate-pulse rounded-full bg-black/10" />
            <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-black/10" />
          </div>
          <div className="ml-auto mt-5 h-2.5 w-20 animate-pulse rounded-full bg-black/10" />
        </article>
      ))}
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-body font-medium uppercase tracking-[2px] text-[#6F7280]">{label}</p>
      <p className="mt-1 break-words text-base font-medium tracking-[0.3px] text-[#111827]">{value || "--"}</p>
    </div>
  );
}


function ProfileOption({
  title,
  subtitle,
  Icon,
  badgeCount,
  danger,
  disabled,
  onClick,
}: {
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  badgeCount?: number;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-4 py-4 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="relative">
        <Icon
          className={cn(
            "size-5",
            danger ? "text-[#FF3B30]" : "text-[#AAB6C8]"
          )}
        />
        {badgeCount ? (
          <span className="absolute -right-2.5 -top-2.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#FF3B30] px-1 text-caption font-bold leading-none text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </span>

      <div className="flex-1 text-left">
        <p
          className={cn(
            "text-body font-medium",
            danger ? "text-[#FF3B30]" : "text-white"
          )}
        >
          {title}
        </p>

        {subtitle && (
          <p className="mt-0.5 text-caption text-[#6F7B8E]">
            {subtitle}
          </p>
        )}
      </div>
    </button>
  );
}

function normalizeLanguageCode(language?: string | null) {
  if (!language) return "";

  const normalizedLanguage = language.trim().toLowerCase();
  const option = languageOptions.find((item) => item.code.toLowerCase() === normalizedLanguage || item.label.toLowerCase() === normalizedLanguage);

  return option?.code || "";
}

function readStoredLanguage() {
  if (typeof window === "undefined") {
    return "en";
  }

  return normalizeLanguageCode(localStorage.getItem("scorecare_language")) || "en";
}

function loadGoogleTranslate() {
  if (typeof window === "undefined") {
    return;
  }

  ensureGoogleTranslateElement();

  const googleWindow = window as typeof window & {
    google?: {
      translate?: {
        TranslateElement?: new (options: { includedLanguages: string; pageLanguage: string }, elementId: string) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  };

  googleWindow.googleTranslateElementInit = () => {
    const translateElement = document.getElementById("google_translate_element");

    if (!googleWindow.google?.translate?.TranslateElement || !translateElement || translateElement.dataset.initialized === "true") {
      return;
    }

    translateElement.dataset.initialized = "true";
    new googleWindow.google.translate.TranslateElement(
      {
        includedLanguages: languageOptions.map((language) => language.code).join(","),
        pageLanguage: "en",
      },
      "google_translate_element"
    );

    const storedLanguage = readStoredLanguage();

    if (storedLanguage !== "en") {
      applyGoogleLanguageWithRetry(storedLanguage);
    }
  };

  if (document.getElementById("scorecare-google-translate-script")) {
    if (googleWindow.google?.translate?.TranslateElement) {
      googleWindow.googleTranslateElementInit();
    }
    return;
  }

  const script = document.createElement("script");
  script.id = "scorecare-google-translate-script";
  script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  document.body.appendChild(script);
}

function applyGoogleLanguageWithRetry(language: string) {
  if (googleTranslatePendingLanguage === language && readStoredLanguage() === language) {
    return;
  }

  googleTranslatePendingLanguage = language;
  googleTranslateRetryTimers.forEach((timer) => window.clearTimeout(timer));
  googleTranslateRetryTimers = [];

  if (readStoredLanguage() === language && isGoogleLanguageApplied(language)) {
    googleTranslatePendingLanguage = "";
    return;
  }

  const delays = [0, 250, 700];

  googleTranslateRetryTimers = delays.map((delay) =>
    window.setTimeout(() => {
      const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

      if (!select && delay !== delays[delays.length - 1]) return;
      if (select?.value === language) {
        googleTranslatePendingLanguage = "";
        return;
      }

      applyGoogleLanguage(language, false);
      googleTranslatePendingLanguage = "";
    }, delay)
  );
}

function applyProfileLanguage(profile: UserProfile | null) {
  const profileLanguage = normalizeLanguageCode(profile?.selectedLanguage);

  if (!profileLanguage) return false;

  if (profileLanguage === "en") {
    resetGoogleLanguage();
    return false;
  }

  loadGoogleTranslate();
  applyGoogleLanguageWithRetry(profileLanguage);
  return true;
}

function waitForLanguageApply() {
  return new Promise((resolve) => window.setTimeout(resolve, 800));
}

function applyGoogleLanguage(language: string, reloadWhenMissing = true) {
  localStorage.setItem("scorecare_language", language);
  document.cookie = `googtrans=/en/${language};path=/`;
  document.cookie = `googtrans=/en/${language};domain=${window.location.hostname};path=/`;
  document.body.style.top = "0";

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (!select) {
    if (reloadWhenMissing) {
      loadGoogleTranslate();
    }
    return;
  }

  select.value = language;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function ensureGoogleTranslateElement() {
  if (document.getElementById("google_translate_element")) {
    return;
  }

  const element = document.createElement("div");
  element.id = "google_translate_element";
  element.className = "hidden";
  document.body.appendChild(element);
}

function isGoogleLanguageApplied(language: string) {
  if (language === "en") {
    return !document.documentElement.classList.contains("translated-ltr") && !document.documentElement.classList.contains("translated-rtl");
  }

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
  const cookieLanguage = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/)?.[1];

  return select?.value === language || cookieLanguage === language;
}

function resetGoogleLanguage() {
  googleTranslatePendingLanguage = "";
  googleTranslateRetryTimers.forEach((timer) => window.clearTimeout(timer));
  googleTranslateRetryTimers = [];
  localStorage.setItem("scorecare_language", "en");
  document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `googtrans=;domain=${window.location.hostname};path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = "googtrans=/en/en;path=/";
  document.cookie = `googtrans=/en/en;domain=${window.location.hostname};path=/`;
  document.body.style.top = "0";

  const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");

  if (select) {
    select.value = "en";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}



async function loadProfile(token: string) {
  const response = await apiRequest("/users/me/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const result = await response.json();

  if (response.status === 401 || response.status === 403) {
    clearScorecareSession();
    window.location.replace("/login");
    return null;
  }

  if (!response.ok) {
    throw new Error(result?.message || "Unable to load profile");
  }

  const profile = readProfile(result);

  if (profile?.fullName) localStorage.setItem("scorecare_full_name", profile.fullName);
  if (profile?.mobileNumber) localStorage.setItem("scorecare_mobile_number", profile.mobileNumber);
  if (profile?.panNumber) localStorage.setItem("scorecare_pan_number", profile.panNumber);
  if (profile?.email) localStorage.setItem("scorecare_email", profile.email);
  if (profile?.dateOfBirth) localStorage.setItem("scorecare_date_of_birth", profile.dateOfBirth);
  if (profile?.selectedLanguage) localStorage.setItem("scorecare_language", normalizeLanguageCode(profile.selectedLanguage) || profile.selectedLanguage);

  return profile;
}

async function updateUserLanguage(token: string, selectedLanguageLabel: string) {
  const response = await apiRequest("/users/me/language", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: { selectedLanguage: selectedLanguageLabel },
  });
  const result = await response.json();

  if (response.status === 401 || response.status === 403) {
    clearScorecareSession();
    window.location.replace("/login");
    return;
  }

  if (!response.ok) {
    throw new Error(result?.message || "Unable to update language");
  }
}

async function loadSubscriptionStatus(token: string) {
  const response = await apiRequest("/api/subscription-plans/status", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load subscription status.");
  }

  return response.json();
}

function readProfile(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const response = result as {
    accessType?: unknown;
    data?: {
      accessType?: unknown;
      profile?: unknown;
      user?: unknown;
    };
    profile?: unknown;
    user?: unknown;
  };
  const profile = response.data?.user ?? response.data?.profile ?? response.user ?? response.profile ?? (response.data?.accessType ? response.data : result);

  return profile && typeof profile === "object" ? profile as UserProfile : null;
}

function applySubscriptionStatus(profile: UserProfile | null, result: unknown) {
  const subscription = readSubscriptionStatus(result);

  if (!subscription) {
    return profile;
  }

  const status = normalizeStatus(subscription.status ?? subscription.subscriptionStatus ?? subscription.planStatus ?? subscription.accessType);
  const accessType = isPaidSubscriptionStatus(status) ? "paid" : subscription.accessType ?? profile?.accessType;

  return {
    ...profile,
    accessType,
    planStatus: subscription.planStatus ?? subscription.status ?? profile?.planStatus,
    subscriptionStatus: subscription.subscriptionStatus ?? subscription.status ?? profile?.subscriptionStatus,
    subscription: {
      ...profile?.subscription,
      ...subscription,
      accessType,
      status: subscription.status ?? subscription.subscriptionStatus ?? profile?.subscription?.status,
    },
  } as UserProfile;
}

function readSubscriptionStatus(result: unknown) {
  if (!result || typeof result !== "object") {
    return null;
  }

  const response = result as {
    data?: {
      subscription?: unknown;
      status?: unknown;
    };
    subscription?: unknown;
    status?: unknown;
  };
  const subscription = response.subscription ?? response.data?.subscription ?? response.data ?? response;

  return subscription && typeof subscription === "object" ? subscription as {
    accessType?: string | null;
    planStatus?: string | null;
    status?: string | null;
    subscriptionStatus?: string | null;
  } : null;
}

async function loadCibilData(token: string, profile: UserProfile | null) {
  try {
    const displayData = await getCachedCibilDisplayData(token, { forceRefresh: true });

    if (readScore(displayData)) {
      return displayData;
    }
  } catch {
    if (profile?.panNumber && profile.mobileNumber && profile.fullName) {
      return await getCachedCibilScoreCheckData(token, {
        pan: profile.panNumber,
        mobile: profile.mobileNumber,
        name: profile.fullName,
        consent: "Y",
        gender: "male",
      });
    }

    return getStoredLatestCibilScoreCheckData(token) ?? profile;
  }

  if (profile?.panNumber && profile.mobileNumber && profile.fullName) {
    return await getCachedCibilScoreCheckData(token, {
      pan: profile.panNumber,
      mobile: profile.mobileNumber,
      name: profile.fullName,
      consent: "Y",
      gender: "male",
    });
  }

  return getStoredLatestCibilScoreCheckData(token) ?? profile;
}

async function loadBasicCibilScoreData(token: string, profile: UserProfile | null) {
  if (!profile?.panNumber || !profile.mobileNumber || !profile.fullName) {
    return profile;
  }

  return getCachedCibilScoreCheckData(token, {
    pan: profile.panNumber,
    mobile: profile.mobileNumber,
    name: profile.fullName,
    consent: "Y",
    gender: "male",
  });
}

async function loadNotifications(token: string) {
  const response = await apiRequest(`/notifications?limit=${notificationsPageSize}&unreadOnly=false`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load notifications.");
  }

  const result = (await response.json()) as {
    data?: {
      notifications?: NotificationItem[] | null;
      unreadCount?: number | null;
    };
    status?: string;
  };

  return {
    notifications: result.status === "success" ? result.data?.notifications ?? [] : [],
    unreadCount: result.status === "success" ? result.data?.unreadCount ?? 0 : 0,
  };
}

async function getNotificationPreferences(token: string) {
  const response = await apiRequest("/api/users/notification-preferences", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load notification preferences.");
  }

  const result = (await response.json()) as {
    data?: {
      whatsappAlertsEnabled?: boolean;
    };
  };

  return Boolean(result.data?.whatsappAlertsEnabled);
}

async function updateNotificationPreferences(token: string, whatsappAlertsEnabled: boolean) {
  const response = await apiRequest("/api/users/notification-preferences", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      whatsappAlertsEnabled,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to update notification preferences.");
  }

  const result = (await response.json()) as {
    data?: {
      whatsappAlertsEnabled?: boolean;
    };
  };

  return Boolean(result.data?.whatsappAlertsEnabled);
}

async function loadActiveDisputes(token: string) {
  try {
    const response = await apiRequest("/api/disputes", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return 0;

    const result = (await response.json()) as { data?: CibilRepairStatus | null };

    return readNumber(result.data?.activeDisputes);
  } catch {
    return 0;
  }
}

async function markNotificationsReadAll(token: string) {
  const response = await apiRequest("/notifications/read-all", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to mark all notifications read.");
  }
}

function buildDashboardData(result: unknown, profile: UserProfile | null, activeDisputes = 0): DashboardData {
  const score = readScore(result) ?? readScore(profile);
  const accounts = readAccounts(result);
  const enquiries = readEnquiries(result);
  const summary = readReportSummary(result);
  const disputeCount = activeDisputes;
  const utilization = calculateUtilization(accounts);
  const targetScore = getTargetScore(score);
  const recentEnquiries = summary.recentEnquiries;
  const paymentHistory = calculatePaymentHistory(accounts);
  const creditAge = calculateCreditAge(accounts);
  const creditMix = calculateCreditMix(accounts, summary);
  const newEnquiries = calculateNewEnquiries(recentEnquiries);
  const scoreHistory = readScoreHistory(result);
  const reportMonths = readReportHistoryMonths(accounts);
  const fallbackTrend = score && reportMonths.length ? buildFallbackJourneyScores(score, reportMonths.length) : [];
  const hasReportData = accounts.length > 0 || enquiries.length > 0 || Boolean(summary.outstandingBalance || summary.activeAccounts || summary.defaultAccounts || summary.recentEnquiries);
  const improvement = calculateImprovement(score);
  const crifLoanAccounts = readCrifLoanAccounts(result);
  const totalActiveEmi = calculateActiveEmiTotal(crifLoanAccounts.length ? crifLoanAccounts : accounts);

  return {
    score,
    rating: getRating(score),
    grade: getGrade(score),
    monthlyChange: 0,
    sixMonthChange: 0,
    targetScore,
    targetMonth: getTargetMonth(),
    activeDisputes: disputeCount,
    scoreGain: 0,
    emiDue: totalActiveEmi ? formatCurrency(totalActiveEmi) : "--",
    dueMonth: totalActiveEmi ? "due" : "--",
    improvement,
    offers: 0,
    hasReportData,
    trend: scoreHistory.length > 1 ? scoreHistory.map((record) => record.score) : fallbackTrend,
    trendMonths: scoreHistory.length > 1 ? scoreHistory.map((record) => record.month) : reportMonths,
    hasScoreHistory: scoreHistory.length > 1,
    factors: [
      { name: "Payment History", value: paymentHistory.value, meta: paymentHistory.meta, tone: paymentHistory.tone },
      { name: "Credit Utilization", value: utilization.strength, meta: utilization.label, tone: utilization.tone },
      { name: "Credit Age", value: creditAge.value, meta: creditAge.meta, tone: creditAge.tone },
      { name: "Credit Mix", value: creditMix.value, meta: creditMix.meta, tone: creditMix.tone },
      { name: "New Enquiries", value: newEnquiries.value, meta: newEnquiries.meta, tone: newEnquiries.tone },
    ],
    coach: buildCoachText(disputeCount, utilization.percent, recentEnquiries),
    coachGain: disputeCount ? disputeCount * 12 : utilization.percent > 30 ? 24 : 0,
    coachTime: "30-60 days",
  };
}

function buildFreeTierDashboard(result: unknown): DashboardData {
  const score = readScore(result);

  return {
    score,
    rating: getRating(score),
    grade: getGrade(score),
    monthlyChange: "-",
    sixMonthChange: "-",
    targetScore: "-",
    targetMonth: "--",
    activeDisputes: "-",
    scoreGain: "-",
    emiDue: "-",
    dueMonth: "--",
    improvement: "-",
    offers: "-",
    hasReportData: false,
    trend: [],
    trendMonths: [],
    hasScoreHistory: false,
    factors: [
      { name: "Payment History", value: 0, meta: "-", tone: "warn" },
      { name: "Credit Utilization", value: 0, meta: "-", tone: "warn" },
      { name: "Credit Age", value: 0, meta: "-", tone: "warn" },
      { name: "Credit Mix", value: 0, meta: "-", tone: "warn" },
      { name: "New Enquiries", value: 0, meta: "-", tone: "warn" },
    ],
    coach: "Subscribe to unlock credit factors, disputes, EMIs, offers, and action plan.",
    coachGain: 0,
    coachTime: "--",
  };
}

function isFreeTierProfile(profile: UserProfile | null) {
  const accessType = normalizeStatus(profile?.accessType ?? profile?.subscription?.accessType);
  const subscriptionStatus = normalizeStatus(profile?.subscriptionStatus ?? profile?.subscription?.subscriptionStatus);
  const planStatus = normalizeStatus(profile?.planStatus ?? profile?.subscription?.planStatus);
  const status = normalizeStatus(profile?.subscription?.status);

  return ![accessType, subscriptionStatus, planStatus, status].some(isPaidSubscriptionStatus);
}

function isPaidSubscriptionStatus(value: string) {
  return value === "paid" || value === "active";
}

function normalizeStatus(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function clearSubscriptionDashboardCache() {
  localStorage.removeItem("subscriptionStatus");
  localStorage.removeItem("dashboardData");
  sessionStorage.removeItem("subscriptionStatus");
  sessionStorage.removeItem("dashboardData");
  clearCachedCibilDisplayData();
}

function hasReloadedSubscriptionSuccess() {
  return sessionStorage.getItem("scorecare_subscription_success_reloaded") === "true";
}

function markSubscriptionSuccessReloaded() {
  sessionStorage.setItem("scorecare_subscription_success_reloaded", "true");
}

function routerReplaceDashboardSuccess() {
  replaceAfterPaymentSuccess("/dashboard?subscription=success");
}

function createEmptyDashboard(message = "Score data is unavailable right now."): DashboardData {
  return {
    score: null,
    rating: "Unavailable",
    grade: "--",
    monthlyChange: 0,
    sixMonthChange: 0,
    targetScore: 0,
    targetMonth: "--",
    activeDisputes: 0,
    scoreGain: 0,
    emiDue: "--",
    dueMonth: "--",
    improvement: 0,
    offers: 0,
    hasReportData: false,
    trend: [],
    trendMonths: [],
    hasScoreHistory: false,
    factors: [],
    coach: message,
    coachGain: 0,
    coachTime: "--",
  };
}

function readScore(result: unknown) {
  const data = result as {
    cibilScore?: unknown;
    score?: unknown;
    credit_score?: unknown;
    data?: {
      cibilScore?: unknown;
      score?: unknown;
      credit_score?: unknown;
      display?: { score?: { value?: unknown } };
      credit_report?: {
        SCORE?: {
          FCIREXScore?: unknown;
          BureauScore?: unknown;
        };
      };
      report?: { cibilScore?: unknown; score?: unknown; credit_score?: unknown };
    };
  } | null;
  const value =
    data?.data?.display?.score?.value ??
    data?.data?.credit_report?.SCORE?.BureauScore ??
    data?.data?.credit_report?.SCORE?.FCIREXScore ??
    data?.data?.report?.cibilScore ??
    data?.data?.report?.score ??
    data?.data?.report?.credit_score ??
    data?.data?.cibilScore ??
    data?.data?.score ??
    data?.data?.credit_score ??
    data?.cibilScore ??
    data?.score ??
    data?.credit_score;
  const score = readNumber(value);

  return score > 0 ? score : null;
}

function readScoreHistory(result: unknown) {
  const data = result as {
    data?: {
      report?: {
        scoreHistory?: unknown;
        score_history?: unknown;
      };
      scoreHistory?: unknown;
      score_history?: unknown;
    };
    scoreHistory?: unknown;
    score_history?: unknown;
  } | null;
  const history = data?.data?.scoreHistory ?? data?.data?.score_history ?? data?.data?.report?.scoreHistory ?? data?.data?.report?.score_history ?? data?.scoreHistory ?? data?.score_history;

  if (!Array.isArray(history)) return [];

  return history
    .map((item) => {
      const record = item as Record<string, unknown>;
      const score = readNumber(record.credit_score ?? record.score ?? record.BureauScore ?? record.bureau_score);
      const recordedAt = parseRecordDate(record.recorded_at ?? record.recordedAt ?? record.created_at ?? record.date);

      return score > 0 && recordedAt ? { score, recordedAt, month: formatJourneyMonthYear(recordedAt) } : null;
    })
    .filter((record): record is { score: number; recordedAt: Date; month: string } => Boolean(record))
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
}

function readReportHistoryMonths(accounts: Array<Record<string, unknown>>) {
  const keys = new Set<string>();

  accounts.forEach((account) => {
    const history = account.CAIS_Account_History;

    if (!Array.isArray(history)) return;

    history.forEach((item) => {
      const record = item as Record<string, unknown>;
      const year = readNumber(record.Year);
      const month = readNumber(record.Month);

      if (year && month) {
        keys.add(`${year}-${String(month).padStart(2, "0")}`);
      }
    });
  });

  return Array.from(keys).sort().slice(-5).map(formatReportMonth);
}

function buildFallbackJourneyScores(score: number, count: number) {
  const offsets = [-26, -18, -24, -13, 0];
  const selectedOffsets = offsets.slice(Math.max(0, offsets.length - count));

  return selectedOffsets.map((offset) => Math.max(300, Math.min(900, score + offset)));
}

function formatReportMonth(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  return Number.isNaN(date.getTime()) ? "--" : formatJourneyMonthYear(date);
}

function formatJourneyMonthYear(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(date);
}

function formatJourneyAxisMonth(value: string) {
  return value.split(" ")[0] || value;
}

function readDisplayName(result: unknown) {
  const data = result as { data?: { display?: { profile?: { name?: unknown } }; name?: unknown } } | null;
  const name = data?.data?.display?.profile?.name ?? data?.data?.name;

  return typeof name === "string" ? name.trim() : "";
}

function readAccounts(result: unknown) {
  const data = result as {
    data?: {
      display?: { accounts?: Array<Record<string, unknown>> };
      credit_report?: { CAIS_Account?: { CAIS_Account_DETAILS?: Array<Record<string, unknown>> } };
    };
  } | null;

  if (Array.isArray(data?.data?.credit_report?.CAIS_Account?.CAIS_Account_DETAILS)) {
    return data.data.credit_report.CAIS_Account.CAIS_Account_DETAILS;
  }

  return Array.isArray(data?.data?.display?.accounts) ? data.data.display.accounts : [];
}

function readCrifLoanAccounts(result: unknown) {
  const data = result as {
    data?: {
      credit_report?: {
        RESPONSES?: {
          RESPONSE?: Record<string, unknown> | Array<Record<string, unknown>>;
        };
      };
    };
  } | null;
  const responses = data?.data?.credit_report?.RESPONSES?.RESPONSE;
  const responseList = Array.isArray(responses) ? responses : responses ? [responses] : [];

  return responseList.flatMap((response) => {
    const loanDetails = response["LOAN-DETAILS"];

    return Array.isArray(loanDetails) ? loanDetails : loanDetails ? [loanDetails as Record<string, unknown>] : [];
  });
}

function readEnquiries(result: unknown) {
  const data = result as {
    data?: {
      display?: { enquiries?: Array<Record<string, unknown>> };
      credit_report?: { CAPS?: { CAPS_Application_Details?: Array<Record<string, unknown>> } };
    };
  } | null;

  if (Array.isArray(data?.data?.display?.enquiries)) return data.data.display.enquiries;

  return Array.isArray(data?.data?.credit_report?.CAPS?.CAPS_Application_Details)
    ? data.data.credit_report.CAPS.CAPS_Application_Details
    : [];
}

function calculateUtilization(accounts: Array<Record<string, unknown>>) {
  const cardAccounts = accounts.filter((account) => {
    const limit = readNumber(account.Credit_Limit_Amount ?? account.high_credit_amount);
    const portfolioType = String(account.Portfolio_Type ?? account.portfolio_type ?? "").trim().toUpperCase();
    const accountType = readNumber(account.Account_Type ?? account.account_type);

    return limit > 0 && (portfolioType === "R" || accountType === 10);
  });
  const totals = cardAccounts.reduce<{ balance: number; limit: number }>(
    (sum, account) => ({
      balance: sum.balance + readNumber(account.current_balance ?? account.Current_Balance),
      limit: sum.limit + readNumber(account.Credit_Limit_Amount ?? account.high_credit_amount),
    }),
    { balance: 0, limit: 0 },
  );
  const percent = totals.limit ? Math.round((totals.balance / totals.limit) * 100) : 0;
  const strength = Math.max(10, 100 - percent);

  if (percent > 50) return { percent, strength, label: `${percent}% - High`, tone: "alert" as const };
  if (percent > 30) return { percent, strength, label: `${percent}% - Fair`, tone: "warn" as const };

  return { percent, strength, label: `${percent}% - Good`, tone: "good" as const };
}

function isActiveAccount(account: Record<string, unknown>) {
  const accountStatus = String(account.account_status ?? account.Account_Status ?? "").trim().toLowerCase();

  if (accountStatus === "closed") {
    return false;
  }

  const closedValue = account.account_closed ?? account.Date_Closed;

  if (closedValue === null || closedValue === undefined || closedValue === "") {
    return true;
  }

  return !parseExperianDate(closedValue);
}

function isCrifActiveAccount(account: Record<string, unknown>) {
  return String(account["ACCOUNT-STATUS"] ?? "").trim() === "Active";
}

function calculateActiveEmiTotal(accounts: Array<Record<string, unknown>>) {
  const total = accounts
    .filter(isCrifActiveAccount)
    .filter((account) => String(account["ACCT-TYPE"] ?? "").trim() !== "Credit Card")
    .reduce((sum, account) => sum + readAccountEmiAmount(account), 0);

  return Math.round(total);
}

function readAccountEmiAmount(account: Record<string, unknown>) {
  const value = account["INSTALLMENT-AMT"];

  if (value === null || value === undefined || value === "") return 0;

  const amount = Number(String(value).split("/")[0].trim().replace(/[^\d.-]/g, ""));

  return Number.isFinite(amount) ? amount : 0;
}

function readReportSummary(result: unknown) {
  const data = result as {
    data?: {
      credit_report?: {
        CAPS?: {
          CAPS_Summary?: {
            CAPSLast90Days?: unknown;
            CAPSLast180Days?: unknown;
          };
        };
        CAIS_Account?: {
          CAIS_Summary?: {
            Credit_Account?: {
              CreditAccountTotal?: unknown;
              CreditAccountActive?: unknown;
              CreditAccountClosed?: unknown;
              CreditAccountDefault?: unknown;
            };
            Total_Outstanding_Balance?: {
              Outstanding_Balance_All?: unknown;
              Outstanding_Balance_Secured_Percentage?: unknown;
              Outstanding_Balance_UnSecured_Percentage?: unknown;
            };
          };
        };
      };
    };
  } | null;
  const creditAccount = data?.data?.credit_report?.CAIS_Account?.CAIS_Summary?.Credit_Account;
  const outstanding = data?.data?.credit_report?.CAIS_Account?.CAIS_Summary?.Total_Outstanding_Balance;

  return {
    totalAccounts: readNumber(creditAccount?.CreditAccountTotal),
    activeAccounts: readNumber(creditAccount?.CreditAccountActive),
    closedAccounts: readNumber(creditAccount?.CreditAccountClosed),
    defaultAccounts: readNumber(creditAccount?.CreditAccountDefault),
    outstandingBalance: readNumber(outstanding?.Outstanding_Balance_All),
    securedPercentage: readNumber(outstanding?.Outstanding_Balance_Secured_Percentage),
    unsecuredPercentage: readNumber(outstanding?.Outstanding_Balance_UnSecured_Percentage),
    recentEnquiries: readNumber(data?.data?.credit_report?.CAPS?.CAPS_Summary?.CAPSLast90Days),
  };
}

function calculatePaymentHistory(accounts: Array<Record<string, unknown>>) {
  const hasLatePayment = accounts.some((account) => {
    const history = account.CAIS_Account_History;

    if (!Array.isArray(history)) return false;

    return history.some((item) => readNumber((item as Record<string, unknown>).Days_Past_Due) > 0);
  });

  if (hasLatePayment) {
    return { value: 58, meta: "Needs attention", tone: "alert" as const };
  }

  return { value: 100, meta: "Excellent", tone: "good" as const };
}

function calculateCreditAge(accounts: Array<Record<string, unknown>>) {
  const openDates = accounts
    .map((account) =>
      parseExperianDate(
        account.opened ??
        account.Open_Date ??
        account.open_date ??
        account.date_opened ??
        account.Date_Opened
      )
    )
    .filter((date): date is Date => Boolean(date));

  if (!openDates.length) {
    return { value: 50, meta: "Not available", tone: "warn" as const };
  }

  const oldest = openDates.reduce((min, date) => (date < min ? date : min), openDates[0]);
  const today = new Date();
  const months = Math.max(0, (today.getFullYear() - oldest.getFullYear()) * 12 + today.getMonth() - oldest.getMonth() - (today.getDate() < oldest.getDate() ? 1 : 0));
  const years = months / 12;

  return {
    value: years >= 5 ? 100 : years >= 3 ? 75 : years >= 1 ? 50 : 25,
    meta: `${years.toFixed(1)} yrs`,
    tone: years >= 3 ? "good" as const : years >= 1 ? "warn" as const : "alert" as const,
  };
}

function calculateCreditMix(accounts: Array<Record<string, unknown>>, summary: ReturnType<typeof readReportSummary>) {
  const hasRevolving = accounts.some((account) => String(account.Portfolio_Type ?? account.portfolio_type ?? "").trim().toUpperCase() === "R");
  const hasInstallment = accounts.some((account) => String(account.Portfolio_Type ?? account.portfolio_type ?? "").trim().toUpperCase() === "I");
  const hasSecuredAndUnsecured = summary.securedPercentage > 0 && summary.unsecuredPercentage > 0;

  if ((hasRevolving && hasInstallment) || hasSecuredAndUnsecured) {
    return { value: 90, meta: "Good mix", tone: "good" as const };
  }

  if (hasRevolving || hasInstallment || summary.securedPercentage > 0 || summary.unsecuredPercentage > 0) {
    return { value: 55, meta: "Needs variety", tone: "warn" as const };
  }

  return { value: 25, meta: "Needs variety", tone: "alert" as const };
}

function calculateNewEnquiries(recentEnquiries: number) {
  if (recentEnquiries === 0) {
    return { value: 100, meta: "0 recent", tone: "good" as const };
  }

  if (recentEnquiries <= 2) {
    return { value: 70, meta: `${recentEnquiries} recent`, tone: "warn" as const };
  }

  return { value: 35, meta: `${recentEnquiries} recent`, tone: "alert" as const };
}

function parseExperianDate(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const digits = raw.replace(/\D/g, "");

  let yyyy = 0;
  let mm = 0;
  let dd = 0;

  if (/^\d{8}$/.test(digits)) {
    const firstFour = Number(digits.slice(0, 4));

    if (firstFour >= 1900) {
      yyyy = firstFour;
      mm = Number(digits.slice(4, 6));
      dd = Number(digits.slice(6, 8));
    } else {
      dd = Number(digits.slice(0, 2));
      mm = Number(digits.slice(2, 4));
      yyyy = Number(digits.slice(4, 8));
    }
  } else {
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const currentYear = new Date().getFullYear();

  if (yyyy < 1900 || yyyy > currentYear) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;

  const date = new Date(yyyy, mm - 1, dd);

  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) return null;

  return date;
}

function parseRecordDate(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const date = new Date(raw);

  return Number.isNaN(date.getTime()) ? null : date;
}

function readNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;

  const number = typeof value === "number" ? value : Number(String(value).split("/")[0].trim().replace(/[^\d.-]/g, ""));

  return Number.isFinite(number) ? number : 0;
}

function getRating(score: number | null) {
  if (!score) return "Unavailable";
  if (score >= 750) return "EXCELLENT";
  if (score >= 700) return "GOOD";
  if (score >= 650) return "FAIR";

  return "NEEDS WORK";
}

function getGrade(score: number | null) {
  if (!score) return "--";
  if (score >= 800) return "A+";
  if (score >= 750) return "A";
  if (score >= 700) return "B+";
  if (score >= 650) return "B";

  return "C";
}

function getTargetScore(score: number | null) {
  if (!score) return 0;
  if (score < 750) return 750;
  if (score < 800) return 800;
  if (score < 850) return 850;

  return Math.min(900, score + 25);
}

function calculateImprovement(score: number | null) {
  if (!score) return 0;
  if (score < 650) return 80;
  if (score < 750) return 50;
  if (score < 800) return 25;

  return "Maintain score";
}

function getTargetMonth() {
  const date = new Date();
  date.setMonth(date.getMonth() + 3);

  return formatJourneyMonthYear(date);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "INR",
  }).format(value);
}

function formatSignedValue(value: number | string) {
  return typeof value === "number" ? `+${value}` : value;
}

function formatActiveValue(value: number | string) {
  return typeof value === "number" ? `${value} Active` : value;
}

function formatNotificationRelativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  return `${days} days ago`;
}

function formatDownloadDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatOptionalDownloadDate(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return formatDownloadDateTime(date);
}

function formatReportType(value?: string | null) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "Credit Report";
}

async function loadCreditReportDownloads(token: string) {
  const response = await apiRequest("/credit-reports/downloads", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load downloaded reports.");
  }

  const result = (await response.json()) as {
    data?: CreditReportDownloadItem[] | null;
    status?: string;
  };

  return result.status === "success" && Array.isArray(result.data) ? result.data : [];
}

function buildCoachText(overdueAccounts: number, utilization: number, enquiries: number) {
  if (overdueAccounts) return "Clear overdue accounts first to reduce negative repayment signals.";
  if (utilization > 30) return "Reduce credit utilization below 30% before your next statement date.";
  if (enquiries > 2) return "Pause new credit applications while recent enquiries cool down.";

  return "Maintain on-time payments and keep utilization low to protect your score.";
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (!digits) return "--";

  return digits.startsWith("91") && digits.length > 10 ? `+${digits.slice(0, 2)} ${digits.slice(2)}` : `+91 ${digits}`;
}

async function submitFeedback(payload: { rating: number; message: string; isLiked: boolean; isDisliked: boolean }) {
  const token = localStorage.getItem("scorecare_token");

  if (!token || isTokenExpired(token)) {
    throw new Error("Please login again to submit feedback.");
  }

  const response = await apiRequest("/feedback", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error("Unable to submit feedback.");
  }
}

function calculateProfileCompletion(profile: UserProfile | null) {
  const fields = [profile?.fullName, profile?.mobileNumber, profile?.panNumber, profile?.email, profile?.dateOfBirth];
  const completed = fields.filter(Boolean).length;

  return Math.round((completed / fields.length) * 100);
}
