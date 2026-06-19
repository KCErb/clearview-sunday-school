import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { ChristMark } from '@/components/Logo';
import { Spinner } from '@/components/Spinner';

export function Login() {
  const { session, signInWithMagicLink } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (session) return <Navigate to="/app" replace />;

  async function send(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setStatus('sending');
    try {
      await signInWithMagicLink({ email, firstName, lastName });
      setStatus('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <Link to="/" className="mx-auto mb-8 flex flex-col items-center gap-3 text-center">
        <ChristMark className="h-16 w-16" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Clearview Ward Adult Sunday School
        </span>
      </Link>

      <div className="rounded-3xl border border-sky-100 bg-white/80 p-8 shadow-xl shadow-brand/5 backdrop-blur">
        {status === 'sent' ? (
          <div className="text-center">
            <h1 className="text-xl font-bold text-ink">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              We sent a sign-in link to <span className="font-semibold text-ink">{email}</span>.
              Open it on this device to finish signing in.
            </p>
            <button
              onClick={() => send()}
              className="mt-6 text-sm font-semibold text-brand hover:text-brand-bright"
            >
              Resend link
            </button>
          </div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-bold text-ink">Sign in</h1>
              <p className="mt-1.5 text-sm text-ink-soft">
                No password — we’ll email you a one-tap link.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="First name"
                value={firstName}
                onChange={setFirstName}
                autoComplete="given-name"
                required
              />
              <Field
                label="Last name"
                value={lastName}
                onChange={setLastName}
                autoComplete="family-name"
                required
              />
            </div>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-bright disabled:opacity-60"
            >
              {status === 'sending' ? <Spinner /> : 'Send my sign-in link'}
            </button>

            <p className="text-center text-xs leading-relaxed text-ink-faint">
              We ask for your name so the instructor can recognize folks from the ward.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  autoComplete,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
