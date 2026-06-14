"use client";

import { motion } from "framer-motion";

type ScorecareBrandAnimationProps = {
  message?: string;
};

const services = ["Credit Score", "CIBIL Repair", "Reports", "Loans"];

export function ScorecareBrandAnimation({ message = "Securing your credit journey" }: ScorecareBrandAnimationProps) {
  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-0 z-[120] grid place-items-center bg-white px-8 text-[#123f5a]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="grid min-h-dvh w-full max-w-[21rem] place-items-center">
        <motion.div
          className="grid w-full place-items-center"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="text-center text-[0.78rem] font-black uppercase tracking-[0.16em] text-[#123f5a]"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
          >
            {message}
          </motion.p>

          <motion.div
            className="relative mt-6 grid h-44 w-64 place-items-center"
            initial={{ scale: 0.97 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.img
              src="/scorecare-logo.PNG"
              alt="ScoreCare"
              className="relative z-10 h-auto w-60"
              initial={{ opacity: 0, y: 8, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.span
              className="absolute inset-y-6 left-0 z-20 w-12 -skew-x-12 bg-white/70"
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: "520%", opacity: [0, 0.75, 0] }}
              transition={{ duration: 1.4, delay: 1.1, ease: "easeInOut" }}
            />
          </motion.div>

          <div className="mt-2 grid w-full grid-cols-2 gap-2.5">
            {services.map((service, index) => (
              <motion.div
                key={service}
                className="rounded-2xl border border-[#e3edf1] bg-[#fbfdfc] px-3 py-2 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#123f5a] shadow-[0_8px_24px_rgba(18,63,90,0.05)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 1, 1, 0.72], y: 0 }}
                transition={{ duration: 3.8, delay: 0.65 + index * 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-[#23aa88]" />
                {service}
              </motion.div>
            ))}
          </div>

          <div className="mt-7 h-1.5 w-64 overflow-hidden rounded-full bg-[#e8eef2]">
            <motion.span
              className="block h-full rounded-full bg-[#23aa88]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: [0.65, 0, 0.35, 1] }}
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
