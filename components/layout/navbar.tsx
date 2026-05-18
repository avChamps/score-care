"use client";

import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import { navItems } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-transparent px-3 py-3 sm:px-5">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between rounded-full border border-[#6f5948]/12 bg-[#fffdf7]/88 px-4 shadow-[0_18px_55px_rgba(92,62,37,0.12)] backdrop-blur-2xl sm:px-6 lg:px-7">
        <Logo />
        <div className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-bold text-[#6f5948] transition hover:bg-[#f7e7c6] hover:text-[#2d2119] dark:text-[#6f5948] dark:hover:bg-[#f7e7c6] dark:hover:text-[#2d2119]"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-sm font-black text-[#6f5948]">
            Login
          </Link>
          <Button href="/credit-score" size="sm">
            Free Check <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <button
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-full border border-[#6f5948]/20 bg-[#fffdf7]/80 text-[#2d2119]"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      <div className={cn("mx-auto grid max-w-7xl transition-all duration-300 lg:hidden", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
        <div className="overflow-hidden">
          <div className="mt-3 space-y-2 rounded-[2rem] border border-[#6f5948]/12 bg-[#fffdf7]/95 px-4 py-4 shadow-[0_18px_55px_rgba(92,62,37,0.12)]">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-2xl px-4 py-3 text-sm font-bold text-[#6f5948] hover:bg-[#f7e7c6]"
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
