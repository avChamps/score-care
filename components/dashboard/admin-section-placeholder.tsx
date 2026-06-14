import type { ElementType } from "react";
import { AppCard } from "@/components/dashboard/portal-ui";

type AdminSectionPlaceholderProps = {
  Icon: ElementType;
  title: string;
  description: string;
  items: string[];
};

export function AdminSectionPlaceholder({ Icon, description, items, title }: AdminSectionPlaceholderProps) {
  return (
    <div className="space-y-5 animate-[creditPanelIn_0.42s_ease-out]">
      <AppCard>
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--portal-blue-soft)] text-[var(--portal-blue)]">
            <Icon className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[var(--portal-orange)]">Admin</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--portal-ink)]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--portal-muted)]">{description}</p>
          </div>
        </div>
      </AppCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, index) => (
          <AppCard key={item} className="animate-[creditPanelIn_0.45s_ease-out_both]" style={{ animationDelay: `${index * 55}ms` }}>
            <p className="text-sm font-black text-[var(--portal-ink)]">{item}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--portal-muted)]">Ready for the connected admin API data.</p>
          </AppCard>
        ))}
      </div>
    </div>
  );
}
