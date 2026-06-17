"use client";

import { useEffect, useRef } from "react";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import { logCrashlyticsMessage, trackEvent } from "@/src/lib/analytics";

const RESUME_REFRESH_THROTTLE_MS = 1500;

export function useCapacitorAppLifecycle() {
  const wasOfflineRef = useRef(false);
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let isActive = true;
    let isDisposed = false;
    const removeCallbacks: Array<() => void | Promise<void>> = [];
    const addCleanup = (remove: () => void | Promise<void>) => {
      if (isDisposed) {
        void remove();
        return;
      }

      removeCallbacks.push(remove);
    };

    function refreshAppData(reason: "resume" | "network-restored" | "active") {
      const now = Date.now();

      if (now - lastRefreshAtRef.current < RESUME_REFRESH_THROTTLE_MS) {
        return;
      }

      lastRefreshAtRef.current = now;

      const token = localStorage.getItem("scorecare_token");

      if (token && isTokenExpired(token)) {
        clearScorecareSession();
        window.location.replace("/login");
        return;
      }

      window.dispatchEvent(new CustomEvent("scorecare:app-refresh", { detail: { reason } }));
      window.dispatchEvent(new CustomEvent("scorecare:notifications-updated"));
      window.dispatchEvent(new CustomEvent("scorecare:profile-notifications-refresh"));
    }

    function handleSessionExpired() {
      clearScorecareSession();
      window.location.replace("/login");
    }

    window.addEventListener("scorecare:session-expired", handleSessionExpired);
    addCleanup(() => window.removeEventListener("scorecare:session-expired", handleSessionExpired));

    void trackEvent("app_open", { page_name: "app" });
    void logCrashlyticsMessage("App opened");

    void App.addListener("pause", () => {
      isActive = false;
    }).then((listener) => {
      addCleanup(() => listener.remove());
    });

    void App.addListener("resume", () => {
      isActive = true;
      refreshAppData("resume");
    }).then((listener) => {
      addCleanup(() => listener.remove());
    });

    void App.addListener("appStateChange", ({ isActive: appIsActive }) => {
      isActive = appIsActive;

      if (appIsActive) {
        refreshAppData("active");
      }
    }).then((listener) => {
      addCleanup(() => listener.remove());
    });

    void Network.getStatus().then((status) => {
      wasOfflineRef.current = !status.connected;
    });

    void Network.addListener("networkStatusChange", (status) => {
      const wasOffline = wasOfflineRef.current;
      wasOfflineRef.current = !status.connected;

      window.dispatchEvent(new CustomEvent("scorecare:network-status", { detail: status }));

      if (status.connected && (wasOffline || isActive)) {
        refreshAppData("network-restored");
      }
    }).then((listener) => {
      addCleanup(() => listener.remove());
    });

    return () => {
      isDisposed = true;
      removeCallbacks.forEach((remove) => {
        void remove();
      });
    };
  }, []);
}
