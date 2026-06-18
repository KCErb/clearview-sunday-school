import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { AuthContext, type SignInArgs } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Track the current session (initial load + future changes).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Load the profile row whenever the signed-in user changes.
  useEffect(() => {
    const userId = session?.user?.id;
    let cancelled = false;
    void (async () => {
      if (!userId) {
        if (!cancelled) {
          setProfile(null);
          setProfileLoaded(true);
        }
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (!cancelled) {
        setProfile((data as Profile) ?? null);
        setProfileLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const signInWithMagicLink = useCallback(
    async ({ email, firstName, lastName }: SignInArgs) => {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { first_name: firstName.trim(), last_name: lastName.trim() },
        },
      });
      if (error) throw new Error(error.message);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        loading,
        profileLoaded,
        session,
        user: session?.user ?? null,
        profile,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
