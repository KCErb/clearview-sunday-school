import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/useAuth';
import { ChristMark } from '@/components/Logo';
import { Spinner } from '@/components/Spinner';

/** Shown once after first sign-in, when we don't yet have the member's name. */
export function CompleteProfile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !user) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, first_name: firstName.trim(), last_name: lastName.trim() || null });
    if (error) {
      setSaving(false);
      setError(error.message);
      return;
    }
    await refreshProfile();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12">
      <div className="mx-auto mb-8 flex flex-col items-center gap-3 text-center">
        <ChristMark className="h-16 w-16" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
          Clearview Ward Adult Sunday School
        </span>
      </div>

      <form
        onSubmit={submit}
        className="space-y-4 rounded-3xl border border-sky-100 bg-white/80 p-8 shadow-xl shadow-brand/5 backdrop-blur"
      >
        <div className="text-center">
          <h1 className="text-xl font-bold text-ink">One quick thing</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            What’s your name? It helps KC recognize folks from the ward. You can still post
            answers anonymously later.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">First name</span>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              autoFocus
              required
              className="w-full rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Last name</span>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              className="w-full rounded-xl border border-sky-100 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={saving || !firstName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-base font-semibold text-white shadow-lg shadow-brand/25 transition hover:bg-brand-bright disabled:opacity-60"
        >
          {saving ? <Spinner /> : 'Continue'}
        </button>
        <button
          type="button"
          onClick={signOut}
          className="w-full text-center text-xs font-medium text-ink-faint hover:text-ink-soft"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
