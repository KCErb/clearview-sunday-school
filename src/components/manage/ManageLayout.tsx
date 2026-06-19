import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';

export function ManageLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-3xl px-6">
        <header className="flex flex-wrap items-center gap-x-5 gap-y-2 py-6">
          <span className="text-lg font-bold text-ink">Manage</span>
          <nav className="flex items-center gap-1 text-sm">
            <Tab to="/manage" end>
              Sessions
            </Tab>
            <Tab to="/manage/inquiries">Questions from class</Tab>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link to="/this-week" className="font-medium text-brand hover:text-brand-bright">
              Class view ↗
            </Link>
            <button onClick={signOut} className="font-medium text-ink-soft hover:text-ink">
              Sign out
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}

function Tab({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-lg px-3 py-1.5 font-medium transition ${
          isActive ? 'bg-brand/10 text-brand' : 'text-ink-soft hover:bg-white hover:text-ink'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
