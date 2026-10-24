/**
 * client/src/pages/tournaments.tsx
 * ────────────────────────────────────
 * Public tournaments list — upcoming events plus an archive of past ones.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { Trophy, MapPin, Clock } from "lucide-react";
import config from "@/lib/tenant";
import type { Tournament } from "@shared/schema";

const { brand } = config;

export default function Tournaments() {
  const { data: tournaments = [] } = useQuery<Tournament[]>({ queryKey: ["/api/public/tournaments"] });

  useEffect(() => {
    applySeo({
      title: `Tournaments · ${brand.name}`,
      description: `Upcoming and past tournaments at ${brand.name}.`,
      path: "/tournaments",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Tournaments", path: "/tournaments" }])],
    });
  }, []);

  const upcoming = tournaments.filter((t) => t.status === "upcoming");
  const completed = tournaments.filter((t) => t.status === "completed");

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Tournaments</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Bring on the <span className="font-serif italic font-medium text-primary">competition</span>.
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
          {upcoming.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">No tournaments on the calendar right now.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {upcoming.map((t) => <TournamentCard key={t.id} t={t} />)}
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Past tournaments</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {completed.map((t) => <TournamentCard key={t.id} t={t} compact />)}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function TournamentCard({ t, compact }: { t: Tournament; compact?: boolean }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm" data-testid={`card-tournament-${t.id}`}>
      {!compact && t.photoUrl && <img src={t.photoUrl} alt={t.name} className="w-full aspect-video object-cover" loading="lazy" />}
      <div className="p-5">
        <h2 className="font-display font-bold text-lg">{t.name}</h2>
        {t.ageGroup && <p className="text-xs uppercase tracking-wide text-primary font-semibold mt-0.5">{t.ageGroup}{t.format ? ` · ${t.format}` : ""}</p>}
        <div className="mt-3 space-y-1 text-sm text-muted-foreground">
          {t.date && <p className="flex items-center gap-1.5"><Clock className="size-3.5" /> {formatDate(t.date)}{t.startTime ? ` · ${t.startTime}` : ""}</p>}
          {t.location && <p className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {t.location}</p>}
        </div>
        {t.infoUrl && (
          <a href={t.infoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-3">
            More information
          </a>
        )}
      </div>
    </div>
  );
}
