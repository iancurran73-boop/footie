/**
 * client/src/pages/teams.tsx
 * ────────────────────────────
 * Public list of the club's age-group teams/squads.
 */

import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteShell } from "@/components/site-shell";
import { applySeo, breadcrumb } from "@/lib/seo";
import { Users, Mail, Phone, Clock, ArrowRight } from "lucide-react";
import config from "@/lib/tenant";
import type { Team } from "@shared/schema";

const { brand } = config;

export default function Teams() {
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/public/teams"] });

  useEffect(() => {
    applySeo({
      title: `Teams · ${brand.name}`,
      description: `Meet the age-group teams at ${brand.name}.`,
      path: "/teams",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Teams", path: "/teams" }])],
    });
  }, []);

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Our teams</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            A team for <span className="font-serif italic font-medium text-primary">every age</span>.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {brand.name} runs squads across every age group, each coached by volunteers from the club.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {teams.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Team details are coming soon — check back shortly.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {teams.map((t) => <TeamCard key={t.id} team={t} />)}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}

function TeamCard({ team }: { team: Team }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="relative aspect-[16/9] bg-gradient-to-br from-primary/30 via-accent/15 to-primary/40 flex items-center justify-center overflow-hidden">
        {team.photoUrl ? (
          <img src={team.photoUrl} alt={team.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : (
          <Users className="size-14 text-white/40" strokeWidth={1.2} />
        )}
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-bold text-lg">{team.name}</h2>
          {team.ageGroup && (
            <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{team.ageGroup}</span>
          )}
        </div>
        {team.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{team.description}</p>}

        <div className="mt-3 space-y-1.5 text-sm text-foreground/85">
          {team.coachName && (
            <p>Coach: <span className="font-medium">{team.coachName}</span></p>
          )}
          {team.trainingInfo && (
            <p className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3.5 shrink-0" /> {team.trainingInfo}</p>
          )}
          {team.coachEmail && (
            <a href={`mailto:${team.coachEmail}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Mail className="size-3.5 shrink-0" /> {team.coachEmail}</a>
          )}
          {team.coachPhone && (
            <a href={`tel:${team.coachPhone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Phone className="size-3.5 shrink-0" /> {team.coachPhone}</a>
          )}
        </div>

        <Link
          href={`/fixtures?team=${encodeURIComponent(team.name)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary mt-4 hover:underline"
        >
          See fixtures <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}
