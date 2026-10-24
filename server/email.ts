import { getEmailConfig, getEmailTemplates, getBusinessConfig } from "./storage";

// Resend's HTTP API, not raw SMTP. Railway (or the network it sits on)
// blocks outbound SMTP entirely — both port 587 (STARTTLS) and 465 (SSL)
// timed out identically in testing, which is the signature of a blanket
// port block rather than a config problem. An HTTPS API call on port 443
// sidesteps that completely, since that's the same kind of connection the
// app itself already needs to serve traffic.
const RESEND_API_URL = "https://api.resend.com/emails";

async function sendViaResend(opts: { from: string; to: string; bcc?: string; subject: string; text: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set on the server");
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      ...(opts.bcc ? { bcc: [opts.bcc] } : {}),
      subject: opts.subject,
      text: opts.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${body.slice(0, 300)}`);
  }
}

function render(tmpl: string, vars: Record<string, string | number | undefined>): string {
  return tmpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? "").toString());
}

function fromHeader(cfg: { fromName?: string; fromEmail: string }, clubName: string): string {
  return `${cfg.fromName || clubName} <${cfg.fromEmail}>`;
}

// Sent once a raffle purchase (or admin-entered free-post entry) goes through,
// confirming which ticket number(s) were issued.
export async function sendTicketConfirmEmail(opts: {
  buyerEmail: string;
  buyerName: string;
  competitionTitle: string;
  ticketNumbers: number[];
}): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.buyerEmail) return;
  const templates = getEmailTemplates();
  const clubName = getBusinessConfig()?.name ?? "Junior FC";
  const vars = {
    buyer: opts.buyerName,
    competition: opts.competitionTitle,
    plural: opts.ticketNumbers.length > 1 ? "s" : "",
    ticketNumbers: opts.ticketNumbers.join(", "),
    clubName,
  };
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.buyerEmail,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: render(templates.ticketConfirm.subject, vars),
      text: render(templates.ticketConfirm.body, vars),
    });
  } catch (e) { console.error("[email] ticket confirm failed", e); }
}

// Sent to the winning ticket holder once a raffle is drawn.
export async function sendRaffleWinnerEmail(opts: {
  winnerEmail: string;
  winnerName: string;
  competitionTitle: string;
  prizeDescription: string;
  ticketNumber: number;
}): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.winnerEmail) return;
  const templates = getEmailTemplates();
  const clubName = getBusinessConfig()?.name ?? "Junior FC";
  const vars = {
    buyer: opts.winnerName,
    competition: opts.competitionTitle,
    prize: opts.prizeDescription,
    ticketNumber: opts.ticketNumber,
    clubName,
  };
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.winnerEmail,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: render(templates.raffleWinner.subject, vars),
      text: render(templates.raffleWinner.body, vars),
    });
  } catch (e) { console.error("[email] raffle winner send failed", e); }
}

// Sent to the winning bidder once an auction closes.
export async function sendAuctionWinnerEmail(opts: {
  winnerEmail: string;
  winnerName: string;
  competitionTitle: string;
  prizeDescription: string;
  amount: number;
}): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.winnerEmail) return;
  const templates = getEmailTemplates();
  const clubName = getBusinessConfig()?.name ?? "Junior FC";
  const vars = {
    bidder: opts.winnerName,
    competition: opts.competitionTitle,
    prize: opts.prizeDescription,
    amount: opts.amount.toFixed(2),
    clubName,
  };
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.winnerEmail,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: render(templates.auctionWinner.subject, vars),
      text: render(templates.auctionWinner.body, vars),
    });
  } catch (e) { console.error("[email] auction winner send failed", e); }
}

// Sent once a supporter claims a team on a football card.
export async function sendFootballCardClaimEmail(opts: {
  buyerEmail: string;
  buyerName: string;
  cardTitle: string;
  team: string;
}): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.buyerEmail) return;
  const clubName = getBusinessConfig()?.name ?? "the club";
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.buyerEmail,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: `You've got ${opts.team} — ${opts.cardTitle}`,
      text: `Thanks ${opts.buyerName}! You've got ${opts.team} on "${opts.cardTitle}". We'll email you the moment every team is taken and the draw is made. Good luck!`,
    });
  } catch (e) { console.error("[email] football card claim failed", e); }
}

