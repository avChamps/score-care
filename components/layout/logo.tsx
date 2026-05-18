import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-[1.1rem] border border-[#2d2119]/10 bg-gradient-to-br from-[#1f8a5b] via-[#8bd8b6] to-[#f8d96b] text-[#2d2119] shadow-[0_10px_30px_rgba(31,138,91,0.18)]">
        <ShieldCheck className="size-5" />
      </span>
      <span className={light ? "text-lg font-black tracking-tight text-white" : "text-lg font-black tracking-tight text-[#2d2119] dark:text-[#2d2119]"}>SCORECARE</span>
    </Link>
  );
}
