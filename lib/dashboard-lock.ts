"use client";

import { useSyncExternalStore } from "react";
import { isTokenExpired } from "./auth-session";

function isLoggedIn() {
	if (typeof window === "undefined") return false;
	const token = localStorage.getItem("scorecare_token");
	if (!token) return false;
	try {
		return !isTokenExpired(token);
	} catch {
		return false;
	}
}

export function getDashboardActionsDisabled() {
	try {
		const loggedIn = isLoggedIn();
		const path = typeof location !== "undefined" ? location.pathname : "";
		const allowedInteractivePaths = ["/profile", "/dashboard/credit-score", "/dashboard/offers", "/dashboard/loans", "/dashboard/admin"];

		if (loggedIn && !allowedInteractivePaths.some((allowedPath) => path.startsWith(allowedPath))) return true;
		return false;
	} catch {
		return false;
	}
}

// Initial false matches SSR; the client applies the real lock after hydration.
export function useDashboardActionsDisabled() {
	return useSyncExternalStore(subscribeToDashboardLock, getDashboardActionsDisabled, () => false);
}

function subscribeToDashboardLock(onStoreChange: () => void) {
	if (typeof window === "undefined") {
		return () => {};
	}

	window.addEventListener("storage", onStoreChange);
	window.addEventListener("popstate", onStoreChange);

	return () => {
		window.removeEventListener("storage", onStoreChange);
		window.removeEventListener("popstate", onStoreChange);
	};
}
