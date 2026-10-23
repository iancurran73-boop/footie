/**
 * tenant.config.ts
 * ─────────────────────────
 * Example junior football club tenant. Rename the club, swap the colours
 * and copy below, then edit the rest via the admin Content tab once live.
 */

import type { TenantConfig } from "./shared/tenant-types";

const config: TenantConfig = {
  brand: {
    name: "Riverside Juniors FC",
    shortName: "Riverside Juniors",
    tagline: "Every child plays. Every match matters.",
    domain: "riversidejuniorsfc.co.uk",
    instagram: "riversidejuniorsfc",
    logoPath: "",
    favicon: "/favicon.png",
    colors: {
      // HSL "H S% L%" — forest green & gold, a classic junior-club kit palette.
      primary: "142 45% 24%",        // club green
      primaryFg: "0 0% 100%",
      accent: "45 90% 55%",          // gold trim
      accentFg: "240 30% 14%",
      background: "40 30% 98%",      // warm off-white
      foreground: "240 30% 14%",
      muted: "142 25% 94%",
      mutedFg: "0 0% 40%",
      border: "142 20% 85%",
    },
    fonts: {
      display: "Fraunces",
      body: "Inter",
    },
  },

  business: {
    ownerName: "Dave Thompson",
    phone: "+440000000000",            // TBC
    phoneDisplay: "TBC",
    email: "hello@riversidejuniorsfc.co.uk", // TBC
    address: {
      line1: "Riverside Recreation Ground",
      city: "Riverside",
      postcode: "NE00",
      country: "United Kingdom",
    },
    mapsUrl: "https://maps.google.com/?q=Riverside+Recreation+Ground",
  },

  copy: {
    heroTitle: "Every Child Plays, Every Match Matters",
    heroSubtitle:
      "Riverside Juniors FC is a volunteer-run junior football club with teams for every age group. Catch our fixtures, see the gallery, and support the club through our raffles and auctions.",
    aboutTitle: "About the club",
    aboutBody:
      "Riverside Juniors FC is a community-run junior football club fielding teams from under-7s through to under-16s.\n\nWe're entirely volunteer-led — coaches, committee members and matchday helpers all give their time for free. Fundraising through raffles and auctions helps us cover pitch hire, kit, equipment and coach qualifications so that subs can stay as low as possible for every family.\n\nWe believe every child should get to play, develop and enjoy football regardless of ability. (Edit this in the admin Content tab to add your own club story.)",
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
    siteUrl: "https://riversidejuniorsfc.co.uk",
    defaultTitle: "Riverside Juniors FC · Junior Football Club",
    defaultDescription:
      "Riverside Juniors FC — a volunteer-run junior football club. Fixtures, galleries, and raffles & auctions to support the club.",
    ogImage: "/img/og-default.png",
  },
};

export default config;
