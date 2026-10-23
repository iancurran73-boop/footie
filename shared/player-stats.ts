/**
 * shared/player-stats.ts
 * ─────────────────────────
 * Shape of a computed season-stats row (server/stats.ts computes these;
 * client pages just display them). Split out from server/stats.ts so the
 * client can import the type without pulling in server/storage.ts.
 */

export type PlayerSeasonStats = {
  playerId: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  lastDitchTackles: number;
  managerPotm: number;
  coach1Potm: number;
  coach2Potm: number;
  opponentPotm: number;
  parentsPlayerWins: number;
};
