/**
 * client/src/pages/football-card-detail.tsx
 * ───────────────────────────────────────────
 * Public football card detail — the team grid. Tap an open team, give your
 * name, and it's yours. Once every team is taken the admin runs the draw
 * and the winning team (and whoever claimed it) is shown here.
 */

import { useEffect, useState } from "react";
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
import { gbp } from "@/lib/format";
import { Shield, Trophy, Loader2, Check } from "lucide-react";
import config from "@/lib/tenant";
import type { FootballCard } from "@shared/schema";

const { brand } = config;

type PublicSlot = { id: number; cardId: number; team: string; sortOrder: number; buyerName: string; claimedAt: number | null; taken: boolean };
type PublicCard = Omit<FootballCard, "drawSeed"> & { slots: PublicSlot[] };

export default function FootballCardDetail() {
  const { id } = useParams<{ id: string }>();
  const cardId = Number(id);
  const { toast } = useToast();
  const [selected, setSelected] = useState<PublicSlot | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");

  const { data: card, isLoading } = useQuery<PublicCard>({ queryKey: [`/api/public/football-cards/${cardId}`] });

  useEffect(() => {
    if (card) {
      applySeo({
        title: `${card.title} · ${brand.name}`,
        description: card.description || `Pick a team on this card to support ${brand.name}.`,
        path: `/football-cards/${cardId}`,
        jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Football Cards", path: "/football-cards" }, { name: card.title, path: `/football-cards/${cardId}` }])],
      });
    }
  }, [card?.id]);

  const claim = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/public/football-cards/${cardId}/slots/${selected!.id}/claim`, { buyerName, buyerEmail, buyerPhone });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/public/football-cards/${cardId}`] });
      toast({ title: `${selected!.team} is yours!`, description: buyerEmail ? "A confirmation has been emailed to you." : undefined });
      setSelected(null);
      setBuyerName(""); setBuyerEmail(""); setBuyerPhone("");
    },
    onError: (e: any) => {
      const msg = String(e?.message || e).replace(/^\d+:\s*/, "");
      toast({ title: "Couldn't claim that team", description: msg, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: [`/api/public/football-cards/${cardId}`] });
      setSelected(null);
    },
  });

  if (isLoading) {
    return <SiteShell><div className="py-24 flex justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div></SiteShell>;
  }

  if (!card) {
    return (
      <SiteShell>
        <div className="py-24 text-center">
          <p className="text-muted-foreground">This football card isn't available.</p>
          <Link href="/football-cards" className="text-primary font-semibold hover:underline mt-2 inline-block">Back to football cards</Link>
        </div>
      </SiteShell>
    );
  }

  const taken = card.slots.filter((s) => s.taken).length;
  const winningSlot = card.winnerSlotId != null ? card.slots.find((s) => s.id === card.winnerSlotId) : undefined;

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/football-cards" className="text-xs uppercase tracking-[0.2em] text-primary font-bold hover:underline">
            &larr; Football cards
          </Link>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={card.status === "live" ? "default" : "secondary"} className="text-[10px] uppercase">
              {card.status === "live" ? "Live" : "Winner drawn"}
            </Badge>
            {card.inAidOf && <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">In aid of {card.inAidOf}</span>}
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2">{card.title}</h1>
          {card.description && <p className="mt-3 text-base text-muted-foreground leading-relaxed">{card.description}</p>}
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="font-display font-bold text-xl">{gbp(card.stake)}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Per team</div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="font-display font-bold text-xl">{taken}/{card.slots.length}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Teams taken</div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <div className="font-display font-bold text-xl">{card.prizeAmount > 0 ? gbp(card.prizeAmount) : "—"}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Prize</div>
            </div>
          </div>

          {card.status === "drawn" ? (
            <div className="bg-card border border-card-border rounded-xl p-6 text-center">
              <Trophy className="size-10 text-primary mx-auto" />
              <p className="mt-3 text-sm text-muted-foreground">Winning team</p>
              <p className="font-display font-extrabold text-3xl mt-1">{card.drawnTeam}</p>
              {winningSlot?.buyerName && <p className="text-sm text-muted-foreground mt-2">Claimed by {winningSlot.buyerName}</p>}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">Tap an open team below to claim it. Once every team's taken, we'll draw the winner.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {card.slots.map((s) => {
              const isWinner = card.status === "drawn" && s.id === card.winnerSlotId;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={s.taken || card.status !== "live"}
                  onClick={() => setSelected(s)}
                  data-testid={`button-team-${s.id}`}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    isWinner
                      ? "bg-primary text-primary-foreground border-primary"
                      : s.taken
                      ? "bg-muted/60 border-card-border text-muted-foreground cursor-default"
                      : "bg-card border-card-border hover-elevate cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {s.taken ? <Check className="size-3.5 shrink-0" /> : <Shield className="size-3.5 shrink-0 opacity-50" />}
                    <span className="font-display font-bold text-sm truncate">{s.team}</span>
                  </div>
                  {s.taken && <p className="text-xs mt-0.5 truncate opacity-80">{s.buyerName}</p>}
                </button>
              );
            })}
          </div>

          {selected && (
            <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
              <h2 className="font-display font-bold text-lg">Claim {selected.team}</h2>
              <div>
                <Label>Your name</Label>
                <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} data-testid="input-buyer-name" />
              </div>
              <div>
                <Label>Email <span className="text-muted-foreground font-normal text-xs">(optional — for a confirmation)</span></Label>
                <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} data-testid="input-buyer-email" />
              </div>
              <div>
                <Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} data-testid="input-buyer-phone" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  disabled={claim.isPending || !buyerName.trim()}
                  onClick={() => claim.mutate()}
                  data-testid="button-claim-team"
                >
                  {claim.isPending && <Loader2 className="size-4 mr-1.5 animate-spin" />}
                  Claim for {gbp(card.stake)}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">A committee member will collect the stake — see them, or contact the club, to pay.</p>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
