import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";
import type { ActionPerformed, PushNotificationSchema, Token } from "@capacitor/push-notifications";
import { apiRequest } from "@/lib/api";
import { isTokenExpired } from "@/lib/auth-session";

type PushNotificationsModule = typeof import("@capacitor/push-notifications");

export type PushNotificationInitState = {
  error: string | null;
  fcmToken: string | null;
  isLoading: boolean;
  isNativeAndroid: boolean;
  permission: "prompt" | "prompt-with-rationale" | "granted" | "denied" | null;
};

type PushNotificationCleanup = {
  remove: () => Promise<void>;
};

type InitializePushNotificationOptions = {
  onNotificationClick?: (path: string) => void;
  onStateChange?: (state: PushNotificationInitState) => void;
};

const registeredTokenStorageKey = "scorecare_registered_fcm_token";
const deviceIdStorageKey = "scorecare_push_device_id";
const androidDeviceIdStorageKey = "scorecare_android_device_id";

function debugLog(message: string, data?: unknown) {
  console.info(`[ScoreCare Push] ${message}`, data ?? "");
}

function getNotificationPath(data: unknown) {
  if (!data || typeof data !== "object") return "/notifications";

  const payload = data as Record<string, unknown>;
  const rawPath = payload.screen ?? payload.path ?? payload.url ?? payload.deepLink;

  if (typeof rawPath !== "string" || !rawPath.startsWith("/") || rawPath.startsWith("//")) {
    return "/notifications";
  }

  return rawPath;
}

function isSupportedNativePlatform() {
  return Capacitor.isNativePlatform() && ["android", "ios"].includes(Capacitor.getPlatform());
}

function getDeviceId() {
  const storageKey = Capacitor.getPlatform() === "android" ? androidDeviceIdStorageKey : deviceIdStorageKey;
  const storedDeviceId = localStorage.getItem(storageKey);

  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(storageKey, deviceId);
  return deviceId;
}

async function getFirebaseMessagingToken() {
  const result = await FirebaseMessaging.getToken();
  return result.token ?? "";
}

async function sendTokenToBackend(fcmToken: string, jwtToken: string) {
  if (!jwtToken) {
    throw new Error("Missing auth token for push notification registration.");
  }

  if (!fcmToken) {
    throw new Error("Missing FCM token.");
  }

  if (Capacitor.getPlatform() === "ios" && fcmToken.length === 64) {
    throw new Error("Invalid iOS token. APNs token received instead of FCM token.");
  }

  if (localStorage.getItem(registeredTokenStorageKey) === fcmToken) {
    debugLog("FCM token already registered; skipping API call", { fcmToken });
    return;
  }

  const platform = Capacitor.getPlatform();
  const deviceId = getDeviceId();

  console.log("Notification platform:", platform);
  console.log("FCM token length:", fcmToken.length);
  console.log("FCM token prefix:", fcmToken.slice(0, 20));

  const response = await apiRequest("/api/notifications/register-device", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
    body: {
      fcmToken,
      platform,
      deviceId,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.error("[ScoreCare Push] Device registration API failed", {
      status: response.status,
      errorBody,
    });
    throw new Error(`Device registration failed with status ${response.status}`);
  }

  localStorage.setItem(registeredTokenStorageKey, fcmToken);
  debugLog("Device registration API succeeded", { fcmToken });
}

export function clearPushNotificationState() {
  localStorage.removeItem(registeredTokenStorageKey);
  localStorage.removeItem(deviceIdStorageKey);
  localStorage.removeItem(androidDeviceIdStorageKey);
}

export async function initializePushNotifications(
  jwtToken: string,
  options: InitializePushNotificationOptions = {}
): Promise<PushNotificationCleanup | null> {
  const { onNotificationClick, onStateChange } = options;

  const setState = (state: Partial<PushNotificationInitState>) => {
    onStateChange?.({
      error: null,
      fcmToken: null,
      isLoading: false,
      isNativeAndroid: Capacitor.getPlatform() === "android",
      permission: null,
      ...state,
    });
  };

  if (!isSupportedNativePlatform()) {
    debugLog("Skipped initialization outside supported native platforms");
    setState({ isNativeAndroid: false });
    return null;
  }

  if (!jwtToken || isTokenExpired(jwtToken)) {
    console.error("[ScoreCare Push] Missing or expired auth token; push registration skipped");
    setState({ error: "Missing auth token." });
    return null;
  }

  setState({ isLoading: true });

  try {
    const { PushNotifications }: PushNotificationsModule = await import("@capacitor/push-notifications");
    const isAndroid = Capacitor.getPlatform() === "android";

    const listenerHandles = await Promise.all([
      PushNotifications.addListener("registration", async (token: Token) => {
        try {
          const fcmToken = isAndroid ? token.value : await getFirebaseMessagingToken();

          debugLog("Registration success; FCM token received", {
            platform: Capacitor.getPlatform(),
            tokenLength: fcmToken.length,
            tokenPrefix: fcmToken.slice(0, 20),
          });

          await sendTokenToBackend(fcmToken, jwtToken);
          setState({ fcmToken, isLoading: false, permission: "granted" });
        } catch (error) {
          console.error("[ScoreCare Push] Failed to register FCM token", error);
          setState({
            error: error instanceof Error ? error.message : "Unable to register this device for notifications.",
            isLoading: false,
          });
        }
      }),

      PushNotifications.addListener("registrationError", (error) => {
        console.error("[ScoreCare Push] Native registration failed", error);
        setState({
          error: error.error || "Push notification registration failed.",
          isLoading: false,
        });
      }),

      PushNotifications.addListener("pushNotificationReceived", (notification: PushNotificationSchema) => {
        debugLog("Foreground notification received", notification);
        window.dispatchEvent(new Event("scorecare:notifications-updated"));
      }),

      PushNotifications.addListener("pushNotificationActionPerformed", (action: ActionPerformed) => {
        const path = getNotificationPath(action.notification.data);
        debugLog("Notification clicked", { action, path });
        onNotificationClick?.(path);
      }),
    ]);

    const currentPermission = await PushNotifications.checkPermissions();
    const permission =
      currentPermission.receive === "prompt"
        ? await PushNotifications.requestPermissions()
        : currentPermission;

    debugLog("Permission status", permission);
    setState({ isLoading: true, permission: permission.receive });

    if (permission.receive !== "granted") {
      debugLog("Notification permission denied", permission);
      setState({
        error: "Notification permission was not granted.",
        isLoading: false,
        permission: permission.receive,
      });

      return {
        remove: async () => {
          await Promise.all(listenerHandles.map((listener) => listener.remove()));
        },
      };
    }

    if (isAndroid) {
      await PushNotifications.createChannel({
        id: "scorecare_notifications",
        name: "ScoreCare Notifications",
        description: "Credit score, report, offer, and account alerts.",
        importance: 4,
        visibility: 1,
        lights: true,
        vibration: true,
      });
    }

    await PushNotifications.register();
    debugLog("Push registration requested");

    return {
      remove: async () => {
        await Promise.all(listenerHandles.map((listener) => listener.remove()));
        debugLog("Push notification listeners removed");
      },
    };
  } catch (error) {
    console.error("[ScoreCare Push] Initialization failed", error);
    setState({
      error: error instanceof Error ? error.message : "Unable to initialize push notifications.",
      isLoading: false,
      permission: null,
    });
    return null;
  }
}