"use client";

import { Capacitor, registerPlugin } from "@capacitor/core";

const appLockSettingsKey = "scorecare_app_lock_settings";

type NativeAppLockPlugin = {
  authenticate: () => Promise<{ authenticated: boolean }>;
  isAvailable: () => Promise<{ available: boolean }>;
};

const nativeAppLock = registerPlugin<NativeAppLockPlugin>("NativeAppLock");

export type AppLockSettings = {
  biometricEnabled: boolean;
  credentialId?: string;
  enabled: boolean;
  pinHash?: string;
  pinSalt?: string;
};

export function readAppLockSettings(): AppLockSettings {
  if (typeof window === "undefined") {
    return { biometricEnabled: false, enabled: false };
  }

  try {
    const settings = JSON.parse(localStorage.getItem(appLockSettingsKey) ?? "{}") as AppLockSettings;
    const biometricEnabled = Capacitor.isNativePlatform()
      ? Boolean(settings.biometricEnabled)
      : Boolean(settings.biometricEnabled && settings.credentialId);

    return {
      biometricEnabled,
      credentialId: settings.credentialId,
      enabled: Boolean(settings.enabled && settings.pinHash && settings.pinSalt),
      pinHash: settings.pinHash,
      pinSalt: settings.pinSalt,
    };
  } catch {
    return { biometricEnabled: false, enabled: false };
  }
}

export async function saveAppLockPin(pin: string) {
  const pinSalt = crypto.randomUUID();
  const pinHash = await hashAppLockPin(pin, pinSalt);
  const current = readAppLockSettings();

  writeAppLockSettings({
    ...current,
    enabled: true,
    pinHash,
    pinSalt,
  });
}

export function disableAppLock() {
  localStorage.removeItem(appLockSettingsKey);
  window.dispatchEvent(new Event("scorecare:app-lock-settings-changed"));
}

export async function verifyAppLockPin(pin: string) {
  const settings = readAppLockSettings();

  if (!settings.pinHash || !settings.pinSalt) {
    return false;
  }

  return await hashAppLockPin(pin, settings.pinSalt) === settings.pinHash;
}

export function canUseBiometricAppLock() {
  if (Capacitor.isNativePlatform()) {
    return true;
  }

  return typeof window !== "undefined" && Boolean(window.PublicKeyCredential && navigator.credentials);
}

export async function enableBiometricAppLock() {
  if (Capacitor.isNativePlatform()) {
    const availability = await nativeAppLock.isAvailable();

    if (!availability.available) {
      throw new Error("Biometric app lock is not configured on this device.");
    }

    await nativeAppLock.authenticate();
    writeAppLockSettings({
      ...readAppLockSettings(),
      biometricEnabled: true,
      credentialId: undefined,
    });
    return;
  }

  if (!canUseBiometricAppLock()) {
    throw new Error("Biometric app lock is not available on this device.");
  }

  const credential = await navigator.credentials.create({
    publicKey: {
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "preferred",
        userVerification: "required",
      },
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      pubKeyCredParams: [{ alg: -7, type: "public-key" }],
      rp: { name: "ScoreCare" },
      user: {
        displayName: localStorage.getItem("scorecare_full_name") || "ScoreCare User",
        id: crypto.getRandomValues(new Uint8Array(16)),
        name: localStorage.getItem("scorecare_mobile_number") || "scorecare-user",
      },
    },
  }) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error("Unable to enable biometric app lock.");
  }

  writeAppLockSettings({
    ...readAppLockSettings(),
    biometricEnabled: true,
    credentialId: arrayBufferToBase64Url(credential.rawId),
  });
}

export async function disableBiometricAppLock() {
  writeAppLockSettings({
    ...readAppLockSettings(),
    biometricEnabled: false,
    credentialId: undefined,
  });
}

export async function verifyBiometricAppLock() {
  const settings = readAppLockSettings();

  if (!settings.biometricEnabled || !canUseBiometricAppLock()) {
    return false;
  }

  if (Capacitor.isNativePlatform()) {
    const result = await nativeAppLock.authenticate();

    return result.authenticated;
  }

  if (!settings.credentialId) {
    return false;
  }

  const credential = await navigator.credentials.get({
    publicKey: {
      allowCredentials: [{
        id: base64UrlToArrayBuffer(settings.credentialId),
        type: "public-key",
      }],
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      userVerification: "required",
    },
  });

  return Boolean(credential);
}

function writeAppLockSettings(settings: AppLockSettings) {
  localStorage.setItem(appLockSettingsKey, JSON.stringify(settings));
  window.dispatchEvent(new Event("scorecare:app-lock-settings-changed"));
}

async function hashAppLockPin(pin: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return arrayBufferToBase64Url(hash);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let value = "";

  bytes.forEach((byte) => {
    value += String.fromCharCode(byte);
  });

  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToArrayBuffer(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
