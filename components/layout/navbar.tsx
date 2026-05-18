"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isHeroOverlay = isHome && !scrolled;

  useEffect(() => {
    if (!isHome) {
      return;
    }

    function onScroll() {
      setScrolled(window.scrollY > 120);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.requestAnimationFrame(onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header className={cn(isHome ? "fixed left-0 right-0 top-0" : "sticky top-0", "z-50 bg-transparent px-3 py-3 sm:px-5")}>
      <nav className={cn(
        "mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between rounded-full border px-4 backdrop-blur-2xl transition-colors duration-300 sm:px-6 lg:px-7",
        isHeroOverlay
          ? "border-white/35 bg-[#2d2119]/24 shadow-[0_18px_55px_rgba(0,0,0,0.18)]"
          : "border-[#6f5948]/12 bg-[#fffdf7]/88 shadow-[0_18px_55px_rgba(92,62,37,0.12)]",
      )}>
        <Logo light={isHeroOverlay} />
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold transition",
                isHeroOverlay
                  ? "text-white hover:bg-white/14 hover:text-white"
                  : "text-[#6f5948] hover:bg-[#f7e7c6] hover:text-[#2d2119] dark:text-[#6f5948] dark:hover:bg-[#f7e7c6] dark:hover:text-[#2d2119]",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className={cn("text-sm font-black", isHeroOverlay ? "text-white" : "text-[#6f5948]")}>
            Login
          </Link>
          <Button href="/credit-score" size="sm">
            Free Check <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            aria-label="Open menu"
            className={cn(
              "grid size-10 place-items-center rounded-full border",
              isHeroOverlay ? "border-white/35 bg-white/12 text-white" : "border-[#6f5948]/20 bg-[#fffdf7]/80 text-[#2d2119]",
            )}
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      <div className={cn("mx-auto grid max-w-7xl transition-all duration-300 lg:hidden", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className={cn(
            "mt-3 space-y-2 rounded-[2rem] border px-4 py-4 shadow-[0_18px_55px_rgba(92,62,37,0.12)]",
            isHeroOverlay ? "border-white/25 bg-[#2d2119]/88" : "border-[#6f5948]/12 bg-[#fffdf7]/95",
          )}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn("block rounded-2xl px-4 py-3 text-sm font-bold", isHeroOverlay ? "text-white hover:bg-white/10" : "text-[#6f5948] hover:bg-[#f7e7c6]")}
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button href="/login" variant="secondary" className="w-full">
                Login
              </Button>
              <Button href="/signup" className="w-full">
                Sign up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
