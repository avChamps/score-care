import Link from "next/link";
import { type ComponentPropsWithoutRef } from "react";
import {
  BadgeIndianRupee,
  Bell,
  CreditCard,
  Gauge,
  Headphones,
  Home,
  Plus,
  ReceiptText,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PortalShellProps = {
  active: "home" | "score" | "loans" | "fix" | "bills";
  children: React.ReactNode;
};

const navItems = [
  { id: "home", label: "Home", href: "/dashboard", Icon: Home },
  { id: "score", label: "Credit score", href: "/dashboard/credit-score", Icon: Gauge },
  { id: "loans", label: "Loans", href: "/dashboard/loans", Icon: BadgeIndianRupee },
  { id: "fix", label: "Score Fix", href: "/dashboard/score-fix", Icon: Headphones },
  { id: "bills", label: "Bill payments", href: "/dashboard/bill-payments", Icon: ReceiptText },
] as const;

export function PortalShell({ active, children }: PortalShellProps) {
  return (
    <section className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white/80 px-4 py-5 lg:block">
          <Link href="/" className="mb-7 flex items-center gap-3 px-3">
            <span className="grid size-8 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 text-[0.7rem] font-black text-white">
              SC
            </span>
            <span className="text-sm font-black tracking-tight">SCORECARE</span>
          </Link>
          <NavItems active={active} direction="side" />
        </aside>
        <div className="min-w-0 pb-24 lg:pb-0">
          {children}
        </div>
      </div>
      <BottomNav active={active} />
    </section>
  );
}

export function PortalTopBar({ title, backHref }: { title?: string; backHref?: string }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 px-4 py-2.5 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link href={backHref} aria-label="Back" className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700">
              <span className="text-2xl leading-none">&lsaquo;</span>
            </Link>
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-cyan-500/10 text-cyan-600">
              <User className="size-5" />
            </div>
          )}
          {title ? (
            <div className="min-w-0">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-cyan-600">Dashboard</p>
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">{title}</h1>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">Welcome back</p>
              <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">Hi Gosu Disendra</h1>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <IconCircle label="Support">
            <Headphones className="size-5" />
          </IconCircle>
          <IconCircle label="Notifications">
            <Bell className="size-5" />
          </IconCircle>
        </div>
      </div>
    </div>
  );
}

export function PageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8 lg:py-6", className)}>{children}</div>;
}

export function AppCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_42px_rgba(15,23,42,0.07)] sm:p-5", className)}>
      {children}
    </div>
  );
}

type PrimaryPortalButtonProps = ComponentPropsWithoutRef<"button"> & {
  href?: string;
  children: React.ReactNode;
};

export function PrimaryPortalButton({ children, href, className, ...props }: PrimaryPortalButtonProps) {
  const classes = cn(
    "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-5 text-xs font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)] sm:h-11 sm:text-sm",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function ScoreGauge({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("relative mx-auto mt-4 h-52 max-w-sm", compact && "h-40")}>
      <div className="absolute inset-x-8 top-5 h-32 rounded-t-full border-[1.15rem] border-b-0 border-slate-200" />
      <div className="absolute left-1/2 top-[7.55rem] size-5 -translate-x-1/2 rounded-full bg-cyan-500" />
      <div className="absolute left-[34%] top-[7.65rem] h-3 w-24 origin-right -rotate-5 rounded-full bg-cyan-500 [clip-path:polygon(0_50%,100%_0,100%_100%)]" />
      <div className="absolute inset-x-0 bottom-8 flex justify-between text-base font-semibold text-slate-500">
        <span>300</span>
        <span>900</span>
      </div>
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-xl text-slate-400">-</div>
    </div>
  );
}

export function CreditReportBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_42px_rgba(15,23,42,0.07)]">
      <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-cyan-500 to-emerald-400" />
      <div className="relative z-10 pr-24">
        <p className="text-sm font-bold uppercase tracking-tight text-slate-950">Credit Report</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">Track score health, report status, and improvement opportunities.</p>
      </div>
      <div className="absolute right-5 top-1/2 grid size-14 -translate-y-1/2 place-items-center rounded-2xl bg-cyan-50 text-cyan-600">
        <Gauge className="size-7" />
      </div>
    </div>
  );
}

