import { useEffect, useState } from 'react';
import { exchangeCodeForToken, setToken } from '../lib/auth';
import { appPath } from '../lib/url';

export default function AuthCallback() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code) {
      setError('Missing OAuth code in callback URL.');
      return;
    }

    exchangeCodeForToken(code)
      .then((token) => {
        setToken(token);
        window.location.href = appPath();
      })
      .catch((err) => setError(err.message ?? 'Token exchange failed'));
  }, []);

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-red-600">{error}</p>
        <a href={appPath()} className="mt-4 inline-block text-sm hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  return <div className="py-16 text-center text-slate-600">Signing you in…</div>;
}
