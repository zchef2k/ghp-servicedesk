# GitHub-Pages Service Desk

A Jira-Service-Desk-style ticketing app for internal teams, built as a static
site (Astro + React) on GitHub Pages. Authentication is via GitHub OAuth, and
GitHub Issues in a private repo serve as the ticket database. The only
non-static piece is a tiny AWS Lambda function that performs the OAuth
code→token exchange.

## Architecture

- **`ghp-servicedesk`** (this repo) — Astro site source, deployed to GitHub
  Pages via `.github/workflows/deploy.yml`.
- **`ghp-servicedesk-data`** (private, separate repo) — exists only to hold
  Issues (tickets). Create it manually on GitHub.
- **`lambda/`** — OAuth token-exchange function (AWS Lambda). See
  [`lambda/README.md`](lambda/README.md) for deployment.

`repo` OAuth scope is requested, which grants access to all private repos the
signed-in user can see (not just the data repo) — acceptable for an internal
tool, but worth knowing.

## Setup

### 1. Create the private data repo

Create a private GitHub repo (e.g. `ghp-servicedesk-data`) under the same
account/org. Add team members as collaborators with write access. Then create
these labels at `https://github.com/<owner>/ghp-servicedesk-data/labels`
(Issues tab → Labels):

**Status**
- `status:open`
- `status:pending-approval`
- `status:in-progress`
- `status:waiting-on-requester`
- `status:resolved`

**Priority**
- `priority:low`
- `priority:medium`
- `priority:high`
- `priority:urgent`

**Category**
- `category:hardware`
- `category:software`
- `category:access`
- `category:other`

**Type**
- `type:incident`
- `type:service-request`
- `type:change`

**Knowledge base**
- `kb:article`

You can create these via the UI or with the GitHub CLI:

```sh
for l in status:open status:pending-approval status:in-progress status:waiting-on-requester status:resolved \
         priority:low priority:medium priority:high priority:urgent \
         category:hardware category:software category:access category:other \
         type:incident type:service-request type:change \
         kb:article; do
  gh label create "$l" --repo <owner>/ghp-servicedesk-data
done
```

### 2. Create a GitHub OAuth App

GitHub → Settings → Developer settings → OAuth Apps → New OAuth App:

- **Homepage URL**: `https://<username>.github.io/ghp-servicedesk/`
- **Authorization callback URL**: `https://<username>.github.io/ghp-servicedesk/auth/callback`

Note the **Client ID** and generate a **Client secret**.

### 3. Deploy the token-exchange Lambda

Follow [`lambda/README.md`](lambda/README.md). Use the client ID/secret from
step 2, and set `ALLOWED_ORIGIN` to `https://<username>.github.io`. Note the
resulting Function URL.

### 4. Configure the app

Edit `src/lib/config.ts`:

```ts
export const config = {
  dataRepoOwner: '<username-or-org>',
  dataRepoName: 'ghp-servicedesk-data',
  githubOAuthClientId: '<client-id-from-step-2>',
  githubOAuthScope: 'repo',
  tokenExchangeUrl: '<function-url-from-step-3>',
};
```

Edit `astro.config.mjs` and set `site`/`base` to match your GitHub Pages URL
and repo name.

### 5. Enable GitHub Pages

Repo Settings → Pages → Source: **GitHub Actions**. Push to `main` to trigger
`deploy.yml`.

## Local development

```sh
npm install
npm run dev
```

The OAuth flow requires a real callback URL registered with the OAuth App, so
testing login locally requires either a tunnel (e.g. `ngrok`) pointed at
`localhost:4321` with a matching OAuth App callback URL, or testing against
the deployed Pages site.

## Commands

| Command           | Action                                      |
| :----------------- | :------------------------------------------ |
| `npm install`      | Install dependencies                         |
| `npm run dev`       | Start local dev server                       |
| `npm run build`     | Build production site to `./dist/`           |
| `npm run preview`   | Preview the build locally                     |
