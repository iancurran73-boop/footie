/**
 * client/src/pages/competition-detail.tsx
 * ───────────────────────────────────────────
 * Public raffle/auction detail page. Also handles the SumUp return leg
 * (/competitions/:id/return) by polling /api/public/purchases/:checkoutId
 * for the checkout id stashed in sessionStorage before the redirect.
 */

import { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "wouter";
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
import { Ticket, Gavel, Trophy, Loader2, Mail, MapPin } from "lucide-react";
import config from "@/lib/tenant";
import type { Competition } from "@shared/schema";

const { brand, business } = config;

type PublicCompetition = Omit<Competition, "drawSeed"> & { currentPrice?: number; bidCount?: number };

function checkoutStorageKey(id: number) {
  return `pending_checkout_${id}`;
}

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const [location] = useLocation();
  const competitionId = Number(id);
  const isReturn = location.endsWith("/return");

  const { data: comp, isLoading } = useQuery<PublicCompetition>({
    queryKey: [`/api/public/competitions/${competitionId}`],
  });

  useEffect(() => {
    if (comp) {
      applySeo({
        title: `${comp.title} · ${brand.name}`,
        description: comp.prizeDescription || comp.description || `${comp.type === "raffle" ? "Raffle" : "Auction"} at ${brand.name}.`,
        path: `/competitions/${competitionId}`,
        jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Raffles & auctions", path: "/competitions" }, { name: comp.title, path: `/competitions/${competitionId}` }])],
      });
    }
  }, [comp?.id]);

  if (isLoading) {
    return (
      <SiteShell>
        <div className="py-24 flex justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      </SiteShell>
    );
  }

  if (!comp) {
    return (
      <SiteShell>
        <div className="py-24 text-center">
          <p className="text-muted-foreground">This raffle or auction isn't available.</p>
          <Link href="/competitions" className="text-primary font-semibold hover:underline mt-2 inline-block">Back to raffles &amp; auctions</Link>
        </div>
      </SiteShell>
    );
  }

  if (isReturn) {
    return (
      <SiteShell>
        <ReturnPanel comp={comp} />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-16 pb-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link href="/competitions" className="text-xs uppercase tracking-[0.2em] text-primary font-bold hover:underline">
            &larr; Raffles &amp; auctions
          </Link>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant={comp.status === "live" ? "default" : "secondary"} className="text-[10px] uppercase">
              {comp.status === "live" ? "Live" : comp.status === "drawn" ? "Winner drawn" : "Closed"}
            </Badge>
            <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold flex items-center gap-1">
              {comp.type === "raffle" ? <Ticket className="size-3.5" /> : <Gavel className="size-3.5" />}
              {comp.type === "raffle" ? "Raffle" : "Auction"}
            </span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight mt-2">{comp.title}</h1>
          {comp.description && <p className="mt-3 text-base text-muted-foreground leading-relaxed">{comp.description}</p>}
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          {comp.imageUrl ? (
            <img src={comp.imageUrl} alt={comp.title} className="w-full aspect-[16/9] object-cover rounded-2xl shadow-sm" />
          ) : (
            <div className="w-full aspect-[16/9] rounded-2xl bg-gradient-to-br from-primary/30 via-accent/15 to-primary/40 flex items-center justify-center">
              <Ticket className="size-16 text-white/40" strokeWidth={1.2} />
            </div>
          )}

          {comp.prizeDescription && (
            <div className="bg-card border border-card-border rounded-xl p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">The prize</p>
              <p className="mt-1 text-foreground">{comp.prizeDescription}</p>
            </div>
          )}

          {comp.type === "raffle" ? <RaffleSection comp={comp} /> : <AuctionSection comp={comp} />}
        </div>
      </section>
    </SiteShell>
  );
}

// ───────────────────────── RAFFLE ─────────────────────────

function RaffleSection({ comp }: { comp: PublicCompetition }) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [notSetUp, setNotSetUp] = useState<string | null>(null);

  const remaining = comp.maxTickets > 0 ? comp.maxTickets - comp.ticketsSold : null;

  const checkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/public/competitions/${comp.id}/sumup-checkout`, { quantity, buyerName, buyerEmail, buyerPhone });
      return res.json() as Promise<{ checkoutId: string; hostedCheckoutUrl: string; amount: number }>;
    },
    onSuccess: (data) => {
      sessionStorage.setItem(checkoutStorageKey(comp.id), data.checkoutId);
      window.location.href = data.hostedCheckoutUrl;
    },
    onError: async (e: any) => {
      const msg = String(e?.message || e);
      if (msg.includes("503")) {
        setNotSetUp("Online payment isn't set up yet — see a committee member to buy a ticket in person.");
      } else {
        toast({ title: "Couldn't start checkout", description: msg.replace(/^\d+:\s*/, ""), variant: "destructive" });
      }
    },
  });

  if (comp.status !== "live") {
    return <DrawnResultPanel comp={comp} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="font-display font-bold text-xl">{gbp(comp.ticketPrice)}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Per ticket</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="font-display font-bold text-xl">{comp.ticketsSold}{comp.maxTickets > 0 ? `/${comp.maxTickets}` : ""}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Sold</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="font-display font-bold text-xl">{new Date(comp.closesAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Closes</div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <h2 className="font-display font-bold text-lg">Buy tickets</h2>
        {notSetUp ? (
          <p className="text-sm text-muted-foreground">{notSetUp}</p>
        ) : (
          <>
            <div>
              <Label>Number of tickets</Label>
              <Input
                type="number" min={1} max={remaining ?? 100} value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                data-testid="input-ticket-quantity"
              />
              {remaining != null && <p className="text-xs text-muted-foreground mt-1">{remaining} ticket(s) left</p>}
            </div>
            <div>
              <Label>Your name</Label>
              <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} data-testid="input-buyer-name" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} data-testid="input-buyer-email" />
            </div>
            <div>
              <Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} data-testid="input-buyer-phone" />
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={checkout.isPending || !buyerName || !buyerEmail || (remaining != null && remaining < 1)}
              onClick={() => checkout.mutate()}
              data-testid="button-buy-tickets"
            >
              {checkout.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
              Pay {gbp(quantity * comp.ticketPrice)} &amp; get {quantity} ticket{quantity > 1 ? "s" : ""}
            </Button>
          </>
        )}
      </div>

      <FreePostalEntryNotice />
    </div>
  );
}

// Standard "free prize draw" exemption under the Gambling Act 2005 — a
// genuine free-entry route into the same number pool, with the same odds,
// keeps the raffle outside lottery regulation. This must stay visible and
// unobscured next to the paid-entry option, not buried in the T&Cs.
function FreePostalEntryNotice() {
  return (
    <div className="bg-muted/60 border border-card-border rounded-xl p-5">
      <h3 className="font-display font-bold text-sm">Free postal entry</h3>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
        No purchase is necessary to enter. For a free entry (same odds as a paid ticket), write your name, email, phone number and the name of this raffle on a postcard and post it to:
      </p>
      <p className="text-sm text-foreground font-medium mt-2 flex items-start gap-2">
        <MapPin className="size-4 mt-0.5 shrink-0 text-primary" />
        {business.address.line1}, {business.address.city} {business.address.postcode}
      </p>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed flex items-start gap-2">
        <Mail className="size-4 mt-0.5 shrink-0 text-primary" />
        One free entry per postcard. We'll log your entry and confirm by email — contact {business.email} with any questions.
      </p>
    </div>
  );
}

function DrawnResultPanel({ comp }: { comp: PublicCompetition }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-6 text-center">
      <Trophy className="size-10 text-primary mx-auto" />
      {comp.drawnNumber != null ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">Winning ticket number</p>
          <p className="font-display font-extrabold text-4xl mt-1">#{comp.drawnNumber}</p>
          <p className="text-xs text-muted-foreground mt-2">Drawn from {comp.ticketsSold} ticket{comp.ticketsSold === 1 ? "" : "s"} sold.</p>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">This raffle has closed — the winner will be drawn shortly.</p>
      )}
    </div>
  );
}

// ───────────────────────── AUCTION ─────────────────────────

function AuctionSection({ comp }: { comp: PublicCompetition }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [bidderName, setBidderName] = useState("");
  const [bidderEmail, setBidderEmail] = useState("");
  const [bidderPhone, setBidderPhone] = useState("");

  const currentPrice = comp.currentPrice ?? comp.startingBid;
  const minNextBid = (comp.bidCount ?? 0) > 0 ? currentPrice + comp.bidIncrement : currentPrice;

  const bid = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/public/competitions/${comp.id}/bid`, {
        amount: Number(amount), bidderName, bidderEmail, bidderPhone,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/public/competitions/${comp.id}`] });
      toast({ title: "Bid placed!" });
      setAmount("");
    },
    onError: (e: any) => {
      const msg = String(e?.message || e).replace(/^\d+:\s*/, "");
      toast({ title: "Couldn't place bid", description: msg, variant: "destructive" });
    },
  });

  if (comp.status !== "live") {
    return (
      <div className="bg-card border border-card-border rounded-xl p-6 text-center">
        <Trophy className="size-10 text-primary mx-auto" />
        <p className="mt-3 text-sm text-muted-foreground">This auction has closed.</p>
        {comp.status === "drawn" && <p className="font-display font-bold text-lg mt-1">Final price: {gbp(currentPrice)}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="font-display font-bold text-xl">{gbp(currentPrice)}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Current price</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="font-display font-bold text-xl">{comp.bidCount ?? 0}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Bids so far</div>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-4">
          <div className="font-display font-bold text-xl">{new Date(comp.closesAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">Closes</div>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <h2 className="font-display font-bold text-lg">Place a bid</h2>
        <p className="text-xs text-muted-foreground">Minimum next bid: {gbp(minNextBid)}</p>
        <div>
          <Label>Your bid (£)</Label>
          <Input type="number" min={minNextBid} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-bid-amount" />
        </div>
        <div>
          <Label>Your name</Label>
          <Input value={bidderName} onChange={(e) => setBidderName(e.target.value)} data-testid="input-bidder-name" />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={bidderEmail} onChange={(e) => setBidderEmail(e.target.value)} data-testid="input-bidder-email" />
        </div>
        <div>
          <Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
          <Input value={bidderPhone} onChange={(e) => setBidderPhone(e.target.value)} data-testid="input-bidder-phone" />
        </div>
        <Button
          className="w-full" size="lg"
          disabled={bid.isPending || !bidderName || !bidderEmail || !amount || Number(amount) < minNextBid}
          onClick={() => bid.mutate()}
          data-testid="button-place-bid"
        >
          {bid.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null}
          Bid {amount ? gbp(Number(amount)) : ""}
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── SUMUP RETURN ─────────────────────────

function ReturnPanel({ comp }: { comp: PublicCompetition }) {
  const checkoutId = sessionStorage.getItem(checkoutStorageKey(comp.id));

  const { data } = useQuery<{ status: string; ticketNumbers?: number[]; error?: string }>({
    queryKey: [`/api/public/purchases/${checkoutId}`],
    enabled: !!checkoutId,
    refetchInterval: (query) => (query.state.data?.status === "issued" ? false : 2500),
  });

  useEffect(() => {
    if (data?.status === "issued") sessionStorage.removeItem(checkoutStorageKey(comp.id));
  }, [data?.status]);

  if (!checkoutId) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 text-center">
        <p className="text-muted-foreground">We couldn't find your checkout session. If you were charged, check your email for a confirmation — or contact {business.email}.</p>
        <Link href={`/competitions/${comp.id}`} className="text-primary font-semibold hover:underline mt-3 inline-block">Back to {comp.title}</Link>
      </div>
    );
  }

  return (
    <div className="py-24 max-w-md mx-auto px-4 text-center">
      {data?.status === "issued" ? (
        <>
          <Trophy className="size-10 text-primary mx-auto" />
          <h1 className="font-display font-extrabold text-2xl mt-3">You're in!</h1>
          <p className="text-muted-foreground mt-2">
            Ticket number{data.ticketNumbers!.length > 1 ? "s" : ""}: <span className="font-bold text-foreground">{data.ticketNumbers!.map((n) => `#${n}`).join(", ")}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">A confirmation has been emailed to you. Good luck!</p>
          <Link href="/competitions" className="text-primary font-semibold hover:underline mt-4 inline-block">See other raffles &amp; auctions</Link>
        </>
      ) : (
        <>
          <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
          <p className="mt-3 text-muted-foreground">Confirming your payment…</p>
          <p className="text-xs text-muted-foreground mt-1">This usually only takes a few seconds.</p>
        </>
      )}
    </div>
  );
}
