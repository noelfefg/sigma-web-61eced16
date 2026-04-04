/**
 * VerifiedBadge - TikTok-style blue tick for verified accounts
 * Usage: <VerifiedBadge size={14} />
 */
interface Props { size?: number; className?: string; }

export function VerifiedBadge({ size = 14, className = '' }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={`inline ${className}`} aria-label="Verified">
      <circle cx="10" cy="10" r="10" fill="#1d9bf0"/>
      <path d="M6 10.5L8.5 13L14 7.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
