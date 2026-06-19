/**
 * Local design preview (dev only — mounted at /preview when running `pnpm dev`).
 * A sandbox to try Christ-centered art treatments and tweak small design elements
 * without touching the real pages. Edit freely; pick the treatments you like and
 * we'll wire the winners into the splash / headers.
 *
 * Art: Carl Bloch (1834–1890), public domain. Files in /public/art.
 */
import type { ReactNode } from 'react';
import { LogoMark, Wordmark } from '@/components/Logo';

const ART = {
  sermon: '/art/sermon-on-the-mount.jpg',
  gethsemane: '/art/gethsemane.jpg',
  resurrection: '/art/resurrection.jpg',
  child: '/art/christ-and-child.jpg',
};

export function Preview() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-ink">CWASS — design preview</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Dev-only sandbox. Compare the Christ-centered treatments below and tell me which to adopt
        (or tweak this file directly). Art by Carl Bloch — public domain.
      </p>

      <Section title="A · Hero band (art across the top of the splash)">
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm">
          <div className="relative">
            <img src={ART.sermon} alt="The Sermon on the Mount" className="h-60 w-full object-cover object-[center_25%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c3a]/90 via-[#0b1c3a]/35 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
                Clearview Ward Adult Sunday School
              </div>
              <h2 className="mt-1 text-3xl font-extrabold">Welcome to CWASS</h2>
            </div>
          </div>
          <div className="p-6 text-sm text-ink-soft">Body content sits below the art band…</div>
        </div>
        <Note>Warm and immediate; the teaching scene fits a study class. Good as the splash header.</Note>
      </Section>

      <Section title="B · Framed art + a verse">
        <div className="grid gap-5 rounded-3xl border border-sky-100 bg-white/80 p-6 shadow-sm sm:grid-cols-[140px_1fr] sm:items-center">
          <img src={ART.child} alt="Christ and Child" className="mx-auto h-44 w-32 rounded-2xl object-cover object-top shadow-md ring-1 ring-black/5" />
          <div>
            <Verse text="Come unto me, all ye that labour and are heavy laden, and I will give you rest." cite="Matthew 11:28" />
            <h2 className="mt-3 text-2xl font-bold text-ink">Welcome to CWASS</h2>
            <p className="mt-1 text-sm text-ink-soft">A place to study together and bring our questions.</p>
          </div>
        </div>
        <Note>Quieter and reverent; pairs a painting with scripture. Nice for the splash or a sidebar.</Note>
      </Section>

      <Section title="C · Quiet watermark behind the clean splash">
        <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/80 p-8 text-center shadow-sm">
          <img src={ART.resurrection} alt="" aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full object-cover opacity-[0.10]" />
          <div className="relative">
            <LogoMark className="mx-auto h-16 w-16" />
            <h2 className="mt-4 text-3xl font-extrabold text-ink">Welcome to CWASS</h2>
            <p className="mt-2 text-sm text-ink-soft">The current clean splash, with art as a faint background presence.</p>
          </div>
        </div>
        <Note>Most subtle — keeps the current minimal feel and just hints at the art.</Note>
      </Section>

      <Section title="D · Small art accent in the header">
        <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <img src={ART.child} alt="" aria-hidden className="h-10 w-10 rounded-full object-cover object-top ring-1 ring-black/5" />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight text-ink">CWASS</div>
              <div className="text-[11px] text-ink-faint">Clearview Ward Adult Sunday School</div>
            </div>
          </div>
          <span className="text-sm text-ink-faint">Sign out</span>
        </div>
        <Note>Tiny touch on every page via the wordmark. Compare with the current logo header below.</Note>
        <div className="mt-3 rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-sm">
          <Wordmark />
        </div>
      </Section>

      <Section title="Scripture element (standalone)">
        <div className="space-y-3">
          <Verse text="I am the light of the world: he that followeth me shall not walk in darkness, but shall have the light of life." cite="John 8:12" />
          <Verse text="And we talk of Christ, we rejoice in Christ, we preach of Christ…" cite="2 Nephi 25:26" />
        </div>
        <Note>A rotating “verse of the week” could sit on the splash or atop /this-week.</Note>
      </Section>

      <Section title="Palette">
        <div className="flex flex-wrap gap-2">
          {[
            ['brand', 'bg-brand'],
            ['brand-bright', 'bg-brand-bright'],
            ['ink', 'bg-ink'],
            ['ink-soft', 'bg-ink-soft'],
            ['ink-faint', 'bg-ink-faint'],
            ['sky-100', 'bg-sky-100'],
            ['sky-50', 'bg-sky-50'],
          ].map(([name, cls]) => (
            <div key={name} className="text-center">
              <div className={`h-14 w-20 rounded-xl border border-black/5 ${cls}`} />
              <div className="mt-1 text-[11px] text-ink-faint">{name}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Components">
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-bright">
            Primary button
          </button>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Shared</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">needs review</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">anonymous</span>
        </div>
        <input
          placeholder="Input field"
          className="mt-3 w-full rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </Section>

      <p className="mt-12 text-center text-xs text-ink-faint">
        Art: Carl Bloch, public domain (via Wikimedia Commons).
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs leading-relaxed text-ink-faint">{children}</p>;
}

function Verse({ text, cite }: { text: string; cite: string }) {
  return (
    <blockquote className="border-l-2 border-brand/40 pl-3">
      <p className="text-[15px] italic leading-relaxed text-ink">“{text}”</p>
      <cite className="mt-1 block text-xs font-semibold not-italic text-brand">— {cite}</cite>
    </blockquote>
  );
}
