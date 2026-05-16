import type { Metadata } from "next";
import {
  BadgeCheck,
  CalendarDays,
  Download,
  FileText,
  HelpCircle,
  Languages,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ReceiptText,
  Shield,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import { AppCard, PageContent, PortalShell, PortalTopBar } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your SCORECARE user profile, KYC details, subscriptions, and account options.",
};

const details = [
  { label: "First Name", value: "Rajesh", Icon: UserRound },
  { label: "Last Name", value: "Sharma", Icon: UserRound },
  { label: "Email", value: "rajesh.sharma@email.com", Icon: Mail },
  { label: "Mobile Number", value: "+91 98765 43210", Icon: Phone },
  { label: "PAN Number", value: "ABCDE1234F", Icon: WalletCards },
  { label: "Aadhaar Number", value: "XXXX XXXX 1234", Icon: Shield },
  { label: "Date of Birth", value: "12 Jan 1992", Icon: CalendarDays },
  { label: "State", value: "Maharashtra", Icon: MapPin },
];

const options = [
  { label: "Subscription Plan", Icon: ReceiptText },
  { label: "Payment History", Icon: CalendarDays },
  { label: "CIBIL Reports History", Icon: Download },
  { label: "Change Language", Icon: Languages },
  { label: "Help & Support", Icon: HelpCircle },
  { label: "Terms & Conditions", Icon: FileText },
  { label: "Privacy Policy", Icon: Shield },
];

export default function ProfilePage() {
  return (
    <PortalShell active="home">
      <PortalTopBar title="Profile" backHref="/dashboard" />
      <PageContent>
        <div className="space-y-6 animate-[creditPanelIn_0.42s_ease-out]">
          <section className="text-center">
            <div className="mx-auto grid size-20 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_18px_42px_rgba(37,99,235,0.22)]">
              <UserRound className="size-9" />
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
              <BadgeCheck className="size-4" /> KYC Verified
            </div>
          </section>

          <AppCard>
            <div>
              <h2 className="text-base font-bold text-slate-950">Personal Details</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Profile details cannot be edited after KYC verification.</p>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {details.map(({ Icon, label, value }) => (
                <div key={label} className="grid grid-cols-[2.5rem_1fr] gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid size-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-cyan-700">
                    <Icon className="size-5" strokeWidth={1.9} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.68rem] font-semibold text-slate-500">{label}</p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-900">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard className="p-0">
            <div className="divide-y divide-slate-100">
              {options.map(({ Icon, label }) => (
                <button key={label} className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-cyan-50/50 sm:px-5" type="button">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-600 transition group-hover:bg-white group-hover:text-cyan-700">
                    <Icon className="size-4.5" strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-bold text-slate-800">{label}</span>
                  <span className="text-lg leading-none text-slate-300 transition group-hover:text-cyan-600">&rsaquo;</span>
                </button>
              ))}
            </div>
          </AppCard>

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="h-11 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700" type="button">
              <span className="inline-flex items-center gap-2">
                <LogOut className="size-4" /> Logout
              </span>
            </button>
            <button className="h-11 rounded-2xl border border-rose-100 bg-rose-50 text-xs font-bold text-rose-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200" type="button">
              <span className="inline-flex items-center gap-2">
                <Trash2 className="size-4" /> Delete Account
              </span>
            </button>
          </div>
        </div>
      </PageContent>
    </PortalShell>
  );
}