// Sent to whoever claimed the drawn team once a football card is resolved.
export async function sendFootballCardWinnerEmail(opts: {
  winnerEmail: string;
  winnerName: string;
  cardTitle: string;
  team: string;
  prizeAmount: number;
}): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.winnerEmail) return;
  const clubName = getBusinessConfig()?.name ?? "the club";
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.winnerEmail,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: `${opts.team} won! You've won "${opts.cardTitle}"`,
      text: `Congratulations ${opts.winnerName}! ${opts.team} was drawn as the winning team on "${opts.cardTitle}"${opts.prizeAmount > 0 ? ` — you've won £${opts.prizeAmount.toFixed(2)}` : ""}. A committee member will be in touch. Thanks for supporting ${clubName}!`,
    });
  } catch (e) { console.error("[email] football card winner failed", e); }
}

// Sent to the previous highest bidder the moment someone outbids them.
export async function sendOutbidEmail(opts: {
  bidderEmail: string;
  bidderName: string;
  competitionTitle: string;
  amount: number;
}): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.bidderEmail) return;
  const templates = getEmailTemplates();
  const clubName = getBusinessConfig()?.name ?? "Junior FC";
  const vars = {
    bidder: opts.bidderName,
    competition: opts.competitionTitle,
    amount: opts.amount.toFixed(2),
    clubName,
  };
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.bidderEmail,
      subject: render(templates.auctionOutbid.subject, vars),
      text: render(templates.auctionOutbid.body, vars),
    });
  } catch (e) { console.error("[email] outbid send failed", e); }
}

// Sent to a parent/guardian the moment they submit the "Join the Wolfpack"
// waiting-list form. Copy is the exact wording from the club's brief —
// not run through the admin-editable template system, since it's fixed.
export async function sendWaitingListConfirmEmail(opts: { parentEmail: string }): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.parentEmail) return;
  const clubName = getBusinessConfig()?.name ?? "the club";
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.parentEmail,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: "Hi from the Wolfpack! 🐺⚽️🐺",
      text: "Thank you for your interest in Harton & Westoe Wolves. We really appreciate you taking the time to register your interest. We'll be in touch if a suitable space becomes available. In the meantime, stay positive and good luck to your child on their football journey!",
    });
  } catch (e) { console.error("[email] waiting list confirm failed", e); }
}

// Sent to the complainant immediately on submission, with their reference.
export async function sendComplaintConfirmEmail(opts: { email: string; reference: string }): Promise<void> {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled || !cfg.fromEmail || !opts.email) return;
  const clubName = getBusinessConfig()?.name ?? "the club";
  try {
    await sendViaResend({
      from: fromHeader(cfg, clubName),
      to: opts.email,
      bcc: cfg.bccOwner && cfg.ownerEmail ? cfg.ownerEmail : undefined,
      subject: `We've received your complaint — ref ${opts.reference}`,
      text: `Thank you for letting us know. Your reference is ${opts.reference} — please quote it in any follow-up.\n\n${clubName} aims to respond within 10 working days. We'll be in touch.`,
    });
  } catch (e) { console.error("[email] complaint confirm failed", e); }
}

export async function sendTestEmail(toOverride?: string) {
  const cfg = getEmailConfig();
  if (!cfg || !cfg.enabled) throw new Error('"Send emails" is switched off in Admin > Emails — turn it on to send anything, including this test.');
  if (!cfg.fromEmail) throw new Error("Email not configured — set a From email in Admin > Emails");
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not set on the server");
  const clubName = getBusinessConfig()?.name ?? "Test";
  await sendViaResend({
    from: fromHeader(cfg, clubName),
    to: toOverride ?? cfg.ownerEmail ?? cfg.fromEmail,
    subject: "Test email from the club admin",
    text: "If you can read this, your Resend setup is working.",
  });
}