export function ListAction({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-slate-50 text-cyan-600">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-slate-950">{title}</span>
        <span className="block text-sm text-slate-500">{subtitle}</span>
      </span>
      <span className="text-2xl leading-none text-slate-300 transition group-hover:text-cyan-500">&rsaquo;</span>
    </Link>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-7 text-xl font-bold tracking-tight text-slate-950">{children}</h2>;
}

export function LoanSummaryCard({ tone, title, value, caption }: { tone: "green" | "red"; title: string; value: string; caption: string }) {
  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", tone === "green" ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-base font-bold leading-tight text-slate-950">{title}</p>
        {tone === "green" ? <ReceiptText className="size-8 text-emerald-600" /> : <InfoIcon className="border-rose-300 text-rose-500" />}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
      <p className="mt-3 text-sm text-slate-600">{caption}</p>
    </div>
  );
}

export function LoanCard({ overdue = false }: { overdue?: boolean }) {
  return (
    <AppCard className={cn("space-y-5", overdue && "border-rose-200 bg-rose-50")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold">HDFC Bank</h3>
          <p className="text-slate-500">Suresh patel</p>
        </div>
        <span className={cn("rounded-full border px-4 py-2 text-sm font-bold", overdue ? "border-rose-300 text-rose-600" : "border-emerald-200 text-emerald-600")}>
          {overdue ? "Disbursed" : "Active"}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <p className="text-2xl font-bold">Rs.500,000</p>
        <p className="pb-1 text-sm text-slate-500">Loan Amount</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <MiniMetric title="EMI Amount" value="Rs.500,000" />
        <MiniMetric title="Next EMI" value="5 Feb" />
      </div>
      {overdue ? <div className="rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-rose-600">Rs.23,200 overdue - Affects CIBIL</div> : null}
      <PrimaryPortalButton className={cn("w-full", overdue && "bg-none bg-rose-500 shadow-rose-200")}>
        <CreditCard className="size-6" /> Pay EMI 15,000
      </PrimaryPortalButton>
      <div className="grid grid-cols-3 gap-3 text-sm text-slate-600">
        <span>Sanctioned<br />5/1/2025</span>
        <span>Disbursed<br />5/1/2025</span>
        <span className="text-right">1/36<br />EMIS</span>
      </div>
    </AppCard>
  );
}

export function UtilityTile({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="min-w-0 rounded-[1.2rem] border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-lg">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-50 text-cyan-600 sm:size-14">{icon}</span>
      <span className="mt-2 block text-xs font-semibold leading-tight text-slate-700 sm:text-sm">{label}</span>
    </button>
  );
}

export function PlusApplyButton() {
  return (
    <Link href="/dashboard/loans" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200">
      <Plus className="size-5" /> Apply for Loan
    </Link>
  );
}

function BottomNav({ active }: { active: PortalShellProps["active"] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map(({ id, label, href, Icon }) => {
          const selected = id === active;
          return (
            <Link key={id} href={href} className={cn("flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-bold text-slate-400", selected && "bg-cyan-50 text-cyan-700")}>
              <Icon className="size-5" strokeWidth={selected ? 2.5 : 1.8} />
              <span className="text-center leading-tight">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavItems({ active, direction }: { active: PortalShellProps["active"]; direction: "side" }) {
  return (
    <div className={cn("grid gap-1.5", direction === "side" && "text-xs")}>
      {navItems.map(({ id, label, href, Icon }) => {
        const selected = id === active;
        return (
          <Link key={id} href={href} className={cn("flex items-center gap-3 rounded-xl px-4 py-2.5 font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-950", selected && "bg-cyan-50 text-cyan-700")}>
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function IconCircle({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button aria-label={label} className="grid size-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm sm:size-10">
      {children}
    </button>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-1 text-base font-bold text-slate-950">{value}</p>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return <span className={cn("grid size-9 place-items-center rounded-full border-2 text-lg font-black", className)}>i</span>;
}
