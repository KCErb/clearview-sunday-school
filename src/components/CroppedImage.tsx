import { resolveArt } from '@/lib/art';
import type { SectionArt } from '@/lib/types';

/**
 * Renders a section's art at its chosen aspect ratio and crop. The crop is stored
 * as react-easy-crop's croppedArea (percentages); we apply it purely with CSS by
 * scaling/offsetting the image so the cropped region fills the aspect box.
 */
export function CroppedImage({
  art,
  alt = '',
  className = '',
}: {
  art: SectionArt;
  alt?: string;
  className?: string;
}) {
  const piece = resolveArt(art.src);
  if (!piece) return null;
  const a = art.area;
  return (
    <div className={`relative overflow-hidden bg-sky-50 ${className}`} style={{ aspectRatio: String(art.aspect) }}>
      {a ? (
        <img
          src={piece.src}
          alt={alt}
          className="absolute max-w-none"
          style={{
            width: `${10000 / a.width}%`,
            left: `${-(a.x / a.width) * 100}%`,
            top: `${-(a.y / a.height) * 100}%`,
          }}
        />
      ) : (
        <img src={piece.src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
      )}
    </div>
  );
}
