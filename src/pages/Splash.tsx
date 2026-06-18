import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { LogoMark } from '@/components/Logo';
import { Footer } from '@/components/Footer';

const features = [
  {
    title: 'The study schedule',
    body: 'See what we’re reading each week and what to come ready to discuss.',
  },
  {
    title: 'Answers & questions',
    body: 'Share what you’re learning and ask the things you’re still chewing on.',
  },
  {
    title: 'Join from anywhere',
    body: 'Can’t make it on Sunday? You can still take part during the week.',
  },
];

export function Splash() {
  const { session } = useAuth();

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center px-6 py-16 text-center">
      <LogoMark className="h-20 w-20 drop-shadow-sm" />

      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Welcome to <span className="text-brand">CWASS!</span>
      </h1>
      <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-ink-faint">
        Clearview Ward Adult Sunday School
      </p>

      <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
        A little corner of the internet for our class — the weekly study plan, a place to share
        your answers, and room for the questions you’re still wrestling with. (Yes, the name makes
        us smile too.)
      </p>

      <div className="mt-10">
        {session ? (
          <Link
            to="/this-week"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-bright"
          >
            Go to this week →
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-bright"
          >
            Sign in to get started
          </Link>
        )}
      </div>

      <div className="mt-16 grid w-full gap-4 sm:grid-cols-3">
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

      <div className="mt-auto w-full">
        <Footer />
      </div>
    </div>
  );
}
