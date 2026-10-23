/**
 * tenant.config.example.ts
 * ─────────────────────────
 * Reference junior football club config — copy this to tenant.config.ts
 * and edit it to stand up a new club's site on this template.
 */

import type { TenantConfig } from "./shared/tenant-types";

const config: TenantConfig = {
  brand: {
    name: "Example Town Juniors FC",
    shortName: "Example Town Juniors",
    tagline: "Football for everyone, every Saturday.",
    domain: "exampletownjuniors.co.uk",
    instagram: "exampletownjuniors",
    logoPath: "",
    favicon: "/favicon.png",
    colors: {
      // HSL "H S% L%" — navy & amber, swap for your own kit colours.
      primary: "220 55% 22%",
      primaryFg: "0 0% 100%",
      accent: "35 95% 55%",
      accentFg: "240 30% 14%",
      background: "40 25% 98%",
      foreground: "240 30% 14%",
      muted: "220 25% 94%",
      mutedFg: "0 0% 40%",
      border: "220 20% 85%",
    },
    fonts: {
      display: "Fraunces",
      body: "Inter",
    },
  },

  business: {
    ownerName: "Jane Smith",
    phone: "+440000000000",
    phoneDisplay: "TBC",
    email: "hello@exampletownjuniors.co.uk",
    address: {
      line1: "Example Town Recreation Ground",
      city: "Example Town",
      postcode: "EX1",
      country: "United Kingdom",
    },
    mapsUrl: "https://maps.google.com/?q=Example+Town+Recreation+Ground",
  },

  copy: {
    heroTitle: "Football For Everyone, Every Saturday",
    heroSubtitle:
      "Example Town Juniors FC is a volunteer-run junior football club with teams for every age group. Catch our fixtures, see the gallery, and support the club through our raffles and auctions.",
    aboutTitle: "About the club",
    aboutBody:
      "Example Town Juniors FC is a community-run junior football club.\n\nWe're volunteer-led — coaches, committee members and matchday helpers all give their time for free. Fundraising through raffles and auctions helps us cover pitch hire, kit and coaching so subs can stay low for every family.\n\n(Edit this in the admin Content tab to add your own club story.)",
    homeBullets: [
      "Teams for every age group",
      "DBS-checked, qualified coaches",
      "Run entirely by volunteers",
      "Raffles & auctions fund the club",
    ],
  },

  gallery: [
    // Empty — upload match-day photos via the admin Content tab.
  ],

  payments: {
    // Mode stays "mvp" until SumUp is connected via the admin Payments tab.
    mode: "mvp",
    currency: "GBP",
    currencySymbol: "£",
  },

  admin: {
    // Passcode-only login (case-insensitive). Change this before going live.
    passcode: "W3lcome",
  },

  seo: {
    siteUrl: "https://exampletownjuniors.co.uk",
    defaultTitle: "Example Town Juniors FC · Junior Football Club",
    defaultDescription:
      "Example Town Juniors FC — a volunteer-run junior football club. Fixtures, galleries, and raffles & auctions to support the club.",
    ogImage: "/img/og-default.png",
  },
};

export default config;
