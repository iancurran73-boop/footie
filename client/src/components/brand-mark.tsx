/**
 * client/src/components/brand-mark.tsx
 * ──────────────────────────────────────
 * Renders the tenant logo. Uses config.brand.logoPath for the image.
 * Falls back to a text-based monogram if the path is empty or the image fails.
 */

import config from "@/lib/tenant";

interface BrandMarkProps {
  className?: string;
  /** Passed to BrandMark but unused — kept for legacy call-sites */
  size?: number;
}

export function BrandMark({ className = "h-12 w-auto" }: BrandMarkProps) {
  if (config.brand.logoPath) {
    return (
      <img
        src={config.brand.logoPath}
        alt={config.brand.name}
        className={className}
        onError={(e) => {
          // If the logo image fails to load, fall back to text
          const target = e.currentTarget;
          target.style.display = "none";
          const fallback = document.createElement("span");
          fallback.textContent = config.brand.shortName;
          fallback.className = "font-display font-extrabold text-current";
          target.parentNode?.insertBefore(fallback, target.nextSibling);
        }}
      />
    );
  }
  // SVG football mark fallback when no logoPath configured
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-label={config.brand.shortName}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="2.5" />
      <polygon points="32,20 40.5,26.2 37.3,36.2 26.7,36.2 23.5,26.2" fill="currentColor" />
      <path
        d="M32 20 L32 10.5 M40.5 26.2 L49.5 23 M37.3 36.2 L42.5 44.5 M26.7 36.2 L21.5 44.5 M23.5 26.2 L14.5 23"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// A simplified inline monogram SVG — kept for admin gate and compact contexts
export function BrandMonogram({ className = "h-8 w-8" }: { className?: string }) {
  const initials = config.brand.shortName.slice(0, 2).toUpperCase();
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-label={config.brand.shortName}>
      <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2" />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="currentColor"
        fontFamily="sans-serif"
      >
        {initials}
      </text>
    </svg>
  );
}
