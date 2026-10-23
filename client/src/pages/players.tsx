/**
 * client/src/pages/players.tsx
 * ───────────────────────────────
 * Public player roster, grouped by team, with season stats pulled from
 * /api/public/stats (computed from match reports — see server/stats.ts).
 */

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { UserCircle } from "lucide-react";
import config from "@/lib/tenant";
import type { Player } from "@shared/schema";
import type { PlayerSeasonStats } from "@shared/player-stats";

const { brand } = config;

export default function Players() {
  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/public/players"] });
  const { data: stats = [] } = useQuery<PlayerSeasonStats[]>({ queryKey: ["/api/public/stats"] });

  useEffect(() => {
    applySeo({
      title: `Players · ${brand.name}`,
      description: `Meet the squad at ${brand.name}.`,
      path: "/players",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Players", path: "/players" }])],
    });
  }, []);

  const statsById = useMemo(() => new Map(stats.map((s) => [s.playerId, s])), [stats]);

  const byTeam = useMemo(() => {
    const m = new Map<string, Player[]>();
    for (const p of players) m.set(p.team, [...(m.get(p.team) ?? []), p]);
    Array.from(m.values()).forEach((list) => list.sort((a, b) => a.sortOrder - b.sortOrder || (a.squadNumber ?? 999) - (b.squadNumber ?? 999)));
    return m;
  }, [players]);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">The squad</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Meet the <span className="font-serif italic font-medium text-primary">Wolfpack</span>.
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          {players.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Player profiles are coming soon.</p>
          ) : (
            Array.from(byTeam.entries()).map(([team, list]) => (
              <div key={team}>
                <h2 className="font-display font-bold text-2xl mb-4">{team}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((p) => {
                    const s = statsById.get(p.id);
                    return (
                      <div key={p.id} className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm" data-testid={`card-player-${p.id}`}>
                        <div className="relative aspect-square bg-gradient-to-br from-primary/30 via-accent/15 to-primary/40 flex items-center justify-center overflow-hidden">
                          {p.photoUrl ? (
                            <img src={p.photoUrl} alt={p.displayName} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <UserCircle className="size-16 text-white/40" strokeWidth={1.2} />
                          )}
                          {p.squadNumber != null && (
                            <span className="absolute top-2 right-2 size-8 rounded-full bg-foreground/80 text-white text-sm font-display font-bold flex items-center justify-center">{p.squadNumber}</span>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-display font-bold">{p.displayName}</h3>
                          <p className="text-xs text-muted-foreground">
                            {p.primaryPosition}{p.secondaryPositions ? ` · ${p.secondaryPositions}` : ""}
                          </p>
                          {p.shortProfile && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{p.shortProfile}</p>}
                          {s && (s.goals > 0 || s.assists > 0 || s.cleanSheets > 0) && (
                            <div className="flex gap-3 mt-3 pt-3 border-t border-card-border text-xs">
                              {s.goals > 0 && <span><b className="text-foreground">{s.goals}</b> <span className="text-muted-foreground">goals</span></span>}
                              {s.assists > 0 && <span><b className="text-foreground">{s.assists}</b> <span className="text-muted-foreground">assists</span></span>}
                              {s.cleanSheets > 0 && <span><b className="text-foreground">{s.cleanSheets}</b> <span className="text-muted-foreground">clean sheets</span></span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </SiteShell>
  );
}
