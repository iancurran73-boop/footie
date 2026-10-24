/**
 * client/src/pages/complaints.tsx
 * ───────────────────────────────────
 * Complaints form. Not in the main nav (see storage.ts seed, visible:
 * false) — linked quietly from Contact/Safeguarding, same way most club
 * sites handle this rather than giving it top billing.
 */

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { applySeo, breadcrumb } from "@/lib/seo";
import { Loader2, CheckCircle2 } from "lucide-react";
import config from "@/lib/tenant";

const { brand } = config;

export default function Complaints() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", reason: "", dateOccurred: "", desiredResolution: "" });
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: `Complaints · ${brand.name}`,
      description: `Raise a complaint with ${brand.name}.`,
      path: "/complaints",
      jsonLd: [breadcrumb([{ name: "Home", path: "/" }, { name: "Complaints", path: "/complaints" }])],
    });
  }, []);

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/public/complaints", form);
      return res.json() as Promise<{ ok: boolean; reference: string }>;
    },
    onSuccess: (data) => setReference(data.reference),
    onError: (e: any) => toast({ title: "Couldn't submit", description: String(e?.message || e).replace(/^\d+:\s*/, ""), variant: "destructive" }),
  });

  if (reference) {
    return (
      <SiteShell>
        <div className="py-24 max-w-md mx-auto px-4 text-center">
          <CheckCircle2 className="size-10 text-primary mx-auto" />
          <h1 className="font-display font-extrabold text-2xl mt-3">We've received your complaint</h1>
          <p className="text-muted-foreground mt-3">
            Your reference is <span className="font-bold text-foreground">{reference}</span> — please quote it in any follow-up.
            {" "}{brand.name} aims to respond within 10 working days.
          </p>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="bg-gradient-to-br from-[hsl(35_40%_97%)] to-[hsl(35_40%_92%)] pt-12 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Complaints</p>
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight mt-3 leading-[1.05] max-w-3xl">
            Tell us what <span className="font-serif italic font-medium text-primary">went wrong</span>.
          </h1>
          <p className="mt-5 text-base text-muted-foreground max-w-2xl">
            {brand.name} aims to respond to every complaint within 10 working days.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="bg-card border border-card-border rounded-xl p-5 sm:p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-complaint-name" /></div>
              <div><Label>Email</Label><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-complaint-email" /></div>
            </div>
            <div><Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-complaint-phone" /></div>
            <div><Label>Date the issue occurred <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Input type="date" value={form.dateOccurred} onChange={(e) => setForm({ ...form, dateOccurred: e.target.value })} data-testid="input-complaint-date" /></div>
            <div><Label>Reason for complaint</Label><Textarea required rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} data-testid="input-complaint-reason" /></div>
            <div><Label>How would you like the matter resolved? <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label><Textarea rows={3} value={form.desiredResolution} onChange={(e) => setForm({ ...form, desiredResolution: e.target.value })} data-testid="input-complaint-resolution" /></div>
            <Button type="submit" size="lg" className="w-full" disabled={submit.isPending} data-testid="button-submit-complaint">
              {submit.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : null} Submit complaint
            </Button>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
