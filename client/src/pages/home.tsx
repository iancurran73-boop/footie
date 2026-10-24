/**
 * client/src/pages/home.tsx
 * ──────────────────────────
 * Homepage. Hero, highlights, next fixtures, live competitions, testimonials.
 * Copy is driven by tenant.config.ts and the admin Content tab.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Sparkles, Heart, Shield, ArrowRight, Star, MapPin, Users, Trophy, Flag, Ticket, Gavel, HeartHandshake } from "lucide-react";
import { applySeo, localBusinessJsonLd, breadcrumb } from "@/lib/seo";
import { formatDate, gbp } from "@/lib/format";
import config from "@/lib/tenant";
import { useContent } from "@/lib/content";
import { useBrand } from "@/lib/brand";
import { FundraiserGauge } from "@/components/fundraiser-gauge";
import type { Review, Fixture, Competition, Fundraiser, Sponsor } from "@shared/schema";

const BASE = import.meta.env.BASE_URL || "./";
const HERO_IMG = `${BASE}img/photos/hero.jpg`;

const HIGHLIGHTS = [
  { title: "Every child plays", body: "Development and enjoyment come first — every player gets game time, whatever their ability.", icon: Heart },
  { title: "Safe & welcoming", body: "DBS-checked coaches, safeguarding first, and a welcoming environment for every family.", icon: Shield },
  { title: "Run by volunteers", body: "Coaches, committee and matchday helpers all give their time to keep the club running.", icon: Users },
  { title: "Teams for every age", body: "From our youngest minis through to our oldest juniors, there's a team for every age group.", icon: Trophy },
];

const { copy, business } = config;

export default function Home() {
  const { c } = useContent();
  const b = useBrand();
  const { data: reviews = [] } = useQuery<Review[]>({ queryKey: ["/api/public/reviews"] });
  const { data: fixtures = [] } = useQuery<Fixture[]>({ queryKey: ["/api/public/fixtures"] });
  const { data: competitions = [] } = useQuery<Competition[]>({ queryKey: ["/api/public/competitions"] });
  const { data: fundraisers = [] } = useQuery<Fundraiser[]>({ queryKey: ["/api/public/fundraisers"] });
  const { data: sponsors = [] } = useQuery<Sponsor[]>({ queryKey: ["/api/public/sponsors"] });
  const activeFundraiser = fundraisers.find((f) => f.status === "active");

  const heroTitle = c("home.heroTitle", copy.heroTitle);
  const heroBody = c("home.heroBody", copy.heroSubtitle);
  const heroImage = c("home.heroImage", HERO_IMG);
  const bullets = c("home.bullets", copy.homeBullets.join("\n"))
    .split("\n")
    .map((b) => b.trim())
    .filter(Boolean);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingFixtures = fixtures.filter((f) => f.date >= today).slice(0, 3);
  const liveCompetitions = competitions.filter((comp) => comp.status === "live").slice(0, 3);

  useEffect(() => {
    applySeo({
      title: config.seo.defaultTitle,
      description: config.seo.defaultDescription,
      path: "/",
      image: HERO_IMG,
      jsonLd: [localBusinessJsonLd, breadcrumb([{ name: "Home", path: "/" }])],
    });
  }, []);

  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[hsl(var(--foreground))]">
        <div className="absolute inset-0 z-0">
          {heroImage && heroImage !== HERO_IMG ? (
            <img src={heroImage} alt={`${b.brandName} hero`} className="absolute inset-0 w-full h-full object-cover" loading="eager" fetchPriority="high" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--foreground))] via-primary/40 to-accent/30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 lg:pt-24 pb-16 sm:pb-24 lg:pb-32 grid lg:grid-cols-12 gap-8 items-end min-h-[70vh] sm:min-h-[76vh]">
          <div className="lg:col-span-7 text-white">
            <p className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.24em] font-semibold bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-5 ring-1 ring-white/20">
              <Sparkles className="size-3 text-accent" /> {business.address.city} Junior Football Club
            </p>
            <h1 className="font-display font-extrabold tracking-tight leading-[1.02] text-[clamp(2.5rem,7vw,5rem)]">
              {heroTitle}
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed">
              {heroBody}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/fixtures">
                <Button size="lg" className="rounded-full px-7 py-6 text-base font-semibold shadow-xl">
                  Fixtures &amp; results <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/competitions">
                <Button size="lg" variant="outline" className="rounded-full px-7 py-6 text-base font-medium bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  Raffles &amp; auctions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME */}
      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Welcome to {b.brandName}</p>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-tight">
            Football for every <span className="font-serif italic font-medium text-primary">child</span>
          </h2>
          <div className="mt-6 max-w-3xl mx-auto space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>{b.brandName} runs teams across every age group, coached by volunteers who give their own time to the club.</p>
            <p>Fundraising — through raffles, auctions and sponsorship — keeps subs low and the club open to every family.</p>
          </div>
        </div>
      </section>

      {/* NEXT FIXTURES + LIVE COMPETITIONS */}
      {(upcomingFixtures.length > 0 || liveCompetitions.length > 0) && (
        <section className="py-16 sm:py-20 bg-[hsl(35_40%_94%)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8">
            {upcomingFixtures.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Flag className="size-5 text-primary" />
                  <h3 className="font-display font-bold text-lg">Next fixtures</h3>
                </div>
                <div className="space-y-3">
                  {upcomingFixtures.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-sm border-b border-card-border last:border-0 pb-3 last:pb-0">
                      <span className="font-medium text-foreground">{f.homeAway === "home" ? `${f.team} vs ${f.opponent}` : `${f.opponent} vs ${f.team}`}</span>
                      <span className="text-muted-foreground text-xs">{formatDate(f.date)}</span>
                    </div>
                  ))}
                </div>
                <Link href="/fixtures" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-4 hover:underline">
                  All fixtures <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
            {liveCompetitions.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="size-5 text-primary" />
                  <h3 className="font-display font-bold text-lg">Live now</h3>
                </div>
                <div className="space-y-3">
                  {liveCompetitions.map((comp) => (
                    <Link key={comp.id} href={`/competitions/${comp.id}`} className="flex items-center justify-between text-sm border-b border-card-border last:border-0 pb-3 last:pb-0 hover:text-primary">
                      <span className="flex items-center gap-1.5 font-medium text-foreground">
                        {comp.type === "raffle" ? <Ticket className="size-3.5" /> : <Gavel className="size-3.5" />} {comp.title}
                      </span>
                      <span className="text-muted-foreground text-xs">{comp.type === "raffle" ? gbp(comp.ticketPrice) + "/ticket" : "bid now"}</span>
                    </Link>
                  ))}
                </div>
                <Link href="/competitions" className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-4 hover:underline">
                  All raffles &amp; auctions <ArrowRight className="size-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FUNDRAISING PROGRESS */}
      {activeFundraiser && (
        <section className="py-14 sm:py-20 bg-[hsl(35_40%_94%)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold text-center">Our goal, a brighter future</p>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-center mt-2">{activeFundraiser.name}</h2>
              <div className="mt-4">
                <FundraiserGauge raised={activeFundraiser.raisedAmount} target={activeFundraiser.targetAmount} />
              </div>
              <div className="text-center mt-2">
                <Link href="/fundraising">
                  <Button variant="outline" className="rounded-full">See all fundraising</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HIGHLIGHTS */}
      <section className="py-16 sm:py-24 bg-accent text-accent-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.28em] font-bold">What we're about</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-tight">
              Community, <span className="font-serif italic font-medium text-primary">on and off</span> the pitch.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {HIGHLIGHTS.map((h) => {
              const Icon = h.icon;
              return (
                <article key={h.title} className="bg-background text-foreground rounded-2xl overflow-hidden shadow-md flex flex-col">
                  <div className="p-6 sm:p-7 flex-1 flex flex-col">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="font-display font-extrabold text-lg sm:text-xl leading-tight text-primary">{h.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{h.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPETITIONS CTA */}
      <section className="bg-foreground text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-accent font-bold">Support the club</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-tight">
              Every entry <span className="font-serif italic font-medium text-accent">funds the club</span>.
            </h2>
            <p className="mt-5 text-white/80 text-lg leading-relaxed max-w-lg">
              Raffle tickets and auction bids go straight back into kit, pitch fees and coaching — no entry fee goes to waste.
            </p>
            <ul className="mt-7 space-y-3 text-sm sm:text-base">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <span className="mt-1 size-2 rounded-full bg-accent shrink-0" />
                  <span className="text-white/90">{bullet}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/competitions">
                <Button size="lg" className="rounded-full px-7 py-6 text-base font-semibold bg-primary hover:bg-primary/90 shadow-xl">
                  See what's live <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </Link>
              <a href={`tel:${b.phone}`}>
                <Button size="lg" variant="outline" className="rounded-full px-7 py-6 text-base bg-white/10 hover:bg-white/20 border-white/30 text-white">
                  Or call {b.phone}
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 bg-accent/20 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl shadow-2xl w-full aspect-[4/3] bg-gradient-to-br from-primary/40 via-accent/15 to-primary/50 flex flex-col items-center justify-center overflow-hidden p-8">
              <Trophy className="size-24 text-white/40" strokeWidth={1.2} />
              <p className="mt-4 text-white font-display font-bold text-xl text-center">{b.brandName}</p>
            </div>
            <div className="absolute -bottom-5 -left-5 sm:-left-8 bg-card text-foreground rounded-xl p-4 shadow-xl flex items-center gap-3">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Find us</p>
                <p className="font-display font-bold text-sm">{business.address.line1}, {business.address.city}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPONSORS STRIP — only shown once sponsors exist */}
      {sponsors.length > 0 && (
        <section className="py-10 sm:py-14 bg-background border-t border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground font-bold mb-6 flex items-center justify-center gap-1.5">
              <HeartHandshake className="size-3.5" /> Backed by
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {sponsors.slice(0, 8).map((s) => (
                <Link key={s.id} href="/sponsors" className="opacity-80 hover:opacity-100 transition-opacity">
                  {s.logoUrl ? (
                    <img src={s.logoUrl} alt={s.businessName} className="h-10 sm:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all" />
                  ) : (
                    <span className="text-sm font-display font-bold text-foreground">{s.businessName}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS — only shown if reviews exist in the DB */}
      {reviews.length > 0 && (
        <section className="py-16 sm:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
              <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Club love</p>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-tight">
                What parents &amp; sponsors say.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
              {reviews.map((r) => (
                <figure key={r.id} className="bg-card border border-card-border rounded-2xl p-6 sm:p-7 shadow-sm">
                  <div className="flex gap-0.5 text-accent mb-4">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-accent" />
                    ))}
                  </div>
                  <blockquote className="font-serif italic text-lg leading-relaxed text-foreground/85">
                    "{r.body}"
                  </blockquote>
                  <figcaption className="mt-5 pt-5 border-t border-card-border">
                    <p className="font-display font-bold text-sm">{r.authorName}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}
    </SiteShell>
  );
}
