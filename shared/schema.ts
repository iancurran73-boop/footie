import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Club-wide settings (single row)
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  clubName: text("club_name").notNull().default("Junior FC"),
  notifyEmail: text("notify_email").notNull().default(""),
  // Alert the committee the moment a raffle ticket sells or a new bid lands.
  pushEnabled: integer("push_enabled", { mode: "boolean" }).notNull().default(false),
});
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Key/value content store - used by InlineText/ImageDropzone for all editable text + images
export const content = sqliteTable("content", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: integer("updated_at").notNull(),
});
export type ContentRow = typeof content.$inferSelect;

// Gallery items — match-day photos etc.
export const galleryItems = sqliteTable("gallery_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  imageUrl: text("image_url").notNull(),
  caption: text("caption").default(""),
  category: text("category").default(""), // e.g. team name, used as a filter
  sortOrder: integer("sort_order").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});
export const insertGalleryItemSchema = createInsertSchema(galleryItems).omit({ id: true, createdAt: true });
export type InsertGalleryItem = z.infer<typeof insertGalleryItemSchema>;
export type GalleryItem = typeof galleryItems.$inferSelect;

// Reviews/testimonials — repurposable for parent/sponsor shout-outs
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull().default(5),
  body: text("body").notNull(),
  publishedAt: text("published_at").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;

// Site pages — drives the nav. "core" rows point at built-in routes/components
// and only their nav placement is editable here; "custom" rows are
// admin-created pages rendered by the generic layout renderer.
export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  navLabel: text("nav_label").notNull(),
  path: text("path").notNull(),
  kind: text("kind").notNull().default("custom"), // "core" | "custom"
  layout: text("layout"),
  sortOrder: integer("sort_order").notNull().default(0),
  visible: integer("visible", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at").notNull(),
});
export const insertPageSchema = createInsertSchema(pages).omit({ id: true, createdAt: true });
export type InsertPage = z.infer<typeof insertPageSchema>;
export type Page = typeof pages.$inferSelect;

// Fixtures & results — one row per match, per team (a club runs several
// age-group teams, each with their own fixture list).
export const fixtures = sqliteTable("fixtures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team: text("team").notNull(), // e.g. "U10s", "U14s Girls"
  opponent: text("opponent").notNull(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  kickoffTime: text("kickoff_time").notNull().default(""), // "HH:MM"
  homeAway: text("home_away").notNull().default("home"), // "home" | "away"
  venue: text("venue").notNull().default(""),
  league: text("league").notNull().default(""), // league/cup/friendly
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const insertFixtureSchema = createInsertSchema(fixtures).omit({ id: true, createdAt: true });
export type InsertFixture = z.infer<typeof insertFixtureSchema>;
export type Fixture = typeof fixtures.$inferSelect;

// Competitions — a raffle (numbered tickets, drawn at random) or an auction
// (open bidding, highest bidder wins). One table covers both; the fields
// that don't apply to a given type are simply left at their defaults.
export const competitions = sqliteTable("competitions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(), // "raffle" | "auction"
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  prizeDescription: text("prize_description").notNull().default(""),

  // raffle only
  ticketPrice: real("ticket_price").notNull().default(0),
  maxTickets: integer("max_tickets").notNull().default(0), // the cap, e.g. 500
  // Running count of tickets actually issued (paid + free combined) — this,
  // not maxTickets, is what bounds the draw. If only 250 of a 500 cap sell,
  // the winning number is drawn from 1-250, never an unsold number.
  ticketsSold: integer("tickets_sold").notNull().default(0),

  // auction only
  startingBid: real("starting_bid").notNull().default(0),
  bidIncrement: real("bid_increment").notNull().default(1),

  opensAt: integer("opens_at").notNull(),
  closesAt: integer("closes_at").notNull(),
  status: text("status").notNull().default("draft"), // "draft" | "live" | "closed" | "drawn"

  // raffle draw result
  drawnNumber: integer("drawn_number"),
  drawnAt: integer("drawn_at"),
  // Hex seed generated at draw time and stored for audit — proves the draw
  // wasn't re-rolled after the fact, since drawnNumber is reproducible from
  // (drawSeed, ticketsSold) by anyone who wants to check the maths.
  drawSeed: text("draw_seed").notNull().default(""),
  winnerEntryId: integer("winner_entry_id"),

  // auction result
  winnerBidId: integer("winner_bid_id"),
  winnerPaid: integer("winner_paid", { mode: "boolean" }).notNull().default(false),

  createdAt: integer("created_at").notNull(),
});
export const insertCompetitionSchema = createInsertSchema(competitions).omit({
  id: true,
  ticketsSold: true,
  status: true,
  drawnNumber: true,
  drawnAt: true,
  drawSeed: true,
  winnerEntryId: true,
  winnerBidId: true,
  winnerPaid: true,
  createdAt: true,
});
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Competition = typeof competitions.$inferSelect;

// Raffle entries — one row per ticket number issued. entryMethod "free_post"
// exists so a genuine free-entry route (same number pool, same odds) can sit
// alongside paid tickets — see the club's T&Cs page for why that matters.
export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  competitionId: integer("competition_id").notNull(),
  ticketNumber: integer("ticket_number").notNull(),
  entryMethod: text("entry_method").notNull().default("paid"), // "paid" | "free_post"
  buyerName: text("buyer_name").notNull(),
  buyerEmail: text("buyer_email").notNull().default(""),
  buyerPhone: text("buyer_phone").notNull().default(""),
  // Groups every ticket bought in one checkout (a buyer can take several
  // numbers at once); empty for admin-entered free-post tickets.
  purchaseRef: text("purchase_ref").notNull().default(""),
  paymentRef: text("payment_ref").notNull().default(""), // SumUp checkout id, empty for free entries
  createdAt: integer("created_at").notNull(),
});
export const insertEntrySchema = createInsertSchema(entries).omit({ id: true, createdAt: true });
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type Entry = typeof entries.$inferSelect;

