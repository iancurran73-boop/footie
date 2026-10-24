/**
 * client/src/lib/pages.ts
 * ─────────────────────────
 * usePages() — the site nav, backed by /api/public/pages (admin-editable
 * order/visibility via Admin > Pages). Falls back to the current default
 * page set while loading or if the request fails, so the nav never flashes
 * empty.
 */

import { useQuery } from "@tanstack/react-query";

export interface SitePage {
  id: number;
  slug: string;
  navLabel: string;
  path: string;
  kind: "core" | "custom";
  layout: string | null;
  sortOrder: number;
  visible: boolean;
}

const FALLBACK_PAGES: SitePage[] = [
  { id: -1, slug: "home", navLabel: "Home", path: "/", kind: "core", layout: null, sortOrder: 0, visible: true },
  { id: -2, slug: "teams", navLabel: "Teams", path: "/teams", kind: "core", layout: null, sortOrder: 1, visible: true },
  { id: -3, slug: "players", navLabel: "Players", path: "/players", kind: "core", layout: null, sortOrder: 2, visible: true },
  { id: -4, slug: "fixtures", navLabel: "Fixtures & Results", path: "/fixtures", kind: "core", layout: null, sortOrder: 3, visible: true },
  { id: -5, slug: "stats", navLabel: "Stats", path: "/stats", kind: "core", layout: null, sortOrder: 4, visible: true },
  { id: -6, slug: "fundraising", navLabel: "Fundraising", path: "/fundraising", kind: "core", layout: null, sortOrder: 5, visible: true },
  { id: -7, slug: "competitions", navLabel: "Raffles & Auctions", path: "/competitions", kind: "core", layout: null, sortOrder: 6, visible: true },
  { id: -8, slug: "football-cards", navLabel: "Football Cards", path: "/football-cards", kind: "core", layout: null, sortOrder: 7, visible: true },
  { id: -9, slug: "sponsors", navLabel: "Sponsors", path: "/sponsors", kind: "core", layout: null, sortOrder: 8, visible: true },
  { id: -10, slug: "gallery", navLabel: "Gallery", path: "/gallery", kind: "core", layout: null, sortOrder: 9, visible: true },
  { id: -11, slug: "about", navLabel: "About", path: "/about", kind: "core", layout: null, sortOrder: 10, visible: true },
  { id: -12, slug: "contact", navLabel: "Contact", path: "/contact", kind: "core", layout: null, sortOrder: 11, visible: true },
  { id: -13, slug: "tournaments", navLabel: "Tournaments", path: "/tournaments", kind: "core", layout: null, sortOrder: 12, visible: true },
  { id: -14, slug: "committee", navLabel: "Committee", path: "/committee", kind: "core", layout: null, sortOrder: 13, visible: true },
  { id: -15, slug: "safeguarding", navLabel: "Safeguarding", path: "/safeguarding", kind: "core", layout: null, sortOrder: 14, visible: true },
  { id: -16, slug: "join", navLabel: "Join the Wolfpack", path: "/join", kind: "core", layout: null, sortOrder: 15, visible: true },
  { id: -17, slug: "complaints", navLabel: "Complaints", path: "/complaints", kind: "core", layout: null, sortOrder: 16, visible: false },
];

async function fetchPages(): Promise<SitePage[]> {
  const res = await fetch("/api/public/pages");
  if (!res.ok) throw new Error("pages fetch failed");
  return res.json();
}

export function usePages(): SitePage[] {
  const { data } = useQuery<SitePage[]>({
    queryKey: ["/api/public/pages"],
    queryFn: fetchPages,
    staleTime: 60_000,
    retry: 1,
  });
  return data ?? FALLBACK_PAGES;
}
