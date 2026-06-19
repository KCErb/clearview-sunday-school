import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { Footer } from '@/components/Footer';

const features = [
  {
    title: 'The weekly study',
    body: 'See what we’re reading and come ready to discuss together.',
  },
  {
    title: 'Answers & questions',
    body: 'Share what you’re learning and ask what you’re still pondering.',
  },
  {
    title: 'Teachers at home',
    body: 'Help for guiding gospel learning in your own home, all week long.',
  },
];

export function Splash() {
  const { session } = useAuth();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <div className="relative overflow-hidden shadow-lg sm:mt-8 sm:rounded-3xl">
        <img
          src="/art/sermon-on-the-mount.jpg"
          alt="The Sermon on the Mount, by Carl Bloch"
          className="h-72 w-full object-cover object-[center_22%] sm:h-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c3a]/92 via-[#0b1c3a]/40 to-[#0b1c3a]/10" />
        <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/80">
            Clearview Ward · Adult Sunday School
          </div>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">
            Come, let’s study together.
          </h1>
        </div>
      </div>

      <div className="px-6 sm:px-0">
        <p className="mt-7 text-lg leading-relaxed text-ink-soft">
          A quiet corner for our class — the week’s study, room to share what you’re finding, and
          the questions you’re still carrying. We see everyone here as a teacher in their own home.
        </p>

        <blockquote className="mt-6 border-l-2 border-brand/40 pl-4">
          <p className="text-[15px] italic leading-relaxed text-ink">
            “Come unto me, all ye that labour and are heavy laden, and I will give you rest.”
          </p>
          <cite className="mt-1 block text-xs font-semibold not-italic text-brand">
            — Matthew 11:28
          </cite>
        </blockquote>

        <div className="mt-8">
          <Link
            to={session ? '/this-week' : '/login'}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-bright"
          >
            {session ? 'Go to this week →' : 'Sign in to get started'}
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-sky-100 bg-white/70 p-5 text-left shadow-sm backdrop-blur"
            >
              <h2 className="text-sm font-semibold text-ink">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-ink-faint">
          Around here, we fondly call it <span className="font-semibold text-ink-soft">CWASS</span>.
        </p>
      </div>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
