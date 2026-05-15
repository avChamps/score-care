import type { Metadata } from "next";
import { Bot, BrainCircuit, FileUp, Sparkles, WandSparkles } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { AiShowcase } from "@/components/sections/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "AI Credit Analysis",
  description: "Upload credit reports and receive AI-powered SCORECARE insights, recommendations, and repair paths.",
};

export default function AiAnalysisPage() {
  return (
    <>
      <PageHero eyebrow="AI analysis" title="Turn dense credit reports into clean decisions." body="SCORECARE AI reads repayment behavior, utilization, inquiry risk, and dispute markers to give you a prioritized action plan." primary="Upload report" href="#upload">
        <Card><Bot className="size-12 text-cyan-500" /><p className="mt-6 text-4xl font-black sm:text-5xl">8</p><p className="text-slate-600 dark:text-slate-300">high-impact recommendations found</p></Card>
      </PageHero>
      <Section id="upload">
        <div className="grid gap-8 lg:grid-cols-2">
          <Card className="grid min-h-80 place-items-center border-dashed text-center">
            <div>
              <FileUp className="mx-auto size-14 text-cyan-500" />
              <h2 className="mt-5 text-2xl font-bold">Upload report PDF</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Drag and drop UI placeholder for secure report analysis.</p>
              <Button className="mt-6">Choose file</Button>
            </div>
          </Card>
          <div className="grid gap-5">
            {[
              { Icon: BrainCircuit, title: "Root-cause score diagnosis" },
              { Icon: Sparkles, title: "Smart loan readiness forecast" },
              { Icon: WandSparkles, title: "Personal repair roadmap" },
            ].map(({ Icon, title }) => (
              <Card key={title}><Icon className="size-8 text-cyan-500" /><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Clean, executive-style recommendations with supporting credit factors.</p></Card>
            ))}
          </div>
        </div>
      </Section>
      <AiShowcase />
    </>
  );
}
