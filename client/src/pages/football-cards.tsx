/**
 * client/src/pages/football-cards.tsx
 * ───────────────────────────────────────
 * Public listing of football cards — a "40 team card" style fundraiser.
 * Pick a team, same idea as the club's own paper cards, except the draw
 * happens here once every team is taken.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { applySeo, breadcrumb } from "@/lib/seo";
import { gbp } from "@/lib/format";
import { Shield } from "lucide-react";
import config from "@/lib/tenant";
import type { FootballCard } from "@shared/schema";

const { brand } = config;

export default function FootballCards() {
  const { data: cards = [] } = useQuery<FootballCard[]>({ queryKey: ["/api/public/football-cards"] });

  useEffect(() => {
    applySeo({
      title: `Football Cards · ${brand.name}`,
      description: `Pick a team and support ${brand.name} — once every team's taken, one is drawn at random.`,
      path: "/football-cards",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Football Cards", path: "/football-cards" }])],
    });
  }, []);

  const live = cards.filter((c) => c.status === "live");
  const past = cards.filter((c) => c.status === "drawn");

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Football cards</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Pick a team, <span className="font-serif italic font-medium text-primary">back the Wolves</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Claim a team for a flat stake. Once every team on the card is taken, one is drawn at random — whoever has that team wins the prize.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {live.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nothing live right now — check back soon for the next card.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {live.map((c) => <CardCard key={c.id} c={c} />)}
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display font-bold text-xl mb-4">Past cards</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {past.map((c) => <CardCard key={c.id} c={c} />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function CardCard({ c }: { c: FootballCard }) {
  const closed = c.status !== "live";
  return (
    <Link href={`/football-cards/${c.id}`}>
      <div className="group bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm hover-elevate cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/30 via-accent/15 to-primary/40 flex items-center justify-center overflow-hidden">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <Shield className="size-16 text-white/40" strokeWidth={1.2} />
          )}
          <Badge className="absolute top-3 left-3 text-[10px] uppercase" variant={closed ? "secondary" : "default"}>
            {c.status === "live" ? "Live" : "Winner drawn"}
          </Badge>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-display font-bold text-lg">{c.title}</h3>
          {c.inAidOf && <p className="text-sm text-muted-foreground mt-1.5">In aid of {c.inAidOf}</p>}
          <div className="mt-auto pt-4 text-sm font-semibold text-primary">
            {gbp(c.stake)} per team{c.prizeAmount > 0 ? ` · ${gbp(c.prizeAmount)} prize` : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}
