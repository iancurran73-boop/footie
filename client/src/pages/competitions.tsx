/**
 * client/src/pages/competitions.tsx
 * ────────────────────────────────────
 * Public listing of live (and recently drawn/closed) raffles & auctions.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { applySeo, breadcrumb } from "@/lib/seo";
import { gbp } from "@/lib/format";
import { Ticket, Gavel, Trophy } from "lucide-react";
import config from "@/lib/tenant";
import type { Competition } from "@shared/schema";

const { brand } = config;

export default function Competitions() {
  const { data: competitions = [] } = useQuery<Competition[]>({ queryKey: ["/api/public/competitions"] });

  useEffect(() => {
    applySeo({
      title: `Raffles & Auctions · ${brand.name}`,
      description: `Enter a raffle or place a bid to support ${brand.name}.`,
      path: "/competitions",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Raffles & auctions", path: "/competitions" }])],
    });
  }, []);

  const live = competitions.filter((c) => c.status === "live");
  const past = competitions.filter((c) => c.status === "drawn" || c.status === "closed");

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Raffles &amp; auctions</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Win a prize, <span className="font-serif italic font-medium text-primary">fund the club</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Every ticket and every bid goes straight back into {brand.name} — kit, pitch fees and coaching.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {live.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              Nothing live right now — check back soon for the next raffle or auction.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {live.map((c) => <CompetitionCard key={c.id} c={c} />)}
            </div>
          )}

          {past.length > 0 && (
            <div className="mt-14">
              <h2 className="font-display font-bold text-xl mb-4">Past competitions</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {past.map((c) => <CompetitionCard key={c.id} c={c} />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function CompetitionCard({ c }: { c: Competition }) {
  const closed = c.status !== "live";
  return (
    <Link href={`/competitions/${c.id}`}>
      <div className="group bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm hover-elevate cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/30 via-accent/15 to-primary/40 flex items-center justify-center overflow-hidden">
          {c.imageUrl ? (
            <img src={c.imageUrl} alt={c.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          ) : (
            <Trophy className="size-16 text-white/40" strokeWidth={1.2} />
          )}
          <Badge className="absolute top-3 left-3 text-[10px] uppercase" variant={closed ? "secondary" : "default"}>
            {c.status === "live" ? "Live" : c.status === "drawn" ? "Winner drawn" : "Closed"}
          </Badge>
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
            {c.type === "raffle" ? <Ticket className="size-3.5" /> : <Gavel className="size-3.5" />}
            {c.type === "raffle" ? "Raffle" : "Auction"}
          </p>
          <h3 className="font-display font-bold text-lg mt-1">{c.title}</h3>
          {c.prizeDescription && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{c.prizeDescription}</p>}
          <div className="mt-auto pt-4 text-sm font-semibold text-primary">
            {c.type === "raffle"
              ? `${gbp(c.ticketPrice)} per ticket`
              : `From ${gbp(c.startingBid)}`}
          </div>
        </div>
      </div>
    </Link>
  );
}
