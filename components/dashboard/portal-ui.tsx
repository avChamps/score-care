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
import { TopBarActions } from "@/components/dashboard/topbar-actions";
import { dashboardActionsDisabled } from "@/lib/dashboard-lock";
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
    <section className={cn("portal-theme relative min-h-screen overflow-hidden text-[var(--portal-ink)] lg:h-screen", dashboardActionsDisabled && "dashboard-actions-disabled")}>
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl lg:h-screen lg:grid-cols-[248px_1fr]">
        <aside className="portal-surface m-4 hidden rounded-2xl border px-3 py-4 lg:block lg:h-[calc(100vh-2rem)] lg:overflow-hidden">
          <Link href="/dashboard" data-dashboard-home="true" className="mb-6 flex items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-[var(--portal-blue-soft)]">
            <span className="grid size-9 place-items-center rounded-2xl bg-[var(--portal-blue)] text-[0.7rem] font-black text-white shadow-[0_10px_22px_rgba(7,112,227,0.22)]">
              SC
            </span>
            <span className="text-sm font-black tracking-tight text-[var(--portal-ink)]">SCORECARE</span>
          </Link>
          <NavItems active={active} direction="side" />
        </aside>
        <div className="min-w-0 pb-24 lg:h-screen lg:overflow-y-auto lg:pb-0">
          {children}
        </div>
      </div>
      <BottomNav active={active} />
    </section>
  );
}

export function PortalTopBar({ title, backHref }: { title?: string; backHref?: string }) {
  return (
    <div className="sticky top-0 z-20 border-b border-[var(--portal-border)] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {backHref ? (
            <Link href={backHref} data-dashboard-home={backHref === "/dashboard" ? "true" : undefined} aria-label="Back" className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--portal-border)] bg-white text-[var(--portal-muted)] transition hover:border-[var(--portal-blue)] hover:text-[var(--portal-blue)]">
              <span className="text-2xl leading-none">&lsaquo;</span>
            </Link>
          ) : (
            <Link href="/profile" data-dashboard-profile="true" aria-label="Open profile" className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--portal-blue-soft)] text-[var(--portal-blue)] transition hover:bg-[#dceeff]">
              <User className="size-5" />
            </Link>
          )}
          {title ? (
            <div className="min-w-0">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">ScoreCare</p>
              <h1 className="truncate text-base font-black tracking-tight text-[var(--portal-ink)] sm:text-lg">{title}</h1>
            </div>
          ) : (
            <div className="min-w-0">
              <p className="text-xs font-bold text-[var(--portal-muted)]">Welcome back</p>
              <h1 className="truncate text-base font-black tracking-tight text-[var(--portal-ink)] sm:text-lg">Hi Gosu Disendra</h1>
            </div>
          )}
        </div>
        <TopBarActions />
      </div>
    </div>
  );
}

export function PageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8", className)}>{children}</div>;
}

type AppCardProps = ComponentPropsWithoutRef<"div"> & {
  children: React.ReactNode;
};

export function AppCard({ className, children, ...props }: AppCardProps) {
  return (
    <div className={cn("portal-card rounded-[var(--portal-radius)] border p-4 sm:p-5", className)} {...props}>
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
    "inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-[var(--portal-orange)] bg-[var(--portal-orange)] px-5 text-xs font-black text-white shadow-[0_2px_6px_rgba(255,109,0,0.24)] transition hover:bg-[var(--portal-orange-deep)] sm:h-11 sm:text-sm",
    className,
  );

  if (href) {
    if (dashboardActionsDisabled) {
      return (
        <span aria-disabled="true" className={cn(classes, "cursor-not-allowed opacity-55 hover:bg-[var(--portal-orange)]")}>
          {children}
        </span>
      );
    }

    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button {...props} className={cn(classes, dashboardActionsDisabled && "cursor-not-allowed opacity-55 hover:bg-[var(--portal-orange)]")} disabled={dashboardActionsDisabled || props.disabled}>
      {children}
    </button>
  );
}

export function ScoreGauge({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("relative mx-auto mt-4 h-52 max-w-sm", compact && "h-40")}>
      <div className="absolute inset-x-8 top-5 h-32 rounded-t-full border-[1.15rem] border-b-0 border-[var(--portal-blue-soft)]" />
      <div className="absolute left-1/2 top-[7.55rem] size-5 -translate-x-1/2 rounded-full bg-[var(--portal-blue)]" />
      <div className="absolute left-[34%] top-[7.65rem] h-3 w-24 origin-right -rotate-5 rounded-full bg-[var(--portal-blue)] [clip-path:polygon(0_50%,100%_0,100%_100%)]" />
      <div className="absolute inset-x-0 bottom-8 flex justify-between text-base font-semibold text-[var(--portal-muted)]">
        <span>300</span>
        <span>900</span>
      </div>
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-xl text-[var(--portal-muted)]/60">-</div>
    </div>
  );
}

export function CreditReportBanner() {
  return (
    <div className="portal-card relative overflow-hidden rounded-[var(--portal-radius)] border p-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-[var(--portal-blue)]" />
      <div className="relative z-10 pr-24">
        <p className="text-sm font-black uppercase tracking-tight text-[var(--portal-ink)]">Credit Report</p>
        <p className="mt-2 text-xs leading-5 text-[var(--portal-muted)]">Track score health, report status, and improvement opportunities.</p>
      </div>
      <div className="absolute right-5 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">
        <Bell className="size-6" />
      </div>
    </div>
  );
}

