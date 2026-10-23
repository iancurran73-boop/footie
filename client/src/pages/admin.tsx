import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { gbp, formatDuration, formatDate, formatDateShort, todayIso, addDays } from "@/lib/format";
import { BrandMark } from "@/components/brand-mark";
import {
  Calendar, Briefcase, Clock, Settings as SettingsIcon, Plus, Trash2, Pencil, Bell, ChevronLeft,
  CalendarOff, CheckCircle2, X, Loader2, BellRing, AlertCircle, FileText,
  ChevronUp, ChevronDown, GripVertical, Image as ImageIcon, Star, MessageSquare, CreditCard,
  Building2, Palette, ScrollText, MapPin, Mail, Layers, Eye, EyeOff, Users, Search,
  Trophy, Gavel, Ticket, Flag, Upload, Table2, Share2,
} from "lucide-react";
import type { Settings, Review, Team, Fixture, Competition, Entry, Bid, LeagueTableRow, SocialPost } from "@shared/schema";
import { AdminGate, AdminLogout } from "@/components/admin-gate";
import { useContent, useGalleryItems, useContentMutations } from "@/lib/content";
import type { GalleryItem } from "@/lib/content";
import type { SitePage } from "@/lib/pages";
import { PAGE_LAYOUTS } from "@shared/page-layouts";
import { ImageDropzone } from "@/components/content/ImageDropzone";
import { InlineText } from "@/components/content/InlineText";
import config from "@/lib/tenant";

type Tab = "today" | "fixtures" | "competitions" | "settings" | "content" | "pages" | "reviews" | "payments" | "business" | "branding" | "emails" | "social";

const { brand, business } = config;

export default function Admin() {
  return (
    <AdminGate>
      <AdminInner />
    </AdminGate>
  );
}

const TABS: Tab[] = ["today", "fixtures", "competitions", "settings", "content", "pages", "reviews", "payments", "business", "branding", "emails"];

