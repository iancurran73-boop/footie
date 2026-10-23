/**
 * server/competitionScheduler.ts
 * ─────────────────────────────────
 * Polls for "live" raffles/auctions whose close time has passed and settles
 * them automatically — runs the raffle draw, or records the auction's
 * highest bidder — rather than relying on someone to click "Run draw now"
 * at the right moment.
 *
 * Single long-running Node process, so an in-process interval is enough;
 * no separate cron infrastructure needed.
 */
import { storage } from "./storage";
import { resolveCompetition } from "./competitions";

const POLL_MS = 5 * 60 * 1000; // 5 minutes — a competition should close close to on time

export async function runCompetitionCloseSweep(): Promise<void> {
  const competitions = await storage.listCompetitions();
  const now = Date.now();
  const due = competitions.filter((c) => c.status === "live" && c.closesAt <= now);
  for (const c of due) {
    try {
      await resolveCompetition(c.id);
    } catch (e) {
      console.error(`[competitions] failed to auto-close competition ${c.id}`, e);
    }
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startCompetitionScheduler(): void {
  if (timer) return; // idempotent — don't stack intervals across hot reloads
  const tick = () => { runCompetitionCloseSweep().catch((e) => console.error("[competitions] sweep failed", e)); };
  tick();
  timer = setInterval(tick, POLL_MS);
  console.log("[competitions] scheduler started, polling every 5 minutes");
}
