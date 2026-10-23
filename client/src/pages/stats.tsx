/**
 * client/src/pages/stats.tsx
 * ─────────────────────────────
 * Season leaderboards — top scorers, assists, clean sheets, tackles, POTM
 * totals. All computed from match reports (server/stats.ts), never a
 * hand-maintained counter.
 */

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { Trophy } from "lucide-react";
import config from "@/lib/tenant";
import type { Player } from "@shared/schema";
import type { PlayerSeasonStats } from "@shared/player-stats";

const { brand } = config;

type Row = PlayerSeasonStats & { name: string; team: string };

function Leaderboard({ title, rows, field }: { title: string; rows: Row[]; field: keyof PlayerSeasonStats }) {
  const sorted = [...rows].filter((r) => (r[field] as number) > 0).sort((a, b) => (b[field] as number) - (a[field] as number)).slice(0, 8);
  if (sorted.length === 0) return null;
  return (
    <div className="bg-card border border-card-border rounded-2xl p-5">
      <h3 className="font-display font-bold mb-3">{title}</h3>
      <div className="space-y-2">
        {sorted.map((r, i) => (
          <div key={r.playerId} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground w-4 text-xs">{i + 1}</span>
              {r.name}
              <span className="text-xs text-muted-foreground">({r.team})</span>
            </span>
            <span className="font-display font-bold">{r[field] as number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Stats() {
  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/public/players"] });
  const { data: stats = [] } = useQuery<PlayerSeasonStats[]>({ queryKey: ["/api/public/stats"] });

  useEffect(() => {
    applySeo({
      title: `Season Stats · ${brand.name}`,
      description: `Top scorers, assists, clean sheets and Player of the Month at ${brand.name}.`,
      path: "/stats",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Stats", path: "/stats" }])],
    });
  }, []);

  const rows: Row[] = useMemo(() => {
    const byId = new Map(players.map((p) => [p.id, p]));
    return stats.map((s) => {
      const p = byId.get(s.playerId);
      return { ...s, name: p?.displayName ?? `#${s.playerId}`, team: p?.team ?? "" };
    });
  }, [players, stats]);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Season stats</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Who's <span className="font-serif italic font-medium text-primary">leading the pack</span>.
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {rows.every((r) => Object.values(r).every((v) => typeof v !== "number" || v === 0)) ? (
            <p className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center gap-2">
              <Trophy className="size-8 text-muted-foreground/50" />
              No stats yet this season — they'll appear here once match reports are entered.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              <Leaderboard title="Top scorers" rows={rows} field="goals" />
              <Leaderboard title="Most assists" rows={rows} field="assists" />
              <Leaderboard title="Clean sheets" rows={rows} field="cleanSheets" />
              <Leaderboard title="Last-ditch tackles" rows={rows} field="lastDitchTackles" />
              <Leaderboard title="Manager's Player of the Match" rows={rows} field="managerPotm" />
              <Leaderboard title="Parents' Player wins" rows={rows} field="parentsPlayerWins" />
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
