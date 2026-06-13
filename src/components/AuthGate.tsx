import { useEffect, useState, type ReactNode } from 'react';
import { getLoginUrl, isLoggedIn, logout } from '../lib/auth';

/**
 * Wraps page content that requires authentication. Shows a sign-in prompt
 * if the user has no token, otherwise renders children with a logout control.
 */
export default function AuthGate({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
  }, []);

  if (loggedIn === null) {
    return null;
  }

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Sign in to continue</h1>
        <p className="text-slate-600">
          You need a GitHub account with access to the ticket repo.
        </p>
        <a
          href={getLoginUrl()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Sign in with GitHub
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => {
            logout();
            window.location.reload();
          }}
          className="text-sm text-slate-500 hover:underline"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
