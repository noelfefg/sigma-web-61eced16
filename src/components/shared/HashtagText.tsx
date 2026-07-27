interface HashtagTextProps {
  text: string;
  className?: string;
}

// Renders text with #hashtags highlighted (no hashtag pages in the current backend)
export function HashtagText({ text, className }: HashtagTextProps) {
  if (!text) return null;
  const parts = text.split(/(#[A-Za-z0-9_]+)/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('#') && p.length > 1) {
          return <span key={i} className="text-primary font-semibold">{p}</span>;
        }
        return <span key={i}>{p}</span>;
      })}
    </span>
  );
}
