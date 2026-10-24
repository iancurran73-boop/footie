/**
 * client/src/components/fundraiser-gauge.tsx
 * ───────────────────────────────────────────
 * Semicircle "currently raised" gauge, in the style of the club's own
 * Facebook fundraising graphic — but driven live from the admin-editable
 * Fundraiser record instead of being redrawn in Canva each time.
 */

import { gbp } from "@/lib/format";

export function FundraiserGauge({ raised, target, size = 240 }: { raised: number; target: number; size?: number }) {
  const pct = target > 0 ? Math.min(100, (raised / target) * 100) : 0;
  const pctLabel = Math.round(pct);
  const r = 90, cx = 110, cy = 112, sw = 20;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg viewBox="0 0 220 150" style={{ width: size, maxWidth: "100%" }} className="mx-auto" role="img" aria-label={`${gbp(raised)} raised of ${gbp(target)} target, ${pctLabel}%`}>
      <defs>
        <linearGradient id="fundraiser-gauge-fill" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(var(--accent))" />
          <stop offset="100%" stopColor="hsl(var(--primary))" />
        </linearGradient>
      </defs>
      <path d={arc} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={sw} strokeLinecap="round" pathLength={100} />
      <path
        d={arc} fill="none" stroke="url(#fundraiser-gauge-fill)" strokeWidth={sw} strokeLinecap="round"
        pathLength={100} strokeDasharray={`${pct} ${100 - pct}`}
        style={{ transition: "stroke-dasharray .6s ease" }}
      />
      <text x={cx} y={cy - 14} textAnchor="middle" fontFamily="var(--font-display, serif)" fontWeight={800} fontSize="27" fill="currentColor">
        {gbp(raised)}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11.5" fill="currentColor" opacity={0.65}>
        {pctLabel}% of {gbp(target)} target
      </text>
      <text x={cx - r} y={cy + 28} textAnchor="start" fontSize="11" fill="currentColor" opacity={0.55}>£0</text>
      <text x={cx + r} y={cy + 28} textAnchor="end" fontSize="11" fill="currentColor" opacity={0.55}>{gbp(target)}</text>
    </svg>
  );
}
