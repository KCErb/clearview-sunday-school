import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

export interface AuthContextValue {
  /** Still resolving the initial session. */
  loading: boolean;
  /** True once the profile row (or its absence) has been fetched for the current user. */
  profileLoaded: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Sends a magic-link email to this address; resolves on success or throws with a message. */
  signInWithMagicLink: (email: string) => Promise<void>;
  /** Re-fetch the current user's profile (e.g. after completing their name). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
