import { useState } from 'react';

const hue = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

// Shows the poster image, or a typographic fallback poster when none is set.
export default function Poster({ movie, wide = false, className = '' }) {
  const [broken, setBroken] = useState(false);
  const url = wide ? movie.bannerUrl || movie.posterUrl : movie.posterUrl;
  if (url && !broken) return <img className={`poster ${wide ? 'wide' : ''} ${className}`} src={url} alt={`${movie.title} poster`} loading="lazy" onError={() => setBroken(true)} />;
  const h = hue(movie.title);
  return (
    <div className={`poster fallback ${wide ? 'wide' : ''} ${className}`} role="img" aria-label={`${movie.title} poster`}
      style={{ background: `linear-gradient(160deg, hsl(${h} 55% 32%), hsl(${(h + 50) % 360} 60% 12%))` }}>
      <span>{movie.title}</span>
    </div>
  );
}
