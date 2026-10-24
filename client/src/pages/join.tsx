/**
 * client/src/pages/join.tsx
 * ───────────────────────────
 * "Join the Wolfpack" waiting-list registration form.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { applySeo, breadcrumb } from "@/lib/seo";
import { Loader2, CheckCircle2 } from "lucide-react";
import config from "@/lib/tenant";

const { brand } = config;

const emptyForm = {
  parentName: "", parentEmail: "", parentPhone: "",
  playerName: "", school: "", schoolYear: "",
  position: "", secondaryPosition: "",
  footballLevel: "", saturdayLeague: "", division: "", ageGroup: "",
};

export default function Join() {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    applySeo({
      title: `Join the Wolfpack · ${brand.name}`,
      description: `Register your interest in joining ${brand.name}.`,
      path: "/join",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Join", path: "/join" }])],
    });
  }, []);

  const submit = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/public/waiting-list", form),
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => toast({ title: "Couldn't submit", description: String(e?.message || e).replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  if (submitted) {
    return (
      <SiteShell>
        <div className="py-24 max-w-md mx-auto px-4 text-center">
          <CheckCircle2 className="size-10 text-primary mx-auto" />
          <h1 className="font-display font-extrabold text-2xl mt-3">Hi from the Wolfpack! 🐺⚽️🐺</h1>
          <p className="text-muted-foreground mt-3">
            Thank you for your interest in {brand.name}. We really appreciate you taking the time to register your interest.
            We'll be in touch if a suitable space becomes available. In the meantime, stay positive and good luck to your
            child on their football journey!
          </p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Join the Wolfpack</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Register your <span className="font-serif italic font-medium text-primary">interest</span>.
          </h1>
          <p className="mt-5 text-base text-muted-foreground max-w-2xl">
            Spaces open up through the season — register and we'll be in touch when one suits your child's age group.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="bg-card border border-card-border rounded-xl p-5 sm:p-6 space-y-4">
            <h2 className="font-display font-bold text-lg">Parent / Guardian</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input required value={form.parentName} onChange={set("parentName")} data-testid="input-join-parentname" /></div>
              <div><Label>Email</Label><Input required type="email" value={form.parentEmail} onChange={set("parentEmail")} data-testid="input-join-parentemail" /></div>
            </div>
            <div><Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.parentPhone} onChange={set("parentPhone")} data-testid="input-join-parentphone" /></div>

            <h2 className="font-display font-bold text-lg pt-3 border-t border-card-border">Player</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Player's name</Label><Input required value={form.playerName} onChange={set("playerName")} data-testid="input-join-playername" /></div>
              <div><Label>Age group</Label><Input placeholder="e.g. U10" value={form.ageGroup} onChange={set("ageGroup")} data-testid="input-join-agegroup" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>School <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.school} onChange={set("school")} data-testid="input-join-school" /></div>
              <div><Label>School year <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.schoolYear} onChange={set("schoolYear")} data-testid="input-join-schoolyear" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Position <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.position} onChange={set("position")} data-testid="input-join-position" /></div>
              <div><Label>Secondary position <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.secondaryPosition} onChange={set("secondaryPosition")} data-testid="input-join-secondaryposition" /></div>
            </div>
            <div><Label>Current football level <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.footballLevel} onChange={set("footballLevel")} data-testid="input-join-level" /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Saturday league <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.saturdayLeague} onChange={set("saturdayLeague")} data-testid="input-join-league" /></div>
              <div><Label>Division <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.division} onChange={set("division")} data-testid="input-join-division" /></div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={submit.isPending} data-testid="button-submit-join">
              {submit.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null} Register interest
            </Button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
