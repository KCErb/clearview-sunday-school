import { cfmUrl } from '@/lib/cfm';
import { resolveArt } from '@/lib/art';
import { ArtImage } from '@/components/ArtImage';
import type { Lesson, SectionArt, SectionLink } from '@/lib/types';

/** The art-hero "Study & resources" card: art on the left, links on the right. */
export function LinksCard({
  sa,
  lesson,
  week,
  links,
}: {
  sa: SectionArt | null;
  lesson?: Lesson;
  week: number | null;
  links: SectionLink[];
}) {
  const hasManual = !!lesson && week != null;
  const piece = sa ? resolveArt(sa.src) : null;
  if (!sa && !hasManual && links.length === 0) return null;
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-sky-100 bg-white/80 shadow-sm sm:flex-row">
      {sa && piece && (
        <div className="h-44 sm:h-auto sm:w-48 sm:shrink-0">
          <ArtImage art={sa} className="h-full w-full" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          Study &amp; resources
        </div>
        <ul className="mt-2.5 divide-y divide-sky-100">
          {hasManual && (
            <li>
              <a
                href={cfmUrl(week!)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-2.5"
              >
                <span className="font-semibold text-ink underline-offset-2 group-hover:underline">
                  Read in the Come, Follow Me manual
                </span>
                <span aria-hidden className="shrink-0 text-brand">→</span>
              </a>
            </li>
          )}
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-2.5"
              >
                <span className="font-semibold text-ink underline-offset-2 group-hover:underline">{l.label}</span>
                <span aria-hidden className="shrink-0 text-brand">→</span>
              </a>
            </li>
          ))}
          {!hasManual && links.length === 0 && (
            <li className="py-2.5 text-sm text-ink-faint">No resources added yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
