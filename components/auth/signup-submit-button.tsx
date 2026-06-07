"use client";

import Link from "next/link";
import { useState } from "react";
import { ButtonLoader } from "@/components/auth/button-loader";

export function SignupSubmitButton() {
  const [loading, setLoading] = useState(false);

  return (
    <Link
      href="/dashboard"
      onClick={() => setLoading(true)}
      className="relative inline-flex h-12 items-center justify-center rounded-xl bg-[#ff6d00] text-sm font-black text-white transition active:scale-[0.99]"
    >
      {loading ? (
        <>
          <span className="invisible">Create account</span>
          <ButtonLoader className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        </>
      ) : (
        "Create account"
      )}
    </Link>
  );
}
