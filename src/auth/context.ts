import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

export interface SignInArgs {
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthContextValue {
  /** Still resolving the initial session. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** Sends a magic-link email; resolves on success or throws with a message. */
  signInWithMagicLink: (args: SignInArgs) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
