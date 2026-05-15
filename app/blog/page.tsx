import type { Metadata } from "next";
import Image from "next/image";
import { blogPosts } from "@/lib/site";
import { Card } from "@/components/ui/card";
import { Section, SectionHeader } from "@/components/ui/section";

export const metadata: Metadata = { title: "Blog", description: "SCORECARE credit strategy articles and fintech guides." };

export default function BlogPage() {
  return (
    <Section>
      <SectionHeader eyebrow="Blog" title="Credit strategy for modern builders." body="Insightful guides for individuals, founders, and finance teams." />
      <div className="grid gap-6 lg:grid-cols-3">{blogPosts.map((post) => <Card key={post.title} className="overflow-hidden p-0"><div className="relative aspect-[4/3]"><Image src={post.image} alt={post.title} fill className="object-cover" sizes="(min-width: 1024px) 33vw, 100vw" /></div><div className="p-6"><p className="text-sm font-bold text-cyan-500">{post.category} • {post.read}</p><h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{post.title}</h2></div></Card>)}</div>
    </Section>
  );
}
