import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/25">
        <ShieldCheck className="size-5" />
      </span>
      <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">SCORECARE</span>
    </Link>
  );
}
