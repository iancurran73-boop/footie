/**
 * client/src/pages/about.tsx
 * ───────────────────────────
 * About the club page. Copy, names and contact info are driven by
 * tenant.config.ts and editable via the admin Content tab.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { applySeo, breadcrumb } from "@/lib/seo";
import { ArrowRight, Heart, Shield, Users, Trophy } from "lucide-react";
import config from "@/lib/tenant";
import { useContent } from "@/lib/content";
import { useBrand } from "@/lib/brand";

const { copy, business } = config;

export default function About() {
  const { c } = useContent();
  const b = useBrand();
  const aboutTitle = c("about.title", copy.aboutTitle);
  const aboutBody = c("about.body", copy.aboutBody);
  const aboutImage = c("about.image", "/img/photos/about.jpg");

  useEffect(() => {
    applySeo({
      title: `About · ${b.brandName} ${business.address.city}`,
      description: `${b.brandName} is a junior football club based in ${business.address.city}.`,
      path: "/about",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])],
    });
  }, []);

  const aboutParagraphs = aboutBody.split("\n\n").filter(Boolean);

  return (
    <SiteShell>
      <section className="pt-12 sm:pt-20 pb-10 bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">About the club</p>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05]">
              {aboutTitle}
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              {aboutParagraphs[0]}
            </p>
            {aboutParagraphs[1] && (
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                {aboutParagraphs[1]}
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/fixtures">
                <Button size="lg" className="rounded-full px-7 py-6 text-base font-semibold">
                  See fixtures <ArrowRight className="size-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/competitions">
                <Button size="lg" variant="outline" className="rounded-full px-7 py-6 text-base">
                  Raffles &amp; auctions
                </Button>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/15 rounded-3xl blur-2xl" />
              {aboutImage && aboutImage !== "/img/photos/about.jpg" ? (
                <img
                  src={aboutImage}
                  alt={b.brandName}
                  className="relative rounded-2xl shadow-2xl w-full aspect-[4/5] object-cover"
                  loading="eager"
                />
              ) : (
                <div className="relative rounded-2xl shadow-2xl w-full aspect-[4/5] bg-gradient-to-br from-primary/30 via-accent/15 to-primary/40 flex items-center justify-center overflow-hidden">
                  <Trophy className="size-32 text-white/40" strokeWidth={1.2} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent" />
                  <p className="absolute bottom-6 left-6 right-6 text-white font-display font-bold text-xl leading-tight">{b.brandName}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">What we stand for</p>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl tracking-tight mt-3 leading-tight">
              Community, on and off the pitch.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Heart, title: "Every child plays", body: "Development and enjoyment come first — every player gets game time, whatever their ability." },
              { icon: Shield, title: "Safe & welcoming", body: "DBS-checked coaches, safeguarding first, and a welcoming environment for every family." },
              { icon: Users, title: "Run by volunteers", body: "Coaches, committee and matchday helpers all give their time — raffles and auctions help cover what fees don't." },
              { icon: Trophy, title: "Teams for every age", body: "From our youngest minis through to our oldest juniors, there's a team for every age group." },
            ].map((v) => (
              <div key={v.title} className="bg-card border border-card-border rounded-2xl p-6 hover-elevate">
                <div className="size-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <v.icon className="size-5" />
                </div>
                <h3 className="font-display font-bold text-lg mt-4">{v.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {aboutParagraphs.length > 2 && (
        <section className="py-16 sm:py-24 bg-[hsl(35_40%_94%)]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold text-center">Our story</p>
            <div className="mt-10 prose prose-lg max-w-none font-body text-foreground/80 leading-relaxed space-y-5">
              {aboutParagraphs.slice(2).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 sm:py-20 bg-background text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">Get involved</h2>
          <p className="text-muted-foreground mt-3 text-base">
            Enter a current raffle or auction, or get in touch about joining a team.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="/competitions"><Button size="lg" className="rounded-full px-8 py-6 text-base font-semibold">See what's live</Button></Link>
            <Link href="/contact"><Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-base">Get in touch</Button></Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
