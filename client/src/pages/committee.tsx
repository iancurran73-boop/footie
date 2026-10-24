/**
 * client/src/pages/committee.tsx
 * ─────────────────────────────────
 * Public committee / club contacts page.
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { Users, Mail, Phone } from "lucide-react";
import config from "@/lib/tenant";
import type { CommitteeMember } from "@shared/schema";

const { brand } = config;

export default function Committee() {
  const { data: members = [] } = useQuery<CommitteeMember[]>({ queryKey: ["/api/public/committee"] });

  useEffect(() => {
    applySeo({
      title: `Committee · ${brand.name}`,
      description: `Who's who at ${brand.name}.`,
      path: "/committee",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Committee", path: "/committee" }])],
    });
  }, []);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Who's who</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Run by <span className="font-serif italic font-medium text-primary">volunteers</span>.
          </h1>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {members.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8 flex flex-col items-center gap-2">
              <Users className="size-8 text-muted-foreground/50" />
              Committee details are coming soon.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {members.map((m) => (
                <div key={m.id} className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4" data-testid={`card-committee-${m.id}`}>
                  <div className="size-14 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                    {m.photoUrl ? <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" /> : <Users className="size-6 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold">{m.name}</p>
                    <p className="text-xs uppercase tracking-wide text-primary font-semibold">{m.role}</p>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {m.email && <a href={`mailto:${m.email}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Mail className="size-3" /> {m.email}</a>}
                      {m.phone && <a href={`tel:${m.phone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"><Phone className="size-3" /> {m.phone}</a>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