function AdminInner() {
  const [tab, setTab] = useState<Tab>(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return (TABS as string[]).includes(requested ?? "") ? (requested as Tab) : "today";
  });
  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-sidebar/95 backdrop-blur border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground" data-testid="link-back-site">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BrandMark className="h-12 w-auto" />
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Admin</div>
                <div className="font-display font-bold text-sm leading-tight">{brand.shortName}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:text-sidebar-foreground" data-testid="button-notifications">
              <Bell className="size-5" />
            </Button>
            <AdminLogout />
          </div>
        </div>
      </header>

      {/* Body — light surface */}
      <main className="bg-background text-foreground rounded-t-3xl min-h-[calc(100vh-58px)] pb-24 sm:pb-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            {/* Desktop: grouped nav panel. Mobile uses the fixed bottom nav below. */}
            <Card className="hidden sm:block p-4 mb-6 space-y-3">
              <NavGroup label="Operations">
                <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="today" data-testid="tab-today"><Calendar className="size-4 mr-1.5" /> Today</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="fixtures" data-testid="tab-fixtures"><Flag className="size-4 mr-1.5" /> Fixtures</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="competitions" data-testid="tab-competitions"><Trophy className="size-4 mr-1.5" /> Competitions</TabsTrigger>
                </TabsList>
              </NavGroup>
              <NavGroup label="Content">
                <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="content" data-testid="tab-content"><FileText className="size-4 mr-1.5" /> Content</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="pages" data-testid="tab-pages"><Layers className="size-4 mr-1.5" /> Pages</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="reviews" data-testid="tab-reviews"><Star className="size-4 mr-1.5" /> Reviews</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="social" data-testid="tab-social"><Share2 className="size-4 mr-1.5" /> Social</TabsTrigger>
                </TabsList>
              </NavGroup>
              <NavGroup label="Setup">
                <TabsList className="bg-transparent p-0 h-auto flex flex-wrap gap-2 justify-start">
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="business" data-testid="tab-business"><Building2 className="size-4 mr-1.5" /> Business</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="branding" data-testid="tab-branding"><Palette className="size-4 mr-1.5" /> Branding</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="emails" data-testid="tab-emails"><Mail className="size-4 mr-1.5" /> Emails</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="payments" data-testid="tab-payments"><CreditCard className="size-4 mr-1.5" /> Payments</TabsTrigger>
                  <TabsTrigger className="flex-none px-3 py-1.5 text-sm" value="settings" data-testid="tab-settings"><SettingsIcon className="size-4 mr-1.5" /> Settings</TabsTrigger>
                </TabsList>
              </NavGroup>
            </Card>

            <TabsContent value="today"><TodayTab /></TabsContent>
            <TabsContent value="fixtures"><FixturesTab /></TabsContent>
            <TabsContent value="competitions"><CompetitionsTab /></TabsContent>
            <TabsContent value="content"><ContentTab /></TabsContent>
            <TabsContent value="pages"><PagesTab /></TabsContent>
            <TabsContent value="reviews"><ReviewsTab /></TabsContent>
            <TabsContent value="social"><SocialTab /></TabsContent>
            <TabsContent value="payments"><PaymentsTab /></TabsContent>
            <TabsContent value="business"><BusinessTab /></TabsContent>
            <TabsContent value="branding"><BrandingTab /></TabsContent>
            <TabsContent value="emails"><EmailsTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
          </Tabs>
        </div>

        {/* Mobile bottom nav */}
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-card/95 backdrop-blur border-t border-card-border">
          <div className="grid grid-cols-6">
            {([
              ["today", Calendar, "Today"],
              ["fixtures", Flag, "Fixtures"],
              ["competitions", Trophy, "Draws"],
              ["content", FileText, "Content"],
              ["pages", Layers, "Pages"],
              ["reviews", Star, "Reviews"],
              ["social", Share2, "Social"],
              ["payments", CreditCard, "Pay"],
              ["business", Building2, "Business"],
              ["branding", Palette, "Brand"],
              ["emails", Mail, "Emails"],
              ["settings", SettingsIcon, "Settings"],
            ] as [Tab, typeof Calendar, string][]).map(([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                data-testid={`mobnav-${id}`}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${tab === id ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="size-5" />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}

// ============ TODAY ============
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4 bg-card">
      <div className="text-2xl font-display font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </Card>
  );
}

function TodayTab() {
  const { data: competitions = [] } = useQuery<Competition[]>({ queryKey: ["/api/admin/competitions"] });
  const { data: fixtures = [] } = useQuery<Fixture[]>({ queryKey: ["/api/admin/fixtures"] });

  const today = todayIso();
  const live = competitions.filter((c) => c.status === "live");
  const needsPublishing = competitions.filter((c) => c.status === "draft");
  const needsPayout = competitions.filter((c) =>
    (c.status === "drawn" || c.status === "closed") && !c.winnerPaid && (c.winnerEntryId != null || c.winnerBidId != null)
  );
  const upcoming = fixtures.filter((f) => f.date >= today).slice(0, 5);

  return (
    <div className="space-y-5 mt-5">
      <h1 className="font-display text-2xl font-bold">Today</h1>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Live competitions" value={String(live.length)} />
        <Stat label="Drafts to publish" value={String(needsPublishing.length)} />
        <Stat label="Winners to pay" value={String(needsPayout.length)} />
      </div>

      {live.length > 0 && (
        <Card className="p-4 bg-card space-y-2">
          <h2 className="font-display font-bold text-sm">Live right now</h2>
          {live.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <span className="text-foreground">{c.title}</span>
              <span className="text-muted-foreground text-xs">
                {c.type === "raffle" ? `${c.ticketsSold}${c.maxTickets > 0 ? `/${c.maxTickets}` : ""} tickets` : "auction"}
              </span>
            </div>
          ))}
        </Card>
      )}

      <Card className="p-4 bg-card space-y-2">
        <h2 className="font-display font-bold text-sm">Next fixtures</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
        ) : upcoming.map((f) => (
          <div key={f.id} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{f.team} vs {f.opponent}</span>
            <span className="text-muted-foreground text-xs">{formatDateShort(f.date)}{f.kickoffTime ? ` · ${f.kickoffTime}` : ""}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ============ CONTENT ============
function ContentTab() {
  const { c, ready } = useContent();
  const { items: galleryItems, refresh: refreshGallery } = useGalleryItems();
  const { uploadImage, insertGalleryItem, updateGalleryItem, deleteGalleryItem } = useContentMutations();
  const { toast } = useToast();
  const { copy, business, brand, seo } = config;
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // We need useRef for the gallery multi-upload input
  // Use a callback to create it lazily
  function handleGalleryFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setGalleryUploading(true);
    let failed = 0;
    const uploads = Array.from(files).map(async (file, i) => {
      try {
        const url = await uploadImage(file);
        await insertGalleryItem.mutateAsync({
          imageUrl: url,
          caption: null,
          category: null,
          sortOrder: Date.now() + i,
          active: true,
        });
      } catch (e: unknown) {
        failed += 1;
        const msg = e instanceof Error ? e.message : "Upload failed";
        toast({ title: `Couldn't add ${file.name}`, description: msg, variant: "destructive" });
      }
    });
    // Individual failures already toast above — only claim success here for
    // what actually saved, instead of always showing "Gallery updated"
    // regardless of whether every upload failed.
    Promise.all(uploads).finally(() => {
      setGalleryUploading(false);
      refreshGallery();
      const succeeded = files.length - failed;
      if (succeeded > 0) {
        toast({ title: `${succeeded} photo${succeeded === 1 ? "" : "s"} added` });
      }
    });
  }

  async function moveItem(item: GalleryItem, direction: "up" | "down") {
    const sorted = [...galleryItems].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((i) => i.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapItem = sorted[swapIdx];
    await updateGalleryItem.mutateAsync({ id: item.id, sortOrder: swapItem.sortOrder });
    await updateGalleryItem.mutateAsync({ id: swapItem.id, sortOrder: item.sortOrder });
  }

  async function confirmDelete(id: number) {
    try {
      await deleteGalleryItem.mutateAsync(id);
      toast({ title: "Item deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setConfirmDeleteId(null);
    }
  }

  if (!ready) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="size-5 animate-spin inline" />
        <p className="text-sm text-muted-foreground mt-2">Loading content…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Content</h1>
        <p className="text-sm text-muted-foreground mt-1">Edit your website text and images. Changes save automatically.</p>
      </div>

      <Accordion type="multiple" className="space-y-3">

        {/* HOME PAGE */}
        <AccordionItem value="home" className="border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-display font-bold hover:no-underline">
            Home page
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 space-y-5">
            <div>
              <Label className="mb-1 block">Hero Title <span className="text-xs font-normal text-muted-foreground">— shown at the top of the home page</span></Label>
              <InlineText contentKey="home.heroTitle" value={c("home.heroTitle", copy.heroTitle)} placeholder={copy.heroTitle} label="Hero title" />
            </div>
            <div>
              <Label className="mb-1 block">Hero Accent <span className="text-xs font-normal text-muted-foreground">— the italic words at the end of the title</span></Label>
              <InlineText contentKey="home.heroAccent" value={c("home.heroAccent", copy.heroTitle.split(" ").slice(-2).join(" "))} placeholder="Pampered Perfection" label="Hero accent" />
            </div>
            <div>
              <Label className="mb-1 block">Hero Body <span className="text-xs font-normal text-muted-foreground">— paragraph below the headline</span></Label>
              <InlineText contentKey="home.heroBody" value={c("home.heroBody", copy.heroSubtitle)} variant="textarea" rows={4} label="Hero body" />
            </div>
            <div>
              <Label className="mb-1 block">Hero Image</Label>
              <ImageDropzone contentKey="home.heroImage" currentUrl={c("home.heroImage", "")} alt="Hero image" />
            </div>
            <div>
              <Label className="mb-1 block">Trust Badges <span className="text-xs font-normal text-muted-foreground">— one per line</span></Label>
              <InlineText contentKey="home.bullets" value={c("home.bullets", copy.homeBullets.join("\n"))} variant="textarea" rows={5} label="Trust badges" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ABOUT PAGE */}
        <AccordionItem value="about" className="border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-display font-bold hover:no-underline">
            About page
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 space-y-5">
            <div>
              <Label className="mb-1 block">Title</Label>
              <InlineText contentKey="about.title" value={c("about.title", copy.aboutTitle)} label="About title" />
            </div>
            <div>
              <Label className="mb-1 block">Body <span className="text-xs font-normal text-muted-foreground">— separate paragraphs with a blank line</span></Label>
              <InlineText contentKey="about.body" value={c("about.body", copy.aboutBody)} variant="textarea" rows={10} label="About body" />
            </div>
            <div>
              <Label className="mb-1 block">About Image</Label>
              <ImageDropzone contentKey="about.image" currentUrl={c("about.image", "")} alt="About image" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* GALLERY */}
        <AccordionItem value="gallery" className="border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-display font-bold hover:no-underline">
            Gallery
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 space-y-5">
            {/* Multi-upload drop zone */}
            <div>
              <Label className="mb-2 block">Upload new images <span className="text-xs font-normal text-muted-foreground">— you can pick multiple at once</span></Label>
              <div
                role="button"
                tabIndex={0}
                onClick={() => galleryInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && galleryInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/60 hover:bg-muted/50 cursor-pointer transition-colors touch-manipulation"
              >
                {galleryUploading ? (
                  <><Loader2 className="size-6 text-muted-foreground animate-spin" /><p className="text-sm text-muted-foreground">Uploading…</p></>
                ) : (
                  <><ImageIcon className="size-6 text-muted-foreground" /><p className="text-sm text-center text-muted-foreground"><span className="font-semibold text-foreground">Drop images or tap to upload</span><br /><span className="text-xs">Multiple files at once supported</span></p></>
                )}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => handleGalleryFiles(e.target.files)}
                  data-testid="input-gallery-upload"
                />
              </div>
            </div>

            {/* Gallery grid */}
            {galleryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No gallery images yet. Upload some above.</p>
            ) : (
              <div className="space-y-3">
                {[...galleryItems].sort((a, b) => a.sortOrder - b.sortOrder).map((item, idx, arr) => (
                  <Card key={item.id} className="relative p-3 flex gap-3 items-start bg-card">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label="Delete photo"
                      title="Delete photo"
                      className="absolute top-1.5 right-1.5 z-10 grid place-items-center size-7 rounded-full bg-white/90 text-destructive shadow-sm ring-1 ring-destructive/20 hover:bg-white hover:ring-destructive/40 transition-colors"
                      data-testid={`button-gallery-delete-${item.id}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="size-16 rounded-md overflow-hidden shrink-0 bg-muted">
                      <img src={item.imageUrl} alt={item.caption ?? "Gallery item"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2 pr-8">
                      <Input
                        placeholder="Caption (optional)"
                        defaultValue={item.caption ?? ""}
                        onBlur={(e) => updateGalleryItem.mutate({ id: item.id, caption: e.target.value || null })}
                        className="w-full text-sm h-8"
                        data-testid={`input-gallery-caption-${item.id}`}
                      />
                      <Input
                        placeholder="Category (optional)"
                        defaultValue={item.category ?? ""}
                        onBlur={(e) => updateGalleryItem.mutate({ id: item.id, category: e.target.value || null })}
                        className="w-full text-sm h-8"
                        data-testid={`input-gallery-category-${item.id}`}
                      />
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => moveItem(item, "up")} disabled={idx === 0} data-testid={`button-gallery-up-${item.id}`}>
                        <ChevronUp className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => moveItem(item, "down")} disabled={idx === arr.length - 1} data-testid={`button-gallery-down-${item.id}`}>
                        <ChevronDown className="size-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Delete confirm dialog */}
            <Dialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
              <DialogContent>
                <DialogHeader><DialogTitle>Delete image?</DialogTitle></DialogHeader>
                <p className="text-sm text-muted-foreground">This will remove the image from your gallery. You cannot undo this.</p>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => confirmDeleteId !== null && confirmDelete(confirmDeleteId)}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </AccordionContent>
        </AccordionItem>

        {/* CONTACT */}
        <AccordionItem value="contact" className="border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-display font-bold hover:no-underline">
            Contact details
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">Phone <span className="text-xs font-normal text-muted-foreground">e.g. +447591134200</span></Label>
                <InlineText contentKey="contact.phone" value={c("contact.phone", business.phone)} label="Phone" />
              </div>
              <div>
                <Label className="mb-1 block">Phone display <span className="text-xs font-normal text-muted-foreground">e.g. +44 7591 134200</span></Label>
                <InlineText contentKey="contact.phoneDisplay" value={c("contact.phoneDisplay", business.phoneDisplay)} label="Phone display" />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Email</Label>
              <InlineText contentKey="contact.email" value={c("contact.email", business.email)} label="Email" />
            </div>
            <div>
              <Label className="mb-1 block">Address line 1</Label>
              <InlineText contentKey="contact.addressLine1" value={c("contact.addressLine1", business.address.line1)} label="Address line 1" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1 block">City</Label>
                <InlineText contentKey="contact.city" value={c("contact.city", business.address.city)} label="City" />
              </div>
              <div>
                <Label className="mb-1 block">Postcode</Label>
                <InlineText contentKey="contact.postcode" value={c("contact.postcode", business.address.postcode)} label="Postcode" />
              </div>
            </div>
            <div>
              <Label className="mb-1 block">Instagram handle <span className="text-xs font-normal text-muted-foreground">— without the @</span></Label>
              <InlineText contentKey="contact.instagram" value={c("contact.instagram", brand.instagram ?? "")} label="Instagram" />
            </div>
            <div>
              <Label className="mb-1 block">Hours note <span className="text-xs font-normal text-muted-foreground">— free-form note shown beside opening hours</span></Label>
              <InlineText contentKey="contact.hoursNote" value={c("contact.hoursNote", "")} variant="textarea" rows={2} placeholder="e.g. Sunday by request only" label="Hours note" />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* FOOTER / SEO */}
        <AccordionItem value="seo" className="border border-border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 py-3 font-display font-bold hover:no-underline">
            Footer &amp; SEO
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-5 space-y-5">
            <div>
              <Label className="mb-1 block">Page title <span className="text-xs font-normal text-muted-foreground">— shown in browser tab and Google results</span></Label>
              <InlineText contentKey="seo.title" value={c("seo.title", seo.defaultTitle)} label="SEO title" />
            </div>
            <div>
              <Label className="mb-1 block">Meta description <span className="text-xs font-normal text-muted-foreground">— 150–160 characters for best Google display</span></Label>
              <InlineText contentKey="seo.description" value={c("seo.description", seo.defaultDescription)} variant="textarea" rows={3} label="SEO description" />
            </div>
            <div>
              <Label className="mb-1 block">Social share image (OG Image)</Label>
              <ImageDropzone contentKey="seo.ogImage" currentUrl={c("seo.ogImage", seo.ogImage)} alt="OG image" />
            </div>
            <div>
              <Label className="mb-1 block">Logo image <span className="text-xs font-normal text-muted-foreground">— replaces the logo across the entire site</span></Label>
              <ImageDropzone contentKey="brand.logo" currentUrl={c("brand.logo", brand.logoPath)} alt="Logo" />
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  );
}

// ============ PAGES ============
function PagesTab() {
  const { toast } = useToast();
  const { data: allPages = [], isLoading } = useQuery<SitePage[]>({ queryKey: ["/api/admin/pages"] });
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<SitePage | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const sorted = [...allPages].sort((a, b) => a.sortOrder - b.sortOrder);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/pages"] });
    queryClient.invalidateQueries({ queryKey: ["/api/public/pages"] });
  }

  async function move(page: SitePage, direction: "up" | "down") {
    const idx = sorted.findIndex((p) => p.id === page.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap = sorted[swapIdx];
    await apiRequest("PATCH", `/api/admin/pages/${page.id}`, { sortOrder: swap.sortOrder });
    await apiRequest("PATCH", `/api/admin/pages/${swap.id}`, { sortOrder: page.sortOrder });
    invalidate();
  }

  async function toggleVisible(page: SitePage) {
    await apiRequest("PATCH", `/api/admin/pages/${page.id}`, { visible: !page.visible });
    invalidate();
  }

  const deletePage = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/pages/${id}`),
    onSuccess: () => {
      invalidate();
      toast({ title: "Page deleted" });
      setConfirmDeleteId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="size-5 animate-spin inline" />
        <p className="text-sm text-muted-foreground mt-2">Loading pages…</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Pages</h1>
          <p className="text-sm text-muted-foreground">Reorder, hide or add pages. This controls the site's navigation menu.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} data-testid="button-add-page">
          <Plus className="size-4 mr-1" /> Add page
        </Button>
      </div>

      <div className="space-y-2">
        {sorted.map((page, i) => (
          <Card key={page.id} className="p-4 bg-card" data-testid={`row-page-${page.slug}`}>
            <div className="flex items-center gap-3">
              <div className="flex flex-col shrink-0">
                <button
                  type="button"
                  onClick={() => move(page, "up")}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                  data-testid={`button-page-up-${page.slug}`}
                >
                  <ChevronUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(page, "down")}
                  disabled={i === sorted.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move down"
                  data-testid={`button-page-down-${page.slug}`}
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-bold text-foreground">{page.navLabel}</span>
                  <Badge variant="outline" className="text-[10px]">{page.kind === "core" ? "Core" : PAGE_LAYOUTS.find((l) => l.id === page.layout)?.label ?? page.layout}</Badge>
                  {!page.visible && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{page.path}</p>
                {page.kind === "core" && (
                  <p className="text-xs text-muted-foreground mt-1">Edit its copy in the Content tab.</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleVisible(page)}
                  className="text-muted-foreground hover:text-foreground p-1.5"
                  aria-label={page.visible ? "Hide from menu" : "Show in menu"}
                  data-testid={`button-page-visible-${page.slug}`}
                >
                  {page.visible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                </button>
                {page.kind === "custom" && (
                  <>
                    <Button size="icon" variant="ghost" onClick={() => setEditing(page)} data-testid={`button-edit-page-${page.slug}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDeleteId(page.id)} data-testid={`button-delete-page-${page.slug}`}>
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AddPageDialog open={addOpen} onClose={() => setAddOpen(false)} onCreated={(p) => { invalidate(); setEditing(p); }} />
      {editing && <PageContentDialog page={editing} onClose={() => setEditing(null)} />}

      <Dialog open={confirmDeleteId !== null} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete this page?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This removes it from the menu and deletes its content. This can't be undone.</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDeleteId !== null && deletePage.mutate(confirmDeleteId)} disabled={deletePage.isPending} data-testid="button-confirm-delete-page">
              {deletePage.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AddPageDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (page: SitePage) => void }) {
  const { toast } = useToast();
  const [navLabel, setNavLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [layout, setLayout] = useState<string>(PAGE_LAYOUTS[0].id);

  function reset() {
    setNavLabel("");
    setSlug("");
    setSlugTouched(false);
    setLayout(PAGE_LAYOUTS[0].id);
  }

  const create = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/pages", { navLabel, slug, layout });
      return res.json() as Promise<SitePage>;
    },
    onSuccess: (page) => {
      toast({ title: "Page created", description: "Add its content below." });
      reset();
      onClose();
      onCreated(page);
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "Could not create page";
      toast({ title: "Couldn't create page", description: message, variant: "destructive" });
    },
  });

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add a page</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Page name</Label>
            <Input
              value={navLabel}
              onChange={(e) => {
                setNavLabel(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="e.g. FAQ"
              data-testid="input-new-page-label"
            />
          </div>
          <div>
            <Label>URL</Label>
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground font-mono">/p/</span>
              <Input
                value={slug}
                onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }}
                placeholder="faq"
                className="font-mono"
                data-testid="input-new-page-slug"
              />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Layout</Label>
            <div className="grid gap-2">
              {PAGE_LAYOUTS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayout(l.id)}
                  className={`text-left rounded-xl border p-3 transition-colors ${layout === l.id ? "border-primary bg-primary/5" : "border-card-border hover-elevate"}`}
                  data-testid={`button-layout-${l.id}`}
                >
                  <p className="font-semibold text-sm">{l.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{l.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !navLabel.trim() || !slug.trim()}
            data-testid="button-create-page"
          >
            {create.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PageContentDialog({ page, onClose }: { page: SitePage; onClose: () => void }) {
  const { c } = useContent();
  const slug = page.slug;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{page.navLabel}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Title</Label>
            <InlineText contentKey={`page.${slug}.title`} value={c(`page.${slug}.title`, page.navLabel)} label="Title" />
          </div>
          <div>
            <Label className="mb-1 block">Intro</Label>
            <InlineText contentKey={`page.${slug}.intro`} value={c(`page.${slug}.intro`, "")} variant="textarea" rows={2} label="Intro" />
          </div>

          {page.layout === "steps" && (
            <>
              <div>
                <Label className="mb-1 block">Steps <span className="text-xs font-normal text-muted-foreground">— one per line, shown in order</span></Label>
                <InlineText contentKey={`page.${slug}.steps`} value={c(`page.${slug}.steps`, "")} variant="textarea" rows={8} label="Steps" />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n}>
                    <Label className="mb-1 block">Photo {n}</Label>
                    <ImageDropzone contentKey={`page.${slug}.photo${n}`} currentUrl={c(`page.${slug}.photo${n}`, "")} alt={`Photo ${n}`} />
                  </div>
                ))}
              </div>
            </>
          )}

          {page.layout === "story" && (
            <>
              <div>
                <Label className="mb-1 block">Body <span className="text-xs font-normal text-muted-foreground">— separate paragraphs with a blank line</span></Label>
                <InlineText contentKey={`page.${slug}.body`} value={c(`page.${slug}.body`, "")} variant="textarea" rows={10} label="Body" />
              </div>
              <div>
                <Label className="mb-1 block">Image</Label>
                <ImageDropzone contentKey={`page.${slug}.image`} currentUrl={c(`page.${slug}.image`, "")} alt="Story image" />
              </div>
            </>
          )}

          {(page.layout === "simple" || page.layout === "promo") && (
            <>
              <div>
                <Label className="mb-1 block">Body</Label>
                <InlineText contentKey={`page.${slug}.body`} value={c(`page.${slug}.body`, "")} variant="textarea" rows={6} label="Body" />
              </div>
              <div>
                <Label className="mb-1 block">Image {page.layout === "promo" && <span className="text-xs font-normal text-muted-foreground">— shown as a full-width background</span>}</Label>
                <ImageDropzone contentKey={`page.${slug}.image`} currentUrl={c(`page.${slug}.image`, "")} alt="Page image" />
              </div>
            </>
          )}

          {page.layout === "gallery" && (
            <div className="grid sm:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n}>
                  <Label className="mb-1 block">Photo {n}</Label>
                  <ImageDropzone contentKey={`page.${slug}.photo${n}`} currentUrl={c(`page.${slug}.photo${n}`, "")} alt={`Photo ${n}`} />
                </div>
              ))}
            </div>
          )}

          {page.layout === "faq" && (
            <div>
              <Label className="mb-1 block">Questions &amp; answers <span className="text-xs font-normal text-muted-foreground">— question on the first line, answer below, blank line between each</span></Label>
              <InlineText
                contentKey={`page.${slug}.faq`}
                value={c(`page.${slug}.faq`, "")}
                variant="textarea"
                rows={10}
                placeholder={"Do you travel outside Cramlington?\nGet in touch with your postcode and I'll confirm.\n\nWhat if my dog is nervous?\nThat's exactly what one-to-one, no-cage grooming is for."}
                label="FAQ"
              />
            </div>
          )}

          {page.layout === "testimonials" && (
            <p className="text-xs text-muted-foreground">This page shows your full review list automatically — manage reviews in the Reviews tab.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-close-page-content">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ REVIEWS ============
function ReviewsTab() {
  const { toast } = useToast();
  const { data: reviews = [] } = useQuery<Review[]>({ queryKey: ["/api/admin/reviews"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);

  return (
    <div className="space-y-4 mt-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Only active reviews show on the website.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-review">
          <Plus className="size-4 mr-1" /> Add
        </Button>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">No reviews yet. Add your first one.</Card>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <Card key={r.id} className="p-4 bg-card hover-elevate" data-testid={`row-review-${r.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-foreground">{r.authorName}</span>
                    {!r.active && <Badge variant="outline" className="text-[10px]">Hidden</Badge>}
                  </div>
                  <div className="flex gap-0.5 mt-1">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="size-3 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{r.publishedAt}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }} data-testid={`button-edit-review-${r.id}`}>
                  <Pencil className="size-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ReviewDialog open={open} onClose={() => setOpen(false)} review={editing} />
    </div>
  );
}

function ReviewDialog({ open, onClose, review }: { open: boolean; onClose: () => void; review: Review | null }) {
  const { toast } = useToast();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    authorName: review?.authorName ?? "",
    rating: review?.rating ?? 5,
    body: review?.body ?? "",
    publishedAt: review?.publishedAt ?? today,
    active: review?.active ?? true,
    sortOrder: review?.sortOrder ?? 0,
  });

  useState(() => {
    setForm({
      authorName: review?.authorName ?? "",
      rating: review?.rating ?? 5,
      body: review?.body ?? "",
      publishedAt: review?.publishedAt ?? today,
      active: review?.active ?? true,
      sortOrder: review?.sortOrder ?? 0,
    });
  });

  const save = useMutation({
    mutationFn: async () => {
      if (review) {
        return (await apiRequest("PATCH", `/api/admin/reviews/${review.id}`, form)).json();
      }
      return (await apiRequest("POST", "/api/admin/reviews", form)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/reviews"] });
      toast({ title: review ? "Review updated" : "Review added" });
      onClose();
    },
  });

  const remove = useMutation({
    mutationFn: async () => (await apiRequest("DELETE", `/api/admin/reviews/${review!.id}`)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/reviews"] });
      toast({ title: "Review deleted" });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{review ? "Edit review" : "New review"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Author name</Label>
              <Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} placeholder="Sarah W." data-testid="input-review-author" />
            </div>
          </div>
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm({ ...form, rating: n })}
                  className="p-0.5"
                  data-testid={`button-rating-${n}`}
                >
                  <Star className={`size-6 ${n <= form.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Review body</Label>
            <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Tell us about your experience…" data-testid="input-review-body" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.publishedAt} onChange={(e) => setForm({ ...form, publishedAt: e.target.value })} data-testid="input-review-date" />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} data-testid="input-review-sort" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-card-border bg-card px-3 py-2">
            <div>
              <div className="text-sm font-medium">Show on website</div>
              <div className="text-xs text-muted-foreground">Toggle off to hide</div>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} data-testid="switch-review-active" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {review && (
            <Button variant="outline" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="button-delete-review">
              <Trash2 className="size-4 mr-1" /> Delete
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form.authorName || !form.body} data-testid="button-save-review">
            {save.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ SETTINGS ============
function SettingsTab() {
  const { toast } = useToast();
  const { data: settings } = useQuery<Settings>({ queryKey: ["/api/admin/settings"] });

  const update = useMutation({
    mutationFn: async (patch: Partial<Settings>) => (await apiRequest("PATCH", "/api/admin/settings", patch)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved" });
    },
  });

  if (!settings) return <div className="py-12 text-center"><Loader2 className="size-5 animate-spin inline" /></div>;

  return (
    <div className="space-y-6 mt-5">
      <h1 className="font-display text-2xl font-bold">Settings</h1>

      <Card className="p-4 bg-card space-y-4">
        <h2 className="font-display font-bold">Club</h2>
        <div>
          <Label>Club name</Label>
          <Input defaultValue={settings.clubName} onBlur={(e) => update.mutate({ clubName: e.target.value })} data-testid="input-club-name" />
        </div>
      </Card>

      <Card className="p-4 bg-card space-y-4">
        <h2 className="font-display font-bold">Notifications</h2>
        <div>
          <Label>Notification email</Label>
          <Input type="email" defaultValue={settings.notifyEmail} onBlur={(e) => update.mutate({ notifyEmail: e.target.value })} data-testid="input-notify-email" />
        </div>
        <Toggle label="Push notifications" desc="Get an alert the moment a ticket sells or a new bid lands" checked={settings.pushEnabled} onChange={(v) => update.mutate({ pushEnabled: v })} testid="switch-push" icon={<BellRing className="size-4" />} />
      </Card>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange, testid, icon }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; testid: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2">
        {icon && <div className="text-muted-foreground mt-0.5">{icon}</div>}
        <div>
          <div className="text-sm font-medium text-foreground">{label}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} data-testid={testid} />
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground font-display">{label}</div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SkeletonRow() {
  return <div className="space-y-2">{Array.from({length: 3}).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>;
}

// ============ PAYMENTS ============
type PaymentsConfig = {
  mode: "mvp" | "sumup";
  apiKeyMasked: string;
  hasApiKey: boolean;
  merchantCode: string;
};

type SocialConfigResponse = {
  fbEnabled: boolean; fbPageId: string; fbPageTokenMasked: string; hasFbPageToken: boolean; autoPostOnResult: boolean;
};

function SocialTab() {
  const { toast } = useToast();
  const { data: cfg, isLoading } = useQuery<SocialConfigResponse>({
    queryKey: ["/api/admin/social-config"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/social-config")).json(),
  });
  const { data: history = [] } = useQuery<SocialPost[]>({ queryKey: ["/api/admin/social/posts"] });

  const [fbEnabled, setFbEnabled] = useState(false);
  const [fbPageId, setFbPageId] = useState("");
  const [fbPageToken, setFbPageToken] = useState("");
  const [autoPostOnResult, setAutoPostOnResult] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  if (cfg && !initialised) {
    setFbEnabled(cfg.fbEnabled);
    setFbPageId(cfg.fbPageId);
    setAutoPostOnResult(cfg.autoPostOnResult);
    setInitialised(true);
  }

  const save = useMutation({
    mutationFn: async (payload: Partial<{ fbEnabled: boolean; fbPageId: string; fbPageToken: string; autoPostOnResult: boolean }>) =>
      (await apiRequest("POST", "/api/admin/social-config", payload)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-config"] });
      setFbPageToken("");
      toast({ title: "Saved", description: "Social settings updated." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const post = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/social/post", { message, imageUrl: imageUrl || undefined })).json(),
    onSuccess: (data: { results: Array<{ provider: string; ok: boolean; error?: string }> }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social/posts"] });
      const failed = data.results.filter((r) => !r.ok);
      if (failed.length > 0) {
        toast({ title: "Post failed", description: failed.map((f) => f.error).join(" · "), variant: "destructive" });
      } else {
        toast({ title: "Posted" });
        setMessage("");
        setImageUrl("");
      }
    },
    onError: (e: any) => toast({ title: "Post failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await apiRequest("POST", "/api/admin/social-config/test", {});
      const data = await r.json();
      if (data.ok) toast({ title: "Connection OK", description: `Connected to "${data.pageName}"` });
      else toast({ title: "Connection failed", description: data.error || "Check your Page ID and access token", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Connection failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) return <SkeletonRow />;

  return (
    <div className="space-y-4 mt-3">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Share2 className="size-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">Social posting</h2>
            <p className="text-sm text-muted-foreground">
              Post to the club's Facebook Page — manually from here, or automatically the moment a fixture result is saved. You'll need a Meta developer app for the Page with a long-lived Page access token; other platforms can be added later.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Facebook Page</div>
            <div className="text-xs text-muted-foreground">{fbEnabled ? "Connected and enabled" : "Off — posts won't be sent"}</div>
          </div>
          <Switch checked={fbEnabled} onCheckedChange={setFbEnabled} data-testid="switch-social-fb-enabled" />
        </div>
        <div>
          <Label>Page ID</Label>
          <Input value={fbPageId} onChange={(e) => setFbPageId(e.target.value)} placeholder="e.g. 123456789012345" data-testid="input-social-fb-pageid" />
        </div>
        <div>
          <Label>Page access token {cfg?.hasFbPageToken && <span className="text-muted-foreground font-normal text-xs">(current: {cfg.fbPageTokenMasked})</span>}</Label>
          <Input type="password" value={fbPageToken} onChange={(e) => setFbPageToken(e.target.value)} placeholder="Leave blank to keep the current token" data-testid="input-social-fb-token" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-card-border">
          <div>
            <div className="text-sm font-medium text-foreground">Auto-post results</div>
            <div className="text-xs text-muted-foreground">Post a result announcement the moment a fixture score is first saved.</div>
          </div>
          <Switch checked={autoPostOnResult} onCheckedChange={setAutoPostOnResult} data-testid="switch-social-autopost" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => save.mutate({ fbEnabled, fbPageId, fbPageToken: fbPageToken || undefined, autoPostOnResult })}
            disabled={save.isPending}
            data-testid="button-save-social-config"
          >
            {save.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null} Save
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing || !fbPageId} data-testid="button-test-social-config">
            {testing ? <Loader2 className="size-4 mr-1 animate-spin" /> : null} Test connection
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Compose a post</h3>
        <Textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's happening at the club?" data-testid="input-social-message" />
        <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL (optional)" data-testid="input-social-image" />
        <Button onClick={() => post.mutate()} disabled={post.isPending || !message.trim()} data-testid="button-post-social">
          {post.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null} Post now
        </Button>
      </Card>

      <Card className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Recent posts</h3>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div key={p.id} className="text-sm border-b border-card-border last:border-0 pb-2 last:pb-0" data-testid={`row-social-post-${p.id}`}>
                <div className="flex items-center gap-2">
                  <Badge variant={p.status === "sent" ? "default" : "destructive"} className="text-[10px] uppercase">{p.status}</Badge>
                  <span className="text-xs text-muted-foreground">{p.trigger === "fixture_result" ? "Auto · fixture result" : "Manual"}</span>
                </div>
                <p className="text-foreground mt-1 line-clamp-2">{p.message}</p>
                {p.error && <p className="text-xs text-destructive mt-0.5">{p.error}</p>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PaymentsTab() {
  const { toast } = useToast();
  const { data: cfg, isLoading } = useQuery<PaymentsConfig>({
    queryKey: ["/api/admin/payments-config"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/payments-config")).json(),
  });

  const [mode, setMode] = useState<"mvp" | "sumup">("mvp");
  const [apiKey, setApiKey] = useState("");
  const [merchantCode, setMerchantCode] = useState("");
  const [testing, setTesting] = useState(false);
  const [initialised, setInitialised] = useState(false);

  // Initialise local state once when cfg loads.
  if (cfg && !initialised) {
    setMode(cfg.mode);
    setMerchantCode(cfg.merchantCode);
    setInitialised(true);
  }

  const save = useMutation({
    mutationFn: async (payload: Partial<{ mode: string; apiKey: string; merchantCode: string }>) => {
      return (await apiRequest("POST", "/api/admin/payments-config", payload)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payments-config"] });
      setApiKey("");
      toast({ title: "Saved", description: "Payment settings updated." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await apiRequest("POST", "/api/admin/payments-config/test", apiKey ? { apiKey } : {});
      const data = await r.json();
      if (data.ok) {
        const mp = data.merchantProfile || {};
        toast({
          title: "Connection OK",
          description: `${mp.company_name || "Connected"} — merchant code ${mp.merchant_code || "?"} (${mp.default_currency || "GBP"})`,
        });
        if (!merchantCode && mp.merchant_code) setMerchantCode(mp.merchant_code);
      } else {
        toast({ title: "Connection failed", description: data.error || "Check your API key", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Connection failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  if (isLoading) return <SkeletonRow />;

  return (
    <div className="space-y-4 mt-3">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <CreditCard className="size-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-foreground">SumUp payments</h2>
            <p className="text-sm text-muted-foreground">
              Take card payments for raffle tickets via SumUp's hosted checkout. Entrants are redirected to a SumUp page to pay; tickets are issued automatically once payment completes. SumUp's fee is 2.5% per transaction.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Payment mode</div>
            <div className="text-xs text-muted-foreground">
              {mode === "sumup"
                ? "Entrants are redirected to SumUp to pay for tickets."
                : "Online payment is off — sell tickets in person and log them via Competitions > Add entry."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${mode === "mvp" ? "font-semibold" : "text-muted-foreground"}`}>Manual</span>
            <Switch
              checked={mode === "sumup"}
              onCheckedChange={(v) => setMode(v ? "sumup" : "mvp")}
              data-testid="switch-payments-mode"
            />
            <span className={`text-xs ${mode === "sumup" ? "font-semibold" : "text-muted-foreground"}`}>SumUp</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sumup-api-key">SumUp API key</Label>
          <Input
            id="sumup-api-key"
            type="password"
            placeholder={cfg?.hasApiKey ? `Saved: ${cfg.apiKeyMasked} — enter a new key to replace` : "sup_sk_..."}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            data-testid="input-sumup-api-key"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Get this from your SumUp Dashboard → Developer → API keys. Starts with <code>sup_sk_</code>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sumup-merchant">Merchant code</Label>
          <Input
            id="sumup-merchant"
            placeholder="e.g. MQEKWZTL"
            value={merchantCode}
            onChange={(e) => setMerchantCode(e.target.value.trim())}
            data-testid="input-sumup-merchant"
          />
          <p className="text-xs text-muted-foreground">
            Found in your SumUp Dashboard → Account → Profile. Or click "Test connection" — we'll fill it in for you.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || (!apiKey && !cfg?.hasApiKey)}
            data-testid="button-sumup-test"
          >
            {testing ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle2 className="size-4 mr-2" />}
            Test connection
          </Button>
          <Button
            onClick={() => save.mutate({ mode, apiKey: apiKey || undefined, merchantCode })}
            disabled={save.isPending}
            data-testid="button-sumup-save"
          >
            {save.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
            Save
          </Button>
        </div>

        {mode === "sumup" && (!cfg?.hasApiKey || !merchantCode) && (
          <div className="flex gap-2 rounded-md border border-amber-300/40 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            <div>
              SumUp mode is on but credentials are incomplete. Entrants will see an error when trying to pay. Add your API key and merchant code, then test the connection.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============ BRANDING HELPERS ============

// Curated display + body font pairs (Google Fonts CSS2 family names).
const FONT_PAIRS: { display: string; body: string }[] = [
  { display: "Fraunces", body: "Nunito" },
  { display: "Playfair Display", body: "Inter" },
  { display: "DM Serif Display", body: "DM Sans" },
  { display: "Cormorant Garamond", body: "Montserrat" },
  { display: "Lora", body: "Source Sans 3" },
  { display: "Bricolage Grotesque", body: "Inter" },
  { display: "Instrument Serif", body: "Inter" },
  { display: "Work Sans", body: "Work Sans" },
];

// HSL "H S% L%" → "#rrggbb"
function hslStringToHex(hsl: string): string {
  const m = hsl.trim().match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/);
  if (!m) return "#000000";
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// "#rrggbb" → HSL "H S% L%"
function hexToHslString(hex: string): string {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// ============ EMAILS ============
type EmailConfigForm = {
  enabled: boolean;
  fromEmail: string;
  fromName: string;
  bccOwner: boolean;
  ownerEmail: string;
};

type EmailDiagnostics = {
  enabled: boolean;
  fromEmail: string;
  ownerEmail: string;
  apiKeySet: boolean;
  apiKeyValid: boolean | null;
  domains: { name: string; status: string }[];
  fromDomainVerified: boolean | null;
  error: string | null;
};

type EmailTemplate = { subject: string; body: string };
type EmailTemplatesForm = {
  ticketConfirm: EmailTemplate;
  raffleWinner: EmailTemplate;
  auctionWinner: EmailTemplate;
  auctionOutbid: EmailTemplate;
};

const TICKET_PLACEHOLDER_HINT = "Available placeholders: {buyer}, {competition}, {plural}, {ticketNumbers}, {clubName}";
const RAFFLE_WINNER_PLACEHOLDER_HINT = "Available placeholders: {buyer}, {competition}, {prize}, {ticketNumber}, {clubName}";
const AUCTION_WINNER_PLACEHOLDER_HINT = "Available placeholders: {bidder}, {competition}, {prize}, {amount}, {clubName}";
const OUTBID_PLACEHOLDER_HINT = "Available placeholders: {bidder}, {competition}, {amount}, {clubName}";

function EmailsTab() {
  const { toast } = useToast();

  const { data: cfg, isLoading: cfgLoading } = useQuery<EmailConfigForm>({
    queryKey: ["/api/admin/email-config"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/email-config")).json(),
  });
  const { data: tmpl, isLoading: tmplLoading } = useQuery<EmailTemplatesForm>({
    queryKey: ["/api/admin/email-templates"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/email-templates")).json(),
  });

  const [form, setForm] = useState<EmailConfigForm | null>(null);
  const [testTo, setTestTo] = useState("");
  const [tForm, setTForm] = useState<EmailTemplatesForm | null>(null);

  if (cfg && !form) setForm(cfg);
  if (tmpl && !tForm) setTForm(tmpl);

  const saveConfig = useMutation({
    mutationFn: async (payload: EmailConfigForm) =>
      (await apiRequest("POST", "/api/admin/email-config", payload)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-config"] });
      toast({ title: "Saved", description: "Email settings updated." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const saveTemplates = useMutation({
    mutationFn: async (payload: EmailTemplatesForm) =>
      (await apiRequest("POST", "/api/admin/email-templates", payload)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Saved", description: "Templates updated." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const sendTest = useMutation({
    mutationFn: async () =>
      (await apiRequest("POST", "/api/admin/email-test", { to: testTo })).json(),
    onSuccess: () => toast({ title: "Test sent", description: "Check the inbox." }),
    onError: (e: any) => toast({ title: "Test failed", description: String(e?.message || e), variant: "destructive" }),
  });

  const [diagnostics, setDiagnostics] = useState<EmailDiagnostics | null>(null);
  const checkSetup = useMutation({
    mutationFn: async () => (await apiRequest("GET", "/api/admin/email-diagnostics")).json() as Promise<EmailDiagnostics>,
    onSuccess: (data) => setDiagnostics(data),
    onError: (e: any) => toast({ title: "Check failed", description: String(e?.message || e), variant: "destructive" }),
  });

  if (cfgLoading || tmplLoading || !form || !tForm) return <SkeletonRow />;

  return (
    <div className="space-y-4 mt-3">
      {/* Connection */}
      <Card className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Mail className="size-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Emails</h2>
            <p className="text-sm text-muted-foreground">Ticket confirmations and winner notifications, sent via Resend.</p>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3 text-xs text-muted-foreground space-y-1">
          <p>Sent via Resend's API, not a mailbox login — this needs a <code className="font-mono">RESEND_API_KEY</code> environment variable set on the server, not entered here.</p>
          <p>1. Sign up at resend.com and verify a sending domain. 2. Create an API key. 3. Add it as <code className="font-mono">RESEND_API_KEY</code>. 4. Set the From email below to an address on that verified domain.</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm">Send emails</Label>
            <p className="text-xs text-muted-foreground">When off, no ticket or winner emails go out.</p>
          </div>
          <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} data-testid="switch-email-enabled" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="from-email">From email</Label>
          <Input id="from-email" type="email" placeholder="raffle@yourclub.org.uk" value={form.fromEmail} onChange={(e) => setForm({ ...form, fromEmail: e.target.value })} data-testid="input-from-email" />
          <p className="text-xs text-muted-foreground">Must be on a domain verified with Resend — doesn't need to be a real inbox, just a valid address on that domain.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="from-name">From name</Label>
          <Input id="from-name" value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} data-testid="input-from-name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="owner-email">Committee email <span className="text-muted-foreground font-normal">(bcc'd on outgoing emails, if enabled below)</span></Label>
          <Input id="owner-email" type="email" value={form.ownerEmail} onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })} data-testid="input-owner-email" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <Label className="text-sm">Bcc the committee</Label>
            <p className="text-xs text-muted-foreground">Copy the committee email above on every ticket/winner email sent.</p>
          </div>
          <Switch checked={form.bccOwner} onCheckedChange={(v) => setForm({ ...form, bccOwner: v })} data-testid="switch-bcc-owner" />
        </div>

        <Button onClick={() => saveConfig.mutate(form)} disabled={saveConfig.isPending} data-testid="button-save-email-config">
          {saveConfig.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Save settings
        </Button>

        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center justify-between">
            <Label>Check setup</Label>
            <Button variant="outline" size="sm" onClick={() => checkSetup.mutate()} disabled={checkSetup.isPending} data-testid="button-check-setup">
              {checkSetup.isPending ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null} Check setup
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Asks Resend directly whether the API key and domain are actually working — doesn't send anything.</p>
          {diagnostics && (
            <div className="rounded-lg border border-border p-3 space-y-2 text-xs" data-testid="panel-email-diagnostics">
              <DiagnosticRow ok={diagnostics.enabled} label={'"Send emails" is switched on'} />
              <DiagnosticRow ok={diagnostics.apiKeySet} label="RESEND_API_KEY set on the server" />
              {diagnostics.apiKeySet && (
                <DiagnosticRow ok={diagnostics.apiKeyValid} label="API key accepted by Resend" />
              )}
              {diagnostics.apiKeyValid && (
                <DiagnosticRow ok={diagnostics.fromDomainVerified} label={`Domain for "${diagnostics.fromEmail || "(no From email set)"}" is verified`} />
              )}
              {diagnostics.domains.length > 0 && (
                <div className="pt-1 text-muted-foreground">
                  Domains on this Resend account: {diagnostics.domains.map((d) => `${d.name} (${d.status})`).join(", ")}
                </div>
              )}
              {diagnostics.error && (
                <div className="pt-1 text-destructive" data-testid="text-diagnostics-error">{diagnostics.error}</div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-2">
          <Label htmlFor="test-to">Send test email</Label>
          <div className="flex gap-2">
            <Input id="test-to" type="email" placeholder="Optional — defaults to committee email" value={testTo} onChange={(e) => setTestTo(e.target.value)} data-testid="input-test-to" />
            <Button variant="outline" onClick={() => sendTest.mutate()} disabled={sendTest.isPending} data-testid="button-send-test">
              {sendTest.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Send test
            </Button>
          </div>
        </div>
      </Card>

      {/* Templates */}
      <Card className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="size-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Templates</h2>
            <p className="text-sm text-muted-foreground">Customise the emails. Use placeholders like {"{competition}"} that get filled in automatically.</p>
          </div>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="ticket-confirm">
            <AccordionTrigger data-testid="accordion-ticket-confirm">Ticket confirmation</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Sent the moment a raffle entry is issued — a paid purchase, or a free-post entry logged by the committee.</p>
              <div className="space-y-2">
                <Label htmlFor="ticket-subject">Subject</Label>
                <Input id="ticket-subject" value={tForm.ticketConfirm.subject} onChange={(e) => setTForm({ ...tForm, ticketConfirm: { ...tForm.ticketConfirm, subject: e.target.value } })} data-testid="input-ticket-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-body">Body</Label>
                <Textarea id="ticket-body" rows={10} value={tForm.ticketConfirm.body} onChange={(e) => setTForm({ ...tForm, ticketConfirm: { ...tForm.ticketConfirm, body: e.target.value } })} data-testid="input-ticket-body" />
                <p className="text-xs text-muted-foreground">{TICKET_PLACEHOLDER_HINT}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="raffle-winner">
            <AccordionTrigger data-testid="accordion-raffle-winner">Raffle winner</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Sent to the winning ticket holder once a raffle is drawn.</p>
              <div className="space-y-2">
                <Label htmlFor="raffle-winner-subject">Subject</Label>
                <Input id="raffle-winner-subject" value={tForm.raffleWinner.subject} onChange={(e) => setTForm({ ...tForm, raffleWinner: { ...tForm.raffleWinner, subject: e.target.value } })} data-testid="input-raffle-winner-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="raffle-winner-body">Body</Label>
                <Textarea id="raffle-winner-body" rows={10} value={tForm.raffleWinner.body} onChange={(e) => setTForm({ ...tForm, raffleWinner: { ...tForm.raffleWinner, body: e.target.value } })} data-testid="input-raffle-winner-body" />
                <p className="text-xs text-muted-foreground">{RAFFLE_WINNER_PLACEHOLDER_HINT}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="auction-winner">
            <AccordionTrigger data-testid="accordion-auction-winner">Auction winner</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Sent to the highest bidder once an auction closes.</p>
              <div className="space-y-2">
                <Label htmlFor="auction-winner-subject">Subject</Label>
                <Input id="auction-winner-subject" value={tForm.auctionWinner.subject} onChange={(e) => setTForm({ ...tForm, auctionWinner: { ...tForm.auctionWinner, subject: e.target.value } })} data-testid="input-auction-winner-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="auction-winner-body">Body</Label>
                <Textarea id="auction-winner-body" rows={10} value={tForm.auctionWinner.body} onChange={(e) => setTForm({ ...tForm, auctionWinner: { ...tForm.auctionWinner, body: e.target.value } })} data-testid="input-auction-winner-body" />
                <p className="text-xs text-muted-foreground">{AUCTION_WINNER_PLACEHOLDER_HINT}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="auction-outbid">
            <AccordionTrigger data-testid="accordion-auction-outbid">Outbid notice</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Sent to a bidder the moment someone tops their bid.</p>
              <div className="space-y-2">
                <Label htmlFor="outbid-subject">Subject</Label>
                <Input id="outbid-subject" value={tForm.auctionOutbid.subject} onChange={(e) => setTForm({ ...tForm, auctionOutbid: { ...tForm.auctionOutbid, subject: e.target.value } })} data-testid="input-outbid-subject" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outbid-body">Body</Label>
                <Textarea id="outbid-body" rows={10} value={tForm.auctionOutbid.body} onChange={(e) => setTForm({ ...tForm, auctionOutbid: { ...tForm.auctionOutbid, body: e.target.value } })} data-testid="input-outbid-body" />
                <p className="text-xs text-muted-foreground">{OUTBID_PLACEHOLDER_HINT}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button onClick={() => saveTemplates.mutate(tForm)} disabled={saveTemplates.isPending} data-testid="button-save-templates">
          {saveTemplates.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Save templates
        </Button>
      </Card>
    </div>
  );
}

function DiagnosticRow({ ok, label }: { ok: boolean | null; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok === true && <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />}
      {ok === false && <X className="size-3.5 text-destructive shrink-0" />}
      {ok === null && <AlertCircle className="size-3.5 text-muted-foreground shrink-0" />}
      <span className={ok === false ? "text-destructive" : "text-foreground"}>{label}</span>
    </div>
  );
}

// ============ BUSINESS ============
type BusinessConfig = {
  ownerName: string;
  brandName: string;
  brandShortName: string;
  tagline: string;
  instagram: string;
  email: string;
  phone: string;
};

function BusinessTab() {
  const { toast } = useToast();
  const { data: cfg, isLoading } = useQuery<BusinessConfig>({
    queryKey: ["/api/admin/business-config"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/business-config")).json(),
  });

  const [form, setForm] = useState<BusinessConfig | null>(null);
  if (cfg && !form) setForm(cfg);

  const save = useMutation({
    mutationFn: async (payload: BusinessConfig) =>
      (await apiRequest("POST", "/api/admin/business-config", payload)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/brand-config"] });
      toast({ title: "Saved", description: "Business details updated." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  if (isLoading || !form) return <SkeletonRow />;

  return (
    <div className="space-y-4 mt-3">
      <Card className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Building2 className="size-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Business details</h2>
            <p className="text-sm text-muted-foreground">Your name and how your brand appears across the site.</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-owner">Owner name</Label>
          <Input id="biz-owner" value={form.ownerName} onChange={(e) => setForm({ ...form, ownerName: e.target.value })} data-testid="input-owner-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-brand">Brand name</Label>
          <Input id="biz-brand" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} data-testid="input-brand-name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-short">Brand short name</Label>
          <Input id="biz-short" value={form.brandShortName} onChange={(e) => setForm({ ...form, brandShortName: e.target.value })} data-testid="input-brand-short" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-tagline">Tagline</Label>
          <Input id="biz-tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} data-testid="input-tagline" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-email">Business email</Label>
          <Input id="biz-email" type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-business-email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-phone">Business phone</Label>
          <Input id="biz-phone" type="tel" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="input-business-phone" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-insta">Instagram handle <span className="text-muted-foreground font-normal">(optional, no @)</span></Label>
          <Input id="biz-insta" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value.replace(/^@+/, "") })} data-testid="input-instagram" />
        </div>
        <Button onClick={() => save.mutate(form)} disabled={save.isPending} data-testid="button-save-business">
          {save.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Save
        </Button>
      </Card>
    </div>
  );
}

// ============ BRANDING ============
type BrandingConfig = {
  colors: { primary: string; accent: string; background: string; foreground: string };
  fonts: { display: string; body: string };
};

function BrandingTab() {
  const { toast } = useToast();
  const { data: cfg, isLoading } = useQuery<BrandingConfig>({
    queryKey: ["/api/admin/branding-config"],
    queryFn: async () => (await apiRequest("GET", "/api/admin/branding-config")).json(),
  });

  const [form, setForm] = useState<BrandingConfig | null>(null);
  if (cfg && !form) setForm(cfg);

  const save = useMutation({
    mutationFn: async (payload: BrandingConfig) =>
      (await apiRequest("POST", "/api/admin/branding-config", payload)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/branding-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/brand-config"] });
      toast({ title: "Saved", description: "Branding updated — changes are live." });
    },
    onError: (e: any) => toast({ title: "Save failed", description: String(e?.message || e), variant: "destructive" }),
  });

  if (isLoading || !form) return <SkeletonRow />;

  const setColor = (key: keyof BrandingConfig["colors"], hex: string) =>
    setForm({ ...form, colors: { ...form.colors, [key]: hexToHslString(hex) } });

  const colorField = (key: keyof BrandingConfig["colors"], label: string) => {
    const hex = hslStringToHex(form.colors[key]);
    return (
      <div className="space-y-1.5">
        <Label htmlFor={`color-${key}`}>{label}</Label>
        <div className="flex items-center gap-2">
          <input
            id={`color-${key}`}
            type="color"
            value={hex}
            onChange={(e) => setColor(key, e.target.value)}
            className="h-9 w-12 rounded border border-border bg-transparent p-0.5"
            data-testid={`color-${key}`}
          />
          <code className="text-xs text-muted-foreground">{hex}</code>
        </div>
      </div>
    );
  };

  const selectedPairIdx = FONT_PAIRS.findIndex(
    (p) => p.display === form.fonts.display && p.body === form.fonts.body
  );

  return (
    <div className="space-y-4 mt-3">
      <Card className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Palette className="size-5 text-primary mt-0.5" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Branding</h2>
            <p className="text-sm text-muted-foreground">Fonts and colours. Changes apply across the site without a redeploy.</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-pair">Font pair (Display / Body)</Label>
          <select
            id="font-pair"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={selectedPairIdx >= 0 ? String(selectedPairIdx) : ""}
            onChange={(e) => {
              const p = FONT_PAIRS[Number(e.target.value)];
              setForm({ ...form, fonts: { display: p.display, body: p.body } });
            }}
            data-testid="select-font-pair"
          >
            {selectedPairIdx < 0 && <option value="">Custom ({form.fonts.display} / {form.fonts.body})</option>}
            {FONT_PAIRS.map((p, i) => (
              <option key={i} value={i}>{p.display} / {p.body}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {colorField("primary", "Primary")}
          {colorField("accent", "Accent")}
          {colorField("background", "Background")}
          {colorField("foreground", "Foreground (text)")}
        </div>

        <Button onClick={() => save.mutate(form)} disabled={save.isPending} data-testid="button-save-branding">
          {save.isPending ? <Loader2 className="size-4 mr-2 animate-spin" /> : null} Save
        </Button>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-2 text-xs uppercase tracking-wider text-muted-foreground border-b border-card-border">Live preview</div>
        <div
          className="h-[200px] p-6 flex flex-col justify-center gap-3"
          style={{
            background: `hsl(${form.colors.background})`,
            color: `hsl(${form.colors.foreground})`,
            fontFamily: `'${form.fonts.body}', system-ui, sans-serif`,
          }}
        >
          <div style={{ fontFamily: `'${form.fonts.display}', sans-serif`, fontWeight: 700, fontSize: "1.6rem", lineHeight: 1.1 }}>
            Sample heading
          </div>
          <div style={{ fontSize: "0.95rem", opacity: 0.85 }}>
            The quick brown fox jumps over the lazy dog.
          </div>
          <div className="flex gap-2 mt-1">
            <span style={{ background: `hsl(${form.colors.primary})`, color: "#fff", padding: "0.4rem 0.9rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 600 }}>Button</span>
            <span style={{ background: `hsl(${form.colors.accent})`, color: "#000", padding: "0.4rem 0.9rem", borderRadius: "9999px", fontSize: "0.85rem", fontWeight: 600 }}>Accent</span>
          </div>
        </div>
      </Card>
    </div>
  );
}


// ============ FIXTURES ============
// Generic "upload a CSV" control — posts the raw file text as JSON to
// `endpoint`, reports how many rows were imported/skipped, and refreshes
// `invalidateKey` on success. Shared by the fixtures and league-table imports.
function CsvImportButton({
  endpoint, invalidateKey, label, hint,
}: { endpoint: string; invalidateKey: string; label: string; hint: string }) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const importCsv = useMutation({
    mutationFn: async (csv: string) => {
      const res = await apiRequest("POST", endpoint, { csv });
      return res.json() as Promise<{ ok: boolean; imported: number; errors: string[] }>;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: [invalidateKey] });
      if (result.errors.length > 0) {
        toast({
          title: `Imported ${result.imported} row(s), ${result.errors.length} skipped`,
          description: result.errors.slice(0, 3).join(" · "),
          variant: "destructive",
        });
      } else {
        toast({ title: `Imported ${result.imported} row(s)` });
      }
    },
    onError: (e: Error) => toast({ title: "Import failed", description: e.message, variant: "destructive" }),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importCsv.mutate(String(reader.result || ""));
    reader.readAsText(file);
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} data-testid={`input-${label}`} />
      <Button
        variant="outline"
        disabled={importCsv.isPending}
        onClick={() => fileRef.current?.click()}
        title={hint}
        data-testid={`button-${label}`}
      >
        {importCsv.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Upload className="size-4 mr-1" />}
        Import CSV
      </Button>
    </>
  );
}

function FixturesTab() {
  const { data: fixtures = [] } = useQuery<Fixture[]>({ queryKey: ["/api/admin/fixtures"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Fixture | null>(null);

  const sorted = [...fixtures].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-10 mt-5">
      <TeamsSection />

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Fixtures &amp; results</h1>
            <p className="text-sm text-muted-foreground">One list across every team — add a match, then fill in the score once it's played.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CsvImportButton
              endpoint="/api/admin/fixtures/import"
              invalidateKey="/api/admin/fixtures"
              label="import-fixtures"
              hint="Columns: team,opponent,date,kickoffTime,homeAway,venue,league,homeScore,awayScore,notes. Re-uploading updates matching fixtures (by team+opponent+date)."
            />
            <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-fixture">
              <Plus className="size-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">No fixtures yet.</Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((f) => (
              <Card key={f.id} className="p-4 bg-card flex items-center gap-3 hover-elevate" data-testid={`row-fixture-${f.id}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{f.team}</Badge>
                    <span className="font-display font-bold text-foreground">
                      {f.homeAway === "home" ? `${f.team} vs ${f.opponent}` : `${f.opponent} vs ${f.team}`}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(f.date)}{f.kickoffTime ? ` · ${f.kickoffTime}` : ""}{f.venue ? ` · ${f.venue}` : ""}{f.league ? ` · ${f.league}` : ""}
                    {f.homeScore != null && f.awayScore != null ? ` · Final: ${f.homeScore}-${f.awayScore}` : ""}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => { setEditing(f); setOpen(true); }} data-testid={`button-edit-fixture-${f.id}`}>
                  <Pencil className="size-4" />
                </Button>
              </Card>
            ))}
          </div>
        )}

        <FixtureDialog key={editing?.id ?? "new"} open={open} onClose={() => setOpen(false)} fixture={editing} />
      </div>

      <LeagueTablesSection />
    </div>
  );
}

function TeamsSection() {
  const { data: teams = [] } = useQuery<Team[]>({ queryKey: ["/api/admin/teams"] });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);

  const sorted = [...teams].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Teams</h1>
          <p className="text-sm text-muted-foreground">The age-group squads shown on the public Teams page.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} data-testid="button-add-team">
          <Plus className="size-4 mr-1" /> Add team
        </Button>
      </div>

      {sorted.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">No teams yet.</Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((t) => (
            <Card key={t.id} className="p-4 bg-card flex items-center gap-3 hover-elevate" data-testid={`row-team-${t.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-foreground">{t.name}</span>
                  {t.ageGroup && <Badge variant="outline" className="text-[10px]">{t.ageGroup}</Badge>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {t.coachName ? `Coach: ${t.coachName}` : "No coach set"}{t.trainingInfo ? ` · ${t.trainingInfo}` : ""}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => { setEditing(t); setOpen(true); }} data-testid={`button-edit-team-${t.id}`}>
                <Pencil className="size-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <TeamDialog key={editing?.id ?? "new"} open={open} onClose={() => setOpen(false)} team={editing} />
    </div>
  );
}

function TeamDialog({ open, onClose, team }: { open: boolean; onClose: () => void; team: Team | null }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: team?.name ?? "",
    ageGroup: team?.ageGroup ?? "",
    coachName: team?.coachName ?? "",
    coachEmail: team?.coachEmail ?? "",
    coachPhone: team?.coachPhone ?? "",
    trainingInfo: team?.trainingInfo ?? "",
    description: team?.description ?? "",
    photoUrl: team?.photoUrl ?? "",
    sortOrder: team?.sortOrder?.toString() ?? "0",
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
      return team
        ? apiRequest("PATCH", `/api/admin/teams/${team.id}`, payload)
        : apiRequest("POST", "/api/admin/teams", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Couldn't save team", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/admin/teams/${team!.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/teams"] });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Couldn't delete team", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{team ? "Edit team" : "Add team"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Team name <span className="text-muted-foreground font-normal text-xs">(must match the "team" used in Fixtures)</span></Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Under 10s" data-testid="input-team-name" />
          </div>
          <div>
            <Label>Age group <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Input value={form.ageGroup} onChange={(e) => setForm({ ...form, ageGroup: e.target.value })} placeholder="e.g. U10" data-testid="input-team-agegroup" />
          </div>
          <div>
            <Label>Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-team-description" />
          </div>
          <div>
            <Label>Coach name <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Input value={form.coachName} onChange={(e) => setForm({ ...form, coachName: e.target.value })} data-testid="input-team-coachname" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Coach email <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input type="email" value={form.coachEmail} onChange={(e) => setForm({ ...form, coachEmail: e.target.value })} data-testid="input-team-coachemail" />
            </div>
            <div>
              <Label>Coach phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={form.coachPhone} onChange={(e) => setForm({ ...form, coachPhone: e.target.value })} data-testid="input-team-coachphone" />
            </div>
          </div>
          <div>
            <Label>Training info <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Input value={form.trainingInfo} onChange={(e) => setForm({ ...form, trainingInfo: e.target.value })} placeholder="e.g. Tuesdays 6-7pm, Riverside Rec" data-testid="input-team-training" />
          </div>
          <div>
            <Label className="mb-1 block">Team photo <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <ImageDropzone testId="team-photo" currentUrl={form.photoUrl} alt="Team photo" onUploaded={(url) => setForm({ ...form, photoUrl: url })} />
          </div>
          <div>
            <Label>Sort order <span className="text-muted-foreground font-normal text-xs">(lower shows first)</span></Label>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} data-testid="input-team-sortorder" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {team && (
            <Button variant="outline" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="button-delete-team">
              <Trash2 className="size-4 mr-1" /> Delete
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form.name} data-testid="button-save-team">
            {save.isPending ? <Loader2 className="size-4 mr-1 animate-spin" /> : null} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeagueTablesSection() {
  const { data: rows = [] } = useQuery<LeagueTableRow[]>({ queryKey: ["/api/admin/league-tables"] });
  const { toast } = useToast();

  const remove = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/league-tables/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/league-tables"] }),
    onError: (e: Error) => toast({ title: "Couldn't remove row", description: e.message, variant: "destructive" }),
  });

  const byLeague = new Map<string, LeagueTableRow[]>();
  for (const r of rows) byLeague.set(r.league, [...(byLeague.get(r.league) ?? []), r]);
  Array.from(byLeague.values()).forEach((list) => list.sort((a, b) => a.position - b.position));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Table2 className="size-5" /> League tables</h2>
          <p className="text-sm text-muted-foreground">Upload a CSV after each round to update standings — shown on the public Fixtures page.</p>
        </div>
        <CsvImportButton
          endpoint="/api/admin/league-tables/import"
          invalidateKey="/api/admin/league-tables"
          label="import-league-table"
          hint="Columns: league,position,team,played,won,drawn,lost,goalsFor,goalsAgainst,points. Re-uploading updates matching rows (by league+team)."
        />
      </div>

      {byLeague.size === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">No league tables uploaded yet.</Card>
      ) : (
        Array.from(byLeague.entries()).map(([league, list]) => (
          <Card key={league} className="p-4 bg-card overflow-x-auto">
            <h3 className="font-display font-bold mb-3">{league}</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-card-border">
                  <th className="py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-2">Team</th>
                  <th className="py-1.5 pr-2 text-center">P</th>
                  <th className="py-1.5 pr-2 text-center">W</th>
                  <th className="py-1.5 pr-2 text-center">D</th>
                  <th className="py-1.5 pr-2 text-center">L</th>
                  <th className="py-1.5 pr-2 text-center">GD</th>
                  <th className="py-1.5 pr-2 text-center">Pts</th>
                  <th className="py-1.5" />
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="border-b border-card-border last:border-0" data-testid={`row-league-${r.id}`}>
                    <td className="py-1.5 pr-2 text-muted-foreground">{r.position}</td>
                    <td className="py-1.5 pr-2 font-medium">{r.team}</td>
                    <td className="py-1.5 pr-2 text-center">{r.played}</td>
                    <td className="py-1.5 pr-2 text-center">{r.won}</td>
                    <td className="py-1.5 pr-2 text-center">{r.drawn}</td>
                    <td className="py-1.5 pr-2 text-center">{r.lost}</td>
                    <td className="py-1.5 pr-2 text-center">{r.goalsFor - r.goalsAgainst}</td>
                    <td className="py-1.5 pr-2 text-center font-bold">{r.points}</td>
                    <td className="py-1.5 text-right">
                      <Button size="icon" variant="ghost" className="size-7" onClick={() => remove.mutate(r.id)} data-testid={`button-delete-league-${r.id}`}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))
      )}
    </div>
  );
}

function FixtureDialog({ open, onClose, fixture }: { open: boolean; onClose: () => void; fixture: Fixture | null }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    team: fixture?.team ?? "",
    opponent: fixture?.opponent ?? "",
    date: fixture?.date ?? todayIso(),
    kickoffTime: fixture?.kickoffTime ?? "",
    homeAway: (fixture?.homeAway ?? "home") as "home" | "away",
    venue: fixture?.venue ?? "",
    league: fixture?.league ?? "",
    homeScore: fixture?.homeScore?.toString() ?? "",
    awayScore: fixture?.awayScore?.toString() ?? "",
    notes: fixture?.notes ?? "",
  });

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        ...form,
        homeScore: form.homeScore === "" ? null : Number(form.homeScore),
        awayScore: form.awayScore === "" ? null : Number(form.awayScore),
      };
      if (fixture) return (await apiRequest("PATCH", `/api/admin/fixtures/${fixture.id}`, body)).json();
      return (await apiRequest("POST", "/api/admin/fixtures", body)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/fixtures"] });
      toast({ title: fixture ? "Fixture updated" : "Fixture added" });
      onClose();
    },
  });
  const remove = useMutation({
    mutationFn: async () => (await apiRequest("DELETE", `/api/admin/fixtures/${fixture!.id}`)).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/fixtures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/fixtures"] });
      toast({ title: "Fixture deleted" });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{fixture ? "Edit fixture" : "New fixture"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Team</Label>
              <Input value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} placeholder="U10s" data-testid="input-fixture-team" />
            </div>
            <div>
              <Label>Opponent</Label>
              <Input value={form.opponent} onChange={(e) => setForm({ ...form, opponent: e.target.value })} placeholder="Rivals FC" data-testid="input-fixture-opponent" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="input-fixture-date" />
            </div>
            <div>
              <Label>Kick-off <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input type="time" value={form.kickoffTime} onChange={(e) => setForm({ ...form, kickoffTime: e.target.value })} data-testid="input-fixture-time" />
            </div>
          </div>
          <div>
            <Label>Home or away</Label>
            <Select value={form.homeAway} onValueChange={(v) => setForm({ ...form, homeAway: v as "home" | "away" })}>
              <SelectTrigger data-testid="select-fixture-homeaway"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="away">Away</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Venue <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} data-testid="input-fixture-venue" />
            </div>
            <div>
              <Label>League/cup <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={form.league} onChange={(e) => setForm({ ...form, league: e.target.value })} data-testid="input-fixture-league" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{form.homeAway === "home" ? "Our score" : "Opponent score"} <span className="text-muted-foreground font-normal text-xs">(once played)</span></Label>
              <Input type="number" min={0} value={form.homeScore} onChange={(e) => setForm({ ...form, homeScore: e.target.value })} data-testid="input-fixture-homescore" />
            </div>
            <div>
              <Label>{form.homeAway === "home" ? "Opponent score" : "Our score"}</Label>
              <Input type="number" min={0} value={form.awayScore} onChange={(e) => setForm({ ...form, awayScore: e.target.value })} data-testid="input-fixture-awayscore" />
            </div>
          </div>
          <div>
            <Label>Notes <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="input-fixture-notes" />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          {fixture && (
            <Button variant="outline" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="button-delete-fixture">
              <Trash2 className="size-4 mr-1" /> Delete
            </Button>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form.team || !form.opponent} data-testid="button-save-fixture">
            {save.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============ COMPETITIONS ============
function statusBadgeVariant(status: string): "default" | "secondary" | "outline" {
  if (status === "live") return "default";
  if (status === "draft") return "outline";
  return "secondary";
}

function CompetitionsTab() {
  const { data: competitions = [] } = useQuery<Competition[]>({ queryKey: ["/api/admin/competitions"] });
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<Competition | null>(null);

  return (
    <div className="space-y-4 mt-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Raffles &amp; auctions</h1>
          <p className="text-sm text-muted-foreground">Create a raffle or auction, then track entries/bids and run the draw.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="button-add-competition">
          <Plus className="size-4 mr-1" /> New
        </Button>
      </div>

      {competitions.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-dashed">Nothing set up yet.</Card>
      ) : (
        <div className="space-y-2">
          {competitions.map((c) => (
            <Card key={c.id} className="p-4 bg-card flex items-center gap-3 hover-elevate cursor-pointer" onClick={() => setDetail(c)} data-testid={`row-competition-${c.id}`}>
              <div className="text-muted-foreground">{c.type === "raffle" ? <Ticket className="size-5" /> : <Gavel className="size-5" />}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-foreground">{c.title}</span>
                  <Badge variant={statusBadgeVariant(c.status)} className="text-[10px] uppercase">{c.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {c.type === "raffle"
                    ? `${gbp(c.ticketPrice)}/ticket · ${c.ticketsSold}${c.maxTickets > 0 ? `/${c.maxTickets}` : ""} sold`
                    : `From ${gbp(c.startingBid)}`}
                  {" · closes "}{formatDate(new Date(c.closesAt).toISOString().slice(0, 10))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CompetitionDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      {detail && <CompetitionDetailDialog competition={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CompetitionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const toLocalInput = (d: Date) => {
    const copy = new Date(d);
    copy.setMinutes(copy.getMinutes() - copy.getTimezoneOffset());
    return copy.toISOString().slice(0, 16);
  };
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  const [form, setForm] = useState({
    type: "raffle" as "raffle" | "auction",
    title: "",
    description: "",
    prizeDescription: "",
    imageUrl: "",
    ticketPrice: "2",
    maxTickets: "500",
    startingBid: "10",
    bidIncrement: "5",
    opensAt: toLocalInput(new Date()),
    closesAt: toLocalInput(weekFromNow),
  });

  const create = useMutation({
    mutationFn: async () => {
      const body = {
        type: form.type,
        title: form.title,
        description: form.description,
        prizeDescription: form.prizeDescription,
        imageUrl: form.imageUrl,
        ticketPrice: Number(form.ticketPrice) || 0,
        maxTickets: Number(form.maxTickets) || 0,
        startingBid: Number(form.startingBid) || 0,
        bidIncrement: Number(form.bidIncrement) || 1,
        opensAt: new Date(form.opensAt).getTime(),
        closesAt: new Date(form.closesAt).getTime(),
      };
      return (await apiRequest("POST", "/api/admin/competitions", body)).json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      toast({ title: "Created as a draft", description: "Publish it from the detail view when you're ready." });
      onClose();
    },
    onError: (e: any) => toast({ title: "Couldn't create", description: String(e?.message || e), variant: "destructive" }),
  });

  const canSave = !!form.title.trim() && !!form.prizeDescription.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New competition</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "raffle" | "auction" })}>
              <SelectTrigger data-testid="select-competition-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="raffle">Raffle — numbered tickets, drawn at random</SelectItem>
                <SelectItem value="auction">Auction — highest bid wins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Signed shirt raffle" data-testid="input-competition-title" />
          </div>
          <div>
            <Label>Prize</Label>
            <Input value={form.prizeDescription} onChange={(e) => setForm({ ...form, prizeDescription: e.target.value })} placeholder="Signed first-team shirt" data-testid="input-competition-prize" />
          </div>
          <div>
            <Label>Description <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-competition-description" />
          </div>
          <div>
            <Label className="mb-1 block">Prize photo <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <ImageDropzone testId="competition-image" currentUrl={form.imageUrl} alt="Prize photo" onUploaded={(url) => setForm({ ...form, imageUrl: url })} />
          </div>

          {form.type === "raffle" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ticket price (£)</Label>
                <Input type="number" min={0} step="0.01" value={form.ticketPrice} onChange={(e) => setForm({ ...form, ticketPrice: e.target.value })} data-testid="input-competition-ticketprice" />
              </div>
              <div>
                <Label>Ticket cap <span className="text-muted-foreground font-normal text-xs">(0 = unlimited)</span></Label>
                <Input type="number" min={0} value={form.maxTickets} onChange={(e) => setForm({ ...form, maxTickets: e.target.value })} data-testid="input-competition-maxtickets" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Starting bid (£)</Label>
                <Input type="number" min={0} step="0.01" value={form.startingBid} onChange={(e) => setForm({ ...form, startingBid: e.target.value })} data-testid="input-competition-startingbid" />
              </div>
              <div>
                <Label>Min bid increment (£)</Label>
                <Input type="number" min={0} step="0.01" value={form.bidIncrement} onChange={(e) => setForm({ ...form, bidIncrement: e.target.value })} data-testid="input-competition-bidincrement" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Opens</Label>
              <Input type="datetime-local" value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} data-testid="input-competition-opensat" />
            </div>
            <div>
              <Label>Closes</Label>
              <Input type="datetime-local" value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} data-testid="input-competition-closesat" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Created as a draft — nobody can enter until you publish it from the detail view.</p>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={!canSave || create.isPending} data-testid="button-save-competition">
            {create.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompetitionDetailDialog({ competition, onClose }: { competition: Competition; onClose: () => void }) {
  const { toast } = useToast();
  const [addEntryOpen, setAddEntryOpen] = useState(false);

  const { data: comp } = useQuery<Competition>({
    queryKey: ["/api/admin/competitions", competition.id],
    queryFn: async () => (await apiRequest("GET", `/api/admin/competitions/${competition.id}`)).json(),
    initialData: competition,
  });
  const { data: entries = [] } = useQuery<Entry[]>({
    queryKey: ["/api/admin/competitions", competition.id, "entries"],
    queryFn: async () => (await apiRequest("GET", `/api/admin/competitions/${competition.id}/entries`)).json(),
    enabled: comp?.type === "raffle",
  });
  const { data: bids = [] } = useQuery<Bid[]>({
    queryKey: ["/api/admin/competitions", competition.id, "bids"],
    queryFn: async () => (await apiRequest("GET", `/api/admin/competitions/${competition.id}/bids`)).json(),
    enabled: comp?.type === "auction",
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
  };

  const publish = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/admin/competitions/${competition.id}/publish`, {})).json(),
    onSuccess: () => { invalidate(); toast({ title: "Published — live on the site now" }); },
  });
  const draw = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/admin/competitions/${competition.id}/draw`, {})).json(),
    onSuccess: (data: Competition) => {
      invalidate();
      toast({ title: data.type === "raffle" ? `Ticket #${data.drawnNumber} wins!` : "Auction settled" });
    },
    onError: (e: any) => toast({ title: "Couldn't resolve", description: String(e?.message || e), variant: "destructive" }),
  });
  const markPaid = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/admin/competitions/${competition.id}/winner-paid`, {})).json(),
    onSuccess: () => { invalidate(); toast({ title: "Marked as paid" }); },
  });
  const remove = useMutation({
    mutationFn: async () => (await apiRequest("DELETE", `/api/admin/competitions/${competition.id}`)).json(),
    onSuccess: () => { invalidate(); toast({ title: "Deleted" }); onClose(); },
    onError: (e: any) => toast({ title: "Couldn't delete", description: String(e?.message || e), variant: "destructive" }),
  });

  if (!comp) return null;

  const winnerEntry = comp.winnerEntryId != null ? entries.find((e) => e.id === comp.winnerEntryId) : undefined;
  const winnerBid = comp.winnerBidId != null ? bids.find((b) => b.id === comp.winnerBidId) : undefined;
  const topBid = bids[0];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {comp.title}
            <Badge variant={statusBadgeVariant(comp.status)} className="text-[10px] uppercase">{comp.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">{comp.prizeDescription}</div>

          {comp.type === "raffle" ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div><div className="font-display font-bold text-lg">{gbp(comp.ticketPrice)}</div><div className="text-[10px] text-muted-foreground">per ticket</div></div>
              <div><div className="font-display font-bold text-lg">{comp.ticketsSold}{comp.maxTickets > 0 ? `/${comp.maxTickets}` : ""}</div><div className="text-[10px] text-muted-foreground">sold</div></div>
              <div><div className="font-display font-bold text-lg">{comp.drawnNumber ?? "—"}</div><div className="text-[10px] text-muted-foreground">winning #</div></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-center">
              <div><div className="font-display font-bold text-lg">{gbp(topBid?.amount ?? comp.startingBid)}</div><div className="text-[10px] text-muted-foreground">current price</div></div>
              <div><div className="font-display font-bold text-lg">{bids.length}</div><div className="text-[10px] text-muted-foreground">bids</div></div>
            </div>
          )}

          {(winnerEntry || winnerBid) && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <div className="font-semibold text-foreground">Winner</div>
              {winnerEntry && <div>Ticket #{comp.drawnNumber} — {winnerEntry.buyerName} ({winnerEntry.buyerEmail || "no email on file"})</div>}
              {winnerBid && <div>{winnerBid.bidderName} — {gbp(winnerBid.amount)} ({winnerBid.bidderEmail || "no email on file"})</div>}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={comp.winnerPaid ? "secondary" : "outline"} className="text-[10px]">{comp.winnerPaid ? "Paid" : "Not paid yet"}</Badge>
                {!comp.winnerPaid && (
                  <Button size="sm" variant="outline" onClick={() => markPaid.mutate()} disabled={markPaid.isPending} data-testid="button-mark-winner-paid">
                    Mark as paid
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {comp.status === "draft" && (
              <Button onClick={() => publish.mutate()} disabled={publish.isPending} data-testid="button-publish-competition">
                {publish.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Publish
              </Button>
            )}
            {comp.status === "live" && (
              <Button variant="outline" onClick={() => draw.mutate()} disabled={draw.isPending} data-testid="button-draw-competition">
                {draw.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} {comp.type === "raffle" ? "Run draw now" : "Close auction now"}
              </Button>
            )}
            {comp.type === "raffle" && comp.status !== "drawn" && (
              <Button variant="outline" onClick={() => setAddEntryOpen(true)} data-testid="button-add-entry">
                <Plus className="size-4 mr-1" /> Add entry
              </Button>
            )}
            {comp.status === "draft" && (
              <Button variant="ghost" className="text-destructive" onClick={() => remove.mutate()} disabled={remove.isPending} data-testid="button-delete-competition">
                <Trash2 className="size-4 mr-1" /> Delete
              </Button>
            )}
          </div>

          {comp.type === "raffle" ? (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Entries ({entries.length})</h3>
              {entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {entries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                      <span>#{e.ticketNumber} · {e.buyerName}</span>
                      <span className="text-muted-foreground">{e.entryMethod === "free_post" ? "Free" : "Paid"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Bids ({bids.length})</h3>
              {bids.length === 0 ? (
                <p className="text-sm text-muted-foreground">None yet.</p>
              ) : (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {bids.map((b) => (
                    <div key={b.id} className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
                      <span>{b.bidderName}</span>
                      <span className="font-mono">{gbp(b.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      <AddEntryDialog open={addEntryOpen} onClose={() => setAddEntryOpen(false)} competition={comp} />
    </Dialog>
  );
}

function AddEntryDialog({ open, onClose, competition }: { open: boolean; onClose: () => void; competition: Competition }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ quantity: "1", entryMethod: "free_post" as "paid" | "free_post", buyerName: "", buyerEmail: "", buyerPhone: "" });

  const create = useMutation({
    mutationFn: async () => (await apiRequest("POST", `/api/admin/competitions/${competition.id}/entries`, {
      quantity: Number(form.quantity) || 1,
      entryMethod: form.entryMethod,
      buyerName: form.buyerName,
      buyerEmail: form.buyerEmail,
      buyerPhone: form.buyerPhone,
    })).json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/competitions"] });
      toast({ title: "Entry logged" });
      setForm({ quantity: "1", entryMethod: "free_post", buyerName: "", buyerEmail: "", buyerPhone: "" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Couldn't add entry", description: String(e?.message || e), variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add entry</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">For a cash sale at the clubhouse, or a genuine free-post entry — both land in the same numbered draw.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} data-testid="input-entry-quantity" />
            </div>
            <div>
              <Label>Method</Label>
              <Select value={form.entryMethod} onValueChange={(v) => setForm({ ...form, entryMethod: v as "paid" | "free_post" })}>
                <SelectTrigger data-testid="select-entry-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid (cash)</SelectItem>
                  <SelectItem value="free_post">Free entry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Name</Label>
            <Input value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} data-testid="input-entry-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input type="email" value={form.buyerEmail} onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })} data-testid="input-entry-email" />
            </div>
            <div>
              <Label>Phone <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Input value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} data-testid="input-entry-phone" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => create.mutate()} disabled={create.isPending || !form.buyerName.trim()} data-testid="button-save-entry">
            {create.isPending && <Loader2 className="size-4 mr-1 animate-spin" />} Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
