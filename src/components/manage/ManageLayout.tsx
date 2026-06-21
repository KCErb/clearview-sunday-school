import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function ManageLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 py-6 sm:px-8">
        <Link to="/manage" className="text-lg font-bold text-ink hover:text-brand">
          Manage
        </Link>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <Link to="/this-week" className="font-medium text-brand hover:text-brand-bright">
            Class view ↗
          </Link>
          <button onClick={signOut} className="font-medium text-ink-soft hover:text-ink">
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6">{children}</main>
    </div>
  );
}
