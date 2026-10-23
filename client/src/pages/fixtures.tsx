/**
 * client/src/pages/fixtures.tsx
 * ───────────────────────────────
 * Public fixtures & results list, filterable by team.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { Flag, Table2 } from "lucide-react";
import config from "@/lib/tenant";
import type { Fixture, LeagueTableRow } from "@shared/schema";

const { brand } = config;

export default function Fixtures() {
  const { data: fixtures = [] } = useQuery<Fixture[]>({ queryKey: ["/api/public/fixtures"] });
  const { data: leagueRows = [] } = useQuery<LeagueTableRow[]>({ queryKey: ["/api/public/league-tables"] });
  const [team, setTeam] = useState<string>(
    () => new URLSearchParams(window.location.search).get("team") || "all"
  );

  useEffect(() => {
    applySeo({
      title: `Fixtures & Results · ${brand.name}`,
      description: `Upcoming fixtures and recent results for ${brand.name}.`,
      path: "/fixtures",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Fixtures", path: "/fixtures" }])],
    });
  }, []);

  const teams = useMemo(
    () => Array.from(new Set(fixtures.map((f) => f.team))).sort(),
    [fixtures]
  );

  const visible = useMemo(
    () => (team === "all" ? fixtures : fixtures.filter((f) => f.team === team)),
    [fixtures, team]
  );

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = visible.filter((f) => f.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const played = visible.filter((f) => f.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const leaguesByName = useMemo(() => {
    const byLeague = new Map<string, LeagueTableRow[]>();
    for (const r of leagueRows) byLeague.set(r.league, [...(byLeague.get(r.league) ?? []), r]);
    Array.from(byLeague.values()).forEach((list) => list.sort((a, b) => a.position - b.position));
    return byLeague;
  }, [leagueRows]);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Fixtures &amp; results</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Who's playing <span className="font-serif italic font-medium text-primary">who</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Upcoming matches and recent results across every team at {brand.name}.
          </p>
        </div>
      </section>

      {teams.length > 1 && (
        <section className="sticky top-[64px] sm:top-[72px] lg:top-[120px] z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            {["all", ...teams].map((t) => (
              <button
                key={t}
                onClick={() => setTeam(t)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold tracking-wide transition-colors ${
                  team === t
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card border border-card-border hover-elevate text-foreground/80"
                }`}
                data-testid={`filter-team-${t}`}
              >
                {t === "all" ? "All teams" : t}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div>
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Flag className="size-5 text-primary" /> Upcoming fixtures
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-sm">No upcoming fixtures scheduled right now — check back soon.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((f) => <FixtureRow key={f.id} f={f} />)}
              </div>
            )}
          </div>

          {played.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Recent results</h2>
              <div className="space-y-3">
                {played.map((f) => <FixtureRow key={f.id} f={f} />)}
              </div>
            </div>
          )}

          {leaguesByName.size > 0 && (
            <div>
              <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                <Table2 className="size-5 text-primary" /> League tables
              </h2>
              <div className="space-y-6">
                {Array.from(leaguesByName.entries()).map(([league, rows]) => (
                  <div key={league} className="bg-card border border-card-border rounded-xl p-4 sm:p-5 overflow-x-auto">
                    <h3 className="font-display font-bold mb-3">{league}</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b border-card-border">
                          <th className="py-1.5 pr-2">#</th>
                          <th className="py-1.5 pr-2">Team</th>
                          <th className="py-1.5 pr-2 text-center">P</th>
                          <th className="py-1.5 pr-2 text-center">W</th>
                          <th className="py-1.5 pr-2 text-center">D</th>
                          <th className="py-1.5 pr-2 text-center">L</th>
                          <th className="py-1.5 pr-2 text-center">GD</th>
                          <th className="py-1.5 text-center">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id} className="border-b border-card-border last:border-0">
                            <td className="py-1.5 pr-2 text-muted-foreground">{r.position}</td>
                            <td className="py-1.5 pr-2 font-medium">{r.team}</td>
                            <td className="py-1.5 pr-2 text-center">{r.played}</td>
                            <td className="py-1.5 pr-2 text-center">{r.won}</td>
                            <td className="py-1.5 pr-2 text-center">{r.drawn}</td>
                            <td className="py-1.5 pr-2 text-center">{r.lost}</td>
                            <td className="py-1.5 pr-2 text-center">{r.goalsFor - r.goalsAgainst}</td>
                            <td className="py-1.5 text-center font-bold">{r.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </SiteShell>
  );
}

function FixtureRow({ f }: { f: Fixture }) {
  const played = f.homeScore != null && f.awayScore != null;
  const homeLabel = f.homeAway === "home" ? f.team : f.opponent;
  const awayLabel = f.homeAway === "home" ? f.opponent : f.team;
  const homeScore = f.homeAway === "home" ? f.homeScore : f.awayScore;
  const awayScore = f.homeAway === "home" ? f.awayScore : f.homeScore;

  return (
    <Link href={`/fixtures/${f.id}`}>
      <div className="bg-card border border-card-border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover-elevate" data-testid={`row-fixture-${f.id}`}>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1.5">
            {f.team}{f.league ? ` · ${f.league}` : ""}
            {f.confirmationStatus !== "confirmed" && (
              <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] ${f.confirmationStatus === "changed" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                {f.confirmationStatus === "changed" ? "Changed" : "Awaiting confirmation"}
              </span>
            )}
          </p>
          <p className="font-display font-bold text-base sm:text-lg mt-0.5 truncate">
            {homeLabel} <span className="text-muted-foreground font-normal">vs</span> {awayLabel}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(f.date)}{f.kickoffTime ? ` · ${f.kickoffTime}` : ""}{f.venue ? ` · ${f.venue}` : ""}
          </p>
          {f.notes && <p className="text-xs text-muted-foreground mt-1 italic">{f.notes}</p>}
        </div>
        {played && (
          <div className="shrink-0 text-center bg-primary/10 text-primary font-display font-bold text-lg rounded-lg px-3 py-1.5">
            {homeScore}-{awayScore}
          </div>
        )}
      </div>
    </Link>
  );
}