export function ListAction({ icon, title, subtitle, href }: { icon: React.ReactNode; title: string; subtitle: string; href: string }) {
  const classes = "group flex items-center gap-3 rounded-[var(--portal-radius)] border border-[var(--portal-border)] bg-white p-4 shadow-[var(--portal-shadow-soft)] transition hover:border-[var(--portal-blue)]";

  if (dashboardActionsDisabled) {
    return (
      <div aria-disabled="true" className={cn(classes, "cursor-not-allowed opacity-55 hover:border-[var(--portal-border)]")}>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-[var(--portal-ink)]">{title}</span>
          <span className="block text-sm text-[var(--portal-muted)]">{subtitle}</span>
        </span>
        <span className="text-2xl leading-none text-[var(--portal-muted)]/35">&rsaquo;</span>
      </div>
    );
  }

  return (
    <Link href={href} className={classes}>
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--portal-border)] bg-[var(--portal-blue-soft)] text-[var(--portal-blue)] transition group-hover:bg-[var(--portal-orange-soft)] group-hover:text-[var(--portal-orange)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-black text-[var(--portal-ink)]">{title}</span>
        <span className="block text-sm text-[var(--portal-muted)]">{subtitle}</span>
      </span>
      <span className="text-2xl leading-none text-[var(--portal-muted)]/35 transition group-hover:text-[var(--portal-blue)]">&rsaquo;</span>
    </Link>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-7 text-xl font-black tracking-tight text-[var(--portal-ink)]">{children}</h2>;
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
    <button className="min-w-0 cursor-not-allowed rounded-[1.2rem] border border-slate-200 bg-white p-4 text-center opacity-55 shadow-sm" disabled type="button">
      <span className="mx-auto grid size-12 place-items-center rounded-xl bg-slate-50 text-cyan-600 sm:size-14">{icon}</span>
      <span className="mt-2 block text-xs font-semibold leading-tight text-slate-700 sm:text-sm">{label}</span>
    </button>
  );
}

export function PlusApplyButton() {
  if (dashboardActionsDisabled) {
    return (
      <span aria-disabled="true" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-[var(--portal-orange)] px-5 py-3 text-sm font-bold text-white opacity-55 shadow-[0_2px_6px_rgba(255,109,0,0.2)]">
        <Plus className="size-5" /> Apply for Loan
      </span>
    );
  }

  return (
    <Link href="/dashboard/loans" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--portal-orange)] px-5 py-3 text-sm font-bold text-white shadow-[0_2px_6px_rgba(255,109,0,0.2)]">
      <Plus className="size-5" /> Apply for Loan
    </Link>
  );
}

function BottomNav({ active }: { active: PortalShellProps["active"] }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--portal-border)] bg-white px-2 py-1.5 shadow-[0_-8px_20px_rgba(16,24,40,0.08)] lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {navItems.map(({ id, label, href, Icon }) => {
          const selected = id === active;
          const disabled = dashboardActionsDisabled && id !== "home";
          if (disabled) {
            return (
              <button
                key={id}
                aria-disabled="true"
                className="relative flex cursor-not-allowed flex-col items-center justify-center gap-1 px-1 py-2 text-[0.66rem] font-black text-[var(--portal-muted)] opacity-45"
                type="button"
              >
                <Icon className="size-5" strokeWidth={1.8} />
                <span className="text-center leading-tight">{label}</span>
              </button>
            );
          }

          return (
            <Link key={id} href={href} data-dashboard-home={id === "home" ? "true" : undefined} className={cn("relative flex flex-col items-center justify-center gap-1 px-1 py-2 text-[0.66rem] font-black text-[var(--portal-muted)]", selected && "text-[var(--portal-ink)] after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-9 after:-translate-x-1/2 after:rounded-full after:bg-[var(--portal-orange)]")}>
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
        const disabled = dashboardActionsDisabled && id !== "home";
        if (disabled) {
          return (
            <button
              key={id}
              aria-disabled="true"
              className="flex cursor-not-allowed items-center gap-3 rounded-2xl border-l-4 border-transparent px-3 py-2.5 text-left font-black text-[var(--portal-muted)] opacity-45"
              type="button"
            >
              <Icon className="size-4" />
              {label}
            </button>
          );
        }

        return (
          <Link key={id} href={href} data-dashboard-home={id === "home" ? "true" : undefined} className={cn("flex items-center gap-3 rounded-2xl border-l-4 border-transparent px-3 py-2.5 font-black text-[var(--portal-muted)] transition hover:bg-[var(--portal-blue-soft)] hover:text-[var(--portal-blue)]", selected && "border-[var(--portal-orange)] bg-[var(--portal-blue-soft)] text-[var(--portal-blue)] hover:bg-[var(--portal-blue-soft)] hover:text-[var(--portal-blue)]")}>
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--portal-border)] bg-[var(--portal-surface-soft)] p-4">
      <p className="text-sm font-bold text-[var(--portal-muted)]">{title}</p>
      <p className="mt-1 text-base font-black text-[var(--portal-ink)]">{value}</p>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return <span className={cn("grid size-9 place-items-center rounded-full border-2 text-lg font-black", className)}>i</span>;
}
