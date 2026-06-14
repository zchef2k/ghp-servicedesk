import { getClient, dataRepo } from './github';

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image to the data repo via the Git Data API (handles files
 * larger than the Contents API's 1MB limit) and returns a `repo-asset:`
 * reference for use in Markdown bodies.
 */
export async function uploadImage(file: File): Promise<string> {
  const client = getClient();
  const base64 = await readAsBase64(file);
  const ext = EXTENSIONS[file.type] ?? 'png';
  const path = `images/${crypto.randomUUID()}.${ext}`;

  const { data: ref } = await client.git.getRef({ ...dataRepo, ref: 'heads/main' });
  const { data: blob } = await client.git.createBlob({ ...dataRepo, content: base64, encoding: 'base64' });
  const { data: baseCommit } = await client.git.getCommit({ ...dataRepo, commit_sha: ref.object.sha });
  const { data: tree } = await client.git.createTree({
    ...dataRepo,
    base_tree: baseCommit.tree.sha,
    tree: [{ path, mode: '100644', type: 'blob', sha: blob.sha }],
  });
  const { data: commit } = await client.git.createCommit({
    ...dataRepo,
    message: 'Add pasted image',
    tree: tree.sha,
    parents: [ref.object.sha],
  });
  await client.git.updateRef({ ...dataRepo, ref: 'heads/main', sha: commit.sha });

  return `repo-asset:${path}`;
}

const REPO_ASSET_PREFIX = 'repo-asset:';

const resolveCache = new Map<string, Promise<string>>();

/** Resolves a `repo-asset:<path>` reference to a `data:` URI by fetching the file from the data repo. */
export function resolveImage(repoAssetPath: string): Promise<string> {
  const path = repoAssetPath.startsWith(REPO_ASSET_PREFIX)
    ? repoAssetPath.slice(REPO_ASSET_PREFIX.length)
    : repoAssetPath;

  const cached = resolveCache.get(path);
  if (cached) return cached;

  const promise = (async () => {
    const client = getClient();
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    const mime = MIME_TYPES[ext] ?? 'application/octet-stream';

    const { data } = await client.repos.getContent({ ...dataRepo, path });
    if (Array.isArray(data) || data.type !== 'file') {
      throw new Error(`Not a file: ${path}`);
    }
    if (data.content) {
      return `data:${mime};base64,${data.content.replace(/\n/g, '')}`;
    }
    const { data: blob } = await client.git.getBlob({ ...dataRepo, file_sha: data.sha });
    return `data:${mime};base64,${blob.content.replace(/\n/g, '')}`;
  })();

  resolveCache.set(path, promise);
  return promise;
}

/** Whether a Markdown image `src` is one of our `repo-asset:` references. */
export function isRepoAsset(src: string): boolean {
  return src.startsWith(REPO_ASSET_PREFIX);
}
