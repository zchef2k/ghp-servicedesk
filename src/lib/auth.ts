import { config } from './config';

const TOKEN_KEY = 'ghp_servicedesk_token';

/** Builds the URL to redirect the user to for GitHub's OAuth consent screen. */
export function getLoginUrl(): string {
  const redirectUri = new URL('auth/callback', window.location.origin + import.meta.env.BASE_URL);
  const params = new URLSearchParams({
    client_id: config.githubOAuthClientId,
    scope: config.githubOAuthScope,
    redirect_uri: redirectUri.toString(),
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/** Exchanges an OAuth `code` for an access token via the Lambda token-exchange endpoint. */
export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch(config.tokenExchangeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description || 'Token exchange returned no access_token');
  }

  return data.access_token as string;
}

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}
