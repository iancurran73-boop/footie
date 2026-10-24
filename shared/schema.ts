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
  // Max players a parent can pick in Parents' Player voting (see fixtures' match report fields).
  parentVoteMaxSelections: integer("parent_vote_max_selections").notNull().default(1),
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
  category: text("category").default(""), // e.g. "Matches", "Training", "Tournaments", "Sponsors"
  season: text("season").default(""), // e.g. "2026/27"
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

// Teams — one row per age-group squad the club runs (e.g. "Under 10s").
// Fixtures reference a team by its name (a free-text string, matched by the
// CSV import too), not a foreign key — keeps the import format simple.
export const teams = sqliteTable("teams", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(), // e.g. "Under 10s" — matched against fixtures.team
  ageGroup: text("age_group").notNull().default(""), // e.g. "U10"
  coachName: text("coach_name").notNull().default(""),
  coachEmail: text("coach_email").notNull().default(""),
  coachPhone: text("coach_phone").notNull().default(""),
  trainingInfo: text("training_info").notNull().default(""), // e.g. "Tuesdays 6-7pm, Riverside Rec"
  description: text("description").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const insertTeamSchema = createInsertSchema(teams).omit({ id: true, createdAt: true });
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

// Fixtures & results — one row per match, per team (a club runs several
// age-group teams, each with their own fixture list). Doubles as the match
// report once played: lineup/scorers/assists/clean-sheets/POTMs are entered
// ONCE here and every player stat/leaderboard is derived from these rows at
// read time (see server/stats.ts) — never stored as separate counters, so
// there's nothing to keep in sync and no double-counting risk on edits.
export const fixtures = sqliteTable("fixtures", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team: text("team").notNull(), // e.g. "U10s", "U14s Girls"
  opponent: text("opponent").notNull(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  kickoffTime: text("kickoff_time").notNull().default(""), // "HH:MM"
  meetTime: text("meet_time").notNull().default(""), // "HH:MM"
  homeAway: text("home_away").notNull().default("home"), // "home" | "away"
  venue: text("venue").notNull().default(""),
  address: text("address").notNull().default(""),
  pitch: text("pitch").notNull().default(""), // e.g. "Pitch 3"
  pitchType: text("pitch_type").notNull().default(""), // e.g. "3G", "grass"
  directionsUrl: text("directions_url").notNull().default(""),
  league: text("league").notNull().default(""), // league/cup/friendly/tournament
  kit: text("kit").notNull().default("home"), // "home" | "away" | "alternative" | "tbc"
  // Independent per-field confirmation — date/time, pitch and location can
  // each be confirmed separately once the club secretary has nailed them down.
  confirmationStatus: text("confirmation_status").notNull().default("awaiting"), // "awaiting" | "confirmed" | "changed"
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  notes: text("notes").notNull().default(""),

  // --- match report (filled in once the match is played) ---
  matchSummary: text("match_summary").notNull().default(""),
  // JSON arrays of player ids, e.g. lineupPlayerIds: "[3,7,12]"
  lineupPlayerIds: text("lineup_player_ids").notNull().default("[]"),
  // JSON array of {playerId, count}, e.g. "[{\"playerId\":3,\"count\":2}]"
  scorers: text("scorers").notNull().default("[]"),
  assists: text("assists").notNull().default("[]"),
  // Admin-selected from the lineup when the team kept a clean sheet — not
  // auto-restricted to keeper/defenders, since the admin knows who actually
  // played there that day.
  cleanSheetPlayerIds: text("clean_sheet_player_ids").notNull().default("[]"),
  lastDitchTacklePlayerIds: text("last_ditch_tackle_player_ids").notNull().default("[]"),
  managerPotmPlayerId: integer("manager_potm_player_id"),
  coach1PotmPlayerId: integer("coach1_potm_player_id"),
  coach2PotmPlayerId: integer("coach2_potm_player_id"),
  opponentPotmPlayerId: integer("opponent_potm_player_id"),

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

// Football cards — a "40 team card" style fundraiser: a fixed grid of teams,
// each claimed by one supporter for a flat stake. Once every team is taken,
// one is drawn at random (same provably-fair draw as the raffle) and whoever
// claimed it wins the prize pot. The team list is fixed at publish time —
// slot rows are created then, one per team — so the grid never changes shape
// mid-sale.
export const footballCards = sqliteTable("football_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  inAidOf: text("in_aid_of").notNull().default(""), // "in aid of..." beneficiary line
  stake: real("stake").notNull().default(0), // price per team square
  prizeAmount: real("prize_amount").notNull().default(0),
  status: text("status").notNull().default("draft"), // "draft" | "live" | "drawn" | "cancelled"
  drawnTeam: text("drawn_team").notNull().default(""),
  drawnAt: integer("drawn_at"),
  // Same audit-seed approach as the raffle draw — see raffleDraw.ts.
  drawSeed: text("draw_seed").notNull().default(""),
  winnerSlotId: integer("winner_slot_id"),
  winnerPaid: integer("winner_paid", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});
export const insertFootballCardSchema = createInsertSchema(footballCards).omit({
  id: true,
  status: true,
  drawnTeam: true,
  drawnAt: true,
  drawSeed: true,
  winnerSlotId: true,
  winnerPaid: true,
  createdAt: true,
});
export type InsertFootballCard = z.infer<typeof insertFootballCardSchema>;
export type FootballCard = typeof footballCards.$inferSelect;

// One row per team square on a card. All rows for a card are created
// together when it's published (from its fixed team list); claiming a slot
// just fills in the buyer fields on an existing row rather than creating one.
export const footballCardSlots = sqliteTable("football_card_slots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  cardId: integer("card_id").notNull(),
  team: text("team").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  buyerName: text("buyer_name").notNull().default(""),
  buyerEmail: text("buyer_email").notNull().default(""),
  buyerPhone: text("buyer_phone").notNull().default(""),
  claimedAt: integer("claimed_at"),
});
export const insertFootballCardSlotSchema = createInsertSchema(footballCardSlots).omit({ id: true });
export type InsertFootballCardSlot = z.infer<typeof insertFootballCardSlotSchema>;
export type FootballCardSlot = typeof footballCardSlots.$inferSelect;

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

// Valid primary/secondary playing positions (spec's position dropdown).
export const PLAYER_POSITIONS = [
  "GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "CF", "ST",
] as const;

// Player profiles — one row per registered player. Season stats (goals,
// assists, clean sheets, POTM totals, etc.) are NOT stored here: they're
// computed from fixtures' match-report fields at read time (server/stats.ts)
// so a correction to one match never leaves a counter out of sync.
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team: text("team").notNull(), // matches teams.name, same convention as fixtures.team
  displayName: text("display_name").notNull(),
  squadNumber: integer("squad_number"),
  primaryPosition: text("primary_position").notNull().default(""),
  secondaryPositions: text("secondary_positions").notNull().default(""), // comma-separated
  shortProfile: text("short_profile").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const insertPlayerSchema = createInsertSchema(players).omit({ id: true, createdAt: true });
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Per-fixture player availability — admin-recorded (parents reply by
// message/in person; there's no parent login in this build yet).
export const playerAvailability = sqliteTable("player_availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fixtureId: integer("fixture_id").notNull(),
  playerId: integer("player_id").notNull(),
  status: text("status").notNull().default("awaiting"), // "available" | "not_available" | "awaiting" | "injured" | "other"
  updatedAt: integer("updated_at").notNull(),
});
export const insertPlayerAvailabilitySchema = createInsertSchema(playerAvailability).omit({ id: true, updatedAt: true });
export type InsertPlayerAvailability = z.infer<typeof insertPlayerAvailabilitySchema>;
export type PlayerAvailability = typeof playerAvailability.$inferSelect;

// Parents' Player votes — one row per ballot cast. Open for 48 hours from
// kickoff; eligible players are whoever is in that fixture's lineup.
// Individual ballots are never shown publicly, only the closed result.
export const playerVotes = sqliteTable("player_votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fixtureId: integer("fixture_id").notNull(),
  voterEmail: text("voter_email").notNull(), // one ballot per email per fixture
  playerIds: text("player_ids").notNull().default("[]"), // JSON array, up to settings.parentVoteMaxSelections
  createdAt: integer("created_at").notNull(),
});
export const insertPlayerVoteSchema = createInsertSchema(playerVotes).omit({ id: true, createdAt: true });
export type InsertPlayerVote = z.infer<typeof insertPlayerVoteSchema>;
export type PlayerVote = typeof playerVotes.$inferSelect;

// Sponsors — business profiles with a configurable, freeform benefits list
// (homepage exposure, fixture branding, etc.) rather than a fixed taxonomy.
export const sponsors = sqliteTable("sponsors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessName: text("business_name").notNull(),
  logoUrl: text("logo_url").notNull().default(""),
  description: text("description").notNull().default(""),
  websiteUrl: text("website_url").notNull().default(""),
  socialUrl: text("social_url").notNull().default(""),
  sponsorshipType: text("sponsorship_type").notNull().default(""), // e.g. "Kit sponsor", "Gold sponsor"
  periodStart: text("period_start").notNull().default(""), // "YYYY-MM-DD"
  periodEnd: text("period_end").notNull().default(""),
  benefits: text("benefits").notNull().default(""), // admin-entered, one per line
  thankYouMessage: text("thank_you_message").notNull().default(""), // what their sponsorship helped achieve
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const insertSponsorSchema = createInsertSchema(sponsors).omit({ id: true, createdAt: true });
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Sponsor = typeof sponsors.$inferSelect;

// Fundraisers — a named pot with a target, distinct from a raffle/auction
// (which already tracks its own ticket/bid total). Supports the "currently
// raised £X of £Y target" progress-bar graphic the club already posts.
export const fundraisers = sqliteTable("fundraisers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date").notNull().default(""),
  targetAmount: real("target_amount").notNull().default(0),
  raisedAmount: real("raised_amount").notNull().default(0), // admin-updated running total
  donationLink: text("donation_link").notNull().default(""),
  updatesText: text("updates_text").notNull().default(""), // admin-entered running log, one update per line
  status: text("status").notNull().default("active"), // "active" | "completed" | "archived"
  createdAt: integer("created_at").notNull(),
});
export const insertFundraiserSchema = createInsertSchema(fundraisers).omit({ id: true, createdAt: true });
export type InsertFundraiser = z.infer<typeof insertFundraiserSchema>;
export type Fundraiser = typeof fundraisers.$inferSelect;

