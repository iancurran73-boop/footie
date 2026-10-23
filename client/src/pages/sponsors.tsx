/**
 * client/src/pages/sponsors.tsx
 * ─────────────────────────────────
 * Public sponsors page — gives each sponsor real exposure (logo, link,
 * what their sponsorship helped achieve) while keeping club branding.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { HeartHandshake, ExternalLink } from "lucide-react";
import config from "@/lib/tenant";
import type { Sponsor } from "@shared/schema";

const { brand } = config;

export default function Sponsors() {
  const { data: sponsors = [] } = useQuery<Sponsor[]>({ queryKey: ["/api/public/sponsors"] });

  useEffect(() => {
    applySeo({
      title: `Our Sponsors · ${brand.name}`,
      description: `The businesses who support ${brand.name}.`,
      path: "/sponsors",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Sponsors", path: "/sponsors" }])],
    });
  }, []);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Our sponsors</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Backed by our <span className="font-serif italic font-medium text-primary">community</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {brand.name} couldn't run without the local businesses who back the Wolfpack.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {sponsors.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center gap-2">
              <HeartHandshake className="size-8 text-muted-foreground/50" />
              Sponsor profiles are coming soon.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {sponsors.map((s) => (
                <div key={s.id} className="bg-card border border-card-border rounded-2xl p-5 sm:p-6" data-testid={`card-sponsor-${s.id}`}>
                  <div className="flex items-start gap-4">
                    <div className="size-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.businessName} className="w-full h-full object-contain p-2" />
                      ) : (
                        <HeartHandshake className="size-7 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display font-bold text-lg">{s.businessName}</h2>
                      {s.sponsorshipType && <p className="text-xs uppercase tracking-wide text-primary font-semibold mt-0.5">{s.sponsorshipType}</p>}
                      {s.websiteUrl && (
                        <a href={s.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1">
                          Visit website <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {s.description && <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{s.description}</p>}
                  {s.thankYouMessage && (
                    <p className="text-sm text-foreground/85 mt-3 pt-3 border-t border-card-border italic">"{s.thankYouMessage}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
