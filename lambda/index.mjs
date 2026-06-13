// AWS Lambda handler (Node 20, invoked via a Function URL) that exchanges a
// GitHub OAuth `code` for an access token. This is the only piece that holds
// the OAuth App's client secret.
//
// Required environment variables:
//   GITHUB_CLIENT_ID      - GitHub OAuth App client ID
//   GITHUB_CLIENT_SECRET  - GitHub OAuth App client secret
//   ALLOWED_ORIGIN        - origin of the GitHub Pages site, e.g. https://<user>.github.io

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod;

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (method !== 'POST') {
    return respond(405, { error: 'method_not_allowed' });
  }

  let code;
  try {
    const parsed = JSON.parse(event.body ?? '{}');
    code = parsed.code;
  } catch {
    return respond(400, { error: 'invalid_json' });
  }

  if (!code) {
    return respond(400, { error: 'missing_code' });
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return respond(400, { error: tokenData.error, error_description: tokenData.error_description });
  }

  return respond(200, { access_token: tokenData.access_token });
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
