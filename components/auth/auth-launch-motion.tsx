"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { ScorecareBrandAnimation } from "@/components/auth/scorecare-brand-animation";

type AuthLaunchMotionProps = {
  children: ReactNode;
};

export function AuthLaunchMotion({ children }: AuthLaunchMotionProps) {
  const [showLaunch, setShowLaunch] = useState(false);

  useEffect(() => {
    const isNativeShell = document.documentElement.classList.contains("native-shell");
    const isMobileView = window.matchMedia("(max-width: 768px)").matches;

    if (!isNativeShell && !isMobileView) {
      return;
    }

    setShowLaunch(true);

    const timer = window.setTimeout(() => {
      setShowLaunch(false);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showLaunch ? (
          <ScorecareBrandAnimation message="Welcome to ScoreCare" />
        ) : null}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: showLaunch ? 0.2 : 0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </>
  );
}
