import { useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { ART_LIBRARY, resolveArt } from '@/lib/art';
import { CroppedImage } from '@/components/CroppedImage';
import type { CropArea, SectionArt } from '@/lib/types';

const ASPECTS: { label: string; value: number }[] = [
  { label: 'Wide', value: 16 / 9 },
  { label: 'Landscape', value: 4 / 3 },
  { label: 'Square', value: 1 },
  { label: 'Portrait', value: 3 / 4 },
];

export function ArtField({
  value,
  onChange,
}: {
  value: SectionArt | null;
  onChange: (v: SectionArt | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [src, setSrc] = useState<string | null>(value?.src ?? null);
  const [aspect, setAspect] = useState(value?.aspect ?? 4 / 3);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<CropArea | null>(value?.area ?? null);

  function startEdit() {
    setSrc(value?.src ?? null);
    setAspect(value?.aspect ?? 4 / 3);
    setArea(value?.area ?? null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setEditing(true);
  }
  function pick(s: string | null) {
    setSrc(s);
    setArea(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }
  function save() {
    onChange(src ? { src, aspect, area } : null);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div>
        {value ? (
          <div className="w-48 overflow-hidden rounded-xl border border-sky-100">
            <CroppedImage art={value} />
          </div>
        ) : (
          <p className="text-sm text-ink-faint">No art chosen.</p>
        )}
        <div className="mt-2 flex gap-4 text-xs">
          <button onClick={startEdit} className="font-semibold text-brand hover:text-brand-bright">
            {value ? 'Change / crop art' : 'Choose art'}
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
          <div className="relative mt-3 h-72 overflow-hidden rounded-lg bg-ink/90">
            <Cropper
              image={piece.src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPct: Area) =>
                setArea({ x: areaPct.x, y: areaPct.y, width: areaPct.width, height: areaPct.height })
              }
              restrictPosition
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-soft">Shape:</span>
            {ASPECTS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => setAspect(a.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  Math.abs(aspect - a.value) < 0.01 ? 'bg-brand text-white' : 'bg-sky-100 text-ink-soft hover:bg-sky-200'
                }`}
              >
                {a.label}
              </button>
            ))}
            <label className="ml-2 flex items-center gap-2 text-xs text-ink-soft">
              Zoom
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="accent-brand"
              />
            </label>
          </div>
        </>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={save}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-bright"
        >
          Save art
        </button>
        <button onClick={() => setEditing(false)} className="rounded-md px-3 py-1.5 text-xs font-medium text-ink-soft hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}
