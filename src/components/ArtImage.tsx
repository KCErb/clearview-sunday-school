import { resolveArt } from '@/lib/art';
import type { SectionArt } from '@/lib/types';

/**
 * Renders a section's art so it always *covers* its container (fills, no white bars),
 * framed by a focal point + zoom. Attribution rides on the title tooltip so it costs
 * no card space. The container sizes the image (e.g. h-full in a stretched column).
 */
export function ArtImage({ art, className = '' }: { art: SectionArt; className?: string }) {
  const piece = resolveArt(art.src);
  if (!piece) return null;
  const title = piece.artist ? `${piece.title} — ${piece.artist}` : piece.title || undefined;
  return (
    <div className={`relative overflow-hidden bg-sky-50 ${className}`} title={title}>
      <img
        src={piece.src}
        alt={piece.title}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          objectPosition: `${art.focalX}% ${art.focalY}%`,
          transform: art.zoom !== 1 ? `scale(${art.zoom})` : undefined,
          transformOrigin: `${art.focalX}% ${art.focalY}%`,
        }}
      />
    </div>
  );
}
