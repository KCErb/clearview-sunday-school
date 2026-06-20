import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { ART_LIBRARY, resolveArt } from '@/lib/art';
import { LinksCard } from '@/components/thisweek/LinksCard';
import { ArtImage } from '@/components/ArtImage';
import type { Lesson, SectionArt, SectionLink } from '@/lib/types';

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function ArtField({
  value,
  onChange,
  lesson,
  week,
  links,
}: {
  value: SectionArt | null;
  onChange: (v: SectionArt | null) => void;
  lesson?: Lesson;
  week: number | null;
  links: SectionLink[];
}) {
  const [editing, setEditing] = useState(false);
  const [src, setSrc] = useState<string | null>(value?.src ?? null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(value?.zoom ?? 1);
  const [focalX, setFocalX] = useState(value?.focalX ?? 50);
  const [focalY, setFocalY] = useState(value?.focalY ?? 50);

  function startEdit() {
    setSrc(value?.src ?? null);
    setZoom(value?.zoom ?? 1);
    setFocalX(value?.focalX ?? 50);
    setFocalY(value?.focalY ?? 50);
    setCrop({ x: 0, y: 0 });
    setEditing(true);
  }
  function pick(s: string | null) {
    setSrc(s);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setFocalX(50);
    setFocalY(50);
  }
  function save() {
    onChange(src ? { src, focalX, focalY, zoom } : null);
    setEditing(false);
  }

  const draft: SectionArt | null = src ? { src, focalX, focalY, zoom } : null;

  if (!editing) {
    return (
      <div>
        {value ? (
          <div className="h-28 w-48 overflow-hidden rounded-xl border border-sky-100">
            <ArtImage art={value} className="h-full w-full" />
          </div>
        ) : (
          <p className="text-sm text-ink-faint">No art chosen.</p>
        )}
        <div className="mt-2 flex gap-4 text-xs">
          <button onClick={startEdit} className="font-semibold text-brand hover:text-brand-bright">
            {value ? 'Change / frame art' : 'Choose art'}
          </button>
          {value && (
            <button onClick={() => onChange(null)} className="font-semibold text-red-600 hover:text-red-700">
              Remove
            </button>
          )}
        </div>
      </div>
    );
  }

  const piece = src ? resolveArt(src) : null;

  return (
    <div className="rounded-xl border border-sky-100 bg-white p-3">
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {ART_LIBRARY.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => pick(a.key)}
            title={`${a.title} — ${a.artist}`}
            className={`overflow-hidden rounded-lg border-2 transition ${src === a.key ? 'border-brand ring-2 ring-brand/30' : 'border-transparent hover:border-brand/40'}`}
          >
            <img src={a.src} alt={a.title} className="h-14 w-full object-cover object-top" />
          </button>
        ))}
      </div>
      <input
        value={src && src.startsWith('http') ? src : ''}
        onChange={(e) => pick(e.target.value.trim() || null)}
        placeholder="…or paste a public-domain image URL"
        className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      {piece && (
        <>
          <p className="mt-3 text-xs text-ink-faint">Drag to pan, scroll or use the slider to zoom.</p>
          <div className="relative mt-1 h-64 overflow-hidden rounded-lg bg-ink/90">
            <Cropper
              image={piece.src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(areaPct: Area) => {
                setFocalX(clamp(areaPct.x + areaPct.width / 2));
                setFocalY(clamp(areaPct.y + areaPct.height / 2));
              }}
            />
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
            Zoom
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="accent-brand" />
          </label>

          <div className="mt-4">
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">Card preview</div>
            <LinksCard sa={draft} lesson={lesson} week={week} links={links} />
          </div>
        </>
      )}

      <div className="mt-4 flex gap-2">
        <button onClick={save} className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright">
          Save art
        </button>
        <button onClick={() => setEditing(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}
