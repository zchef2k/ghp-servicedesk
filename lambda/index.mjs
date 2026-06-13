// AWS Lambda handler (Node 20, invoked via a Function URL) that exchanges a
// GitHub OAuth `code` for an access token. This is the only piece that holds
// the OAuth App's client secret.
//
// CORS is handled entirely by the Function URL's CORS configuration (see
// lambda/README.md) — do not add Access-Control-* headers here, or browsers
// will reject the response due to duplicate headers.
//
// Required environment variables:
//   GITHUB_CLIENT_ID      - GitHub OAuth App client ID
//   GITHUB_CLIENT_SECRET  - GitHub OAuth App client secret

export const handler = async (event) => {
  const method = event.requestContext?.http?.method ?? event.httpMethod;

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
