/**
 * `import.meta.env.BASE_URL` has no trailing slash when `base` is set without
 * one (e.g. '/ghp-servicedesk'). Concatenating paths onto it directly produces
 * broken URLs like '/ghp-servicedesknew'. Use this helper everywhere instead.
 */
export function appPath(path: string = ''): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path}`;
}
