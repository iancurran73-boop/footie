/**
 * shared/tenant-types.ts
 * ──────────────────────
 * Canonical TypeScript interface for a junior football club tenant
 * configuration. Import TenantConfig wherever you need type-safety
 * against tenant.config.ts.
 *
 * Changes here must be reflected in tenant.config.example.ts and tenant.config.ts.
 */

export interface TenantConfig {
  brand: {
    /** Full club name — used in page titles and headings */
    name: string;
    /** Short name for compact contexts (header, footer tagline) */
    shortName: string;
    /** Hero subheadline / club tagline */
    tagline: string;
    /** Bare domain (no protocol), e.g. "example-juniors.co.uk" */
    domain: string;
    /** Instagram handle WITHOUT the @ sign */
    instagram?: string;
    /** Root-relative path to logo image, e.g. "/img/logo.png" */
    logoPath: string;
    /** Root-relative favicon path, e.g. "/favicon.png" */
    favicon: string;
    colors: {
      /**
       * All colours use "H S% L%" format (NO hsl() wrapper).
       * These values are injected as CSS custom properties at runtime.
       */
      /** Deep primary brand colour — e.g. "142 45% 24%" */
      primary: string;
      /** Foreground text on primary colour */
      primaryFg: string;
      /** Accent / highlight colour — e.g. "45 90% 55%" */
      accent: string;
      /** Foreground text on accent colour */
      accentFg: string;
      /** Page background */
      background: string;
      /** Default foreground text colour */
      foreground: string;
      /** Muted surface colour */
      muted: string;
      /** Muted foreground text */
      mutedFg: string;
      /** Default border colour */
      border: string;
    };
    fonts: {
      /** Google Fonts family name for display/heading text, e.g. "Fraunces" */
      display: string;
      /** Google Fonts family name for body text, e.g. "Inter" */
      body: string;
    };
  };

  business: {
    /** Name of the club chair / main contact — used in copy throughout the site */
    ownerName: string;
    /** Phone in E.164 format — used in tel: links, e.g. "+447591134200" */
    phone: string;
    /** Human-readable phone for display, e.g. "+44 7591 134200" */
    phoneDisplay: string;
    /** Contact email address */
    email: string;
    address: {
      line1: string;
      city: string;
      postcode: string;
      country: string;
    };
    /** Optional Google Maps URL for the "Get directions" link */
    mapsUrl?: string;
  };

  copy: {
    heroTitle: string;
    heroSubtitle: string;
    aboutTitle: string;
    /** Multi-paragraph body — render with whitespace-pre-line or split on "\n\n" */
    aboutBody: string;
    /** Bullet points shown in the "Support the club" CTA section on the homepage */
    homeBullets: string[];
  };

  gallery: Array<{
    src: string;
    alt: string;
    category?: string;
  }>;

  /**
   * Payment config for buying raffle/auction tickets. Mode is overridden at
   * runtime via the admin Payments tab once SumUp credentials are connected.
   */
  payments: {
    mode: "mvp" | "sumup";
    currency: string;
    currencySymbol: string;
  };

  admin: {
    /**
     * Passcode for the admin portal — compared case-insensitively.
     * Keep this secret; do not commit the real tenant.config.ts to a public repo.
     */
    passcode: string;
  };

  seo: {
    /** Full canonical site URL with protocol, e.g. "https://example-juniors.co.uk" */
    siteUrl: string;
    /** Default <title> for pages that don't override it */
    defaultTitle: string;
    /** Default meta description */
    defaultDescription: string;
    /** Root-relative path to the default OG image */
    ogImage: string;
  };
}
