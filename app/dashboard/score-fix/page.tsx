import type { Metadata } from "next";
import { ChevronDown, Upload } from "lucide-react";
import { AppCard, PageContent, PortalShell, PortalTopBar, PrimaryPortalButton } from "@/components/dashboard/portal-ui";

export const metadata: Metadata = {
  title: "Score Fix Request",
  description: "Submit CIBIL repair requests with card selection, report upload, issue description, and urgency.",
};

export default function ScoreFixRequestPage() {
  return (
    <PortalShell active="fix">
      <PortalTopBar title="Score Fix Request" backHref="/dashboard" />
      <PageContent>
      <form>
        <div className="grid gap-6 lg:grid-cols-2">
        <AppCard>
        <FieldLabel label="Full name As per (PAN)" required />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
          <p className="text-base font-bold">Rajesh.sharma</p>
          <p className="text-sm text-slate-500">Auto-fetched from PAN-verified profile</p>
        </div>

        <FieldLabel className="mt-8" label="Select Your Card" required />
        <button type="button" className="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-left text-sm font-semibold text-slate-400">
          Select your card
          <ChevronDown className="size-6" />
        </button>
        </AppCard>

        <AppCard>
        <FieldLabel className="mt-9" label="Upload Latest CIBIL Report" required />
        <label className="grid h-36 cursor-pointer place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-500 transition hover:border-cyan-400 hover:bg-cyan-50/50">
          <input type="file" className="sr-only" />
          <span>
            <Upload className="mx-auto mb-3 size-10" />
            Click to upload CIBIL Report
          </span>
        </label>
        <p className="mt-3 text-sm text-slate-500">*Max 10 MB * Report must be within last 30 days</p>
        </AppCard>
        </div>

        <AppCard className="mt-6">
        <FieldLabel className="mt-9" label="Issue Description" required />
        <textarea
          className="min-h-56 w-full resize-none rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-400/10"
          placeholder="Describe the issue you are facing in simple words..."
          maxLength={1000}
        />
        <div className="mt-3 flex justify-between text-sm text-slate-500">
          <span>Min 50, Max 1000 characters</span>
          <span>0/1000</span>
        </div>

        <h2 className="mt-7 text-base font-bold">Examples:</h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-slate-600">
          <li>Loan closed but still showing active</li>
          <li>Late payment wrongly marked even through EMI was paid</li>
        </ul>
        </AppCard>

        <AppCard className="mt-6">
        <FieldLabel className="mt-7" label="Type of Urgency" required />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Low", "Informational correction"],
            ["Medium", "Impacting score slowly"],
            ["High", "Affecting loan eligibility"],
            ["Critical", "Immediate loan rejection risk"],
          ].map(([title, subtitle], index) => (
            <button
              key={title}
              type="button"
              className={`rounded-xl border p-4 text-left ${index === 0 ? "border-cyan-200 bg-cyan-50 text-cyan-800" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <span className="block text-base font-bold">{title}</span>
              <span className="mt-1 block text-sm text-slate-500">{subtitle}</span>
            </button>
          ))}
        </div>

        <PrimaryPortalButton className="mt-8 w-full sm:w-auto">Submit Request</PrimaryPortalButton>
        </AppCard>
      </form>
      </PageContent>
    </PortalShell>
  );
}

function FieldLabel({ label, required, className }: { label: string; required?: boolean; className?: string }) {
  return (
    <label className={`mb-3 block text-sm font-bold text-slate-800 ${className ?? ""}`}>
      {label}
      {required ? <span className="text-rose-400"> *</span> : null}
    </label>
  );
}
