"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type AuthLaunchMotionProps = {
  children: ReactNode;
};

export function AuthLaunchMotion({ children }: AuthLaunchMotionProps) {
  const [showLaunch, setShowLaunch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const isNativeShell = document.documentElement.classList.contains("native-shell");
    const isMobileView = window.matchMedia("(max-width: 768px)").matches;

    if (!isNativeShell && !isMobileView) return;

    setShowLaunch(true);
  }, []);

  const launchVideo =
    mounted && showLaunch
      ? createPortal(
        <AnimatePresence>
    
<motion.div className="fixed inset-0 z-[99999] h-[100dvh] w-[100vw] overflow-hidden bg-[#020B18]">
  <video
    autoPlay
    muted
    playsInline
    preload="auto"
    onEnded={() => setShowLaunch(false)}
    className="absolute inset-0 h-full w-full object-fill"
  >
    <source src="/loginpage-animation.mp4" type="video/mp4" />
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