// Training sessions — discrete sessions rather than an abstract recurrence
// rule, so admin can cancel or add a one-off extra without fighting a
// recurring-event model. Availability is tracked the same way as fixtures.
export const trainingSessions = sqliteTable("training_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team: text("team").notNull(),
  date: text("date").notNull(), // "YYYY-MM-DD"
  startTime: text("start_time").notNull().default(""), // "HH:MM"
  endTime: text("end_time").notNull().default(""),
  venue: text("venue").notNull().default(""),
  status: text("status").notNull().default("scheduled"), // "scheduled" | "cancelled"
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({ id: true, createdAt: true });
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;

export const trainingAvailability = sqliteTable("training_availability", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  playerId: integer("player_id").notNull(),
  status: text("status").notNull().default("awaiting"), // same vocabulary as fixture availability
  updatedAt: integer("updated_at").notNull(),
});
export const insertTrainingAvailabilitySchema = createInsertSchema(trainingAvailability).omit({ id: true, updatedAt: true });
export type InsertTrainingAvailability = z.infer<typeof insertTrainingAvailabilitySchema>;
export type TrainingAvailability = typeof trainingAvailability.$inferSelect;

// Tournaments — one-off multi-detail events, separate from the weekly
// league fixture list.
export const tournaments = sqliteTable("tournaments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ageGroup: text("age_group").notNull().default(""),
  date: text("date").notNull().default(""),
  arrivalTime: text("arrival_time").notNull().default(""),
  startTime: text("start_time").notNull().default(""),
  finishTime: text("finish_time").notNull().default(""),
  location: text("location").notNull().default(""),
  address: text("address").notNull().default(""),
  pitch: text("pitch").notNull().default(""),
  pitchType: text("pitch_type").notNull().default(""),
  format: text("format").notNull().default(""), // e.g. "5-a-side"
  photoUrl: text("photo_url").notNull().default(""),
  infoUrl: text("info_url").notNull().default(""),
  status: text("status").notNull().default("upcoming"), // "upcoming" | "completed" | "archived"
  createdAt: integer("created_at").notNull(),
});
export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

