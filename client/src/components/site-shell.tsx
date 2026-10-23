/**
 * client/src/components/site-shell.tsx
 * ──────────────────────────────────────
 * Top-level page wrapper: navigation header + footer.
 * Brand/contact values are read from tenant.config.ts.
 */

import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Menu, X, MapPin, Phone, Mail, Instagram, ArrowRight } from "lucide-react";
import config from "@/lib/tenant";
import { useBrand } from "@/lib/brand";
import { usePages } from "@/lib/pages";

const { business, brand } = config;

export function SiteShell({ children }: { children: React.ReactNode }) {
  const b = useBrand();
  const nav = usePages();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top utility bar */}
      <div className="hidden md:block bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs opacity-90" style={{ background: `hsl(${brand.colors.primary})`, color: `hsl(${brand.colors.primaryFg})` }}>
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Phone className="size-3" /> {b.phone}
            </a>
            <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <Mail className="size-3" /> {b.email}
            </a>
            <span className="inline-flex items-center gap-1.5 opacity-85">
              <MapPin className="size-3" /> {business.address.line1}, {business.address.city} {business.address.postcode}
            </span>
          </div>
          <div className="flex items-center gap-3 opacity-95">
            {b.instagram && (
              <a href={`https://www.instagram.com/${b.instagram}`} target="_blank" rel="noreferrer" className="hover:opacity-80">
                <Instagram className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sticky header */}
      <header className={`sticky top-0 z-40 bg-primary text-primary-foreground transition-shadow ${scrolled ? "shadow-xl" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 py-3 sm:py-4">
          <Link href="/" className="flex items-center gap-3 sm:gap-5 group shrink-0" data-testid="link-home">
            <BrandMark className="h-10 sm:h-12 lg:h-14 w-auto text-white drop-shadow-md transition-transform group-hover:scale-[1.02]" />
            <div className="hidden md:block leading-tight">
              <div className="font-display font-extrabold text-white text-xl lg:text-2xl tracking-tight">{b.brandName}</div>
              <div className="text-xs lg:text-sm italic font-serif text-white/90 mt-0.5">{b.tagline}</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {nav.map((item) => {
              const active = location === item.path;
              return (
                <Link
                  key={item.slug}
                  href={item.path}
                  className={`relative px-3 py-2 text-sm font-semibold tracking-wide rounded-md transition-colors ${
                    active ? "text-white" : "text-white/85 hover:text-white"
                  }`}
                  data-testid={`nav-${item.slug}`}
                >
                  {item.navLabel}
                  {active && <span className="absolute left-3 right-3 -bottom-0.5 h-[2px] bg-white rounded-full" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/competitions" className="hidden md:inline-flex">
              <Button size="default" variant="secondary" className="rounded-full px-5 font-semibold shadow-lg" data-testid="button-competitions-header">
                Raffles &amp; auctions <ArrowRight className="size-4 ml-1" />
              </Button>
            </Link>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden p-2 rounded-md text-white hover:bg-white/10"
              data-testid="button-menu"
            >
              {open ? <X className="size-7" /> : <Menu className="size-7" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden border-t border-white/20 bg-primary">
            <nav className="px-4 py-3 grid gap-1">
              {nav.map((item) => (
                <Link
                  key={item.slug}
                  href={item.path}
                  className={`px-3 py-3 rounded-md text-base font-semibold ${location === item.path ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/10"}`}
                >
                  {item.navLabel}
                </Link>
              ))}
              <Link href="/competitions" className="mt-2">
                <Button className="w-full rounded-full font-semibold py-6 text-base bg-white/15 text-white hover:bg-white/25">
                  Raffles &amp; auctions <ArrowRight className="size-4 ml-1" />
                </Button>
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>{children}</main>

      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  const b = useBrand();
  const nav = usePages();
  return (
    <footer className="bg-[hsl(var(--foreground))] text-[hsl(35_40%_92%)] mt-16 sm:mt-24 pb-12" style={{ background: `hsl(${brand.colors.foreground})` }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div>
          <BrandMark className="h-12 w-auto text-white mb-4" />
          <p className="font-display font-bold text-lg text-white">{b.brandName}</p>
          <p className="font-serif italic text-sm text-white/70 mt-1">{b.tagline}</p>
        </div>
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-[0.18em] text-accent mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 shrink-0 text-accent" />
              {business.address.line1},<br /> {business.address.city} {business.address.postcode}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent" />
              <a href={`tel:${b.phone}`} className="hover:text-accent">{b.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" />
              <a href={`mailto:${b.email}`} className="hover:text-accent break-all">{b.email}</a>
            </li>
          </ul>
          {b.instagram && (
            <a
              href={`https://www.instagram.com/${b.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm hover:text-accent"
            >
              <Instagram className="size-4 text-accent" /> @{b.instagram}
            </a>
          )}
        </div>
        <div>
          <h4 className="font-display font-bold text-sm uppercase tracking-[0.18em] text-accent mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            {nav.map((item) => (
              <li key={item.slug}><Link href={item.path} className="hover:text-accent">{item.navLabel}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {b.brandName} · {business.address.city}</p>
          <p>Powered by GeneralBooking</p>
        </div>
      </div>
    </footer>
  );
}
