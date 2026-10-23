import {
  settings,
  content,
  galleryItems,
  reviews,
  pages,
  teams,
  fixtures,
  competitions,
  entries,
  bids,
  leagueTables,
  socialPosts,
  players,
  playerAvailability,
  playerVotes,
  sponsors,
  fundraisers,
} from "@shared/schema";
import type {
  Settings, InsertSettings,
  ContentRow,
  GalleryItem, InsertGalleryItem,
  Review, InsertReview,
  Page, InsertPage,
  Team, InsertTeam,
  Fixture, InsertFixture,
  Competition, InsertCompetition,
  Entry, InsertEntry,
  Bid, InsertBid,
  LeagueTableRow, InsertLeagueTableRow,
  SocialPost, InsertSocialPost,
  Player, InsertPlayer,
  PlayerAvailability, InsertPlayerAvailability,
  PlayerVote, InsertPlayerVote,
  Sponsor, InsertSponsor,
  Fundraiser, InsertFundraiser,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, asc, desc } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

// Database path: use DATABASE_PATH env var if set (e.g. Railway volume mount),
// otherwise fall back to ./data.db for local dev.
const dbPath = process.env.DATABASE_PATH || "data.db";
const dbDir = path.dirname(dbPath);
if (dbDir && dbDir !== "." && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
console.log(`[storage] Using SQLite database at: ${dbPath}`);
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// --- migrations / setup ---
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_name TEXT NOT NULL DEFAULT 'Junior FC',
    notify_email TEXT NOT NULL DEFAULT '',
    push_enabled INTEGER NOT NULL DEFAULT 0,
    parent_vote_max_selections INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS gallery_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    caption TEXT DEFAULT '',
    category TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_name TEXT NOT NULL,
    rating INTEGER NOT NULL DEFAULT 5,
    body TEXT NOT NULL,
    published_at TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    nav_label TEXT NOT NULL,
    path TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'custom',
    layout TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age_group TEXT NOT NULL DEFAULT '',
    coach_name TEXT NOT NULL DEFAULT '',
    coach_email TEXT NOT NULL DEFAULT '',
    coach_phone TEXT NOT NULL DEFAULT '',
    training_info TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fixtures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team TEXT NOT NULL,
    opponent TEXT NOT NULL,
    date TEXT NOT NULL,
    kickoff_time TEXT NOT NULL DEFAULT '',
    meet_time TEXT NOT NULL DEFAULT '',
    home_away TEXT NOT NULL DEFAULT 'home',
    venue TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    pitch TEXT NOT NULL DEFAULT '',
    pitch_type TEXT NOT NULL DEFAULT '',
    directions_url TEXT NOT NULL DEFAULT '',
    league TEXT NOT NULL DEFAULT '',
    kit TEXT NOT NULL DEFAULT 'home',
    confirmation_status TEXT NOT NULL DEFAULT 'awaiting',
    home_score INTEGER,
    away_score INTEGER,
    notes TEXT NOT NULL DEFAULT '',
    match_summary TEXT NOT NULL DEFAULT '',
    lineup_player_ids TEXT NOT NULL DEFAULT '[]',
    scorers TEXT NOT NULL DEFAULT '[]',
    assists TEXT NOT NULL DEFAULT '[]',
    clean_sheet_player_ids TEXT NOT NULL DEFAULT '[]',
    last_ditch_tackle_player_ids TEXT NOT NULL DEFAULT '[]',
    manager_potm_player_id INTEGER,
    coach1_potm_player_id INTEGER,
    coach2_potm_player_id INTEGER,
    opponent_potm_player_id INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS competitions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    prize_description TEXT NOT NULL DEFAULT '',
    ticket_price REAL NOT NULL DEFAULT 0,
    max_tickets INTEGER NOT NULL DEFAULT 0,
    tickets_sold INTEGER NOT NULL DEFAULT 0,
    starting_bid REAL NOT NULL DEFAULT 0,
    bid_increment REAL NOT NULL DEFAULT 1,
    opens_at INTEGER NOT NULL,
    closes_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    drawn_number INTEGER,
    drawn_at INTEGER,
    draw_seed TEXT NOT NULL DEFAULT '',
    winner_entry_id INTEGER,
    winner_bid_id INTEGER,
    winner_paid INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER NOT NULL,
    ticket_number INTEGER NOT NULL,
    entry_method TEXT NOT NULL DEFAULT 'paid',
    buyer_name TEXT NOT NULL,
    buyer_email TEXT NOT NULL DEFAULT '',
    buyer_phone TEXT NOT NULL DEFAULT '',
    purchase_ref TEXT NOT NULL DEFAULT '',
    payment_ref TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bids (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    competition_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    bidder_name TEXT NOT NULL,
    bidder_email TEXT NOT NULL DEFAULT '',
    bidder_phone TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS league_tables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    league TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    team TEXT NOT NULL,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS social_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider TEXT NOT NULL,
    message TEXT NOT NULL,
    image_url TEXT NOT NULL DEFAULT '',
    trigger TEXT NOT NULL DEFAULT 'manual',
    status TEXT NOT NULL DEFAULT 'sent',
    external_post_id TEXT NOT NULL DEFAULT '',
    error TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team TEXT NOT NULL,
    display_name TEXT NOT NULL,
    squad_number INTEGER,
    primary_position TEXT NOT NULL DEFAULT '',
    secondary_positions TEXT NOT NULL DEFAULT '',
    short_profile TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS player_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fixture_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'awaiting',
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS player_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fixture_id INTEGER NOT NULL,
    voter_email TEXT NOT NULL,
    player_ids TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sponsors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_name TEXT NOT NULL,
    logo_url TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    website_url TEXT NOT NULL DEFAULT '',
    social_url TEXT NOT NULL DEFAULT '',
    sponsorship_type TEXT NOT NULL DEFAULT '',
    period_start TEXT NOT NULL DEFAULT '',
    period_end TEXT NOT NULL DEFAULT '',
    benefits TEXT NOT NULL DEFAULT '',
    thank_you_message TEXT NOT NULL DEFAULT '',
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS fundraisers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    photo_url TEXT NOT NULL DEFAULT '',
    start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT NOT NULL DEFAULT '',
    target_amount REAL NOT NULL DEFAULT 0,
    raised_amount REAL NOT NULL DEFAULT 0,
    donation_link TEXT NOT NULL DEFAULT '',
    updates_text TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    created_at INTEGER NOT NULL
  );
`);

// --- seed defaults if empty ---
const seedIfEmpty = () => {
  const settingsRow = db.select().from(settings).get();
  if (!settingsRow) {
    db.insert(settings).values({
      clubName: "Junior FC",
      notifyEmail: "",
      pushEnabled: false,
    }).run();
  }

  const pgs = db.select().from(pages).all();
  if (pgs.length === 0) {
    const now = Date.now();
    const coreSeed: InsertPage[] = [
      { slug: "home", navLabel: "Home", path: "/", kind: "core", layout: null, sortOrder: 0, visible: true },
      { slug: "teams", navLabel: "Teams", path: "/teams", kind: "core", layout: null, sortOrder: 1, visible: true },
      { slug: "players", navLabel: "Players", path: "/players", kind: "core", layout: null, sortOrder: 2, visible: true },
      { slug: "fixtures", navLabel: "Fixtures & Results", path: "/fixtures", kind: "core", layout: null, sortOrder: 3, visible: true },
      { slug: "stats", navLabel: "Stats", path: "/stats", kind: "core", layout: null, sortOrder: 4, visible: true },
      { slug: "fundraising", navLabel: "Fundraising", path: "/fundraising", kind: "core", layout: null, sortOrder: 5, visible: true },
      { slug: "competitions", navLabel: "Raffles & Auctions", path: "/competitions", kind: "core", layout: null, sortOrder: 6, visible: true },
      { slug: "sponsors", navLabel: "Sponsors", path: "/sponsors", kind: "core", layout: null, sortOrder: 7, visible: true },
      { slug: "gallery", navLabel: "Gallery", path: "/gallery", kind: "core", layout: null, sortOrder: 8, visible: true },
      { slug: "about", navLabel: "About", path: "/about", kind: "core", layout: null, sortOrder: 9, visible: true },
      { slug: "contact", navLabel: "Contact", path: "/contact", kind: "core", layout: null, sortOrder: 10, visible: true },
    ];
    for (const p of coreSeed) db.insert(pages).values({ ...p, createdAt: now }).run();
  }
};
seedIfEmpty();

export interface IStorage {
  // settings
  getSettings(): Promise<Settings>;
  updateSettings(s: Partial<InsertSettings>): Promise<Settings>;

  // content
  listContent(): Promise<ContentRow[]>;
  getContent(key: string): Promise<ContentRow | undefined>;
  setContent(key: string, value: string): Promise<ContentRow>;
  deleteContent(key: string): Promise<boolean>;
  getContentValue(key: string): Promise<string | undefined>;
  setContentValue(key: string, value: string): Promise<void>;

  // gallery
  listGalleryItems(activeOnly: boolean): Promise<GalleryItem[]>;
  createGalleryItem(data: InsertGalleryItem): Promise<GalleryItem>;
  updateGalleryItem(id: number, data: Partial<InsertGalleryItem>): Promise<GalleryItem | undefined>;
  deleteGalleryItem(id: number): Promise<boolean>;

  // reviews
  listReviews(activeOnly: boolean): Promise<Review[]>;
  createReview(data: InsertReview): Promise<Review>;
  updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<boolean>;

  // pages
  listPages(visibleOnly: boolean): Promise<Page[]>;
  getPage(id: number): Promise<Page | undefined>;
  getPageBySlug(slug: string): Promise<Page | undefined>;
  createPage(data: InsertPage): Promise<Page>;
  updatePage(id: number, data: Partial<InsertPage>): Promise<Page | undefined>;
  deletePage(id: number): Promise<boolean>;

  // teams
  listTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(data: InsertTeam): Promise<Team>;
  updateTeam(id: number, data: Partial<InsertTeam>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;

  // fixtures
  listFixtures(team?: string): Promise<Fixture[]>;
  getFixture(id: number): Promise<Fixture | undefined>;
  createFixture(data: InsertFixture): Promise<Fixture>;
  updateFixture(id: number, data: Partial<InsertFixture>): Promise<Fixture | undefined>;
  deleteFixture(id: number): Promise<boolean>;
  // Upserts by (team, opponent, date) — used by the CSV import so re-uploading
  // the same fixture list updates scores/details instead of duplicating rows.
  upsertFixture(data: InsertFixture): Promise<Fixture>;

  // league tables
  listLeagueTables(league?: string): Promise<LeagueTableRow[]>;
  deleteLeagueTableRow(id: number): Promise<boolean>;
  // Upserts by (league, team) — same reasoning as upsertFixture.
  upsertLeagueTableRow(data: InsertLeagueTableRow): Promise<LeagueTableRow>;

  // players
  listPlayers(team?: string): Promise<Player[]>;
  getPlayer(id: number): Promise<Player | undefined>;
  createPlayer(data: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, data: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;

  // player availability (per fixture)
  listAvailability(fixtureId: number): Promise<PlayerAvailability[]>;
  setAvailability(fixtureId: number, playerId: number, status: string): Promise<PlayerAvailability>;

  // parents' player votes
  listVotes(fixtureId: number): Promise<PlayerVote[]>;
  getVoteByEmail(fixtureId: number, voterEmail: string): Promise<PlayerVote | undefined>;
  createVote(data: InsertPlayerVote): Promise<PlayerVote>;

  // sponsors
  listSponsors(activeOnly: boolean): Promise<Sponsor[]>;
  getSponsor(id: number): Promise<Sponsor | undefined>;
  createSponsor(data: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: number, data: Partial<InsertSponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(id: number): Promise<boolean>;

  // fundraisers
  listFundraisers(): Promise<Fundraiser[]>;
  getFundraiser(id: number): Promise<Fundraiser | undefined>;
  createFundraiser(data: InsertFundraiser): Promise<Fundraiser>;
  updateFundraiser(id: number, data: Partial<InsertFundraiser>): Promise<Fundraiser | undefined>;
  deleteFundraiser(id: number): Promise<boolean>;

  // competitions
  listCompetitions(): Promise<Competition[]>;
  getCompetition(id: number): Promise<Competition | undefined>;
  createCompetition(data: InsertCompetition): Promise<Competition>;
  updateCompetition(id: number, data: Partial<Competition>): Promise<Competition | undefined>;
  deleteCompetition(id: number): Promise<boolean>;

  // raffle entries
  listEntries(competitionId: number): Promise<Entry[]>;
  createEntries(rows: Omit<Entry, "id" | "createdAt">[]): Promise<Entry[]>;
  getEntryByTicketNumber(competitionId: number, ticketNumber: number): Promise<Entry | undefined>;

  // auction bids
  listBids(competitionId: number): Promise<Bid[]>;
  getHighestBid(competitionId: number): Promise<Bid | undefined>;
  createBid(data: InsertBid): Promise<Bid>;
  getBid(id: number): Promise<Bid | undefined>;

  // social post history
  listSocialPosts(limit?: number): Promise<SocialPost[]>;
  createSocialPost(data: InsertSocialPost): Promise<SocialPost>;
}

export class DatabaseStorage implements IStorage {
  async getSettings() {
    const row = db.select().from(settings).get();
    return row!;
  }
  async updateSettings(s: Partial<InsertSettings>) {
    const cur = db.select().from(settings).get();
    if (!cur) {
      return db.insert(settings).values(s as InsertSettings).returning().get();
    }
    db.update(settings).set(s).where(eq(settings.id, cur.id)).run();
    return (await this.getSettings());
  }

  async listContent() {
    return db.select().from(content).all();
  }
  async getContent(key: string) {
    return db.select().from(content).where(eq(content.key, key)).get();
  }
  async setContent(key: string, value: string) {
    const now = Date.now();
    const existing = db.select().from(content).where(eq(content.key, key)).get();
    if (existing) {
      db.update(content).set({ value, updatedAt: now }).where(eq(content.key, key)).run();
    } else {
      db.insert(content).values({ key, value, updatedAt: now }).run();
    }
    return db.select().from(content).where(eq(content.key, key)).get()!;
  }
  async deleteContent(key: string) {
    const r = db.delete(content).where(eq(content.key, key)).run();
    return r.changes > 0;
  }
  async getContentValue(key: string) {
    return db.select().from(content).where(eq(content.key, key)).get()?.value;
  }
  async setContentValue(key: string, value: string) {
    await this.setContent(key, value);
  }

  async listGalleryItems(activeOnly: boolean) {
    const rows = activeOnly
      ? db.select().from(galleryItems).where(eq(galleryItems.active, true)).orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id)).all()
      : db.select().from(galleryItems).orderBy(asc(galleryItems.sortOrder), asc(galleryItems.id)).all();
    return rows;
  }
  async createGalleryItem(data: InsertGalleryItem) {
    return db.insert(galleryItems).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateGalleryItem(id: number, data: Partial<InsertGalleryItem>) {
    db.update(galleryItems).set(data).where(eq(galleryItems.id, id)).run();
    return db.select().from(galleryItems).where(eq(galleryItems.id, id)).get();
  }
  async deleteGalleryItem(id: number) {
    const r = db.delete(galleryItems).where(eq(galleryItems.id, id)).run();
    return r.changes > 0;
  }

  async listReviews(activeOnly: boolean) {
    const rows = activeOnly
      ? db.select().from(reviews).where(eq(reviews.active, true)).orderBy(asc(reviews.sortOrder)).all()
      : db.select().from(reviews).orderBy(asc(reviews.sortOrder)).all();
    return rows;
  }
  async createReview(data: InsertReview) {
    return db.insert(reviews).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateReview(id: number, data: Partial<InsertReview>) {
    db.update(reviews).set(data).where(eq(reviews.id, id)).run();
    return db.select().from(reviews).where(eq(reviews.id, id)).get();
  }
  async deleteReview(id: number) {
    const r = db.delete(reviews).where(eq(reviews.id, id)).run();
    return r.changes > 0;
  }

  async listPages(visibleOnly: boolean) {
    const rows = visibleOnly
      ? db.select().from(pages).where(eq(pages.visible, true)).orderBy(asc(pages.sortOrder)).all()
      : db.select().from(pages).orderBy(asc(pages.sortOrder)).all();
    return rows;
  }
  async getPage(id: number) {
    return db.select().from(pages).where(eq(pages.id, id)).get();
  }
  async getPageBySlug(slug: string) {
    return db.select().from(pages).where(eq(pages.slug, slug)).get();
  }
  async createPage(data: InsertPage) {
    return db.insert(pages).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updatePage(id: number, data: Partial<InsertPage>) {
    db.update(pages).set(data).where(eq(pages.id, id)).run();
    return db.select().from(pages).where(eq(pages.id, id)).get();
  }
  async deletePage(id: number) {
    const r = db.delete(pages).where(eq(pages.id, id)).run();
    return r.changes > 0;
  }

  async listTeams() {
    return db.select().from(teams).orderBy(asc(teams.sortOrder), asc(teams.id)).all();
  }
  async getTeam(id: number) {
    return db.select().from(teams).where(eq(teams.id, id)).get();
  }
  async createTeam(data: InsertTeam) {
    return db.insert(teams).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateTeam(id: number, data: Partial<InsertTeam>) {
    db.update(teams).set(data).where(eq(teams.id, id)).run();
    return db.select().from(teams).where(eq(teams.id, id)).get();
  }
  async deleteTeam(id: number) {
    const r = db.delete(teams).where(eq(teams.id, id)).run();
    return r.changes > 0;
  }

  async listFixtures(team?: string) {
    const rows = team
      ? db.select().from(fixtures).where(eq(fixtures.team, team)).orderBy(asc(fixtures.date)).all()
      : db.select().from(fixtures).orderBy(asc(fixtures.date)).all();
    return rows;
  }
  async getFixture(id: number) {
    return db.select().from(fixtures).where(eq(fixtures.id, id)).get();
  }
  async createFixture(data: InsertFixture) {
    return db.insert(fixtures).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateFixture(id: number, data: Partial<InsertFixture>) {
    db.update(fixtures).set(data).where(eq(fixtures.id, id)).run();
    return db.select().from(fixtures).where(eq(fixtures.id, id)).get();
  }
  async deleteFixture(id: number) {
    const r = db.delete(fixtures).where(eq(fixtures.id, id)).run();
    return r.changes > 0;
  }
  async upsertFixture(data: InsertFixture) {
    const existing = db.select().from(fixtures)
      .where(and(eq(fixtures.team, data.team), eq(fixtures.opponent, data.opponent), eq(fixtures.date, data.date)))
      .get();
    if (existing) {
      db.update(fixtures).set(data).where(eq(fixtures.id, existing.id)).run();
      return db.select().from(fixtures).where(eq(fixtures.id, existing.id)).get()!;
    }
    return db.insert(fixtures).values({ ...data, createdAt: Date.now() }).returning().get();
  }

  async listLeagueTables(league?: string) {
    const rows = league
      ? db.select().from(leagueTables).where(eq(leagueTables.league, league)).all()
      : db.select().from(leagueTables).all();
    return rows.sort((a, b) => a.league.localeCompare(b.league) || a.position - b.position);
  }
  async deleteLeagueTableRow(id: number) {
    const r = db.delete(leagueTables).where(eq(leagueTables.id, id)).run();
    return r.changes > 0;
  }
  async upsertLeagueTableRow(data: InsertLeagueTableRow) {
    const existing = db.select().from(leagueTables)
      .where(and(eq(leagueTables.league, data.league), eq(leagueTables.team, data.team)))
      .get();
    const now = Date.now();
    if (existing) {
      db.update(leagueTables).set({ ...data, updatedAt: now }).where(eq(leagueTables.id, existing.id)).run();
      return db.select().from(leagueTables).where(eq(leagueTables.id, existing.id)).get()!;
    }
    return db.insert(leagueTables).values({ ...data, updatedAt: now }).returning().get();
  }

  async listPlayers(team?: string) {
    const rows = team
      ? db.select().from(players).where(eq(players.team, team)).orderBy(asc(players.sortOrder), asc(players.id)).all()
      : db.select().from(players).orderBy(asc(players.sortOrder), asc(players.id)).all();
    return rows;
  }
  async getPlayer(id: number) {
    return db.select().from(players).where(eq(players.id, id)).get();
  }
  async createPlayer(data: InsertPlayer) {
    return db.insert(players).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updatePlayer(id: number, data: Partial<InsertPlayer>) {
    db.update(players).set(data).where(eq(players.id, id)).run();
    return db.select().from(players).where(eq(players.id, id)).get();
  }
  async deletePlayer(id: number) {
    const r = db.delete(players).where(eq(players.id, id)).run();
    return r.changes > 0;
  }

  async listAvailability(fixtureId: number) {
    return db.select().from(playerAvailability).where(eq(playerAvailability.fixtureId, fixtureId)).all();
  }
  async setAvailability(fixtureId: number, playerId: number, status: string) {
    const existing = db.select().from(playerAvailability)
      .where(and(eq(playerAvailability.fixtureId, fixtureId), eq(playerAvailability.playerId, playerId)))
      .get();
    const now = Date.now();
    if (existing) {
      db.update(playerAvailability).set({ status, updatedAt: now }).where(eq(playerAvailability.id, existing.id)).run();
      return db.select().from(playerAvailability).where(eq(playerAvailability.id, existing.id)).get()!;
    }
    return db.insert(playerAvailability).values({ fixtureId, playerId, status, updatedAt: now }).returning().get();
  }

  async listVotes(fixtureId: number) {
    return db.select().from(playerVotes).where(eq(playerVotes.fixtureId, fixtureId)).all();
  }
  async getVoteByEmail(fixtureId: number, voterEmail: string) {
    return db.select().from(playerVotes)
      .where(and(eq(playerVotes.fixtureId, fixtureId), eq(playerVotes.voterEmail, voterEmail)))
      .get();
  }
  async createVote(data: InsertPlayerVote) {
    return db.insert(playerVotes).values({ ...data, createdAt: Date.now() }).returning().get();
  }

  async listSponsors(activeOnly: boolean) {
    const rows = activeOnly
      ? db.select().from(sponsors).where(eq(sponsors.active, true)).orderBy(asc(sponsors.sortOrder), asc(sponsors.id)).all()
      : db.select().from(sponsors).orderBy(asc(sponsors.sortOrder), asc(sponsors.id)).all();
    return rows;
  }
  async getSponsor(id: number) {
    return db.select().from(sponsors).where(eq(sponsors.id, id)).get();
  }
  async createSponsor(data: InsertSponsor) {
    return db.insert(sponsors).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateSponsor(id: number, data: Partial<InsertSponsor>) {
    db.update(sponsors).set(data).where(eq(sponsors.id, id)).run();
    return db.select().from(sponsors).where(eq(sponsors.id, id)).get();
  }
  async deleteSponsor(id: number) {
    const r = db.delete(sponsors).where(eq(sponsors.id, id)).run();
    return r.changes > 0;
  }

  async listFundraisers() {
    return db.select().from(fundraisers).orderBy(desc(fundraisers.createdAt)).all();
  }
  async getFundraiser(id: number) {
    return db.select().from(fundraisers).where(eq(fundraisers.id, id)).get();
  }
  async createFundraiser(data: InsertFundraiser) {
    return db.insert(fundraisers).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateFundraiser(id: number, data: Partial<InsertFundraiser>) {
    db.update(fundraisers).set(data).where(eq(fundraisers.id, id)).run();
    return db.select().from(fundraisers).where(eq(fundraisers.id, id)).get();
  }
  async deleteFundraiser(id: number) {
    const r = db.delete(fundraisers).where(eq(fundraisers.id, id)).run();
    return r.changes > 0;
  }

  async listCompetitions() {
    return db.select().from(competitions).orderBy(desc(competitions.createdAt)).all();
  }
  async getCompetition(id: number) {
    return db.select().from(competitions).where(eq(competitions.id, id)).get();
  }
  async createCompetition(data: InsertCompetition) {
    return db.insert(competitions).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async updateCompetition(id: number, data: Partial<Competition>) {
    db.update(competitions).set(data).where(eq(competitions.id, id)).run();
    return db.select().from(competitions).where(eq(competitions.id, id)).get();
  }
  async deleteCompetition(id: number) {
    const r = db.delete(competitions).where(eq(competitions.id, id)).run();
    return r.changes > 0;
  }

  async listEntries(competitionId: number) {
    return db.select().from(entries).where(eq(entries.competitionId, competitionId)).orderBy(asc(entries.ticketNumber)).all();
  }
  async createEntries(rows: Omit<Entry, "id" | "createdAt">[]) {
    const now = Date.now();
    return rows.map((r) => db.insert(entries).values({ ...r, createdAt: now }).returning().get());
  }
  async getEntryByTicketNumber(competitionId: number, ticketNumber: number) {
    return db.select().from(entries)
      .where(eq(entries.competitionId, competitionId))
      .all()
      .find((e) => e.ticketNumber === ticketNumber);
  }

  async listBids(competitionId: number) {
    return db.select().from(bids).where(eq(bids.competitionId, competitionId)).orderBy(desc(bids.amount), desc(bids.createdAt)).all();
  }
  async getHighestBid(competitionId: number) {
    return this.listBids(competitionId).then((rows) => rows[0]);
  }
  async createBid(data: InsertBid) {
    return db.insert(bids).values({ ...data, createdAt: Date.now() }).returning().get();
  }
  async getBid(id: number) {
    return db.select().from(bids).where(eq(bids.id, id)).get();
  }

  async listSocialPosts(limit = 50) {
    return db.select().from(socialPosts).orderBy(desc(socialPosts.createdAt)).limit(limit).all();
  }
  async createSocialPost(data: InsertSocialPost) {
    return db.insert(socialPosts).values({ ...data, createdAt: Date.now() }).returning().get();
  }
}

export const storage = new DatabaseStorage();

// --- email config / templates (k/v JSON in the content table) ---

export type EmailConfig = {
  enabled: boolean;
  // Address on a domain verified with Resend, e.g. club@yourclub.org.uk.
  // The Resend API key itself lives in the RESEND_API_KEY env var, not here.
  fromEmail: string;
  fromName: string;
  bccOwner: boolean;
  ownerEmail: string;
};

export type EmailTemplate = { subject: string; body: string };
export type EmailTemplates = {
  ticketConfirm: EmailTemplate;
  raffleWinner: EmailTemplate;
  auctionWinner: EmailTemplate;
  auctionOutbid: EmailTemplate;
};

const EMAIL_CONFIG_KEY = "email_config";
const EMAIL_TEMPLATES_KEY = "email_templates";

const defaultEmailConfig: EmailConfig = {
  enabled: false,
  fromEmail: "",
  fromName: "Junior FC",
  bccOwner: false,
  ownerEmail: "",
};

const defaultEmailTemplates: EmailTemplates = {
  ticketConfirm: {
    subject: "Your raffle ticket{plural} for {competition}",
    body: `Hi {buyer},

Thanks for entering {competition}!

Your ticket number{plural}: {ticketNumbers}

The draw happens once entries close. Good luck!

{clubName}`,
  },
  raffleWinner: {
    subject: "You've won the {competition} raffle!",
    body: `Hi {buyer},

Great news — your ticket number {ticketNumber} was drawn as the winner of {competition}!

Prize: {prize}

We'll be in touch about collecting it. Congratulations!

{clubName}`,
  },
  auctionWinner: {
    subject: "You won the {competition} auction!",
    body: `Hi {bidder},

Congratulations — your bid of £{amount} won {competition}!

Prize: {prize}

We'll send over payment details shortly.

{clubName}`,
  },
  auctionOutbid: {
    subject: "You've been outbid on {competition}",
    body: `Hi {bidder},

Someone's placed a higher bid on {competition} since your last one. The current price is now £{amount}.

Head back to the site if you'd like to bid again.

{clubName}`,
  },
};

function readJSON<T>(key: string): T | undefined {
  const row = db.select().from(content).where(eq(content.key, key)).get();
  if (!row) return undefined;
  try { return JSON.parse(row.value) as T; } catch { return undefined; }
}

function writeJSON(key: string, value: unknown): void {
  const now = Date.now();
  const str = JSON.stringify(value);
  const existing = db.select().from(content).where(eq(content.key, key)).get();
  if (existing) {
    db.update(content).set({ value: str, updatedAt: now }).where(eq(content.key, key)).run();
  } else {
    db.insert(content).values({ key, value: str, updatedAt: now }).run();
  }
}

export function getEmailConfig(): EmailConfig {
  return { ...defaultEmailConfig, ...(readJSON<EmailConfig>(EMAIL_CONFIG_KEY) ?? {}) };
}

export function setEmailConfig(cfg: EmailConfig): EmailConfig {
  writeJSON(EMAIL_CONFIG_KEY, cfg);
  return cfg;
}

export function getEmailTemplates(): EmailTemplates {
  const stored = readJSON<Partial<EmailTemplates>>(EMAIL_TEMPLATES_KEY) ?? {};
  return {
    ticketConfirm: { ...defaultEmailTemplates.ticketConfirm, ...(stored.ticketConfirm ?? {}) },
    raffleWinner: { ...defaultEmailTemplates.raffleWinner, ...(stored.raffleWinner ?? {}) },
    auctionWinner: { ...defaultEmailTemplates.auctionWinner, ...(stored.auctionWinner ?? {}) },
    auctionOutbid: { ...defaultEmailTemplates.auctionOutbid, ...(stored.auctionOutbid ?? {}) },
  };
}

export function setEmailTemplates(t: EmailTemplates): EmailTemplates {
  writeJSON(EMAIL_TEMPLATES_KEY, t);
  return t;
}

export function getBusinessConfig(): { name?: string; ownerName?: string; email?: string; phone?: string } {
  return {
    name: db.select().from(content).where(eq(content.key, "brand.name")).get()?.value,
    ownerName: db.select().from(content).where(eq(content.key, "business.ownerName")).get()?.value,
    email: db.select().from(content).where(eq(content.key, "business.email")).get()?.value,
    phone: db.select().from(content).where(eq(content.key, "business.phone")).get()?.value,
  };
}
