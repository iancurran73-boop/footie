// Shared logic for a football card — claiming a team square, and running the
// draw once every square is taken. Mirrors competitions.ts's raffle draw:
// same provably-fair seed/number approach (raffleDraw.ts), just interpreting
// the drawn number as a slot position (1..slot count) instead of a ticket
// number.
import { storage } from "./storage";
import { drawWinningNumber } from "./raffleDraw";
import { sendFootballCardWinnerEmail } from "./email";
import type { FootballCard, FootballCardSlot } from "@shared/schema";

export async function claimSlot(
  slot: FootballCardSlot,
  buyer: { buyerName: string; buyerEmail: string; buyerPhone: string },
): Promise<FootballCardSlot | undefined> {
  return storage.claimFootballCardSlot(slot.id, buyer);
}

// Runs the draw — only once every slot on the card has been claimed. Picks
// one slot at random, in the same auditable way raffle numbers are drawn,
// and emails the winner if they gave an email address.
export async function resolveFootballCard(id: number): Promise<FootballCard | { error: string } | undefined> {
  const card = await storage.getFootballCard(id);
  if (!card) return undefined;
  if (card.status === "drawn") return card; // already settled, no-op

  const slots = await storage.listFootballCardSlots(id);
  const claimed = slots.filter((s) => s.claimedAt != null);
  if (slots.length === 0 || claimed.length < slots.length) {
    return { error: `Only ${claimed.length} of ${slots.length} teams are taken — every team must be claimed before the draw.` };
  }

  const { winningNumber, seed } = drawWinningNumber(slots.length);
  const winningSlot = slots[winningNumber - 1];
  const updated = await storage.updateFootballCard(id, {
    status: "drawn",
    drawnTeam: winningSlot.team,
    drawnAt: Date.now(),
    drawSeed: seed,
    winnerSlotId: winningSlot.id,
  });
  if (winningSlot.buyerEmail) {
    sendFootballCardWinnerEmail({
      winnerEmail: winningSlot.buyerEmail,
      winnerName: winningSlot.buyerName,
      cardTitle: card.title,
      team: winningSlot.team,
      prizeAmount: card.prizeAmount,
    }).catch((e) => console.error("[footballCards] winner email failed", e));
  }
  return updated;
}
