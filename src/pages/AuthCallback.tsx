import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { FullPageSpinner } from '@/components/Spinner';

/**
 * Landing page for the magic link. supabase-js parses the session from the URL
 * automatically (detectSessionInUrl); we just wait for it, then send the user in.
 */
export function AuthCallback() {
  const { loading, session } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Surface an error if the link itself reported one (expired, already used, ...).
  const urlError = new URLSearchParams(
    window.location.hash.replace(/^#/, '') || window.location.search,
  ).get('error_description');

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (session) return <Navigate to="/app" replace />;

  if (urlError || timedOut) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold text-ink">That link didn’t work</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          {urlError ?? 'Your sign-in link may have expired or already been used.'} Let’s get you a
          fresh one.
        </p>
        <Link
          to="/login"
          className="mt-6 rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-bright"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (loading || !session) return <FullPageSpinner />;
  return <Navigate to="/app" replace />;
}
