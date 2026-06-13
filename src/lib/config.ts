// App-wide configuration. Values here are public (embedded in the client bundle) —
// never put secrets in this file.

export const config = {
  /** Owner (user or org) of the private repo used as the ticket database. */
  dataRepoOwner: 'zchef2k',
  /** Name of the private repo used as the ticket database. */
  dataRepoName: 'ghp-servicedesk-data',

  /** Client ID of the GitHub OAuth App (public). */
  githubOAuthClientId: 'Ov23lidzWfvN5g6l8tvF',

  /** OAuth scopes requested. 'repo' is required for private-repo issue access. */
  githubOAuthScope: 'repo',

  /** URL of the Lambda Function URL that exchanges an OAuth code for a token. */
  tokenExchangeUrl: 'https://x46h65pluednkfdpok7uq3ooey0mavsi.lambda-url.us-east-1.on.aws/',
};
