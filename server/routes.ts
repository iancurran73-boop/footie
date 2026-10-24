import type { Express, Request, Response } from "express";
import { createServer } from "node:http";
import type { Server } from "node:http";
import {
  storage,
  getEmailConfig,
  setEmailConfig,
  getEmailTemplates,
  setEmailTemplates,
  type EmailConfig,
  type EmailTemplates,
} from "./storage";
import { sendTestEmail, sendTicketConfirmEmail, sendOutbidEmail, sendWaitingListConfirmEmail, sendComplaintConfirmEmail } from "./email";
import { resolveCompetition, issueTickets } from "./competitions";
import { readSocialConfig, postToSocial } from "./social";
import { computeSeasonStats, isVotingOpen, votingWindow, tallyVotes } from "./stats";
import {
  insertSettingsSchema,
  insertGalleryItemSchema,
  insertReviewSchema,
  insertTeamSchema,
  insertPlayerSchema,
  insertFixtureSchema,
  insertCompetitionSchema,
  insertSponsorSchema,
  insertFundraiserSchema,
  insertTrainingSessionSchema,
  insertTournamentSchema,
  insertTeamKitSchema,
  insertCommitteeMemberSchema,
  insertPolicyLinkSchema,
  insertWaitingListEntrySchema,
  insertComplaintSchema,
} from "@shared/schema";
import { PAGE_LAYOUT_IDS } from "@shared/page-layouts";
import { requireAdminAuth, issueSessionCookie, clearSessionCookie, checkLoginRateLimit, verifyPasscode } from "./adminAuth";
import { parseCsv } from "./csv";
import { z } from "zod";
import tenantConfig from "../tenant.config";

const numOrZero = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// 10 working days (Mon-Fri) from now, for the complaints target response date.
function addWorkingDays(from: number, days: number): number {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return d.getTime();
}

