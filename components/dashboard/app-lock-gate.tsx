"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { Fingerprint, LockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { canUseBiometricAppLock, readAppLockSettings, verifyAppLockPin, verifyBiometricAppLock } from "@/lib/app-lock";

export function AppLockGate() {
  const [enabled, setEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const initializedRef = useRef(false);
  const biometricAvailable = canUseBiometricAppLock();
  const settings = readAppLockSettings();

  useEffect(() => {
    function syncSettings() {
      const nextSettings = readAppLockSettings();

      setEnabled(nextSettings.enabled);
      setLocked((currentLocked) => {
        if (!nextSettings.enabled) return false;
        if (!initializedRef.current) return true;
        return currentLocked;
      });
      initializedRef.current = true;
      setPin("");
      setError("");
    }

    syncSettings();
    window.addEventListener("scorecare:app-lock-settings-changed", syncSettings);

    return () => window.removeEventListener("scorecare:app-lock-settings-changed", syncSettings);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function lockApp() {
      setLocked(true);
      setPin("");
      setError("");
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") lockApp();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (!Capacitor.isNativePlatform()) {
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }

    let removeResumeListener: (() => void) | undefined;

    void App.addListener("resume", lockApp).then((listener) => {
      removeResumeListener = () => listener.remove();
    });

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      removeResumeListener?.();
    };
  }, [enabled]);

  async function unlockWithPin() {
    if (await verifyAppLockPin(pin)) {
      setLocked(false);
      setPin("");
      setError("");
      return;
    }

    setError("Incorrect PIN.");
  }

  async function unlockWithBiometric() {
    try {
      if (await verifyBiometricAppLock()) {
        setLocked(false);
        setPin("");
        setError("");
        return;
      }
    } catch {
      setError("Biometric unlock failed. Use PIN instead.");
      return;
    }

    setError("Biometric unlock failed. Use PIN instead.");
  }

  if (!enabled || !locked) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-[#050912] px-5 text-white">
      <section className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#111821] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.42)]">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#22F2C2]/12 text-[#22F2C2]">
          <LockKeyhole className="size-7" />
        </span>
        <h2 className="mt-4 text-center text-lg font-black">Unlock ScoreCare</h2>
        <p className="mt-1 text-center text-caption text-[#AAB6C8]">Use your app PIN{settings.biometricEnabled && biometricAvailable ? " or biometric unlock" : ""}.</p>

        <input
          className="mt-5 h-12 w-full rounded-[18px] border border-white/10 bg-[#0B111A] px-4 text-center text-lg font-bold tracking-[0.4em] text-white outline-none"
          inputMode="numeric"
          maxLength={6}
          placeholder="PIN"
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />

        {error ? <p className="mt-3 text-center text-caption font-semibold text-[#FF5C8A]">{error}</p> : null}

        <div className="mt-5 grid gap-3">
          <button className="h-12 rounded-[18px] bg-[#22F2C2] text-sm font-black text-[#04120e] disabled:opacity-50" disabled={pin.length < 4} type="button" onClick={() => void unlockWithPin()}>
            Unlock
          </button>
          {settings.biometricEnabled && biometricAvailable ? (
            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.05] text-sm font-bold text-[#AAB6C8]" type="button" onClick={() => void unlockWithBiometric()}>
              <Fingerprint className="size-4" />
              Use biometric
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
