import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { AuthContext } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  // The user id the current `profile` value was fetched for (undefined = not yet fetched).
  const [profileUserId, setProfileUserId] = useState<string | null | undefined>(undefined);

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

  const userId = session?.user?.id ?? null;

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setProfileUserId(null);
      return;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile((data as Profile) ?? null);
    setProfileUserId(userId);
  }, [userId]);

  useEffect(() => {
    void (async () => {
      await fetchProfile();
    })();
  }, [fetchProfile]);

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  // Derived each render: true only once the profile we hold matches the current user.
  // This avoids a stale window on refresh where a guard could see "not admin" too early.
  const profileLoaded = profileUserId === userId;

  return (
    <AuthContext.Provider
      value={{
        loading,
        profileLoaded,
        session,
        user: session?.user ?? null,
        profile,
        signInWithMagicLink,
        refreshProfile: fetchProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
