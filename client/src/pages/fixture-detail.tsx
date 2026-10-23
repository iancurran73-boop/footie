/**
 * client/src/pages/fixture-detail.tsx
 * ───────────────────────────────────────
 * Match centre: fixture/match-day details, the match report once played,
 * and the 48-hour Parents' Player vote. Previous/Next match navigation
 * within the same team.
 */

import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { applySeo, breadcrumb } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { MapPin, Clock, Shirt, ArrowLeft, ArrowRight, Users, Loader2 } from "lucide-react";
import config from "@/lib/tenant";
import type { Fixture, Player } from "@shared/schema";

const { brand } = config;

function parseIdList(json: string): number[] {
  try { const v = JSON.parse(json || "[]"); return Array.isArray(v) ? v.map(Number) : []; } catch { return []; }
}
function parseCountList(json: string): { playerId: number; count: number }[] {
  try { const v = JSON.parse(json || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}

const KIT_LABEL: Record<string, string> = { home: "Home kit", away: "Away kit", alternative: "Alternative kit", tbc: "Kit TBC" };
const CONFIRM_LABEL: Record<string, string> = { awaiting: "Awaiting confirmation", confirmed: "Confirmed", changed: "Changed" };

export default function FixtureDetail() {
  const { id } = useParams<{ id: string }>();
  const fixtureId = Number(id);
  const { data: fixtures = [] } = useQuery<Fixture[]>({ queryKey: ["/api/public/fixtures"] });
  const { data: players = [] } = useQuery<Player[]>({ queryKey: ["/api/public/players"] });

  const fixture = fixtures.find((f) => f.id === fixtureId);
  const playerName = (id: number) => players.find((p) => p.id === id)?.displayName ?? `Player #${id}`;

  useEffect(() => {
    if (fixture) {
      applySeo({
        title: `${fixture.team} vs ${fixture.opponent} · ${brand.name}`,
        description: `Match centre: ${fixture.team} vs ${fixture.opponent}, ${fixture.date}.`,
        path: `/fixtures/${fixtureId}`,
        jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Fixtures", path: "/fixtures" }, { name: `vs ${fixture.opponent}`, path: `/fixtures/${fixtureId}` }])],
      });
    }
  }, [fixture?.id]);

  const sameTeamSorted = useMemo(
    () => fixtures.filter((f) => f.team === fixture?.team).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    [fixtures, fixture?.team]
  );
  const idx = sameTeamSorted.findIndex((f) => f.id === fixtureId);
  const prev = idx > 0 ? sameTeamSorted[idx - 1] : null;
  const next = idx >= 0 && idx < sameTeamSorted.length - 1 ? sameTeamSorted[idx + 1] : null;

  if (!fixture) {
    return (
      <SiteShell>
        <div className="py-24 text-center">
          <p className="text-muted-foreground">Fixture not found.</p>
          <Link href="/fixtures" className="text-primary font-semibold hover:underline mt-2 inline-block">Back to fixtures</Link>
        </div>
      </SiteShell>
    );
  }

  const played = fixture.homeScore != null && fixture.awayScore != null;
  const homeLabel = fixture.homeAway === "home" ? fixture.team : fixture.opponent;
  const awayLabel = fixture.homeAway === "home" ? fixture.opponent : fixture.team;
  const homeScore = fixture.homeAway === "home" ? fixture.homeScore : fixture.awayScore;
  const awayScore = fixture.homeAway === "home" ? fixture.awayScore : fixture.homeScore;

  const scorers = parseCountList(fixture.scorers);
  const assists = parseCountList(fixture.assists);
  const cleanSheets = parseIdList(fixture.cleanSheetPlayerIds);
  const tackles = parseIdList(fixture.lastDitchTacklePlayerIds);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/fixtures" className="text-xs uppercase tracking-[0.2em] text-primary font-bold hover:underline">&larr; All fixtures</Link>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Badge variant="outline" className="text-[10px]">{fixture.team}</Badge>
            <Badge variant={fixture.confirmationStatus === "confirmed" ? "default" : fixture.confirmationStatus === "changed" ? "destructive" : "secondary"} className="text-[10px] uppercase">
              {CONFIRM_LABEL[fixture.confirmationStatus]}
            </Badge>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2">{homeLabel} vs {awayLabel}</h1>
          {played && <p className="font-display font-extrabold text-2xl text-primary mt-1">{homeScore} – {awayScore}</p>}
        </div>
      </section>

      <section className="py-10 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="bg-card border border-card-border rounded-xl p-5 grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div className="flex items-center gap-2"><Clock className="size-4 text-primary shrink-0" /> {formatDate(fixture.date)}{fixture.kickoffTime ? ` · KO ${fixture.kickoffTime}` : ""}</div>
            {fixture.meetTime && <div className="flex items-center gap-2"><Clock className="size-4 text-primary shrink-0" /> Meet at {fixture.meetTime}</div>}
            {fixture.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary shrink-0" />
                {fixture.venue}{fixture.pitch ? ` · ${fixture.pitch}` : ""}{fixture.pitchType ? ` (${fixture.pitchType})` : ""}
              </div>
            )}
            {fixture.directionsUrl && (
              <a href={fixture.directionsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-2">
                <MapPin className="size-4 shrink-0" /> Get directions
              </a>
            )}
            <div className="flex items-center gap-2"><Shirt className="size-4 text-primary shrink-0" /> {KIT_LABEL[fixture.kit]}</div>
            {fixture.league && <div className="text-muted-foreground">{fixture.league}</div>}
          </div>

          {fixture.matchSummary && (
            <div className="bg-card border border-card-border rounded-xl p-5">
              <h2 className="font-display font-bold mb-2">Match report</h2>
              <p className="text-sm text-foreground/85 leading-relaxed">{fixture.matchSummary}</p>
            </div>
          )}

          {(scorers.length > 0 || assists.length > 0 || cleanSheets.length > 0 || tackles.length > 0) && (
            <div className="bg-card border border-card-border rounded-xl p-5 grid sm:grid-cols-2 gap-5 text-sm">
              {scorers.length > 0 && (
                <div><h3 className="font-semibold mb-1.5">Goals</h3>{scorers.map((s) => <p key={s.playerId}>{playerName(s.playerId)}{s.count > 1 ? ` (${s.count})` : ""}</p>)}</div>
              )}
              {assists.length > 0 && (
                <div><h3 className="font-semibold mb-1.5">Assists</h3>{assists.map((s) => <p key={s.playerId}>{playerName(s.playerId)}{s.count > 1 ? ` (${s.count})` : ""}</p>)}</div>
              )}
              {cleanSheets.length > 0 && (
                <div><h3 className="font-semibold mb-1.5">Clean sheet</h3>{cleanSheets.map((id) => <p key={id}>{playerName(id)}</p>)}</div>
              )}
              {tackles.length > 0 && (
                <div><h3 className="font-semibold mb-1.5">Last-ditch tackles</h3>{tackles.map((id) => <p key={id}>{playerName(id)}</p>)}</div>
              )}
            </div>
          )}

          <ParentsPlayerVote fixture={fixture} playerName={playerName} />

          <div className="flex items-center justify-between pt-2">
            {prev ? (
              <Link href={`/fixtures/${prev.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft className="size-3.5" /> Previous match
              </Link>
            ) : <span />}
            {next ? (
              <Link href={`/fixtures/${next.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Next match <ArrowRight className="size-3.5" />
              </Link>
            ) : <span />}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

type VoteStatus =
  | { open: true; opensAt: number; closesAt: number; eligiblePlayerIds: number[] }
  | { open: false; closed: false; opensAt: number; closesAt: number }
  | { open: false; closed: true; opensAt: number; closesAt: number; result: { winners: number[]; counts: Record<number, number>; totalBallots: number } };

function ParentsPlayerVote({ fixture, playerName }: { fixture: Fixture; playerName: (id: number) => string }) {
  const { toast } = useToast();
  const { data: status } = useQuery<VoteStatus>({ queryKey: [`/api/public/fixtures/${fixture.id}/vote-status`], refetchInterval: 60_000 });
  const [email, setEmail] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const vote = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/public/fixtures/${fixture.id}/vote`, { voterEmail: email, playerIds: selected }),
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: [`/api/public/fixtures/${fixture.id}/vote-status`] });
      toast({ title: "Vote cast — thank you!" });
    },
    onError: (e: any) => toast({ title: "Couldn't submit your vote", description: String(e?.message || e).replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  if (!status) return null;

  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <h2 className="font-display font-bold mb-1 flex items-center gap-2"><Users className="size-4 text-primary" /> Parents' Player</h2>

      {status.open && (
        submitted ? (
          <p className="text-sm text-muted-foreground mt-2">Thanks — your vote has been recorded. Results are announced once voting closes.</p>
        ) : (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-muted-foreground">Voting closes 48 hours after kick-off. Your vote stays private — only the final result is shown.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {status.eligiblePlayerIds.map((id) => (
                <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={() => setSelected((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id])}
                  />
                  {playerName(id)}
                </label>
              ))}
            </div>
            <div>
              <Label>Your email <span className="text-muted-foreground font-normal text-xs">(one vote per fixture)</span></Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-vote-email" />
            </div>
            <Button onClick={() => vote.mutate()} disabled={vote.isPending || !email || selected.length === 0} data-testid="button-submit-vote">
              {vote.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null} Submit vote
            </Button>
          </div>
        )
      )}

      {!status.open && !status.closed && (
        <p className="text-sm text-muted-foreground mt-2">Voting opens at kick-off and runs for 48 hours.</p>
      )}

      {!status.open && status.closed && (
        status.result.totalBallots === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">Voting has closed — no votes were cast for this match.</p>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-2">{status.result.totalBallots} vote{status.result.totalBallots === 1 ? "" : "s"} cast.</p>
            <p className="text-base font-display font-bold text-primary">
              {status.result.winners.length > 1 ? "Joint winners: " : "Winner: "}
              {status.result.winners.map((id) => playerName(id)).join(", ")}
            </p>
          </div>
        )
      )}
    </div>
  );
}
