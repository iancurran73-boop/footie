// Shared logic for settling a competition once it's past its close time —
// called both by the auto-close scheduler and by the admin "Run draw now"
// button, so there's exactly one code path that decides a winner.
import { storage } from "./storage";
import { drawWinningNumber } from "./raffleDraw";
import { sendRaffleWinnerEmail, sendAuctionWinnerEmail } from "./email";
import type { Competition, Entry } from "@shared/schema";

// Issues the next `quantity` sequential ticket numbers for a raffle and
// bumps ticketsSold — the one place ticket numbers are ever allocated, used
// by both the payment-confirmed public purchase flow and the admin's
// manual/free-entry route, so the sequence can never collide or skip.
export async function issueTickets(
  comp: Competition,
  quantity: number,
  opts: { entryMethod: "paid" | "free_post"; buyerName: string; buyerEmail?: string; buyerPhone?: string; purchaseRef?: string; paymentRef?: string },
): Promise<Entry[]> {
  const startNumber = comp.ticketsSold + 1;
  const rows = Array.from({ length: quantity }, (_, i) => ({
    competitionId: comp.id,
    ticketNumber: startNumber + i,
    entryMethod: opts.entryMethod,
    buyerName: opts.buyerName,
    buyerEmail: opts.buyerEmail ?? "",
    buyerPhone: opts.buyerPhone ?? "",
    purchaseRef: opts.purchaseRef ?? "",
    paymentRef: opts.paymentRef ?? "",
  }));
  const created = await storage.createEntries(rows);
  await storage.updateCompetition(comp.id, { ticketsSold: comp.ticketsSold + quantity });
  return created;
}

export async function resolveCompetition(id: number): Promise<Competition | undefined> {
  const comp = await storage.getCompetition(id);
  if (!comp) return undefined;
  if (comp.status === "drawn" || comp.status === "closed") return comp; // already settled, no-op

  if (comp.type === "raffle") {
    if (comp.ticketsSold < 1) {
      // Nothing sold — nothing to draw, just close it out.
      return storage.updateCompetition(id, { status: "closed" });
    }
    const { winningNumber, seed } = drawWinningNumber(comp.ticketsSold);
    const winningEntry = await storage.getEntryByTicketNumber(id, winningNumber);
    const updated = await storage.updateCompetition(id, {
      status: "drawn",
      drawnNumber: winningNumber,
      drawnAt: Date.now(),
      drawSeed: seed,
      winnerEntryId: winningEntry?.id,
    });
    if (winningEntry?.buyerEmail) {
      sendRaffleWinnerEmail({
        winnerEmail: winningEntry.buyerEmail,
        winnerName: winningEntry.buyerName,
        competitionTitle: comp.title,
        prizeDescription: comp.prizeDescription,
        ticketNumber: winningNumber,
      }).catch((e) => console.error("[competitions] winner email failed", e));
    }
    return updated;
  }

  // auction — highest bid at close wins, no draw involved
  const topBid = await storage.getHighestBid(id);
  const updated = await storage.updateCompetition(id, {
    status: "closed",
    winnerBidId: topBid?.id,
  });
  if (topBid?.bidderEmail) {
    sendAuctionWinnerEmail({
      winnerEmail: topBid.bidderEmail,
      winnerName: topBid.bidderName,
      competitionTitle: comp.title,
      prizeDescription: comp.prizeDescription,
      amount: topBid.amount,
    }).catch((e) => console.error("[competitions] winner email failed", e));
  }
  return updated;
}
