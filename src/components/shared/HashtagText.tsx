import { Link } from 'react-router-dom';

interface HashtagTextProps {
  text: string;
  className?: string;
}

// Renders text with #hashtags as clickable chips → /tag/:tag
export function HashtagText({ text, className }: HashtagTextProps) {
  if (!text) return null;
  const parts = text.split(/(#[A-Za-z0-9_]+)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('#') && p.length > 1) {
          const tag = p.slice(1).toLowerCase();
          return (
            <Link key={i} to={`/tag/${tag}`} className="text-primary hover:underline font-semibold">
              {p}
            </Link>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
