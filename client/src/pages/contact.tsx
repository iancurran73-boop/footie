/**
 * client/src/pages/contact.tsx
 * ─────────────────────────────
 * Contact page — phone, email, ground address, social.
 * Values driven by tenant.config.ts, editable via the admin Content tab.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { applySeo, breadcrumb } from "@/lib/seo";
import { Phone, Mail, Instagram, MapPin, ArrowRight } from "lucide-react";
import config from "@/lib/tenant";
import { useContent } from "@/lib/content";
import { useBrand } from "@/lib/brand";

const { business } = config;

export default function Contact() {
  const { c } = useContent();
  const b = useBrand();

  const phone = c("contact.phone", b.phone);
  const phoneDisplay = c("contact.phoneDisplay", b.phone);
  const email = c("contact.email", b.email);
  const city = c("contact.city", business.address.city);
  const instagram = c("contact.instagram", b.instagram ?? "");

  useEffect(() => {
    applySeo({
      title: `Contact ${b.brandName} · ${business.address.city}`,
      description: `Get in touch with ${b.brandName}. Call ${business.phoneDisplay} or email ${business.email}.`,
      path: "/contact",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])],
    });
  }, [city]);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-10 sm:pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Contact</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Get in <span className="font-serif italic font-medium text-primary">touch</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {b.brandName} is based in {city} — reach out about joining a team, sponsorship, or anything else.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-card border border-card-border rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Phone className="size-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-bold text-muted-foreground">Phone</p>
                <a href={`tel:${phone}`} className="font-display font-bold text-lg hover:text-primary block mt-1">{phoneDisplay}</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Mail className="size-5" /></div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] font-bold text-muted-foreground">Email</p>
                <a href={`mailto:${email}`} className="font-display font-bold text-base sm:text-lg hover:text-primary block mt-1 break-all">{email}</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><MapPin className="size-5" /></div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] font-bold text-muted-foreground">Ground</p>
                <p className="font-display font-bold text-lg mt-1">{business.address.line1}, {city} {business.address.postcode}</p>
              </div>
            </div>
            {instagram && (
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0"><Instagram className="size-5" /></div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] font-bold text-muted-foreground">Instagram</p>
                  <a href={`https://www.instagram.com/${instagram}`} target="_blank" rel="noreferrer" className="font-display font-bold text-lg hover:text-primary block mt-1">@{instagram}</a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-foreground text-white text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
            Support the club.
          </h2>
          <p className="text-white/80 mt-3 text-base">
            Enter a current raffle or auction — every entry helps fund the club.
          </p>
          <Link href="/competitions">
            <Button size="lg" className="rounded-full px-8 py-6 mt-7 text-base font-semibold shadow-xl">
              See what's live <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </section>
    </SiteShell>
  );
}
