/**
 * client/src/pages/safeguarding.tsx
 * ─────────────────────────────────────
 * Safeguarding, Welfare & Policies. Links are admin-managed (Club >
 * Safeguarding) — no specific FA/Northumberland FA URLs are hard-coded
 * here, since that wording has to come from the club's Welfare Officer.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { ShieldCheck, ExternalLink, AlertTriangle } from "lucide-react";
import config from "@/lib/tenant";
import type { PolicyLink, CommitteeMember } from "@shared/schema";

const { brand } = config;

export default function Safeguarding() {
  const { data: links = [] } = useQuery<PolicyLink[]>({ queryKey: ["/api/public/policy-links"] });
  const { data: committee = [] } = useQuery<CommitteeMember[]>({ queryKey: ["/api/public/committee"] });
  const welfareOfficer = committee.find((m) => m.role.toLowerCase().includes("welfare"));

  useEffect(() => {
    applySeo({
      title: `Safeguarding & Welfare · ${brand.name}`,
      description: `Safeguarding, welfare and policy information for ${brand.name}.`,
      path: "/safeguarding",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Safeguarding", path: "/safeguarding" }])],
    });
  }, []);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Safeguarding, welfare &amp; policies</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Safe for <span className="font-serif italic font-medium text-primary">every child</span>.
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6">
            <p className="text-sm text-foreground/85 leading-relaxed">
              Safeguarding children is everyone's responsibility. {brand.name} is committed to the welfare of every
              player and has safeguarding arrangements in place, including a dedicated Welfare Officer.
            </p>
          </div>

          {welfareOfficer && (
            <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6">
              <h2 className="font-display font-bold mb-1">Club Welfare Officer</h2>
              <p className="text-sm text-foreground/85">{welfareOfficer.name}</p>
              {welfareOfficer.email && <a href={`mailto:${welfareOfficer.email}`} className="text-sm text-primary hover:underline">{welfareOfficer.email}</a>}
            </div>
          )}

          {links.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-5 sm:p-6">
              <h2 className="font-display font-bold mb-3">Official policies &amp; resources</h2>
              <div className="space-y-2">
                {links.map((l) => (
                  <a key={l.id} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                    {l.title} <ExternalLink className="size-3.5" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 sm:p-6">
            <h2 className="font-display font-bold mb-1 flex items-center gap-1.5 text-destructive"><AlertTriangle className="size-4" /> Have a safeguarding concern?</h2>
            <p className="text-sm text-foreground/85 mt-1">
              A safeguarding concern should go straight to the Club Welfare Officer above, not through the general complaints process.
            </p>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Have a different kind of complaint? <Link href="/complaints" className="text-primary hover:underline">Submit it here</Link>.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