function generateReference(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ========= ADMIN AUTH =========
  // Registered before the blanket gate below so login/logout stay reachable
  // without a session. Everything else under /api/admin requires one.

  app.post("/api/admin/login", (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkLoginRateLimit(ip)) {
      return res.status(429).json({ error: "Too many attempts. Try again later." });
    }
    const passcode = String(req.body?.passcode || "");
    if (!verifyPasscode(passcode)) {
      return res.status(401).json({ error: "Incorrect passcode" });
    }
    issueSessionCookie(res);
    res.json({ ok: true });
  });

  app.post("/api/admin/logout", (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.use("/api/admin", requireAdminAuth);

  app.get("/api/admin/session", (_req, res) => {
    res.json({ ok: true });
  });

  // ========= SETTINGS =========

  app.get("/api/admin/settings", async (_req, res) => {
    res.json(await storage.getSettings());
  });
  app.patch("/api/admin/settings", async (req, res) => {
    const parse = insertSettingsSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.updateSettings(parse.data));
  });

  // ========= TEAMS =========

  app.get("/api/public/teams", async (_req, res) => {
    res.json(await storage.listTeams());
  });
  app.get("/api/admin/teams", async (_req, res) => {
    res.json(await storage.listTeams());
  });
  app.post("/api/admin/teams", async (req, res) => {
    const parse = insertTeamSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createTeam(parse.data));
  });
  app.patch("/api/admin/teams/:id", async (req, res) => {
    const parse = insertTeamSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateTeam(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/teams/:id", async (req, res) => {
    res.json({ ok: await storage.deleteTeam(Number(req.params.id)) });
  });

  // ========= PLAYERS =========

  app.get("/api/public/players", async (req, res) => {
    const team = req.query.team as string | undefined;
    const all = await storage.listPlayers(team);
    res.json(all.filter((p) => p.active));
  });
  app.get("/api/admin/players", async (req, res) => {
    const team = req.query.team as string | undefined;
    res.json(await storage.listPlayers(team));
  });
  app.post("/api/admin/players", async (req, res) => {
    const parse = insertPlayerSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createPlayer(parse.data));
  });
  app.patch("/api/admin/players/:id", async (req, res) => {
    const parse = insertPlayerSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updatePlayer(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/players/:id", async (req, res) => {
    res.json({ ok: await storage.deletePlayer(Number(req.params.id)) });
  });

  // Season stats — top scorers, assists, clean sheets, POTM totals, Parents'
  // Player wins — all derived from fixtures' match-report fields, nowhere
  // stored as a counter. See server/stats.ts.
  app.get("/api/public/stats", async (req, res) => {
    const team = req.query.team as string | undefined;
    const statsMap = await computeSeasonStats(team);
    res.json(Array.from(statsMap.values()));
  });
  app.get("/api/admin/stats", async (req, res) => {
    const team = req.query.team as string | undefined;
    const statsMap = await computeSeasonStats(team);
    res.json(Array.from(statsMap.values()));
  });

  // ========= FIXTURES =========

  app.get("/api/public/fixtures", async (req, res) => {
    const team = req.query.team as string | undefined;
    res.json(await storage.listFixtures(team));
  });

  app.get("/api/admin/fixtures", async (req, res) => {
    const team = req.query.team as string | undefined;
    res.json(await storage.listFixtures(team));
  });
  app.post("/api/admin/fixtures", async (req, res) => {
    const parse = insertFixtureSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createFixture(parse.data));
  });
  app.patch("/api/admin/fixtures/:id", async (req, res) => {
    const parse = insertFixtureSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const before = await storage.getFixture(Number(req.params.id));
    const updated = await storage.updateFixture(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });

    // Auto-post a result announcement the first time a score is saved
    // (i.e. it was previously unset) — never re-posts on later edits.
    const scoreJustSet = before && before.homeScore == null && before.awayScore == null
      && updated.homeScore != null && updated.awayScore != null;
    if (scoreJustSet) {
      readSocialConfig().then((cfg) => {
        if (!cfg.autoPostOnResult) return;
        const homeLabel = updated.homeAway === "home" ? updated.team : updated.opponent;
        const awayLabel = updated.homeAway === "home" ? updated.opponent : updated.team;
        const homeScore = updated.homeAway === "home" ? updated.homeScore : updated.awayScore;
        const awayScore = updated.homeAway === "home" ? updated.awayScore : updated.homeScore;
        const message = `Full time: ${homeLabel} ${homeScore}-${awayScore} ${awayLabel}${updated.league ? ` (${updated.league})` : ""}`;
        postToSocial(message, undefined, "fixture_result").catch((e) => console.error("[social]", e));
      }).catch((e) => console.error("[social]", e));
    }

    res.json(updated);
  });
  app.delete("/api/admin/fixtures/:id", async (req, res) => {
    res.json({ ok: await storage.deleteFixture(Number(req.params.id)) });
  });

  // Bulk import/update fixtures from a CSV. The client sends the raw file
  // text (read in the browser) rather than a multipart upload — consistent
  // with how image uploads already flow through this app as base64 JSON.
  // Expected header row: team,opponent,date,kickoffTime,meetTime,homeAway,venue,address,pitch,pitchType,directionsUrl,league,kit,homeScore,awayScore,notes
  // Rows are upserted by (team, opponent, date), so re-uploading the same
  // fixture list later (e.g. with final scores filled in) updates in place.
  app.post("/api/admin/fixtures/import", async (req, res) => {
    const parse = z.object({ csv: z.string().min(1) }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    const rows = parseCsv(parse.data.csv);
    let imported = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.team || !row.opponent || !row.date) {
        errors.push(`Row ${i + 2}: team, opponent and date are required`);
        continue;
      }
      const data = {
        team: row.team,
        opponent: row.opponent,
        date: row.date,
        kickoffTime: row.kickofftime || "",
        meetTime: row.meettime || "",
        homeAway: row.homeaway === "away" ? "away" : "home",
        venue: row.venue || "",
        address: row.address || "",
        pitch: row.pitch || "",
        pitchType: row.pitchtype || "",
        directionsUrl: row.directionsurl || "",
        league: row.league || "",
        kit: ["home", "away", "alternative", "tbc"].includes(row.kit) ? row.kit : "home",
        homeScore: row.homescore ? numOrZero(row.homescore) : null,
        awayScore: row.awayscore ? numOrZero(row.awayscore) : null,
        notes: row.notes || "",
      };
      const check = insertFixtureSchema.safeParse(data);
      if (!check.success) { errors.push(`Row ${i + 2}: ${JSON.stringify(check.error.flatten().fieldErrors)}`); continue; }
      await storage.upsertFixture(check.data);
      imported++;
    }
    res.json({ ok: true, imported, errors });
  });

  // ========= LEAGUE TABLES =========

  app.get("/api/public/league-tables", async (req, res) => {
    res.json(await storage.listLeagueTables(req.query.league as string | undefined));
  });
  app.get("/api/admin/league-tables", async (req, res) => {
    res.json(await storage.listLeagueTables(req.query.league as string | undefined));
  });
  app.delete("/api/admin/league-tables/:id", async (req, res) => {
    res.json({ ok: await storage.deleteLeagueTableRow(Number(req.params.id)) });
  });

  // Bulk import/replace a league table from a CSV — rows upsert by
  // (league, team), so re-uploading the same league's table after a
  // round of fixtures updates everyone's position/points in place.
  // Expected header row: league,position,team,played,won,drawn,lost,goalsFor,goalsAgainst,points
  app.post("/api/admin/league-tables/import", async (req, res) => {
    const parse = z.object({ csv: z.string().min(1) }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    const rows = parseCsv(parse.data.csv);
    let imported = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.league || !row.team) {
        errors.push(`Row ${i + 2}: league and team are required`);
        continue;
      }
      const data = {
        league: row.league,
        team: row.team,
        position: numOrZero(row.position),
        played: numOrZero(row.played),
        won: numOrZero(row.won),
        drawn: numOrZero(row.drawn),
        lost: numOrZero(row.lost),
        goalsFor: numOrZero(row.goalsfor),
        goalsAgainst: numOrZero(row.goalsagainst),
        points: numOrZero(row.points),
      };
      await storage.upsertLeagueTableRow(data);
      imported++;
    }
    res.json({ ok: true, imported, errors });
  });

  // ========= PLAYER AVAILABILITY =========
  // Admin-recorded for now — parents reply by message/in person and the
  // admin sets each player's status. A parent self-service form needs real
  // per-parent accounts, which this build doesn't have yet.

  app.get("/api/admin/fixtures/:id/availability", async (req, res) => {
    res.json(await storage.listAvailability(Number(req.params.id)));
  });
  app.post("/api/admin/fixtures/:id/availability", async (req, res) => {
    const parse = z.object({ playerId: z.number().int(), status: z.enum(["available", "not_available", "awaiting", "injured", "other"]) }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.setAvailability(Number(req.params.id), parse.data.playerId, parse.data.status));
  });

  // ========= PARENTS' PLAYER VOTING =========
  // Open for 48 hours from kickoff (see server/stats.ts votingWindow).
  // Eligible players are whoever the admin recorded in the fixture's
  // lineup. Ballots are never shown individually, only the closed tally.

  app.get("/api/public/fixtures/:id/vote-status", async (req, res) => {
    const fixture = await storage.getFixture(Number(req.params.id));
    if (!fixture) return res.status(404).json({ error: "Not found" });
    const open = isVotingOpen(fixture);
    const { opensAt, closesAt } = votingWindow(fixture);
    const lineupIds: number[] = (() => { try { return JSON.parse(fixture.lineupPlayerIds || "[]"); } catch { return []; } })();
    if (open) {
      return res.json({ open: true, opensAt, closesAt, eligiblePlayerIds: lineupIds });
    }
    const closed = Date.now() >= closesAt && lineupIds.length > 0;
    if (!closed) return res.json({ open: false, closed: false, opensAt, closesAt });
    const result = await tallyVotes(fixture.id);
    res.json({ open: false, closed: true, opensAt, closesAt, result });
  });
  app.post("/api/public/fixtures/:id/vote", async (req, res) => {
    const fixture = await storage.getFixture(Number(req.params.id));
    if (!fixture) return res.status(404).json({ error: "Not found" });
    if (!isVotingOpen(fixture)) return res.status(400).json({ error: "Voting isn't open for this fixture right now" });

    const cfg = await storage.getSettings();
    const bodySchema = z.object({
      voterEmail: z.string().email(),
      playerIds: z.array(z.number().int()).min(1).max(cfg.parentVoteMaxSelections),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

    const lineupIds: number[] = (() => { try { return JSON.parse(fixture.lineupPlayerIds || "[]"); } catch { return []; } })();
    if (!parse.data.playerIds.every((id) => lineupIds.includes(id))) {
      return res.status(400).json({ error: "You can only vote for players who played in this match" });
    }
    const existing = await storage.getVoteByEmail(fixture.id, parse.data.voterEmail);
    if (existing) return res.status(409).json({ error: "You've already voted for this match" });

    await storage.createVote({ fixtureId: fixture.id, voterEmail: parse.data.voterEmail, playerIds: JSON.stringify(parse.data.playerIds) });
    res.json({ ok: true });
  });

  // ========= SPONSORS =========

  app.get("/api/public/sponsors", async (_req, res) => {
    res.json(await storage.listSponsors(true));
  });
  app.get("/api/admin/sponsors", async (_req, res) => {
    res.json(await storage.listSponsors(false));
  });
  app.post("/api/admin/sponsors", async (req, res) => {
    const parse = insertSponsorSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createSponsor(parse.data));
  });
  app.patch("/api/admin/sponsors/:id", async (req, res) => {
    const parse = insertSponsorSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateSponsor(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/sponsors/:id", async (req, res) => {
    res.json({ ok: await storage.deleteSponsor(Number(req.params.id)) });
  });

  // ========= FUNDRAISERS =========

  app.get("/api/public/fundraisers", async (_req, res) => {
    const all = await storage.listFundraisers();
    res.json(all.filter((f) => f.status !== "archived"));
  });
  app.get("/api/admin/fundraisers", async (_req, res) => {
    res.json(await storage.listFundraisers());
  });
  app.post("/api/admin/fundraisers", async (req, res) => {
    const parse = insertFundraiserSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createFundraiser(parse.data));
  });
  app.patch("/api/admin/fundraisers/:id", async (req, res) => {
    const parse = insertFundraiserSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateFundraiser(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/fundraisers/:id", async (req, res) => {
    res.json({ ok: await storage.deleteFundraiser(Number(req.params.id)) });
  });

  // ========= TRAINING =========

  app.get("/api/public/training", async (req, res) => {
    const team = req.query.team as string | undefined;
    // Cancelled sessions stay visible (marked via `status`) rather than
    // vanishing, so parents don't wonder whether training was ever planned.
    res.json(await storage.listTrainingSessions(team));
  });
  app.get("/api/admin/training", async (req, res) => {
    res.json(await storage.listTrainingSessions(req.query.team as string | undefined));
  });
  app.post("/api/admin/training", async (req, res) => {
    const parse = insertTrainingSessionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createTrainingSession(parse.data));
  });
  app.patch("/api/admin/training/:id", async (req, res) => {
    const parse = insertTrainingSessionSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateTrainingSession(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/training/:id", async (req, res) => {
    res.json({ ok: await storage.deleteTrainingSession(Number(req.params.id)) });
  });
  app.get("/api/admin/training/:id/availability", async (req, res) => {
    res.json(await storage.listTrainingAvailability(Number(req.params.id)));
  });
  app.post("/api/admin/training/:id/availability", async (req, res) => {
    const parse = z.object({ playerId: z.number().int(), status: z.enum(["available", "not_available", "awaiting", "injured", "other"]) }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.setTrainingAvailability(Number(req.params.id), parse.data.playerId, parse.data.status));
  });

  // ========= TOURNAMENTS =========

  app.get("/api/public/tournaments", async (_req, res) => {
    const all = await storage.listTournaments();
    res.json(all.filter((t) => t.status !== "archived"));
  });
  app.get("/api/admin/tournaments", async (_req, res) => {
    res.json(await storage.listTournaments());
  });
  app.post("/api/admin/tournaments", async (req, res) => {
    const parse = insertTournamentSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createTournament(parse.data));
  });
  app.patch("/api/admin/tournaments/:id", async (req, res) => {
    const parse = insertTournamentSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateTournament(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/tournaments/:id", async (req, res) => {
    res.json({ ok: await storage.deleteTournament(Number(req.params.id)) });
  });

  // ========= TEAM KITS =========

  app.get("/api/public/kits", async (req, res) => {
    res.json(await storage.listTeamKits(req.query.team as string | undefined));
  });
  app.get("/api/admin/kits", async (req, res) => {
    res.json(await storage.listTeamKits(req.query.team as string | undefined));
  });
  app.put("/api/admin/kits/:team/:kitType", async (req, res) => {
    const { team, kitType } = req.params;
    if (!["home", "away", "alternative"].includes(kitType)) return res.status(400).json({ error: "Invalid kit type" });
    const parse = insertTeamKitSchema.omit({ team: true, kitType: true }).partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.upsertTeamKit(decodeURIComponent(team), kitType, parse.data));
  });
  app.delete("/api/admin/kits/:id", async (req, res) => {
    res.json({ ok: await storage.deleteTeamKit(Number(req.params.id)) });
  });

  // ========= COMMITTEE =========

  app.get("/api/public/committee", async (_req, res) => {
    res.json(await storage.listCommitteeMembers(true));
  });
  app.get("/api/admin/committee", async (_req, res) => {
    res.json(await storage.listCommitteeMembers(false));
  });
  app.post("/api/admin/committee", async (req, res) => {
    const parse = insertCommitteeMemberSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createCommitteeMember(parse.data));
  });
  app.patch("/api/admin/committee/:id", async (req, res) => {
    const parse = insertCommitteeMemberSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateCommitteeMember(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/committee/:id", async (req, res) => {
    res.json({ ok: await storage.deleteCommitteeMember(Number(req.params.id)) });
  });

  // ========= SAFEGUARDING / POLICY LINKS =========

  app.get("/api/public/policy-links", async (_req, res) => {
    res.json(await storage.listPolicyLinks());
  });
  app.get("/api/admin/policy-links", async (_req, res) => {
    res.json(await storage.listPolicyLinks());
  });
  app.post("/api/admin/policy-links", async (req, res) => {
    const parse = insertPolicyLinkSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createPolicyLink(parse.data));
  });
  app.patch("/api/admin/policy-links/:id", async (req, res) => {
    const parse = insertPolicyLinkSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updatePolicyLink(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/policy-links/:id", async (req, res) => {
    res.json({ ok: await storage.deletePolicyLink(Number(req.params.id)) });
  });

  // ========= WAITING LIST =========

  app.post("/api/public/waiting-list", async (req, res) => {
    const parse = insertWaitingListEntrySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const entry = await storage.createWaitingListEntry(parse.data);
    sendWaitingListConfirmEmail({ parentEmail: entry.parentEmail }).catch((e) => console.error("[email]", e));
    res.json({ ok: true, id: entry.id });
  });
  app.get("/api/admin/waiting-list", async (_req, res) => {
    res.json(await storage.listWaitingList());
  });
  app.patch("/api/admin/waiting-list/:id", async (req, res) => {
    const parse = z.object({
      status: z.enum(["new", "waiting", "contacted", "trial_offered", "trial_arranged", "place_offered", "joined", "declined", "archived"]).optional(),
      notes: z.string().optional(),
    }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateWaitingListEntry(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ========= COMPLAINTS =========

  app.post("/api/public/complaints", async (req, res) => {
    const parse = insertComplaintSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const reference = generateReference("CMP");
    const targetResponseAt = addWorkingDays(Date.now(), 10);
    const complaint = await storage.createComplaint({ ...parse.data, reference, targetResponseAt });
    sendComplaintConfirmEmail({ email: complaint.email, reference }).catch((e) => console.error("[email]", e));
    res.json({ ok: true, reference });
  });
  app.get("/api/admin/complaints", async (_req, res) => {
    res.json(await storage.listComplaints());
  });
  app.patch("/api/admin/complaints/:id", async (req, res) => {
    const parse = z.object({
      status: z.enum(["received", "under_review", "response_required", "responded", "resolved", "closed"]).optional(),
      adminNotes: z.string().optional(),
    }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateComplaint(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ========= SOCIAL POSTING (admin) =========
  // Config lives in the content k/v table — see server/social.ts for the keys.
  // Facebook Page is the one wired-up provider; the posting interface there
  // is pluggable so another platform can be added without touching this file.

  const maskToken = (t: string) => {
    if (!t) return "";
    if (t.length <= 8) return "••••";
    return t.slice(0, 4) + "…" + t.slice(-4);
  };

  app.get("/api/admin/social-config", async (_req, res) => {
    const cfg = await readSocialConfig();
    res.json({
      fbEnabled: cfg.fbEnabled,
      fbPageId: cfg.fbPageId,
      fbPageTokenMasked: maskToken(cfg.fbPageToken),
      hasFbPageToken: !!cfg.fbPageToken,
      autoPostOnResult: cfg.autoPostOnResult,
    });
  });
  app.post("/api/admin/social-config", async (req, res) => {
    const schema = z.object({
      fbEnabled: z.boolean().optional(),
      fbPageId: z.string().optional(),
      fbPageToken: z.string().optional(),
      autoPostOnResult: z.boolean().optional(),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { fbEnabled, fbPageId, fbPageToken, autoPostOnResult } = parse.data;
    if (fbEnabled !== undefined) await storage.setContent("social_fb_enabled", String(fbEnabled));
    if (fbPageId !== undefined) await storage.setContent("social_fb_page_id", fbPageId);
    if (fbPageToken !== undefined && fbPageToken !== "") await storage.setContent("social_fb_page_token", fbPageToken);
    if (autoPostOnResult !== undefined) await storage.setContent("social_autopost_result", String(autoPostOnResult));
    const cfg = await readSocialConfig();
    res.json({
      ok: true, fbEnabled: cfg.fbEnabled, fbPageId: cfg.fbPageId,
      fbPageTokenMasked: maskToken(cfg.fbPageToken), hasFbPageToken: !!cfg.fbPageToken,
      autoPostOnResult: cfg.autoPostOnResult,
    });
  });
  app.post("/api/admin/social-config/test", async (_req, res) => {
    const cfg = await readSocialConfig();
    if (!cfg.fbPageId || !cfg.fbPageToken) return res.status(400).json({ ok: false, error: "Missing Facebook Page ID or access token" });
    const r = await fetch(`https://graph.facebook.com/v19.0/${cfg.fbPageId}?fields=name&access_token=${encodeURIComponent(cfg.fbPageToken)}`);
    const data = await r.json() as any;
    if (!r.ok) return res.status(400).json({ ok: false, error: data?.error?.message || `Facebook error (${r.status})` });
    res.json({ ok: true, pageName: data?.name });
  });

  app.get("/api/admin/social/posts", async (_req, res) => {
    res.json(await storage.listSocialPosts());
  });
  app.post("/api/admin/social/post", async (req, res) => {
    const parse = z.object({ message: z.string().min(1), imageUrl: z.string().optional() }).safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const results = await postToSocial(parse.data.message, parse.data.imageUrl, "manual");
    res.json({ results });
  });

  // ========= PAYMENTS CONFIG (admin) =========
  // Stored in content k/v table.
  //   payments_mode         : "mvp" | "sumup"  ("mvp" = no online payment; sell tickets in person, log via "Add entry")
  //   sumup_api_key         : SumUp API key (sup_sk_...)
  //   sumup_merchant_code   : Merchant code from SumUp Dashboard

  const readPaymentsConfig = async () => {
    const mode = (await storage.getContent("payments_mode"))?.value || "mvp";
    const apiKey = (await storage.getContent("sumup_api_key"))?.value || "";
    const merchantCode = (await storage.getContent("sumup_merchant_code"))?.value || "";
    return { mode, apiKey, merchantCode };
  };

  const maskKey = (k: string) => {
    if (!k) return "";
    if (k.length <= 8) return "••••";
    return k.slice(0, 6) + "…" + k.slice(-4);
  };

  app.get("/api/admin/payments-config", async (_req, res) => {
    const cfg = await readPaymentsConfig();
    res.json({ mode: cfg.mode, apiKeyMasked: maskKey(cfg.apiKey), hasApiKey: !!cfg.apiKey, merchantCode: cfg.merchantCode });
  });
  app.post("/api/admin/payments-config", async (req, res) => {
    const schema = z.object({
      mode: z.enum(["mvp", "sumup"]).optional(),
      apiKey: z.string().optional(),
      merchantCode: z.string().optional(),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { mode, apiKey, merchantCode } = parse.data;
    if (mode !== undefined) await storage.setContent("payments_mode", mode);
    if (apiKey !== undefined && apiKey !== "") await storage.setContent("sumup_api_key", apiKey);
    if (merchantCode !== undefined) await storage.setContent("sumup_merchant_code", merchantCode);
    const cfg = await readPaymentsConfig();
    res.json({ ok: true, mode: cfg.mode, apiKeyMasked: maskKey(cfg.apiKey), hasApiKey: !!cfg.apiKey, merchantCode: cfg.merchantCode });
  });
  app.post("/api/admin/payments-config/test", async (req, res) => {
    const cfg = await readPaymentsConfig();
    const apiKey = (req.body?.apiKey as string) || cfg.apiKey;
    if (!apiKey) return res.status(400).json({ ok: false, error: "Missing SumUp API key" });
    try {
      const r = await fetch("https://api.sumup.com/v0.1/me", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!r.ok) {
        const text = await r.text();
        return res.status(400).json({ ok: false, status: r.status, error: text.slice(0, 300) });
      }
      const me = await r.json() as any;
      res.json({
        ok: true,
        merchantProfile: {
          merchant_code: me?.merchant_profile?.merchant_code,
          company_name: me?.merchant_profile?.company_name,
          country: me?.merchant_profile?.country,
          default_currency: me?.merchant_profile?.default_currency,
        },
      });
    } catch (e: any) {
      res.status(500).json({ ok: false, error: String(e?.message || e) });
    }
  });
  app.get("/api/public/payments-mode", async (_req, res) => {
    const cfg = await readPaymentsConfig();
    res.json({ mode: cfg.mode });
  });

  // ========= COMPETITIONS (public) =========

  // Strip anything admin-only (draw seed, buyer-identifying bid details are
  // already excluded from Competition itself) before it goes out publicly.
  const publicCompetition = (c: Awaited<ReturnType<typeof storage.getCompetition>>) => {
    if (!c) return c;
    const { drawSeed, ...rest } = c;
    return rest;
  };

  app.get("/api/public/competitions", async (_req, res) => {
    const all = await storage.listCompetitions();
    res.json(all.filter((c) => c.status !== "draft").map(publicCompetition));
  });

  app.get("/api/public/competitions/:id", async (req, res) => {
    const c = await storage.getCompetition(Number(req.params.id));
    if (!c || c.status === "draft") return res.status(404).json({ error: "Not found" });
    if (c.type === "auction") {
      const top = await storage.getHighestBid(c.id);
      return res.json({ ...publicCompetition(c), currentPrice: top?.amount ?? c.startingBid, bidCount: (await storage.listBids(c.id)).length });
    }
    res.json(publicCompetition(c));
  });

  // Buy raffle tickets — creates a SumUp hosted checkout. Tickets are only
  // issued once payment is confirmed (see /purchases/:checkoutId below), so
  // an abandoned checkout never eats into the numbered pool.
  app.post("/api/public/competitions/:id/sumup-checkout", async (req, res) => {
    const id = Number(req.params.id);
    const comp = await storage.getCompetition(id);
    if (!comp || comp.type !== "raffle") return res.status(404).json({ error: "Not found" });
    if (comp.status !== "live") return res.status(400).json({ error: "This raffle isn't open for entries right now" });

    const bodySchema = z.object({
      quantity: z.number().int().min(1).max(100),
      buyerName: z.string().min(1),
      buyerEmail: z.string().email(),
      buyerPhone: z.string().optional().default(""),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const data = parse.data;

    if (comp.maxTickets > 0 && comp.ticketsSold + data.quantity > comp.maxTickets) {
      return res.status(409).json({ error: `Only ${comp.maxTickets - comp.ticketsSold} ticket(s) left` });
    }

    const cfg = await readPaymentsConfig();
    if (cfg.mode !== "sumup" || !cfg.apiKey || !cfg.merchantCode) {
      return res.status(503).json({ error: "Online payment isn't set up yet — see a committee member to buy in person." });
    }

    const origin = (req.headers.origin as string) || `https://${req.headers.host}`;
    const returnUrl = `${origin}/#/competitions/${id}/return`;
    const reference = `raffle-${id}-${Date.now()}`;
    const amount = Math.round(data.quantity * comp.ticketPrice * 100) / 100;

    try {
      const r = await fetch("https://api.sumup.com/v0.1/checkouts", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          checkout_reference: reference,
          amount,
          currency: "GBP",
          merchant_code: cfg.merchantCode,
          description: `${data.quantity} ticket(s) for ${comp.title}`,
          redirect_url: returnUrl,
          return_url: returnUrl,
          hosted_checkout: { enabled: true },
        }),
      });
      if (!r.ok) {
        const text = await r.text();
        return res.status(502).json({ error: "SumUp error", detail: text.slice(0, 500) });
      }
      const sumupData = await r.json() as any;
      const checkoutId = sumupData?.id;
      const hostedUrl = sumupData?.hosted_checkout_url;
      if (!checkoutId || !hostedUrl) return res.status(502).json({ error: "SumUp response missing fields", detail: sumupData });

      await storage.setContentValue(`pending_purchase_${checkoutId}`, JSON.stringify({
        competitionId: id, quantity: data.quantity, buyerName: data.buyerName, buyerEmail: data.buyerEmail, buyerPhone: data.buyerPhone,
      }));
      res.json({ checkoutId, hostedCheckoutUrl: hostedUrl, amount });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // Poll a checkout's status. Issues the actual ticket numbers the first
  // time SumUp reports PAID — idempotent, since the pending-purchase record
  // is deleted once issued, so a repeat poll just reports the result.
  app.get("/api/public/purchases/:checkoutId", async (req, res) => {
    const checkoutId = req.params.checkoutId;
    const pendingRaw = await storage.getContentValue(`pending_purchase_${checkoutId}`);

    if (!pendingRaw) {
      const existing = (await storage.listCompetitions())
        .flatMap(async (c) => storage.listEntries(c.id));
      // Entries are scoped per-competition in storage, but purchaseRef is
      // globally unique (derived from the checkout id) — scan across the
      // handful of live competitions rather than adding a cross-table index
      // for what's a low-volume admin/receipt lookup.
      for (const comp of await storage.listCompetitions()) {
        const rows = (await storage.listEntries(comp.id)).filter((e) => e.purchaseRef === checkoutId);
        if (rows.length > 0) return res.json({ status: "issued", ticketNumbers: rows.map((r) => r.ticketNumber), competitionId: comp.id });
      }
      return res.status(404).json({ error: "Not found" });
    }

    const pending = JSON.parse(pendingRaw) as { competitionId: number; quantity: number; buyerName: string; buyerEmail: string; buyerPhone: string };
    const cfg = await readPaymentsConfig();
    try {
      const r = await fetch(`https://api.sumup.com/v0.1/checkouts/${encodeURIComponent(checkoutId)}`, {
        headers: { Authorization: `Bearer ${cfg.apiKey}` },
      });
      if (!r.ok) return res.status(502).json({ error: "SumUp error", detail: (await r.text()).slice(0, 300) });
      const data = await r.json() as any;
      const sumupStatus = String(data?.status || "").toUpperCase();
      if (sumupStatus !== "PAID") return res.json({ status: "pending", sumupStatus });

      const comp = await storage.getCompetition(pending.competitionId);
      if (!comp) return res.status(404).json({ error: "Competition not found" });
      const paymentRef = data?.transactions?.[0]?.transaction_code || checkoutId;
      const issued = await issueTickets(comp, pending.quantity, {
        entryMethod: "paid",
        buyerName: pending.buyerName,
        buyerEmail: pending.buyerEmail,
        buyerPhone: pending.buyerPhone,
        purchaseRef: checkoutId,
        paymentRef,
      });
      await storage.deleteContent(`pending_purchase_${checkoutId}`);
      sendTicketConfirmEmail({
        buyerEmail: pending.buyerEmail, buyerName: pending.buyerName,
        competitionTitle: comp.title, ticketNumbers: issued.map((e) => e.ticketNumber),
      }).catch((e) => console.error("[email]", e));
      res.json({ status: "issued", ticketNumbers: issued.map((e) => e.ticketNumber), competitionId: comp.id });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // Place an auction bid.
  app.post("/api/public/competitions/:id/bid", async (req, res) => {
    const id = Number(req.params.id);
    const comp = await storage.getCompetition(id);
    if (!comp || comp.type !== "auction") return res.status(404).json({ error: "Not found" });
    if (comp.status !== "live") return res.status(400).json({ error: "This auction isn't open for bids right now" });

    const bodySchema = z.object({
      amount: z.number().positive(),
      bidderName: z.string().min(1),
      bidderEmail: z.string().email(),
      bidderPhone: z.string().optional().default(""),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const data = parse.data;

    const topBid = await storage.getHighestBid(id);
    const currentPrice = topBid?.amount ?? comp.startingBid;
    const minNextBid = topBid ? currentPrice + comp.bidIncrement : currentPrice;
    if (data.amount < minNextBid) {
      return res.status(409).json({ error: `Bid must be at least £${minNextBid.toFixed(2)}` });
    }

    const bid = await storage.createBid({ competitionId: id, amount: data.amount, bidderName: data.bidderName, bidderEmail: data.bidderEmail, bidderPhone: data.bidderPhone });
    if (topBid && topBid.bidderEmail && topBid.bidderEmail !== data.bidderEmail) {
      sendOutbidEmail({ bidderEmail: topBid.bidderEmail, bidderName: topBid.bidderName, competitionTitle: comp.title, amount: data.amount })
        .catch((e) => console.error("[email]", e));
    }
    res.json(bid);
  });

  // ========= COMPETITIONS (admin) =========

  app.get("/api/admin/competitions", async (_req, res) => {
    res.json(await storage.listCompetitions());
  });
  app.get("/api/admin/competitions/:id", async (req, res) => {
    const c = await storage.getCompetition(Number(req.params.id));
    if (!c) return res.status(404).json({ error: "Not found" });
    res.json(c);
  });
  app.post("/api/admin/competitions", async (req, res) => {
    const parse = insertCompetitionSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createCompetition(parse.data));
  });
  app.patch("/api/admin/competitions/:id", async (req, res) => {
    const parse = insertCompetitionSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateCompetition(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.post("/api/admin/competitions/:id/publish", async (req, res) => {
    const updated = await storage.updateCompetition(Number(req.params.id), { status: "live" });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  // Resolve now — runs the raffle draw, or settles the auction's highest
  // bidder — rather than waiting for the automatic close-time sweep.
  app.post("/api/admin/competitions/:id/draw", async (req, res) => {
    const resolved = await resolveCompetition(Number(req.params.id));
    if (!resolved) return res.status(404).json({ error: "Not found" });
    res.json(resolved);
  });
  app.post("/api/admin/competitions/:id/winner-paid", async (req, res) => {
    const updated = await storage.updateCompetition(Number(req.params.id), { winnerPaid: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/competitions/:id", async (req, res) => {
    const c = await storage.getCompetition(Number(req.params.id));
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status !== "draft") return res.status(400).json({ error: "Only a draft competition (nothing sold or bid yet) can be deleted" });
    res.json({ ok: await storage.deleteCompetition(c.id) });
  });

  app.get("/api/admin/competitions/:id/entries", async (req, res) => {
    res.json(await storage.listEntries(Number(req.params.id)));
  });
  // Manually log an entry — a cash ticket sale at the clubhouse, or a
  // genuine free-post entry. Both land in the same numbered pool as online
  // sales; entryMethod is purely a record-keeping label.
  app.post("/api/admin/competitions/:id/entries", async (req, res) => {
    const comp = await storage.getCompetition(Number(req.params.id));
    if (!comp || comp.type !== "raffle") return res.status(404).json({ error: "Not found" });
    const bodySchema = z.object({
      quantity: z.number().int().min(1).max(100).default(1),
      entryMethod: z.enum(["paid", "free_post"]).default("free_post"),
      buyerName: z.string().min(1),
      buyerEmail: z.string().optional().default(""),
      buyerPhone: z.string().optional().default(""),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const data = parse.data;
    if (comp.maxTickets > 0 && comp.ticketsSold + data.quantity > comp.maxTickets) {
      return res.status(409).json({ error: `Only ${comp.maxTickets - comp.ticketsSold} ticket(s) left` });
    }
    const issued = await issueTickets(comp, data.quantity, {
      entryMethod: data.entryMethod, buyerName: data.buyerName, buyerEmail: data.buyerEmail, buyerPhone: data.buyerPhone,
      purchaseRef: "", paymentRef: "",
    });
    if (data.buyerEmail) {
      sendTicketConfirmEmail({ buyerEmail: data.buyerEmail, buyerName: data.buyerName, competitionTitle: comp.title, ticketNumbers: issued.map((e) => e.ticketNumber) })
        .catch((e) => console.error("[email]", e));
    }
    res.json(issued);
  });

  app.get("/api/admin/competitions/:id/bids", async (req, res) => {
    res.json(await storage.listBids(Number(req.params.id)));
  });

  // ========= PUBLIC CONTENT / GALLERY / REVIEWS / PAGES =========

  app.get("/api/public/content", async (_req, res) => {
    res.json(await storage.listContent());
  });
  app.get("/api/public/gallery", async (_req, res) => {
    res.json(await storage.listGalleryItems(true));
  });
  app.get("/api/public/reviews", async (_req, res) => {
    res.json(await storage.listReviews(true));
  });
  app.get("/api/public/pages", async (_req, res) => {
    res.json(await storage.listPages(true));
  });
  app.get("/api/public/pages/:slug", async (req, res) => {
    const page = await storage.getPageBySlug(req.params.slug);
    if (!page) return res.status(404).json({ error: "Not found" });
    res.json(page);
  });

  // ========= ADMIN CONTENT / GALLERY / REVIEWS / PAGES =========

  app.get("/api/admin/content", async (_req, res) => {
    res.json(await storage.listContent());
  });
  app.put("/api/admin/content/:key", async (req, res) => {
    const value = req.body?.value;
    if (typeof value !== "string") return res.status(400).json({ error: "value (string) required" });
    res.json(await storage.setContent(req.params.key, value));
  });
  app.delete("/api/admin/content/:key", async (req, res) => {
    res.json({ ok: await storage.deleteContent(req.params.key) });
  });

  app.get("/api/admin/gallery", async (_req, res) => {
    res.json(await storage.listGalleryItems(false));
  });
  app.post("/api/admin/gallery", async (req, res) => {
    const parse = insertGalleryItemSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createGalleryItem(parse.data));
  });
  app.patch("/api/admin/gallery/:id", async (req, res) => {
    const parse = insertGalleryItemSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateGalleryItem(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/gallery/:id", async (req, res) => {
    res.json({ ok: await storage.deleteGalleryItem(Number(req.params.id)) });
  });

  app.get("/api/admin/reviews", async (_req, res) => {
    res.json(await storage.listReviews(false));
  });
  app.post("/api/admin/reviews", async (req, res) => {
    const parse = insertReviewSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.createReview(parse.data));
  });
  app.patch("/api/admin/reviews/:id", async (req, res) => {
    const parse = insertReviewSchema.partial().safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const updated = await storage.updateReview(Number(req.params.id), parse.data);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });
  app.delete("/api/admin/reviews/:id", async (req, res) => {
    res.json({ ok: await storage.deleteReview(Number(req.params.id)) });
  });

  app.get("/api/admin/pages", async (_req, res) => {
    res.json(await storage.listPages(false));
  });
  app.post("/api/admin/pages", async (req, res) => {
    const bodySchema = z.object({
      navLabel: z.string().trim().min(1).max(60),
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only"),
      layout: z.enum(PAGE_LAYOUT_IDS as [string, ...string[]]),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const existing = await storage.getPageBySlug(parse.data.slug);
    if (existing) return res.status(409).json({ error: "A page with that slug already exists" });
    const all = await storage.listPages(false);
    const nextSort = all.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;
    const page = await storage.createPage({
      navLabel: parse.data.navLabel, slug: parse.data.slug, path: `/p/${parse.data.slug}`,
      kind: "custom", layout: parse.data.layout, sortOrder: nextSort, visible: true,
    });
    res.json(page);
  });
  app.patch("/api/admin/pages/:id", async (req, res) => {
    const id = Number(req.params.id);
    const page = await storage.getPage(id);
    if (!page) return res.status(404).json({ error: "Not found" });
    const bodySchema = z.object({
      navLabel: z.string().trim().min(1).max(60).optional(),
      visible: z.boolean().optional(),
      sortOrder: z.number().int().optional(),
    });
    const parse = bodySchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    res.json(await storage.updatePage(id, parse.data));
  });
  app.delete("/api/admin/pages/:id", async (req, res) => {
    const page = await storage.getPage(Number(req.params.id));
    if (!page) return res.status(404).json({ error: "Not found" });
    if (page.kind === "core") return res.status(400).json({ error: "Core pages can't be deleted — hide them from the nav instead." });
    res.json({ ok: await storage.deletePage(page.id) });
  });

  // ========= ADMIN: BRANDING / BUSINESS =========
  // Stored in the content k/v table. Fallbacks come from tenant.config.ts.

  const tc = tenantConfig;
  const val = async (key: string, fallback: string) => (await storage.getContentValue(key)) ?? fallback;

  const readBusiness = async () => ({
    ownerName: await val("business.ownerName", tc.business.ownerName),
    brandName: await val("brand.name", tc.brand.name),
    brandShortName: await val("brand.shortName", tc.brand.shortName),
    tagline: await val("brand.tagline", tc.brand.tagline),
    instagram: await val("brand.instagram", tc.brand.instagram ?? ""),
    email: await val("business.email", tc.business.email),
    phone: await val("business.phone", tc.business.phoneDisplay || tc.business.phone),
  });

  const readBranding = async () => ({
    colors: {
      primary: await val("brand.color.primary", tc.brand.colors.primary),
      accent: await val("brand.color.accent", tc.brand.colors.accent),
      background: await val("brand.color.background", tc.brand.colors.background),
      foreground: await val("brand.color.foreground", tc.brand.colors.foreground),
    },
    fonts: {
      display: await val("brand.font.display", tc.brand.fonts.display),
      body: await val("brand.font.body", tc.brand.fonts.body),
    },
  });

  app.get("/api/admin/business-config", async (_req, res) => res.json(await readBusiness()));
  app.post("/api/admin/business-config", async (req, res) => {
    const schema = z.object({
      ownerName: z.string().optional(),
      brandName: z.string().optional(),
      brandShortName: z.string().optional(),
      tagline: z.string().optional(),
      instagram: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const d = parse.data;
    if (d.ownerName !== undefined) await storage.setContentValue("business.ownerName", d.ownerName);
    if (d.brandName !== undefined) await storage.setContentValue("brand.name", d.brandName);
    if (d.brandShortName !== undefined) await storage.setContentValue("brand.shortName", d.brandShortName);
    if (d.tagline !== undefined) await storage.setContentValue("brand.tagline", d.tagline);
    if (d.instagram !== undefined) await storage.setContentValue("brand.instagram", d.instagram.replace(/^@+/, "").trim());
    if (d.email !== undefined) await storage.setContentValue("business.email", d.email);
    if (d.phone !== undefined) await storage.setContentValue("business.phone", d.phone);
    res.json({ ok: true, ...(await readBusiness()) });
  });

  app.get("/api/admin/branding-config", async (_req, res) => res.json(await readBranding()));
  app.post("/api/admin/branding-config", async (req, res) => {
    const schema = z.object({
      colors: z.object({ primary: z.string().optional(), accent: z.string().optional(), background: z.string().optional(), foreground: z.string().optional() }).optional(),
      fonts: z.object({ display: z.string().optional(), body: z.string().optional() }).optional(),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const { colors, fonts } = parse.data;
    if (colors?.primary !== undefined) await storage.setContentValue("brand.color.primary", colors.primary);
    if (colors?.accent !== undefined) await storage.setContentValue("brand.color.accent", colors.accent);
    if (colors?.background !== undefined) await storage.setContentValue("brand.color.background", colors.background);
    if (colors?.foreground !== undefined) await storage.setContentValue("brand.color.foreground", colors.foreground);
    if (fonts?.display !== undefined) await storage.setContentValue("brand.font.display", fonts.display);
    if (fonts?.body !== undefined) await storage.setContentValue("brand.font.body", fonts.body);
    res.json({ ok: true, ...(await readBranding()) });
  });

  // Public merged brand config — fetched on every page load, keep fast & cached.
  app.get("/api/public/brand-config", async (_req, res) => {
    const [business, branding] = await Promise.all([readBusiness(), readBranding()]);
    res.set("Cache-Control", "no-store, max-age=0");
    res.json({ ...business, colors: branding.colors, fonts: branding.fonts });
  });

  // ========= ADMIN: EMAILS =========

  app.get("/api/admin/email-config", async (_req, res) => res.json(getEmailConfig()));
  app.post("/api/admin/email-config", async (req, res) => {
    const schema = z.object({
      enabled: z.boolean().optional(),
      fromEmail: z.string().optional(),
      fromName: z.string().optional(),
      bccOwner: z.boolean().optional(),
      ownerEmail: z.string().optional(),
    });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    const d = parse.data;
    const current = getEmailConfig();
    const next: EmailConfig = {
      enabled: d.enabled ?? current.enabled,
      fromEmail: d.fromEmail ?? current.fromEmail,
      fromName: d.fromName ?? current.fromName,
      bccOwner: d.bccOwner ?? current.bccOwner,
      ownerEmail: d.ownerEmail ?? current.ownerEmail,
    };
    setEmailConfig(next);
    res.json(next);
  });

  app.get("/api/admin/email-templates", async (_req, res) => res.json(getEmailTemplates()));
  app.post("/api/admin/email-templates", async (req, res) => {
    const tmpl = z.object({ subject: z.string(), body: z.string() });
    const schema = z.object({ ticketConfirm: tmpl, raffleWinner: tmpl, auctionWinner: tmpl, auctionOutbid: tmpl });
    const parse = schema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    setEmailTemplates(parse.data as EmailTemplates);
    res.json(getEmailTemplates());
  });

  app.post("/api/admin/email-test", async (req, res) => {
    const schema = z.object({ to: z.string().optional() });
    const parse = schema.safeParse(req.body ?? {});
    if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
    try {
      await sendTestEmail(parse.data.to && parse.data.to.length > 0 ? parse.data.to : undefined);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ error: String(e?.message || e) });
    }
  });

  // Checks Resend's own state directly (API key validity + domain
  // verification) instead of relying on interpreting an email-send error.
  app.get("/api/admin/email-diagnostics", async (_req, res) => {
    const apiKey = process.env.RESEND_API_KEY;
    const cfg = getEmailConfig();
    const fromDomain = cfg.fromEmail.includes("@") ? cfg.fromEmail.split("@")[1] : null;

    const result: {
      enabled: boolean; fromEmail: string; ownerEmail: string;
      apiKeySet: boolean; apiKeyValid: boolean | null;
      domains: { name: string; status: string }[]; fromDomainVerified: boolean | null;
      error: string | null;
    } = { enabled: cfg.enabled, fromEmail: cfg.fromEmail, ownerEmail: cfg.ownerEmail, apiKeySet: !!apiKey, apiKeyValid: null, domains: [], fromDomainVerified: null, error: null };

    if (!apiKey) {
      result.error = "RESEND_API_KEY is not set on the server (check Railway/host env vars).";
      return res.json(result);
    }
    if (!fromDomain) result.error = "From email in Admin > Emails is missing or not a valid address.";

    try {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (r.status === 401 || r.status === 403) {
        result.apiKeyValid = null;
        result.error = `Resend rejected listing domains with this key (${r.status}) — this is expected for a "Sending access"-restricted key and doesn't mean the key is invalid. Use "Send test email" below to confirm it actually works for sending.`;
        return res.json(result);
      }
      if (!r.ok) {
        result.error = `Resend error ${r.status}: ${(await r.text().catch(() => "")).slice(0, 300)}`;
        return res.json(result);
      }
      result.apiKeyValid = true;
      const data = await r.json() as { data?: { name: string; status: string }[] };
      result.domains = (data.data ?? []).map((d) => ({ name: d.name, status: d.status }));
      if (fromDomain) {
        const match = result.domains.find((d) => d.name === fromDomain);
        result.fromDomainVerified = match?.status === "verified";
        if (!match) result.error = `The domain "${fromDomain}" (from your From email) hasn't been added to this Resend account at all.`;
        else if (match.status !== "verified") result.error = `The domain "${fromDomain}" is added to Resend but its status is "${match.status}", not "verified". Check the DNS records Resend asked for.`;
      }
      res.json(result);
    } catch (e: any) {
      result.error = `Could not reach Resend: ${String(e?.message || e)}`;
      res.json(result);
    }
  });

  return httpServer;
}
