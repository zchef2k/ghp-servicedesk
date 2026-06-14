import { getClient, dataRepo } from './github';
import { config } from './config';

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
 * larger than the Contents API's 1MB limit) and returns a GitHub blob URL
 * for use in Markdown bodies.
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

  return `https://github.com/${config.dataRepoOwner}/${config.dataRepoName}/blob/main/${path}?raw=true`;
}
