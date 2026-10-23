/**
 * server/stats.ts
 * ──────────────────
 * Season stats and Parents' Player results — both computed from fixtures'
 * match-report fields (and, for Parents' Player, the votes table) at read
 * time. Nothing is stored as a mutable per-player counter: admin enters a
 * match report once, and every leaderboard/profile total is derived from
 * it here. Editing a past match report is therefore always safe — nothing
 * to double-count or forget to decrement.
 */

import { storage } from "./storage";
import type { Fixture } from "@shared/schema";
import type { PlayerSeasonStats } from "@shared/player-stats";

export type { PlayerSeasonStats };

function parseIds(json: string): number[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v.map(Number).filter((n) => Number.isFinite(n)) : [];
  } catch {
    return [];
  }
}

function parseCounts(json: string): { playerId: number; count: number }[] {
  try {
    const v = JSON.parse(json || "[]");
    if (!Array.isArray(v)) return [];
    return v
      .map((r: any) => ({ playerId: Number(r.playerId), count: Number(r.count) || 1 }))
      .filter((r) => Number.isFinite(r.playerId));
  } catch {
    return [];
  }
}

// Parents' Player voting opens at kickoff and runs for 48 hours. We key the
// window off date+kickoffTime rather than "when the result was entered" so
// it matches the spec literally, even if the admin fills in the match
// report a few days later.
export function votingWindow(f: Fixture): { opensAt: number; closesAt: number } {
  const kickoff = new Date(`${f.date}T${f.kickoffTime || "12:00"}:00`).getTime();
  const opensAt = Number.isFinite(kickoff) ? kickoff : new Date(f.date).getTime();
  return { opensAt, closesAt: opensAt + 48 * 60 * 60 * 1000 };
}

export function isVotingOpen(f: Fixture, now = Date.now()): boolean {
  const { opensAt, closesAt } = votingWindow(f);
  return now >= opensAt && now < closesAt && parseIds(f.lineupPlayerIds).length > 0;
}

// Tallies votes for one fixture. Only meaningful to show publicly once the
// window has closed — callers decide whether to reveal it.
export async function tallyVotes(fixtureId: number): Promise<{ winners: number[]; counts: Record<number, number>; totalBallots: number }> {
  const votes = await storage.listVotes(fixtureId);
  const counts: Record<number, number> = {};
  for (const v of votes) {
    for (const id of parseIds(v.playerIds)) counts[id] = (counts[id] || 0) + 1;
  }
  const max = Math.max(0, ...Object.values(counts));
  const winners = max > 0 ? Object.entries(counts).filter(([, c]) => c === max).map(([id]) => Number(id)) : [];
  return { winners, counts, totalBallots: votes.length };
}

export async function computeSeasonStats(team?: string): Promise<Map<number, PlayerSeasonStats>> {
  const fixtures = await storage.listFixtures(team);
  const map = new Map<number, PlayerSeasonStats>();
  const get = (id: number): PlayerSeasonStats => {
    let s = map.get(id);
    if (!s) {
      s = { playerId: id, goals: 0, assists: 0, cleanSheets: 0, lastDitchTackles: 0, managerPotm: 0, coach1Potm: 0, coach2Potm: 0, opponentPotm: 0, parentsPlayerWins: 0 };
      map.set(id, s);
    }
    return s;
  };

  for (const f of fixtures) {
    for (const { playerId, count } of parseCounts(f.scorers)) get(playerId).goals += count;
    for (const { playerId, count } of parseCounts(f.assists)) get(playerId).assists += count;
    for (const id of parseIds(f.cleanSheetPlayerIds)) get(id).cleanSheets += 1;
    for (const id of parseIds(f.lastDitchTacklePlayerIds)) get(id).lastDitchTackles += 1;
    if (f.managerPotmPlayerId) get(f.managerPotmPlayerId).managerPotm += 1;
    if (f.coach1PotmPlayerId) get(f.coach1PotmPlayerId).coach1Potm += 1;
    if (f.coach2PotmPlayerId) get(f.coach2PotmPlayerId).coach2Potm += 1;
    if (f.opponentPotmPlayerId) get(f.opponentPotmPlayerId).opponentPotm += 1;

    if (!isVotingOpen(f) && parseIds(f.lineupPlayerIds).length > 0) {
      const { winners, totalBallots } = await tallyVotes(f.id);
      if (totalBallots > 0) for (const id of winners) get(id).parentsPlayerWins += 1;
    }
  }

  return map;
}