// Team kit library — the colours/photos behind a fixture's "home"/"away"/
// "alternative" kit selector.
export const teamKits = sqliteTable("team_kits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team: text("team").notNull(),
  kitType: text("kit_type").notNull(), // "home" | "away" | "alternative"
  shirtColour: text("shirt_colour").notNull().default(""),
  shorts: text("shorts").notNull().default(""),
  socks: text("socks").notNull().default(""),
  gkShirt: text("gk_shirt").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const insertTeamKitSchema = createInsertSchema(teamKits).omit({ id: true, createdAt: true });
export type InsertTeamKit = z.infer<typeof insertTeamKitSchema>;
export type TeamKit = typeof teamKits.$inferSelect;

// Committee / club contacts.
export const committeeMembers = sqliteTable("committee_members", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role").notNull().default(""), // e.g. "Club Secretary", "Welfare Officer"
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  visibility: text("visibility").notNull().default("public"), // "public" | "admin_only"
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const insertCommitteeMemberSchema = createInsertSchema(committeeMembers).omit({ id: true, createdAt: true });
export type InsertCommitteeMember = z.infer<typeof insertCommitteeMemberSchema>;
export type CommitteeMember = typeof committeeMembers.$inferSelect;

// Policy Link Manager — external safeguarding/FA/Northumberland FA policy
// links, admin-editable so they can be kept current without a redeploy.
// No specific policy URLs are seeded — that text has to come from the
// club's Welfare Officer, not be guessed.
export const policyLinks = sqliteTable("policy_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});
export const insertPolicyLinkSchema = createInsertSchema(policyLinks).omit({ id: true, createdAt: true });
export type InsertPolicyLink = z.infer<typeof insertPolicyLinkSchema>;
export type PolicyLink = typeof policyLinks.$inferSelect;

// Waiting list — "Join the Wolfpack" registrations of interest.
export const waitingListEntries = sqliteTable("waiting_list_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  parentName: text("parent_name").notNull(),
  parentEmail: text("parent_email").notNull(),
  parentPhone: text("parent_phone").notNull().default(""),
  playerName: text("player_name").notNull(),
  school: text("school").notNull().default(""),
  schoolYear: text("school_year").notNull().default(""),
  position: text("position").notNull().default(""),
  secondaryPosition: text("secondary_position").notNull().default(""),
  footballLevel: text("football_level").notNull().default(""),
  saturdayLeague: text("saturday_league").notNull().default(""),
  division: text("division").notNull().default(""),
  ageGroup: text("age_group").notNull().default(""),
  status: text("status").notNull().default("new"), // new|waiting|contacted|trial_offered|trial_arranged|place_offered|joined|declined|archived
  notes: text("notes").notNull().default(""), // admin-only
  createdAt: integer("created_at").notNull(),
});
export const insertWaitingListEntrySchema = createInsertSchema(waitingListEntries).omit({ id: true, createdAt: true, status: true, notes: true });
export type InsertWaitingListEntry = z.infer<typeof insertWaitingListEntrySchema>;
export type WaitingListEntry = typeof waitingListEntries.$inferSelect;

// Complaints.
export const complaints = sqliteTable("complaints", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  reason: text("reason").notNull(),
  dateOccurred: text("date_occurred").notNull().default(""),
  desiredResolution: text("desired_resolution").notNull().default(""),
  attachmentUrl: text("attachment_url").notNull().default(""),
  status: text("status").notNull().default("received"), // received|under_review|response_required|responded|resolved|closed
  targetResponseAt: integer("target_response_at").notNull(), // submission + 10 working days
  adminNotes: text("admin_notes").notNull().default(""),
  createdAt: integer("created_at").notNull(),
});
export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true, createdAt: true, reference: true, status: true, targetResponseAt: true, adminNotes: true,
});
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;
