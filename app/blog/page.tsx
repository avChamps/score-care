import type { Metadata } from "next";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { blogPosts } from "@/lib/site";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = { title: "Blog", description: "SCORECARE credit strategy articles and fintech guides." };

export default function BlogPage() {
  return (
    <Section className="organic-shell">
      <SectionHeader eyebrow="Blog" title="Credit strategy for modern builders." body="Insightful guides for individuals, founders, and finance teams." />
      <div className="grid gap-6 lg:grid-cols-3">
        {blogPosts.map((post, index) => (
          <Card key={post.title} className="overflow-hidden p-0">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#2d2119]">
              <div className="absolute inset-0 organic-rings opacity-20" />
              <div className={`absolute left-6 top-6 h-24 w-2/5 rounded-[2rem] ${index === 0 ? "bg-[#8bd8b6]/35" : index === 1 ? "bg-[#f8d96b]/35" : "bg-[#ffb38a]/35"}`} />
              <div className="absolute bottom-6 right-6 grid size-16 place-items-center rounded-[1.5rem] bg-[#fff7e8] text-[#1f8a5b]">
                <BookOpen className="size-7" />
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm font-black text-[#1f8a5b]">{post.category} · {post.read}</p>
              <h2 className="mt-3 text-xl font-black text-[#2d2119]">{post.title}</h2>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[#6f5948]">
                Read guide <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
