import type { TreeItem } from "@/lib/types/tree.type";

interface DownloadSelectedFilesParams {
  owner: string;
  repo: string;
  ref: string;
  items: TreeItem[];
}

interface ZipFileEntry {
  path: string;
  downloadUrl: string;
}

async function fetchDirectoryContents({
  owner,
  repo,
  ref,
  path,
}: DownloadSelectedFilesParams & { path: string }) {
  const querystring = new URLSearchParams({
    owner,
    repo,
    ref,
    path,
  }).toString();
  const response = await fetch(`/api/v1/getContents?${querystring}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path || repo}: ${response.status}`);
  }

  const json = await response.json();
  return (json.data ?? []) as TreeItem[];
}

async function collectZipEntries({
  owner,
  repo,
  ref,
  items,
}: DownloadSelectedFilesParams) {
  const files = new Map<string, ZipFileEntry>();
  const folders = new Set<string>();

  async function visit(item: TreeItem) {
    if (item.type === "file") {
      if (!item.download_url) {
        throw new Error(`Missing download URL for ${item.path}`);
      }

      files.set(item.path, {
        path: item.path,
        downloadUrl: item.download_url,
      });
      return;
    }

    folders.add(item.path);
    const children = await fetchDirectoryContents({
      owner,
      repo,
      ref,
      items: [],
      path: item.path,
    });

    await Promise.all(children.map(visit));
  }

  await Promise.all(items.map(visit));

  return {
    files: Array.from(files.values()),
    folders: Array.from(folders),
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export async function downloadSelectedFiles({
  owner,
  repo,
  ref,
  items,
}: DownloadSelectedFilesParams) {
  if (items.length === 0) {
    return;
  }

  const [{ default: JSZip }, { files, folders }] = await Promise.all([
    import("jszip"),
    collectZipEntries({ owner, repo, ref, items }),
  ]);

  if (files.length === 0 && folders.length === 0) {
    throw new Error("No selected files found to download");
  }

  const zip = new JSZip();

  folders.forEach((folder) => {
    zip.folder(folder);
  });

  await Promise.all(
    files.map(async (file) => {
      const response = await fetch(file.downloadUrl);

      if (!response.ok) {
        throw new Error(`Failed to download ${file.path}: ${response.status}`);
      }

      zip.file(file.path, await response.blob());
    })
  );

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const shortRef = ref ? `-${ref.slice(0, 7)}` : "";

  downloadBlob(zipBlob, `${owner}-${repo}${shortRef}-selection.zip`);
}
