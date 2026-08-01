"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearScorecareSession, isTokenExpired } from "@/lib/auth-session";
import {
  launchVideoMaxSeconds,
  launchVideoSrc,
  markLaunchVideoPlayed,
  playLaunchVideo,
  wasLaunchVideoRecentlyPlayed,
} from "@/lib/launch-video";

export default function LoadingPage() {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const revealTimerRef = useRef<number | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  const continueToApp = useCallback(() => {
    if (redirectedRef.current) return;

    redirectedRef.current = true;
    markLaunchVideoPlayed();

    const token = localStorage.getItem("scorecare_token");

    if (token && !isTokenExpired(token)) {
      router.replace("/dashboard");
      return;
    }

    clearScorecareSession();
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    if (wasLaunchVideoRecentlyPlayed()) {
      continueToApp();
      return;
    }

    markLaunchVideoPlayed();

    const timer = window.setTimeout(continueToApp, launchVideoMaxSeconds * 1000);

    return () => {
      window.clearTimeout(timer);

      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, [continueToApp]);

  const revealVideo = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }

    revealTimerRef.current = window.setTimeout(() => {
      setVideoVisible(true);
    }, 180);
  }, []);

  return (
    <div className="fixed inset-0 z-[120] h-[100dvh] w-[100vw] overflow-hidden bg-[#020B18]">
      <video
        autoPlay
        playsInline
        preload="auto"
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onCanPlay={(event) => {
          playLaunchVideo(event.currentTarget).catch(continueToApp);
        }}
        onPlaying={revealVideo}
        onTimeUpdate={(event) => {
          if (event.currentTarget.currentTime >= launchVideoMaxSeconds) {
            continueToApp();
          }
        }}
        onEnded={continueToApp}
        onError={continueToApp}
        className={`launch-video-element absolute inset-0 h-full w-full object-fill transition-opacity duration-150 ${videoVisible ? "opacity-100" : "opacity-0"}`}
      >
        <source src={launchVideoSrc} type="video/mp4" />
      </video>
    </div>
  );
}
