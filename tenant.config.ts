/**
 * tenant.config.ts
 * ─────────────────────────
 * Harton & Westoe Wolves FC — South Shields.
 * Colours/logo: TODO — real crest + sponsor logos (Hygeia, Edwards Commercial
 * Cleaning) were shared but not yet uploaded as files; logoPath stays empty
 * (falls back to the BrandMark football-icon placeholder) until they are.
 * Navy/gold below are read off the real crest, not the brief's generic
 * "blue and white".
 */

import type { TenantConfig } from "./shared/tenant-types";

const config: TenantConfig = {
  brand: {
    name: "Harton & Westoe Wolves",
    shortName: "H&W Wolves",
    tagline: "Stronger Together",
    domain: "hartonwestoewolves.co.uk",
    instagram: "",
    logoPath: "", // TODO: set once the crest is uploaded as a file
    favicon: "/favicon.png",
    colors: {
      // HSL "H S% L%" — navy & gold, read from the club crest.
      primary: "223 55% 23%",        // crest navy
      primaryFg: "0 0% 100%",
      accent: "44 79% 57%",          // crest gold
      accentFg: "223 55% 15%",
      background: "40 25% 98%",
      foreground: "223 40% 14%",
      muted: "223 20% 94%",
      mutedFg: "0 0% 40%",
      border: "223 20% 85%",
    },
    fonts: {
      display: "Fraunces",
      body: "Inter",
    },
  },

  business: {
    ownerName: "Chris Reay",
    phone: "+440000000000",            // TBC
    phoneDisplay: "TBC",
    email: "hello@hartonwestoewolves.co.uk", // TBC
    address: {
      line1: "5 Harton Court",
      city: "South Shields",
      postcode: "NE34 0RH",
      country: "United Kingdom",
    },
    mapsUrl: "https://maps.google.com/?q=5+Harton+Court+South+Shields",
  },

  copy: {
    heroTitle: "Play. Develop. Belong. Achieve.",
    heroSubtitle:
      "Harton & Westoe Wolves is a grassroots football family — development, friendship, teamwork and community, built around supporting every child through their football journey.",
    aboutTitle: "About the Wolves",
    aboutBody:
      "Harton & Westoe Wolves FC is a grassroots football family in South Shields, built around development, friendship, teamwork, community and enjoyment.\n\nWe're run by volunteers — coaches, committee members and matchday helpers all give their time to support every child through their football journey, whatever their ability.\n\nFundraising, sponsorship and the Wolves Shop help cover pitch fees, kit and tournament costs so every family can be part of the Wolfpack. (Edit this in the admin Content tab to add the club's full story.)",
    homeBullets: [
      "Teams for every age group",
      "DBS-checked, qualified coaches",
      "Run entirely by volunteers",
      "100% of fundraising supports the Wolfpack",
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
    siteUrl: "https://hartonwestoewolves.co.uk",
    defaultTitle: "Harton & Westoe Wolves · Grassroots Football Club",
    defaultDescription:
      "Harton & Westoe Wolves FC — South Shields grassroots football. Players, fixtures, fundraising, sponsors and the Wolves Shop.",
    ogImage: "/img/og-default.png",
  },
};

export default config;
