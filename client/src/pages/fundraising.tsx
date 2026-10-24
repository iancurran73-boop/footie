/**
 * client/src/pages/fundraising.tsx
 * ───────────────────────────────────
 * Public fundraising page — a target/raised progress bar per fundraiser,
 * same idea as the club's existing Facebook graphic.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { gbp } from "@/lib/format";
import { Heart, ExternalLink } from "lucide-react";
import { FundraiserGauge } from "@/components/fundraiser-gauge";
import config from "@/lib/tenant";
import type { Fundraiser } from "@shared/schema";

const { brand } = config;

export default function Fundraising() {
  const { data: fundraisers = [] } = useQuery<Fundraiser[]>({ queryKey: ["/api/public/fundraisers"] });

  useEffect(() => {
    applySeo({
      title: `Fundraising · ${brand.name}`,
      description: `Current fundraising targets at ${brand.name}.`,
      path: "/fundraising",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Fundraising", path: "/fundraising" }])],
    });
  }, []);

  const active = fundraisers.filter((f) => f.status === "active");
  const completed = fundraisers.filter((f) => f.status === "completed");

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Our goal, a brighter future</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Stronger <span className="font-serif italic font-medium text-primary">together</span>.
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
          {active.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center gap-2">
              <Heart className="size-8 text-muted-foreground/50" />
              No active fundraisers right now — check back soon.
            </p>
          ) : (
            <div className="space-y-6">
              {active.map((f) => <FundraiserCard key={f.id} f={f} />)}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Completed</h2>
              <div className="space-y-4">
                {completed.map((f) => <FundraiserCard key={f.id} f={f} compact />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function FundraiserCard({ f, compact }: { f: Fundraiser; compact?: boolean }) {
  const updates = f.updatesText.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm" data-testid={`card-fundraiser-${f.id}`}>
      {!compact && f.photoUrl && (
        <img src={f.photoUrl} alt={f.name} className="w-full aspect-[21/9] object-cover" loading="lazy" />
      )}
      <div className="p-5 sm:p-6">
        <h2 className="font-display font-bold text-xl text-center sm:text-left">{f.name}</h2>
        {f.description && <p className="text-sm text-muted-foreground mt-1.5 text-center sm:text-left">{f.description}</p>}

        <div className="mt-2">
          <FundraiserGauge raised={f.raisedAmount} target={f.targetAmount} />
        </div>

        {f.donationLink && (
          <div className="text-center sm:text-left">
            <a href={f.donationLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-primary hover:underline">
              Donate or find out more <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}

        {updates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-card-border space-y-2">
            {updates.map((u, i) => (
              <p key={i} className="text-sm font-semibold text-center bg-accent/15 text-accent-foreground rounded-full px-4 py-2">{u}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
