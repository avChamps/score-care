"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  claimLaunchVideoPlayback,
  launchVideoMaxSeconds,
  launchVideoSrc,
  playLaunchVideo,
} from "@/lib/launch-video";

type AuthLaunchMotionProps = {
  children: ReactNode;
};

export function AuthLaunchMotion({ children }: AuthLaunchMotionProps) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [videoVisible, setVideoVisible] = useState(false);
  const revealTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);

    const isNativeShell = document.documentElement.classList.contains("native-shell");
    const isMobileView = window.matchMedia("(max-width: 768px)").matches;

    if (!isNativeShell && !isMobileView) return;
    if (!claimLaunchVideoPlayback()) return;

    setShowLaunch(true);
  }, []);

  const stopLaunchVideo = useCallback(() => {
    setShowLaunch(false);
  }, []);

  useEffect(() => {
    if (showLaunch) return;

    setVideoVisible(false);
  }, [showLaunch]);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
      }
    };
  }, []);

  const revealVideo = useCallback(() => {
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
    }

    revealTimerRef.current = window.setTimeout(() => {
      setVideoVisible(true);
    }, 180);
  }, []);

  const launchVideo =
    mounted && showLaunch
      ? createPortal(
        <AnimatePresence>
    
<motion.div className="fixed inset-0 z-[99999] h-[100dvh] w-[100vw] overflow-hidden bg-[#020B18]">
  <video
    playsInline
    preload="auto"
    controls={false}
    disablePictureInPicture
    controlsList="nodownload nofullscreen noremoteplayback"
    onCanPlay={(event) => {
      playLaunchVideo(event.currentTarget).catch(stopLaunchVideo);
    }}
    onPlaying={revealVideo}
    onTimeUpdate={(event) => {
      if (event.currentTarget.currentTime >= launchVideoMaxSeconds) {
        stopLaunchVideo();
      }
    }}
    onEnded={stopLaunchVideo}
    onError={stopLaunchVideo}
    className={`launch-video-element absolute inset-0 h-full w-full object-fill transition-opacity duration-150 ${videoVisible ? "opacity-100" : "opacity-0"}`}
  >
    <source src={launchVideoSrc} type="video/mp4" />
  </video>
</motion.div>

        </AnimatePresence>,
        document.body
      )
      : null;

  return (
    <>
      {launchVideo}

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: showLaunch ? 0.2 : 0,
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