// Auction bids — current price is just the highest amount for the competition.
export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  competitionId: integer("competition_id").notNull(),
  amount: real("amount").notNull(),
  bidderName: text("bidder_name").notNull(),
  bidderEmail: text("bidder_email").notNull().default(""),
  bidderPhone: text("bidder_phone").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const insertBidSchema = createInsertSchema(bids).omit({ id: true, createdAt: true });
export type InsertBid = z.infer<typeof insertBidSchema>;
export type Bid = typeof bids.$inferSelect;

// League tables — one row per team's standing within a league/division.
// Grouped by `league` (e.g. "U12 Division 1"); uploaded/updated in bulk via
// a CSV import rather than edited row-by-row.
export const leagueTables = sqliteTable("league_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  league: text("league").notNull(),
  position: integer("position").notNull().default(0),
  team: text("team").notNull(),
  played: integer("played").notNull().default(0),
  won: integer("won").notNull().default(0),
  drawn: integer("drawn").notNull().default(0),
  lost: integer("lost").notNull().default(0),
  goalsFor: integer("goals_for").notNull().default(0),
  goalsAgainst: integer("goals_against").notNull().default(0),
  points: integer("points").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});
export const insertLeagueTableRowSchema = createInsertSchema(leagueTables).omit({ id: true, updatedAt: true });
export type InsertLeagueTableRow = z.infer<typeof insertLeagueTableRowSchema>;
export type LeagueTableRow = typeof leagueTables.$inferSelect;

// History of social posts sent (or attempted) from the admin — manual
// compose, or auto-generated when a fixture result is saved.
export const socialPosts = sqliteTable("social_posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(), // "facebook"
  message: text("message").notNull(),
  imageUrl: text("image_url").notNull().default(""),
  trigger: text("trigger").notNull().default("manual"), // "manual" | "fixture_result"
  status: text("status").notNull().default("sent"), // "sent" | "failed"
  externalPostId: text("external_post_id").notNull().default(""),
  error: text("error").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({ id: true, createdAt: true });
export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;
